package expo.modules.exosytdlp

import android.content.Context
import android.os.SystemClock
import android.webkit.CookieManager
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

  // Each `-J` starts a Python process (~100 MB). Skipping through tracks
  // used to start one per track and push the phone into swap, so stream
  // lookups queue behind two at a time. Downloads are capped in JS.
  private val resolvers = Executors.newFixedThreadPool(2)
  private val initLock = Any()

  @Volatile
  private var initialized = false

  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  private val outDir: File
    get() = File(context.filesDir, "ytdlp").apply { mkdirs() }

  private val cacheDir: File
    get() = File(context.cacheDir, "yt-dlp")

  private val cookiesFile: File
    get() = File(context.filesDir, "youtube-cookies.txt")

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
    AsyncFunction("resolve") { id: String, url: String, format: String, extraArgs: List<String>, promise: Promise ->
      work(promise, resolvers) {
        ensureInit()
        val request = baseRequest(url, format, extraArgs).apply {
          addOption("--dump-single-json")
          addOption("--skip-download")
        }
        val started = SystemClock.elapsedRealtime()
        val response = YoutubeDL.getInstance().execute(request, id)
        mapOf(
          "json" to response.out,
          "log" to tail(response.err),
          "elapsedMs" to SystemClock.elapsedRealtime() - started,
        )
      }
    }

    // Downloads the audio into app storage and returns the file path plus a
    // few metadata fields printed by yt-dlp after the file is in place.
    AsyncFunction("download") { id: String, url: String, format: String, extraArgs: List<String>, outTemplate: String, promise: Promise ->
      work(promise) {
        ensureInit()
        val request = baseRequest(url, format, extraArgs).apply {
          addOption("-o", outTemplate.ifBlank { "${outDir.absolutePath}/%(extractor_key)s-%(id)s.%(ext)s" })
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
          "log" to tail(response.err),
          "elapsedMs" to SystemClock.elapsedRealtime() - started,
        )
      }
    }

    // Bare `yt-dlp --version`: what every call pays for starting Python and
    // importing yt-dlp, before any network request.
    AsyncFunction("startupCost") { promise: Promise ->
      work(promise) {
        ensureInit()
        val started = SystemClock.elapsedRealtime()
        YoutubeDL.getInstance().execute(YoutubeDLRequest(emptyList<String>()).apply { addOption("--version") })
        mapOf("elapsedMs" to SystemClock.elapsedRealtime() - started)
      }
    }

    Function("cancel") { id: String ->
      YoutubeDL.getInstance().destroyProcessById(id)
    }

    Function("outputDir") {
      outDir.absolutePath
    }

    // After the user signs in to Google in the WebView, copies the YouTube
    // and Google cookies into a Netscape cookies.txt that every YouTube call
    // passes to yt-dlp. Signed-in requests skip the "confirm you're not a
    // bot" wall that YouTube shows to phones without an account.
    AsyncFunction("exportCookies") { promise: Promise ->
      work(promise) {
        val manager = CookieManager.getInstance()
        manager.flush()
        val lines = mutableListOf("# Netscape HTTP Cookie File")
        val names = mutableSetOf<String>()
        // WebView hides expiry dates; a year ahead is what yt-dlp needs to
        // treat the cookies as live. Google rotates them while in use.
        val expiry = System.currentTimeMillis() / 1000 + 365L * 24 * 3600
        for (host in COOKIE_HOSTS) {
          val header = manager.getCookie("https://www.$host") ?: continue
          for (pair in header.split(";")) {
            val eq = pair.indexOf('=')
            if (eq <= 0) continue
            val name = pair.substring(0, eq).trim()
            val value = pair.substring(eq + 1).trim()
            if (name.isEmpty()) continue
            names += name
            lines += listOf(".$host", "TRUE", "/", "TRUE", expiry.toString(), name, value).joinToString("\t")
          }
        }
        val signedIn = SIGNED_IN_COOKIES.any { it in names }
        if (signedIn) {
          cookiesFile.writeText(lines.joinToString("\n", postfix = "\n"))
        }
        mapOf("count" to lines.size - 1, "signedIn" to signedIn)
      }
    }

    AsyncFunction("clearCookies") { promise: Promise ->
      work(promise) {
        cookiesFile.delete()
        val manager = CookieManager.getInstance()
        val done = java.util.concurrent.CountDownLatch(1)
        android.os.Handler(android.os.Looper.getMainLooper()).post {
          manager.removeAllCookies { done.countDown() }
        }
        done.await(5, java.util.concurrent.TimeUnit.SECONDS)
        manager.flush()
        true
      }
    }

    Function("hasCookies") {
      cookiesFile.isFile && cookiesFile.length() > 0
    }

    OnDestroy {
      workers.shutdownNow()
      resolvers.shutdownNow()
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

  private fun baseRequest(url: String, format: String, extraArgs: List<String>) = YoutubeDLRequest(url).apply {
    addOption("--no-playlist")
    addOption("-f", format.ifBlank { "bestaudio[ext=m4a]/bestaudio/best" })
    // Keeps solved player JS between runs, so only the first YouTube call
    // per player version pays for QuickJS.
    addOption("--cache-dir", cacheDir.absolutePath)
    addOption("--socket-timeout", "20")
    if (isYoutube(url) && cookiesFile.isFile) {
      addOption("--cookies", cookiesFile.absolutePath)
    }
    addCommands(extraArgs)
  }

  private fun isYoutube(url: String) =
    url.startsWith("ytsearch") || YOUTUBE_URL.containsMatchIn(url)

  private fun work(promise: Promise, pool: java.util.concurrent.ExecutorService = workers, block: () -> Any?) {
    pool.execute {
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

  companion object {
    private val COOKIE_HOSTS = listOf("youtube.com", "google.com")
    private val SIGNED_IN_COOKIES = setOf("SAPISID", "__Secure-3PAPISID", "__Secure-3PSID", "LOGIN_INFO")
    private val YOUTUBE_URL = Regex("^https?://([a-z0-9-]+\\.)*(youtube\\.com|youtu\\.be)/", RegexOption.IGNORE_CASE)
  }
}
