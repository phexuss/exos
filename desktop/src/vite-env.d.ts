/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_MOCK?: string;
}

/** desktop/package.json version, set at build time (vite.config.ts). */
declare const __APP_VERSION__: string;
/** Short commit hash of the build, empty when unknown. */
declare const __APP_COMMIT__: string;
