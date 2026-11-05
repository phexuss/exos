/**
 * The newest desktop and Android releases, read from GitHub. Desktop releases
 * are tagged desktop-v<version> and carry one file per system (see
 * .github/workflows/desktop.yml). Android releases are tagged
 * android-v<version>, older ones plain v<version>, and carry one APK (see
 * .github/workflows/android-release.yml). The page is rebuilt at most once an
 * hour, so GitHub's anonymous rate limit is never in play. When GitHub can't
 * be reached the links fall back to the releases pages.
 */
export const REPO = 'phexuss/exos';
export const RELEASES_URL = `https://github.com/${REPO}/releases?q=desktop&expanded=true`;
export const ANDROID_RELEASES_URL = `https://github.com/${REPO}/releases?q=android&expanded=true`;

export type DesktopFile = 'win' | 'mac' | 'appimage' | 'targz';
export type Asset = { url: string; bytes: number };
export type DesktopRelease = {
  version: string;
  url: string;
  assets: Partial<Record<DesktopFile, Asset>>;
};
export type AndroidRelease = {
  version: string;
  url: string;
  apk: Asset | null;
};
export type Releases = {
  desktop: DesktopRelease | null;
  android: AndroidRelease | null;
};

const MATCH: Record<DesktopFile, RegExp> = {
  win: /-win-x64\.exe$/,
  mac: /-mac-universal\.dmg$/,
  appimage: /\.AppImage$/,
  targz: /-linux-x64\.tar\.gz$/,
};

type GhRelease = {
  tag_name: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  assets: { name: string; size: number; browser_download_url: string }[];
};

const DESKTOP_TAG = /^desktop-v(\d+\.\d+\.\d+(?:-[\w.]+)?)$/;
const ANDROID_TAG = /^(?:android-)?v(\d+\.\d+\.\d+(?:-[\w.]+)?)$/;

/** Semver order; a pre-release sorts below its release. */
function compare(a: string, b: string): number {
  const [coreA, preA] = a.split('-', 2);
  const [coreB, preB] = b.split('-', 2);
  const x = coreA.split('.').map(Number);
  const y = coreB.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  if (preA === preB) return 0;
  if (!preA) return 1;
  if (!preB) return -1;
  return preA < preB ? -1 : 1;
}

/**
 * The highest version among releases whose tag matches. GitHub's list order
 * follows tag dates, not versions, so it can't be trusted on its own.
 * Pre-releases count only when there is no stable release yet.
 */
function newest(list: GhRelease[], tag: RegExp) {
  const found = list
    .filter((r) => !r.draft)
    .map((r) => ({ release: r, version: tag.exec(r.tag_name)?.[1] }))
    .filter((r): r is { release: GhRelease; version: string } =>
      Boolean(r.version),
    );
  const stable = found.filter((r) => !r.release.prerelease);
  const pool = stable.length ? stable : found;
  return pool.sort((a, b) => compare(b.version, a.version))[0] ?? null;
}

function toAsset(file: GhRelease['assets'][number] | undefined): Asset | null {
  return file ? { url: file.browser_download_url, bytes: file.size } : null;
}

export async function getReleases(): Promise<Releases> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases?per_page=100`,
      {
        headers: { Accept: 'application/vnd.github+json' },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return { desktop: null, android: null };
    const list = (await res.json()) as GhRelease[];

    let desktop: DesktopRelease | null = null;
    const d = newest(list, DESKTOP_TAG);
    if (d) {
      const assets: DesktopRelease['assets'] = {};
      for (const key of Object.keys(MATCH) as DesktopFile[]) {
        const asset = toAsset(
          d.release.assets.find((a) => MATCH[key].test(a.name)),
        );
        if (asset) assets[key] = asset;
      }
      desktop = { version: d.version, url: d.release.html_url, assets };
    }

    const a = newest(list, ANDROID_TAG);
    const android: AndroidRelease | null = a
      ? {
          version: a.version,
          url: a.release.html_url,
          apk: toAsset(a.release.assets.find((f) => f.name.endsWith('.apk'))),
        }
      : null;

    return { desktop, android };
  } catch {
    return { desktop: null, android: null };
  }
}

/** The direct APK when there is one, otherwise the Android releases page. */
export function apkHref(android: AndroidRelease | null): string {
  return android?.apk?.url ?? android?.url ?? ANDROID_RELEASES_URL;
}
