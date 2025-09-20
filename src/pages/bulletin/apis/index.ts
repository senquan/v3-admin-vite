import type * as Bulletin from "./type"
import { request } from "@/http/axios"

/**
 * 获取公告列表
 * @param params 查询参数
 * @returns 公告列表数据
 */
export function fetchBulletinList(params: Bulletin.BulletinListRequestParams = {}) {
  return request<Bulletin.BulletinListResponseData>({
    url: "bulletin/",
    method: "get",
    params
  })
}

/**
 * 按类型获取公告列表
 * @param type 公告类型
 * @param params 查询参数
 * @returns 公告列表数据
 */
export function fetchBulletinListByType(
  type: "normal" | "urgent" | "notice",
  params: Bulletin.BulletinByTypeRequestParams = {}
) {
  return request<Bulletin.BulletinListResponseData>({
    url: `bulletin/type/${type}`,
    method: "get",
    params
  })
}

/**
 * 获取公告详情
 * @param id 公告ID
 * @returns 公告详情数据
 */
export function fetchBulletinDetail(id: number) {
  return request<Bulletin.BulletinDetailResponseData>({
    url: `bulletin/${id}`,
    method: "get"
  })
}

/**
 * 创建公告
 * @param data 公告数据
 * @returns 创建结果
 */
export function createBulletin(data: Bulletin.BulletinCreateRequestBody) {
  return request<Bulletin.BulletinActionResponseData>({
    url: "bulletin/",
    method: "post",
    data
  })
}

/**
 * 更新公告
 * @param id 公告ID
 * @param data 更新数据
 * @returns 更新结果
 */
export function updateBulletin(id: number, data: Bulletin.BulletinUpdateRequestBody) {
  return request<Bulletin.BulletinActionResponseData>({
    url: `bulletin/${id}`,
    method: "put",
    data
  })
}

/**
 * 删除公告
 * @param id 公告ID
 * @returns 删除结果
 */
export function deleteBulletin(id: number) {
  return request<Bulletin.BulletinActionResponseData>({
    url: `bulletin/${id}`,
    method: "delete"
  })
}

/**
 * 批量删除公告
 * @param ids 公告ID列表
 * @returns 批量删除结果
 */
export function batchDeleteBulletins(ids: number[]) {
  return request<Bulletin.BulletinBatchDeleteResponseData>({
    url: `bulletin/batch`,
    method: "delete",
    data: { ids }
  })
}

/**
 * 发布公告
 * @param id 公告ID
 * @returns 发布结果
 */
export function publishBulletin(id: number) {
  return request<Bulletin.BulletinActionResponseData>({
    url: `bulletin/${id}/publish`,
    method: "put"
  })
}

/**
 * 归档公告
 * @param id 公告ID
 * @returns 归档结果
 */
export function archiveBulletin(id: number) {
  return request<Bulletin.BulletinActionResponseData>({
    url: `bulletin/${id}/archive`,
    method: "put"
  })
}

// 公告类型选项
export const BULLETIN_TYPE_OPTIONS = [
  { label: "普通公告", value: 1, color: "#409EFF" },
  { label: "紧急公告", value: 2, color: "#F56C6C" },
  { label: "通知公告", value: 3, color: "#E6A23C" }
]

// 公告状态选项
export const BULLETIN_STATUS_OPTIONS = [
  { label: "草稿", value: 0, color: "#909399" },
  { label: "已发布", value: 1, color: "#67C23A" },
  { label: "已归档", value: 2, color: "#C0C4CC" }
]

// 公告优先级选项
export const BULLETIN_PRIORITY_OPTIONS = [
  { label: "低", value: 0, color: "#909399" },
  { label: "中", value: 1, color: "#E6A23C" },
  { label: "高", value: 2, color: "#F56C6C" }
]

// 置顶状态选项
export const BULLETIN_PINNED_OPTIONS = [
  { label: "否", value: false },
  { label: "是", value: true }
]
