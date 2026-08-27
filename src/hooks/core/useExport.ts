/**
 * 服务端导出 Hook
 *
 * 统一处理「同步下载 xlsx」与「异步入队」两种响应：
 * - 200 + application/vnd.openxmlformats-officedocument.spreadsheetml.sheet → 触发浏览器下载
 * - 202 application/json → 读取 Blob 中的 JSON，提示用户「已入队，将通过站内信通知」
 * - 其他错误 → 由 HTTP 拦截器统一弹出错误提示
 *
 * 用法：
 *   const { isExporting, handleExport } = useExport()
 *   // 点击导出按钮：
 *   handleExport(() => fetchExportUsers(searchParams), 'users')
 */
import type { AxiosResponse } from 'axios'
import { downloadBlob, parseFilenameFromDisposition } from '@/utils/file/download'

export interface UseExportOptions {
  /** 预留：未来支持自定义加载提示文案 */
  loadingText?: string
}

export function useExport(options?: UseExportOptions) {
  // options 预留给未来扩展（如自定义 loading 文案），当前暂未使用
  void options
  const isExporting = ref(false)

  /**
   * 执行一次导出请求
   * @param requester 返回原始 AxiosResponse（已设置 responseType: 'blob'）的函数
   * @param fallbackPrefix 无法从 Content-Disposition 解析文件名时使用的前缀（最终拼上 .xlsx）
   */
  async function handleExport(
    requester: () => Promise<AxiosResponse>,
    fallbackPrefix: string = 'export'
  ): Promise<void> {
    if (isExporting.value) return
    isExporting.value = true

    let loadingInstance: { close: () => void } | null = null
    try {
      // 长时操作使用全屏 loading
      const { loadingService } = await import('@/utils/ui/loading')
      loadingInstance = { close: loadingService.showLoading() }

      const res: AxiosResponse = await requester()

      // HTTP 202：异步入队
      if (res.status === 202) {
        const json = await readBlobAsJson<Api.Common.ExportTaskResponse>(res.data)
        ElMessage.success(json?.message || '导出任务已提交，完成后将通过站内信通知您')
        return
      }

      // HTTP 200：同步二进制
      const contentType = String(res.headers?.['content-type'] ?? '')
      const disposition = String(res.headers?.['content-disposition'] ?? '')

      // 兼容某些情况下 200 仍返回 JSON（如 JSON 错误对象）
      if (contentType.includes('application/json')) {
        const json = await readBlobAsJson<{ message?: string }>(res.data)
        if (json?.message) ElMessage.warning(json.message)
        return
      }

      const filename = parseFilenameFromDisposition(
        disposition,
        `${fallbackPrefix}_${formatDateStamp()}.xlsx`
      )
      downloadBlob(res.data as Blob, filename)
      ElMessage.success('导出成功')
    } catch (error) {
      // HTTP 拦截器已弹出错误，此处静默
      console.error('[useExport] request failed:', error)
    } finally {
      loadingInstance?.close()
      isExporting.value = false
    }
  }

  return { isExporting, handleExport }
}

/** 将 Blob 读取为 JSON 对象（用于解析 202 异步响应或异常 JSON） */
async function readBlobAsJson<T = any>(blob: Blob): Promise<T | null> {
  if (!(blob instanceof Blob)) return blob as unknown as T
  try {
    const text = await blob.text()
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

/** 生成文件名时间戳 YYYYMMDD_HHMMSS */
function formatDateStamp(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '_' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  )
}
