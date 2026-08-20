const CHUNK_RELOAD_KEY = "knowledge-hub:chunk-reload";
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

const CHUNK_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /failed to load module script/i,
  /loading chunk [\d]+ failed/i,
  /chunkloaderror/i,
];

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function isChunkLoadError(error: unknown): boolean {
  const message = errorMessage(error);
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * A deployment replaces Vite's hashed bundles. A tab that still has the old
 * index can then request a bundle that no longer exists. Reload once so it
 * receives the current index and bundle names, while the cooldown prevents a
 * broken deployment from causing an infinite reload loop.
 */
export function recoverFromChunkLoadError(error: unknown): boolean {
  if (!isChunkLoadError(error) || typeof window === "undefined") return false;

  const now = Date.now();
  const lastReload = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);

  if (Number.isFinite(lastReload) && now - lastReload < CHUNK_RELOAD_COOLDOWN_MS) {
    return false;
  }

  window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
  window.location.reload();
  return true;
}

export function installChunkLoadRecovery(): () => void {
  const handlePreloadError = (event: Event) => {
    const preloadEvent = event as Event & { payload?: unknown };

    if (recoverFromChunkLoadError(preloadEvent.payload)) {
      event.preventDefault();
    }
  };

  window.addEventListener("vite:preloadError", handlePreloadError);
  return () => window.removeEventListener("vite:preloadError", handlePreloadError);
}
