/**
 * The newest desktop release, read from GitHub. Desktop releases are tagged
 * desktop-v<version> and carry one file per system (see
 * .github/workflows/desktop.yml). The page is rebuilt at most once an hour,
 * so GitHub's anonymous rate limit is never in play.
 */
export const REPO = 'phexuss/exos';
export const RELEASES_URL = `https://github.com/${REPO}/releases?q=desktop&expanded=true`;
/** The phone app's last build; the app is on hold. */
export const APK_URL = `https://github.com/${REPO}/releases/download/v0.2.1-beta/exosv021b.apk`;

export type DesktopFile = 'win' | 'mac' | 'appimage' | 'targz';
export type DesktopAsset = { url: string; bytes: number };
export type DesktopRelease = {
  version: string;
  url: string;
  assets: Partial<Record<DesktopFile, DesktopAsset>>;
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
  assets: { name: string; size: number; browser_download_url: string }[];
};

export async function getDesktopRelease(): Promise<DesktopRelease | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases?per_page=30`,
      {
        headers: { Accept: 'application/vnd.github+json' },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const list = (await res.json()) as GhRelease[];
    const release = list.find(
      (r) => !r.draft && r.tag_name.startsWith('desktop-v'),
    );
    if (!release) return null;
    const assets: DesktopRelease['assets'] = {};
    for (const key of Object.keys(MATCH) as DesktopFile[]) {
      const file = release.assets.find((a) => MATCH[key].test(a.name));
      if (file)
        assets[key] = { url: file.browser_download_url, bytes: file.size };
    }
    return {
      version: release.tag_name.replace('desktop-v', ''),
      url: release.html_url,
      assets,
    };
  } catch {
    return null;
  }
}
