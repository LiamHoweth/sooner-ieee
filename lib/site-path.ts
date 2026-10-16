export function sitePath(pathname: string) {
  const basePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? '';
  if (!basePath) return pathname;

  return pathname === '/' ? `${basePath}/` : `${basePath}${pathname}.html`;
}
