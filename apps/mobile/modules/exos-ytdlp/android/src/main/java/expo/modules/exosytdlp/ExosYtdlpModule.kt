package expo.modules.exosytdlp

import android.content.Context
import android.os.SystemClock
import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.util.concurrent.Executors

/**
 * Runs yt-dlp on the phone, from the device's own IP, the same way the
 * desktop engine runs it on a computer. Calls block on yt-dlp, so each one
 * runs on its own worker thread and settles its promise from there.
 */
class ExosYtdlpModule : Module() {
  private val workers = Executors.newCachedThreadPool()
  private val initLock = Any()

  @Volatile
  private var initialized = false

  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  private val outDir: File
    get() = File(context.filesDir, "ytdlp").apply { mkdirs() }

  private val cacheDir: File
    get() = File(context.cacheDir, "yt-dlp")

  override fun definition() = ModuleDefinition {
    Name("ExosYtdlp")

    Events("onProgress")

    // First call unpacks Python and ffmpeg into app storage (a few seconds,
    // once per install or library upgrade).
    AsyncFunction("init") { promise: Promise ->
      work(promise) {
        val started = SystemClock.elapsedRealtime()
        ensureInit()
        mapOf(
          "version" to YoutubeDL.getInstance().version(context),
          "elapsedMs" to SystemClock.elapsedRealtime() - started,
        )
      }
    }

    // Pulls the latest yt-dlp release from GitHub into app storage. The
    // bundled copy ages fast; YouTube breaks old versions within weeks.
    AsyncFunction("update") { channel: String, promise: Promise ->
      work(promise) {
        ensureInit()
        val target = when (channel) {
          "nightly" -> YoutubeDL.UpdateChannel.NIGHTLY
          else -> YoutubeDL.UpdateChannel.STABLE
        }
        val status = YoutubeDL.getInstance().updateYoutubeDL(context, target)
        mapOf(
          "status" to (status?.name ?: "UNKNOWN"),
          "version" to YoutubeDL.getInstance().version(context),
        )
      }
    }

    // `yt-dlp -J`: metadata plus the direct audio URL and the headers it
    // needs. Returned as raw JSON; the JS side picks what it needs.
    AsyncFunction("resolve") { id: String, url: String, format: String, promise: Promise ->
      work(promise) {
        ensureInit()
        val request = baseRequest(url, format).apply {
          addOption("--dump-single-json")
          addOption("--skip-download")
        }
        val started = SystemClock.elapsedRealtime()
        val response = YoutubeDL.getInstance().execute(request, id)
        mapOf(
          "json" to response.out,
          "elapsedMs" to SystemClock.elapsedRealtime() - started,
        )
      }
    }

    // Downloads the audio into app storage and returns the file path plus a
    // few metadata fields printed by yt-dlp after the file is in place.
    AsyncFunction("download") { id: String, url: String, format: String, promise: Promise ->
      work(promise) {
        ensureInit()
        val request = baseRequest(url, format).apply {
          addOption("-o", "${outDir.absolutePath}/%(extractor_key)s-%(id)s.%(ext)s")
          addOption("--no-mtime")
          addOption("--newline")
          addOption("--progress")
          addOption(
            "--print",
            "after_move:%(.{filepath,id,title,uploader,artist,track,duration,thumbnail,extractor_key,ext,acodec,abr,filesize,filesize_approx})j",
          )
        }
        val started = SystemClock.elapsedRealtime()
        val response = YoutubeDL.getInstance().execute(request, id) { progress, etaSeconds, line ->
          sendEvent(
            "onProgress",
            mapOf(
              "id" to id,
              "progress" to progress.toDouble(),
              "etaSeconds" to etaSeconds,
              "line" to line,
            ),
          )
        }
        val info = response.out.lineSequence().lastOrNull { it.trimStart().startsWith("{") }
          ?: throw IllegalStateException("yt-dlp finished without printing the file path:\n${tail(response.out)}")
        mapOf(
          "json" to info,
          "elapsedMs" to SystemClock.elapsedRealtime() - started,
        )
      }
    }

    Function("cancel") { id: String ->
      YoutubeDL.getInstance().destroyProcessById(id)
    }

    Function("outputDir") {
      outDir.absolutePath
    }

    OnDestroy {
      workers.shutdownNow()
    }
  }

  private fun ensureInit() {
    if (initialized) return
    synchronized(initLock) {
      if (initialized) return
      YoutubeDL.getInstance().init(context)
      FFmpeg.getInstance().init(context)
      initialized = true
    }
  }

  private fun baseRequest(url: String, format: String) = YoutubeDLRequest(url).apply {
    addOption("--no-playlist")
    addOption("-f", format.ifBlank { "bestaudio[ext=m4a]/bestaudio/best" })
    // Keeps solved player JS between runs, so only the first YouTube call
    // per player version pays for QuickJS.
    addOption("--cache-dir", cacheDir.absolutePath)
    addOption("--socket-timeout", "20")
  }

  private fun work(promise: Promise, block: () -> Any?) {
    workers.execute {
      try {
        promise.resolve(block())
      } catch (e: YoutubeDL.CanceledException) {
        promise.reject("ERR_YTDLP_CANCELED", "Canceled", e)
      } catch (e: Throwable) {
        promise.reject("ERR_YTDLP", tail(e.message ?: e.toString()), e)
      }
    }
  }

  private fun tail(text: String, max: Int = 4000) =
    if (text.length <= max) text else "…" + text.takeLast(max)
}
