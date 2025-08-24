export interface MaterialListData {
  id: number
  title: string
  file_path: string
}

export interface CoursewareListData {
  id: number
  title: string
  description: string | null
  category: number
  tags: string | null
  materials: MaterialListData[]
  status: number
  view_count: number
  download_count: number
  is_deleted: number
  creator: number | null
  updater: number | null
  created_time: string
  updated_time: string
}

export interface StaffListData {
  id: number
  name: string
  type: number
}

export interface CoursewareFile {
  name: string
  type?: string
  size?: number
  url: string
}

export interface CoursewareCreateData {
  id?: number
  title: string
  description?: string
  category: number
  tags?: string
  files?: CoursewareFile[]
  status?: number
  materialIds?: number[]
}

export interface CoursewareListRequestParams {
  keyword?: string
  status?: number
  sort?: string
  page?: number
  pageSize?: number
}

export interface CoursewareStaffListRequestParams {
  keyword?: string
  type?: string
  id: string
}

export interface BatchDeleteRequestParams {
  ids: number[]
}

export interface CoursewareListResponseData {
  code: number
  message: string
  data: {
    coursewares: CoursewareListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CoursewareStaffListResponseData {
  code: number
  message: string
  data: {
    users: StaffListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CoursewareDetailResponseData {
  code: number
  message: string
  data: CoursewareListData
}

export interface CoursewareActionResponseData {
  code: number
  message: string
}
