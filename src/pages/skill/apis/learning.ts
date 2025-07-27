import { request } from "@/http/axios"
import type { TaskItem, TaskProgress, TaskAssignment } from "@/pages/training/task/apis/type"

// 学习任务接口
export interface LearningTask {
  _id: number
  title: string
  description?: string
  taskItems: TaskItem[]
  assignment: TaskAssignment | null
  progress: TaskProgress[]
}

export interface Material {
  id: number
  title: string
  file_path: string
}

// 课件信息接口
export interface CoursewareInfo {
  _id: number
  title: string
  description?: string
  file_path: string
  file_type: string
  file_size: number
  duration?: number
  materials?: Material[]
}

// 学习进度更新请求
export interface UpdateProgressRequest {
  task_item_id: number
  progress: number
  study_duration: number
  extra_data?: any
}

// 完成任务项请求
export interface CompleteTaskItemRequest {
  task_item_id: number
  score?: number
  study_duration: number
  notes?: string
  extra_data?: any
}

// 获取学习任务详情
export function getLearningTask(taskId: number) {
  return request<{
    code: number
    message: string
    data: LearningTask
  }>({
    url: `task/${taskId}/learning`,
    method: "get"
  })
}

// 获取任务学习内容（新接口）
export function getTaskLearningContent(taskId: number) {
  return request<{
    code: number
    message: string
    data: LearningTask
  }>({
    url: `task/${taskId}/learning-content`,
    method: "get"
  })
}

// 获取课件信息
export function getCoursewareInfo(coursewareId: number) {
  return request<{
    code: number
    message: string
    data: CoursewareInfo
  }>({
    url: `courseware/detail/${coursewareId}`,
    method: "get"
  })
}

// 更新学习进度
export function updateLearningProgress(taskId: number, data: UpdateProgressRequest) {
  return request<{
    code: number
    message: string
    data: any
  }>({
    url: `task/${taskId}/progress`,
    method: "post",
    data
  })
}

// 完成任务项
export function completeTaskItem(taskId: number, data: CompleteTaskItemRequest) {
  return request<{
    code: number
    message: string
    data: any
  }>({
    url: `task/${taskId}/complete-item`,
    method: "post",
    data
  })
}

// 获取任务项进度
export function getTaskItemProgress(taskId: number, taskItemId: number) {
  return request<{
    code: number
    message: string
    data: TaskProgress
  }>({
    url: `task/${taskId}/item/${taskItemId}/progress`,
    method: "get"
  })
}
