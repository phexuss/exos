import { spawn } from "node:child_process";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import type { Response } from "express";
import { AudioFormat, DownloadDto } from "src/download/download.dto";
import youtubedl from "youtube-dl-exec";

const YTDLP_BIN = "/usr/bin/yt-dlp";
const ytdlp = youtubedl.create(YTDLP_BIN);
const ALLOWED_DIRECT_URL_HOSTS = ["soundcloud.com", "youtube.com", "youtu.be"];

@Injectable()
export class DownloadService {
	private readonly logger = new Logger(DownloadService.name);

	private isHttpUrl(value: string): boolean {
		return /^https?:\/\//i.test(value);
	}

	private isAllowedDirectUrl(url: URL): boolean {
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return false;
		}

		const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
		return ALLOWED_DIRECT_URL_HOSTS.some(
			(domain) => hostname === domain || hostname.endsWith(`.${domain}`),
		);
	}

	private resolveDirectUrl(query: string): string {
		let url: URL;
		try {
			url = new URL(query);
		} catch {
			throw new BadRequestException("Invalid direct audio URL");
		}

		if (!this.isAllowedDirectUrl(url)) {
			throw new BadRequestException("Direct audio URL host is not allowed");
		}

		return url.toString();
	}

	private resolveSource(dto: DownloadDto): string {
		const query = dto.query.trim();
		if (this.isHttpUrl(query)) {
			return this.resolveDirectUrl(query);
		}
		if (dto.isrc) {
			return `ytsearch1:${dto.isrc.trim()}`;
		}
		return `ytsearch1:${query}`;
	}

	private resolveFormat(format: AudioFormat): string {
		switch (format) {
			case AudioFormat.FLAC:
				return "bestaudio[ext=flac]/bestaudio";
			case AudioFormat.WEBM:
				return "bestaudio[ext=webm]/bestaudio";
			case AudioFormat.MP3:
				return "bestaudio[ext=mp3]/bestaudio";
			case AudioFormat.M4A:
			default:
				// Prefer native AAC-in-MP4 streams (YouTube itag=140). When no
				// such container exists (SoundCloud only exposes mp3 today),
				// prefer a progressive HTTP variant over HLS — expo-audio's
				// ExoPlayer/AVPlayer backend reports per-segment `duration` for
				// SC's m3u8 manifests, which makes the playback `progress`
				// ratio overshoot by ~6–10x and breaks the seekbar/lyrics
				// timeline. `[protocol^=http]` matches `http`/`https` but
				// excludes `m3u8`/`m3u8_native`. Bare `bestaudio` is kept as
				// the last-ditch fallback so we never error out, and the
				// post-processing pass (`-x --audio-format m4a`) still coerces
				// the final downloaded payload regardless of source codec.
				return "bestaudio[ext=m4a]/bestaudio[ext=mp4]/bestaudio[ext=aac]/bestaudio[protocol^=http]/bestaudio";
		}
	}

	/**
	 * Map the requested {@link AudioFormat} to (a) the HTTP Content-Type we
	 * advertise and (b) the value passed to yt-dlp's `--audio-format` flag.
	 * Returning `audioFormat = undefined` skips post-processing entirely
	 * (used for FLAC where we don't want lossy re-encode).
	 */
	private resolveContainer(format: AudioFormat): {
		contentType: string;
		audioFormat?: string;
	} {
		switch (format) {
			case AudioFormat.MP3:
				return { contentType: "audio/mpeg", audioFormat: "mp3" };
			case AudioFormat.FLAC:
				return { contentType: "audio/flac" };
			case AudioFormat.WEBM:
				return { contentType: "audio/webm" };
			case AudioFormat.M4A:
			default:
				return { contentType: "audio/mp4", audioFormat: "m4a" };
		}
	}

	async getDownloadUrl(dto: DownloadDto) {
		try {
			const source = this.resolveSource(dto);
			const format = this.resolveFormat(dto.format);

			this.logger.debug(`Resolving source: ${source}`);

			const result = (await ytdlp(source, {
				getUrl: true,
				format,
				noPlaylist: true,
				noCheckCertificates: true,
				...({ extractorRetries: 1 } as Record<string, unknown>),
			})) as unknown as string;

			this.logger.debug(`Result URL resolved (${result.trim().length} chars)`);
			return { url: result.trim() };
		} catch (e: unknown) {
			this.logger.error("youtube-dl-exec error:", e);
			const message =
				e instanceof Error
					? e.message
					: typeof e === "string"
						? e
						: JSON.stringify(e);
			throw new BadRequestException(`Something went wrong: ${message}`);
		}
	}

	async streamAudio(dto: DownloadDto, res: Response): Promise<void> {
		const source = this.resolveSource(dto);
		const format = this.resolveFormat(dto.format);
		const { contentType, audioFormat } = this.resolveContainer(dto.format);

		this.logger.debug(
			`Streaming source=${source} format=${format} contentType=${contentType} audioFormat=${audioFormat ?? "none"}`,
		);

		res.setHeader("Content-Type", contentType);
		res.setHeader("Cache-Control", "no-store");

		const args: string[] = [
			source,
			"-f",
			format,
			"-o",
			"-",
			"-q",
			"--no-playlist",
			"--no-check-certificates",
			"--extractor-retries",
			"1",
		];

		if (audioFormat) {
			// `-x --audio-format <fmt>` makes yt-dlp guarantee the output
			// container/codec: copy when the source already matches, ffmpeg
			// re-encode otherwise. This is the single source of truth for the
			// file format the mobile client receives, so the client can rely on
			// the file extension matching the actual contents.
			args.push("-x", "--audio-format", audioFormat);
		}

		const proc = spawn(YTDLP_BIN, args, {
			stdio: ["ignore", "pipe", "pipe"],
		});

		let stderrBuf = "";
		proc.stderr.on("data", (chunk: Buffer) => {
			stderrBuf += chunk.toString();
		});

		proc.on("error", (err) => {
			this.logger.error(`yt-dlp spawn error: ${err.message}`);
			if (!res.headersSent) {
				res.status(500);
			}
			if (!res.writableEnded) {
				res.end();
			}
		});

		proc.on("close", (code) => {
			if (code !== 0) {
				this.logger.error(
					`yt-dlp exited with code ${code}: ${stderrBuf.trim()}`,
				);
				if (!res.writableEnded) {
					res.end();
				}
			} else {
				this.logger.debug(`yt-dlp finished streaming for ${source}`);
			}
		});

		res.on("close", () => {
			if (!proc.killed) {
				this.logger.debug("Client disconnected, killing yt-dlp process");
				proc.kill("SIGKILL");
			}
		});

		proc.stdout.pipe(res);
	}
}
