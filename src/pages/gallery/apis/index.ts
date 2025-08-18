import type * as Gallery from "./type"
import { request } from "@/http/axios"

// 分页响应类型
export interface GalleryListResponseData<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 上传配置类型
export interface UploadConfig {
  category: string
  tags: string[]
  autoRename: boolean
  compressQuality: number
}

// 批量操作参数
export interface BatchOperationParams {
  ids: string[]
  action: "delete" | "updateCategory" | "addTags" | "removeTags"
  data?: {
    category?: string
    tags?: string[]
  }
}

/**
 * 获取图片列表
 * @param params 查询参数
 * @returns 图片列表和分页信息
 */
export function fetchList(params: Gallery.GalleryListRequestParams = {}) {
  return request<Gallery.GalleryListResponseData>({
    url: "gallery/list",
    method: "get",
    params,
    timeout: 10000
  })
}

/**
 * 根据ID获取图片详情
 * @param id 图片ID
 * @returns 图片详情
 */
export function getImageById(id: string): Promise<Gallery.GalleryDetailResponseData> {
  return request<Gallery.GalleryDetailResponseData>({
    url: `gallery/${id}`,
    method: "get"
  })
}

/**
 * 上传单个图片
 * @param data 包含文件和配置的FormData
 * @returns 上传结果
 */
export function uploadImages(data: Gallery.GalleryCreateData) {
  return request<Gallery.GalleryActionResponseData>({
    url: "gallery/batch",
    method: "post",
    data,
    timeout: 10000
  })
}

/**
 * 更新图片信息
 * @param id 图片ID
 * @param data 更新数据
 * @returns 更新后的图片信息
 */
export function updateImage(id: string, data: Gallery.GalleryUpdateData) {
  return request<Gallery.GalleryActionResponseData>({
    url: `gallery/${id}`,
    method: "put",
    data
  })
}

/**
 * 删除单个图片
 * @param id 图片ID
 * @returns 删除结果
 */
export function deleteImage(id: number) {
  return request<Gallery.GalleryActionResponseData>({
    url: `gallery/${id}`,
    method: "delete"
  })
}

/**
 * 批量删除图片
 * @param ids 图片ID数组
 * @returns 批量删除结果
 */
export function batchDeleteImages(ids: Gallery.BatchDeleteRequestParams) {
  return request<Gallery.GalleryActionResponseData>({
    url: `gallery/batch`,
    method: "delete",
    data: ids
  })
}

/**
 * 批量操作图片
 * @param params 批量操作参数
 * @returns 操作结果
 */
// export function batchOperateImages(params: BatchOperationParams): Promise<{
//   success: string[]
//   failed: Array<{ id: string; error: string }>
// }> {
//   return request.post("/api/gallery/images/batch-operation", params)
// }

/**
 * 获取图片分类列表
 * @returns 分类列表
 */
// export function getImageCategories(): Promise<Array<{
//   value: string
//   label: string
//   count: number
// }>> {
//   return request.get("/api/gallery/categories")
// }

/**
 * 获取图片标签列表
 * @param keyword 搜索关键词
 * @returns 标签列表
 */
// export function getImageTags(keyword?: string): Promise<Array<{
//   name: string
//   count: number
// }>> {
//   return request.get("/api/gallery/tags", {
//     params: { keyword }
//   })
// }

/**
 * 获取图片统计信息
 * @returns 统计数据
 */
// export function getImageStats(): Promise<{
//   total: number
//   categories: Record<string, number>
//   monthlyUploads: Array<{
//     month: string
//     count: number
//   }>
//   storageUsed: number
//   storageLimit: number
// }> {
//   return request.get("/api/gallery/stats")
// }

/**
 * 搜索相似图片
 * @param imageId 参考图片ID
 * @param threshold 相似度阈值 (0-1)
 * @returns 相似图片列表
 */
// export function searchSimilarImages(
//   imageId: string,
//   threshold: number = 0.8
// ): Promise<Array<ImageItem & { similarity: number }>> {
//   return request.get(`/api/gallery/images/${imageId}/similar`, {
//     params: { threshold }
//   })
// }

/**
 * 生成图片缩略图
 * @param id 图片ID
 * @param size 缩略图尺寸
 * @returns 缩略图URL
 */
// export function generateThumbnail(
//   id: string,
//   size: { width: number; height: number }
// ): Promise<{ thumbnailUrl: string }> {
//   return request.post(`/api/gallery/images/${id}/thumbnail`, size)
// }

/**
 * 压缩图片
 * @param id 图片ID
 * @param quality 压缩质量 (0-1)
 * @returns 压缩后的图片信息
 */
// export function compressImage(
//   id: string,
//   quality: number
// ): Promise<ImageItem> {
//   return request.post(`/api/gallery/images/${id}/compress`, { quality })
// }

/**
 * 获取图片上传配置
 * @returns 上传配置信息
 */
// export function getUploadConfig(): Promise<{
//   maxFileSize: number
//   allowedTypes: string[]
//   maxFilesPerBatch: number
//   compressionEnabled: boolean
//   thumbnailSizes: Array<{ width: number; height: number }>
// }> {
//   return request.get("/api/gallery/upload/config")
// }

/**
 * 检查文件是否已存在
 * @param hash 文件哈希值
 * @returns 检查结果
 */
// export function checkFileExists(hash: string): Promise<{
//   exists: boolean
//   image?: ImageItem
// }> {
//   return request.get(`/api/gallery/check-duplicate/${hash}`)
// }

/**
 * 导出图片数据
 * @param params 导出参数
 * @returns 导出任务ID
 */
// export function exportImages(params: {
//   ids?: string[]
//   format: "zip" | "json"
//   includeMetadata: boolean
// }): Promise<{ taskId: string }> {
//   return request.post("/api/gallery/export", params)
// }

/**
 * 获取导出任务状态
 * @param taskId 任务ID
 * @returns 任务状态
 */
// export function getExportStatus(taskId: string): Promise<{
//   status: "pending" | "processing" | "completed" | "failed"
//   progress: number
//   downloadUrl?: string
//   error?: string
// }> {
//   return request.get(`/api/gallery/export/${taskId}/status`)
// }

// 工具函数：格式化文件大小
// export function formatFileSize(bytes: number): string {
//   if (bytes === 0) return "0 B"

//   const k = 1024
//   const sizes = ["B", "KB", "MB", "GB", "TB"]
//   const i = Math.floor(Math.log(bytes) / Math.log(k))

//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
// }

// 工具函数：生成缩略图URL
export function getThumbnailUrl(imageUrl: string, size: { width: number, height: number }): string {
  const url = new URL(imageUrl)
  url.searchParams.set("w", size.width.toString())
  url.searchParams.set("h", size.height.toString())
  url.searchParams.set("fit", "cover")
  return url.toString()
}

// 工具函数：验证图片文件类型
export function isValidImageType(file: File): boolean {
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
  return validTypes.includes(file.type)
}

// 工具函数：获取图片尺寸
export function getImageDimensions(file: File): Promise<{ width: number, height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}
