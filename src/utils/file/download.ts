/**
 * 文件下载工具集
 *
 * 提供通用的 Blob 下载、Content-Disposition 文件名解析能力。
 */

/**
 * 从 Content-Disposition 响应头中解析文件名
 * 优先解析 RFC 5987 编码（filename*=UTF-8''xxx），其次解析普通 filename="xxx"
 */
export function parseFilenameFromDisposition(
  disposition: string | null,
  fallback = 'export.xlsx'
): string {
  if (!disposition) return fallback

  // UTF-8 编码文件名：filename*=UTF-8''%xx%xx
  const utf8Match = /filename\*\s*=\s*([\w-]+)''([^;]+)/i.exec(disposition)
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[2].replace(/^"|"$/g, '').trim())
    } catch {
      // 解码失败，继续下一个
    }
  }

  // 普通 filename="xxx" 或 filename=xxx
  const plainMatch = /filename\s*=\s*("?)([^";]+)\1/i.exec(disposition)
  if (plainMatch) {
    return plainMatch[2].trim()
  }

  return fallback
}

/**
 * 触发浏览器下载 Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(objectUrl)
}
