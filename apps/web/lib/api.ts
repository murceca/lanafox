export function apiUrl(routePath: `/api/${string}`): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  return `${base}${routePath}`;
}

