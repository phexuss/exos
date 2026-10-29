import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'exos-engine-'));
process.env.XDG_CACHE_HOME = path.join(tmp, 'cache');
process.env.XDG_DATA_HOME = path.join(tmp, 'data');
process.env.EXOS_PROXY_CHUNK = '1000';

const media = await import('./media');
const api = await import('./http');
const sc = await import('./soundcloud');
const yt = await import('./ytdlp');
const spotify = await import('./spotify');

const data = Buffer.from(Array.from({ length: 5000 }, (_, i) => i % 251));
let upstreamUp = true;
let apiHits = 0;

/** Behaves like googlevideo: 403 for open-ended ranges or a missing header, 206 for closed ones. */
const upstream = http.createServer((req, res) => {
  if (!upstreamUp) return req.socket.destroy();
  if (req.url === '/cover.jpg') {
    return res.writeHead(200, { 'Content-Type': 'image/jpeg' }).end('jpegbytes');
  }
  if (req.url === '/api') {
    apiHits += 1;
    return res.writeHead(200).end(`answer ${apiHits}`);
  }
  const m = /^bytes=(\d+)-(\d+)$/.exec(req.headers.range ?? '');
  if (req.headers['x-test'] !== 'yes' || !m) return res.writeHead(403).end();
  const from = Number(m[1]);
  const to = Math.min(Number(m[2]), data.length - 1);
  if (from >= data.length) return res.writeHead(416).end();
  res.writeHead(206, { 'Content-Range': `bytes ${from}-${to}/${data.length}`, 'Content-Length': to - from + 1 });
  res.end(data.subarray(from, to + 1));
});
let up = '';

before(async () => {
  await new Promise<void>((r) => upstream.listen(0, '127.0.0.1', () => r()));
  up = `http://127.0.0.1:${(upstream.address() as { port: number }).port}`;
  await media.start();
});
after(async () => {
  upstream.close();
  upstream.closeAllConnections();
  media.stop();
  await fs.rm(tmp, { recursive: true, force: true });
});

async function get(url: string, range?: string) {
  const res = await fetch(url, { headers: range ? { Range: range } : {} });
  return { status: res.status, range: res.headers.get('content-range'), body: Buffer.from(await res.arrayBuffer()) };
}

test('serves local files with ranges and refuses non-audio', async () => {
  const file = path.join(tmp, 't.m4a');
  await fs.writeFile(file, data);
  const url = await media.fileUrl(file);
  assert.deepEqual((await get(url)).body, data);
  const part = await get(url, 'bytes=100-199');
  assert.equal(part.status, 206);
  assert.equal(part.range, 'bytes 100-199/5000');
  assert.deepEqual(part.body, data.subarray(100, 200));
  assert.deepEqual((await get(url, 'bytes=4990-')).body, data.subarray(4990));
  assert.equal((await get(url, 'bytes=6000-')).status, 416);
  assert.equal((await get(`${url}x`)).status, 404);
  await assert.rejects(media.fileUrl('/etc/passwd'));
});

test('proxies a strict CDN in closed chunks', async () => {
  const url = media.remoteUrl(`${up}/v`, { 'x-test': 'yes' }, 'm4a');
  const full = await get(url);
  assert.equal(full.status, 200);
  assert.deepEqual(full.body, data);
  const tail = await get(url, 'bytes=1500-');
  assert.equal(tail.range, 'bytes 1500-4999/5000');
  assert.deepEqual(tail.body, data.subarray(1500));
  const mid = await get(url, 'bytes=900-2100');
  assert.deepEqual(mid.body, data.subarray(900, 2101));
  assert.equal((await get(media.remoteUrl(`${up}/v`, {}, 'm4a'))).status, 502);
});

test('cover art: only https sources', async () => {
  assert.equal((await get(`${media.mediaBase()}/img?u=${encodeURIComponent(`${up}/cover.jpg`)}`)).status, 400);
});

test('answers API GETs from disk while fresh, and stale when offline', async () => {
  const first = await api.request({ url: `${up}/api`, ttl: 60 });
  assert.equal(first.body, 'answer 1');
  const again = await api.request({ url: `${up}/api`, ttl: 60 });
  assert.deepEqual([again.body, again.cached], ['answer 1', 'fresh']);
  const uncached = await api.request({ url: `${up}/api` });
  assert.equal(uncached.body, 'answer 2');
  upstreamUp = false;
  const offline = await api.request({ url: `${up}/api`, ttl: 0.001 });
  assert.deepEqual([offline.body, offline.cached], ['answer 1', 'stale']);
  await assert.rejects(api.request({ url: `${up}/api` }));
  upstreamUp = true;
});

test('soundcloud: finds the client id, picks a stream, parses playlists', () => {
  const js = 'x={a:1,client_id:"short"},y={client_id:"aB3dE5gH7jK9mN1pQ3sT5vX7zA9cE1gH",env:"prod"}';
  assert.equal(sc.findClientId(js), 'aB3dE5gH7jK9mN1pQ3sT5vX7zA9cE1gH');
  const t = (protocol: string, mime: string, preset: string, snipped = false) => ({
    url: `https://api-v2.soundcloud.com/media/x/${preset}/${protocol}`,
    preset,
    snipped,
    format: { protocol, mime_type: mime },
  });
  const list = [
    t('hls', 'audio/mpeg', 'mp3_1_0'),
    t('hls', 'audio/ogg; codecs="opus"', 'opus_0_0'),
    t('hls', 'audio/mp4; codecs="mp4a.40.2"', 'aac_160k'),
    t('encrypted-hls', 'audio/mp4; codecs="mp4a.40.2"', 'aac_160k'),
  ];
  assert.equal(sc.pick(list)?.preset, 'aac_160k');
  assert.equal(sc.classify(sc.pick([...list, t('progressive', 'audio/mpeg', 'mp3_0_0')])!)?.kind, 'progressive');
  assert.equal(sc.pick([t('hls', 'audio/ogg; codecs="opus"', 'opus_0_0')]), null);
  const base = 'https://cf-hls-media.sndcdn.com/playlist/abc/aac.m3u8?Policy=x';
  const p = sc.parsePlaylist(base, '#EXTM3U\n#EXT-X-MAP:URI="init.mp4?a=1"\n#EXTINF:10,\nseg0.m4s?a=1\n#EXTINF:10,\nhttps://other.example/seg1.m4s\n');
  assert.equal(p.init, 'https://cf-hls-media.sndcdn.com/playlist/abc/init.mp4?a=1');
  assert.deepEqual(p.segments, ['https://cf-hls-media.sndcdn.com/playlist/abc/seg0.m4s?a=1', 'https://other.example/seg1.m4s']);
  assert.deepEqual(sc.parsePlaylist(base, '#EXTM3U\n#EXTINF:10,\n/media/0/1.mp3\n').segments, ['https://cf-hls-media.sndcdn.com/media/0/1.mp3']);
  assert.throws(() => sc.parsePlaylist(base, '#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="k"\nseg.ts\n'));
});

test('playlist import: SoundCloud tracks and Spotify embed pages', () => {
  assert.deepEqual(
    sc.mapApiTrack({
      id: 42,
      title: 'Song',
      duration: 30_000,
      full_duration: 181_400,
      permalink_url: 'https://soundcloud.com/who/song',
      artwork_url: 'https://i1.sndcdn.com/artworks-abc-large.jpg',
      user: { id: 7, username: 'who' },
    }),
    {
      id: 'sc_42',
      title: 'Song',
      artist: { id: '7', name: 'who' },
      durationSec: 181,
      coverUrl: 'https://i1.sndcdn.com/artworks-abc-t500x500.jpg',
      isrc: 'https://soundcloud.com/who/song',
      source: 'soundcloud',
    },
  );
  assert.equal(sc.mapApiTrack({ id: 1 }), null);

  assert.deepEqual(spotify.parseLink('https://open.spotify.com/intl-ru/playlist/37i9dQZF1DX?si=abc'), { kind: 'playlist', id: '37i9dQZF1DX' });
  assert.deepEqual(spotify.parseLink('spotify:album:4aawyAB9vmqN3uQ7FjRGTy'), { kind: 'album', id: '4aawyAB9vmqN3uQ7FjRGTy' });
  assert.equal(spotify.parseLink('https://open.spotify.com/track/1'), null);

  const next = {
    props: { pageProps: { state: { data: { entity: {
      type: 'playlist',
      name: 'Night drive',
      trackList: [
        { uri: 'spotify:track:1', title: 'Midnight City', subtitle: 'M83', duration: 243_960 },
        { uri: 'spotify:track:2', title: 'Nightcall', subtitle: 'Kavinsky,\u00a0Lovefoxxx', duration: 258_000 },
      ],
    } } } } },
  };
  const page = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(next)}</script></html>`;
  assert.deepEqual(spotify.parseEmbed(page), {
    name: 'Night drive',
    items: [
      { title: 'Midnight City', artist: 'M83', durationSec: 244 },
      { title: 'Nightcall', artist: 'Kavinsky, Lovefoxxx', durationSec: 258 },
    ],
  });
  // The older embed: base64 JSON in the Web API's own shape.
  const old = { name: 'Old', tracks: { items: [{ track: { name: 'A', artists: [{ name: 'X' }, { name: 'Y' }], duration_ms: 1000 } }] } };
  const oldPage = `<script id="resource" type="application/json">${Buffer.from(JSON.stringify(old)).toString('base64')}</script>`;
  assert.deepEqual(spotify.parseEmbed(oldPage), { name: 'Old', items: [{ title: 'A', artist: 'X, Y', durationSec: 1 }] });
  assert.equal(spotify.parseEmbed('<html>nothing</html>'), null);
});

test('yt-dlp helpers', () => {
  assert.equal(yt.resolveSource({ query: 'a b', isrc: 'USRC17607839' }), 'ytsearch1:USRC17607839');
  assert.equal(yt.resolveSource({ query: 'https://soundcloud.com/x/y' }), 'https://soundcloud.com/x/y');
  assert.throws(() => yt.resolveSource({ query: 'https://evil.example/x' }));
  assert.equal(yt.safeName('AC/DC: Back in Black?.'), 'AC_DC_ Back in Black_');
  assert.equal(yt.templateLiteral('50%: off'), '%(exos_none|)s50%%\\: off');
});

