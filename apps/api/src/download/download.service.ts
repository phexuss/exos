import { spawn } from "node:child_process";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import type { Response } from "express";
import { AudioFormat, DownloadDto } from "src/download/download.dto";
import youtubedl from "youtube-dl-exec";

const YTDLP_BIN = "/usr/bin/yt-dlp";
const ytdlp = youtubedl.create(YTDLP_BIN);

@Injectable()
export class DownloadService {
	private readonly logger = new Logger(DownloadService.name);

	private resolveSource(dto: DownloadDto): string {
		if (dto.query.startsWith("http")) {
			return dto.query;
		}
		if (dto.isrc) {
			return `ytsearch1:${dto.isrc}`;
		}
		return `ytsearch1:${dto.query}`;
	}

	private resolveFormat(format: AudioFormat): string {
		switch (format) {
			case AudioFormat.FLAC:
				return "bestaudio[ext=flac]/bestaudio";
			case AudioFormat.M4A:
				return "bestaudio[ext=m4a]/bestaudio";
			case AudioFormat.WEBM:
				return "bestaudio[ext=webm]/bestaudio";
			default:
				return "bestaudio[ext=mp3]/bestaudio[ext=m4a]/bestaudio";
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
		const contentType =
			dto.format === AudioFormat.M4A ? "audio/mp4" : "audio/webm";

		this.logger.debug(
			`Streaming source=${source} format=${format} contentType=${contentType}`,
		);

		res.setHeader("Content-Type", contentType);
		res.setHeader("Cache-Control", "no-store");

		const args = [
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
