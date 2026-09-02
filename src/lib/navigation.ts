export function safeInternalPath(
  path: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!path?.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}
