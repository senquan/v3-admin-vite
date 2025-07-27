import type * as Task from "./type"
import { request } from "@/http/axios"

/**
 * 获取任务列表
 * @param params 查询参数
 * @returns 任务列表响应
 */
export function getTaskList(params?: Task.TaskQueryParams) {
  return request<Task.TaskListResponse>({
    url: "task",
    method: "get",
    params
  })
}

/**
 * 获取任务详情
 * @param id 任务ID
 * @returns 任务详情
 */
export function getTaskById(id: number) {
  return request<Task.TaskDetailResponseData>({
    url: `task/${id}`,
    method: "get"
  })
}

/**
 * 创建任务
 * @param data 任务数据
 * @returns 创建的任务
 */
export function createTask(data: Task.CreateTaskRequest) {
  return request<Task.TaskActionResponseData>({
    url: "task",
    method: "post",
    data
  })
}

/**
 * 更新任务
 * @param id 任务ID
 * @param data 更新数据
 * @returns 更新后的任务
 */
export function updateTask(id: number, data: Task.UpdateTaskRequest) {
  return request<Task.TaskActionResponseData>({
    url: `task/${id}`,
    method: "put",
    data
  })
}

/**
 * 删除任务
 * @param id 任务ID
 * @returns 删除结果
 */
export function deleteTask(id: number) {
  return request<Task.TaskActionResponseData>({
    url: `task/${id}`,
    method: "delete"
  })
}

/**
 * 批量删除任务
 * @param ids 任务ID列表
 * @returns 删除结果
 */
export function batchDeleteTasks(ids: number[]) {
  return request<Task.TaskActionResponseData>({
    url: "task/batch-delete",
    method: "post",
    data: { ids }
  })
}

/**
 * 发布任务
 * @param id 任务ID
 * @returns 发布结果
 */
export function publishTask(id: number) {
  return request<Task.TaskActionResponseData>({
    url: `task/${id}/publish`,
    method: "post"
  })
}

/**
 * 分配学员到任务
 * @param taskId 任务ID
 * @param data 分配数据
 * @returns 分配结果
 */
export function assignStudentsToTask(taskId: number, data: {
  userIds?: number[]
  departmentIds?: number[]
  reason?: string
}) {
  return request<Task.TaskActionResponseData>({
    url: `task/${taskId}/assign-students`,
    method: "post",
    data
  })
}

/**
 * 获取用户列表（用于任务分配）
 * @returns 用户列表
 */
export function getUserList() {
  return request({
    url: "user",
    method: "get",
    params: {
      page: 1,
      limit: 1000,
      status: 1 // 只获取激活的用户
    }
  })
}

/**
 * 获取部门列表（用于任务分配）
 * @returns 部门列表
 */
export function getDepartmentList() {
  return request({
    url: "department",
    method: "get",
    params: {
      page: 1,
      limit: 1000
    }
  })
}

/**
 * 获取任务统计数据
 * @returns 统计数据
 */
export function getTaskStatistics() {
  return request({
    url: "task/statistics",
    method: "get"
  })
}

/**
 * 获取我的任务列表
 * @param params 查询参数
 * @returns 我的任务列表
 */
export function getMyTasks(params?: Task.TaskQueryParams) {
  return request({
    url: "task/my-tasks",
    method: "get",
    params
  })
}

/**
 * 开始任务
 * @param taskId 任务ID
 * @returns 开始结果
 */
export function startTask(taskId: number) {
  return request({
    url: `task/${taskId}/start`,
    method: "post"
  })
}

/**
 * 完成任务项
 * @param taskId 任务ID
 * @param itemId 任务项ID
 * @param data 完成数据
 * @returns 完成结果
 */
export function completeTaskItem(taskId: number, itemId: number, data: any) {
  return request({
    url: `task/${taskId}/items/${itemId}/complete`,
    method: "post",
    data
  })
}

/**
 * 获取任务进度
 * @param taskId 任务ID
 * @returns 任务进度
 */
export function getTaskProgress(taskId: number) {
  return request({
    url: `task/${taskId}/progress`,
    method: "get"
  })
}

/**
 * 提交任务反馈
 * @param taskId 任务ID
 * @param data 反馈数据
 * @returns 提交结果
 */
export function submitTaskFeedback(taskId: number, data: {
  rating: number
  feedback?: string
  notes?: string
}) {
  return request({
    url: `task/${taskId}/feedback`,
    method: "post",
    data
  })
}

/**
 * 申请任务免除
 * @param taskId 任务ID
 * @param reason 免除原因
 * @returns 申请结果
 */
export function requestTaskExemption(taskId: number, reason: string) {
  return request({
    url: `task/${taskId}/exemption`,
    method: "post",
    data: { reason }
  })
}

/**
 * 审批任务免除
 * @param taskId 任务ID
 * @param userId 用户ID
 * @param approved 是否批准
 * @param remark 审批备注
 * @returns 审批结果
 */
export function approveTaskExemption(taskId: number, userId: number, approved: boolean, remark?: string) {
  return request({
    url: `task/${taskId}/exemption/approve`,
    method: "post",
    data: {
      userId,
      approved,
      remark
    }
  })
}
