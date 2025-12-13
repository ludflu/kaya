declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Tauri global for runtime detection
interface Window {
  __TAURI__?: unknown;
}

// Environment variables
interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly VITE_ASSET_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
