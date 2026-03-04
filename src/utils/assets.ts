/**
 * 资源路径处理工具
 */

const PUBLIC_PREFIX =
  "https://v6.gh-proxy.org/https://github.com/GutsGo/codebook/raw/main/public";

/**
 * 将相对路径或本地路径转换为生产环境下的 CDN/代理路径
 * @param path 路径
 * @returns 处理后的路径
 */
export function resolveImageUrl(path: any): string {
  if (typeof path !== "string" || !path) return "";

  // 如果是完整的 http(s) 路径，直接返回
  if (path.startsWith("http")) return path;

  // 生产环境逻辑
  if (import.meta.env.PROD) {
    // 确保路径开头没有 /
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    // 如果是 images/ 开头的路径，加上前缀
    if (cleanPath.startsWith("images/")) {
      return `${PUBLIC_PREFIX}/${cleanPath}`;
    }
  }

  // 开发环境或非 images 路径返回原路径（确保开头有 / 以便 Vite 正确处理 public 资源）
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * 处理 data 目录下的 json 请求路径
 * @param path 请求路径，例如 '/data/categories.json'
 */
export function resolveDataUrl(path: string): string {
  if (path.startsWith("http")) return path;

  if (import.meta.env.PROD) {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    if (cleanPath.startsWith("data/")) {
      return `${PUBLIC_PREFIX}/${cleanPath}`;
    }
  }

  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * 判断是否为 URL 路径
 */
export function isUrl(str: any): boolean {
  return (
    typeof str === "string" &&
    (str.startsWith("http") || str.startsWith("/") || str.startsWith("images/"))
  );
}
