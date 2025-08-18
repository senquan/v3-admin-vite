export interface Color {
  id: number
  name: string
  value: string
}

export interface Tag {
  id: number
  name: string
  color: Color
}

export interface FileInfo {
  url: string
  size: number
  height: number
  width: number
  type: string
}

export interface FilterOptionsData {
  name: string
  material: string
  barcode: string
  model: string
  status: number
}

export interface GalleryItem {
  id: string
  title: string
  description?: string
  fileUrl: string
  thumbnailUrl?: string
  categoryId: string
  tags: string[]
  altText?: string
  fileName?: string
  fileSize: number
  width: number
  height: number
  mimeType: string
  uploadTime: string
  updateTime?: string
  status: "active" | "deleted" | "processing"
  userId?: string
}

export interface GalleryCreateData {
  category: number
  tags?: string[]
  autoRename?: boolean
  compressQuality?: number
  files: FileInfo[]
}

export interface GalleryUpdateData {
  title: string
  description?: string
  categoryId: number
  tags: string[]
  alt?: string
}

// 查询参数类型
export interface GalleryListRequestParams {
  page?: number
  pageSize?: number
  keyword?: string
  category?: string
  tags?: string[]
  startDate?: string
  endDate?: string
  sortBy?: "uploadTime" | "updateTime" | "fileSize" | "title"
  sortOrder?: "asc" | "desc"
  status?: "active" | "deleted" | "processing"
}

export interface BatchUpdateRequestParams {
  ids: number[]
  scope: string
  adjustType: string
  values: number[]
  searchParams?: GalleryListRequestParams
}

export interface BatchDeleteRequestParams {
  ids: number[]
}

export interface GalleryListResponseData {
  code: number
  message: string
  data: {
    items: GalleryItem[]
    categories: string[]
    tags: Tag[]
    total: number
    page: number
    pageSize: number
  }
}

export interface GalleryDetailResponseData {
  code: number
  message: string
  data: GalleryItem
}

export interface GalleryActionResponseData {
  code: number
  message: string
}

export interface GalleryImportResponseData {
  code: number
  message: string
  data: {
    success: number
    ignored: number
    updated: number
    fail: number
    failList: any[]
    error: number
    errorMessages: string[]
  }
}
