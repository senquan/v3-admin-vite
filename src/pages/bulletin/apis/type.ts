// 公告数据结构定义

// 用户信息
export interface UserInfo {
  _id: number
  username: string
  email: string
  nickname?: string
}

// 公告列表数据
export interface BulletinListData {
  id: number
  title: string
  content: string
  type: number
  status: number
  priority: number
  is_pinned: boolean
  published_at: string | null
  expired_at: string | null
  read_count: number
  attachment_url: string | null
  attachment_name: string | null
  remark: string | null
  is_deleted: boolean
  creator_id: number
  updater_id: number | null
  publisher_id: number | null
  created_at: string
  updated_at: string
  creator: UserInfo
  updater: UserInfo | null
  publisher: UserInfo | null
}

// 公告详情数据
export interface BulletinDetailData extends BulletinListData {
  // 详情页可能包含更多字段，目前与列表数据相同
}

// 公告列表请求参数
export interface BulletinListRequestParams {
  page?: number
  pageSize?: number
  keyword?: string
  type?: number | ""
  status?: number | ""
  priority?: number | ""
  is_pinned?: boolean | ""
  creator_id?: number | ""
  start_date?: string
  end_date?: string
}

// 公告列表响应数据
export interface BulletinListResponseData {
  code: number
  message: string
  data: {
    bulletins: BulletinListData[]
    total: number
    page: number
    pageSize: number
  }
}

// 公告详情响应数据
export interface BulletinDetailResponseData {
  data: BulletinDetailData
  message: string
  code: number
}

// 公告创建请求体
export interface BulletinCreateRequestBody {
  title: string
  content: string
  type?: number
  status?: number
  priority?: number
  is_pinned?: boolean
  published_at?: string
  expired_at?: string
  attachment_url?: string
  attachment_name?: string
  remark?: string
}

// 公告更新请求体
export interface BulletinUpdateRequestBody {
  title?: string
  content?: string
  type?: number
  status?: number
  priority?: number
  is_pinned?: boolean
  published_at?: string
  expired_at?: string
  attachment_url?: string
  attachment_name?: string
  remark?: string
}

// 公告操作响应数据
export interface BulletinActionResponseData {
  data: BulletinDetailData | null
  message: string
  code: number
}

// 批量删除请求体
export interface BulletinBatchDeleteRequestBody {
  ids: number[]
}

// 批量删除响应数据
export interface BulletinBatchDeleteResponseData {
  data: {
    deleted_count: number
    deleted_ids: number[]
  }
  message: string
  code: number
}

// 按类型获取公告请求参数
export interface BulletinByTypeRequestParams {
  page?: number
  limit?: number
  status?: number
}

// 公告类型选项
export interface BulletinTypeOptions {
  label: string
  value: number
  color?: string
}

// 公告状态选项
export interface BulletinStatusOptions {
  label: string
  value: number
  color?: string
}

// 公告优先级选项
export interface BulletinPriorityOptions {
  label: string
  value: number
  color?: string
}
