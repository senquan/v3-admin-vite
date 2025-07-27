// 任务类型枚举
export enum TaskType {
  TRAINING = 1, // 培训
  EXAM = 2, // 考试
  SURVEY = 3, // 问卷
  CHECKIN = 4, // 签到
  HOMEWORK = 5, // 作业
  LIVE = 6, // 直播
  MIXED = 7 // 混合
}

// 任务状态枚举
export enum TaskStatus {
  DRAFT = 0, // 草稿
  PUBLISHED = 1, // 已发布
  IN_PROGRESS = 2, // 进行中
  COMPLETED = 3, // 已完成
  CANCELLED = 4 // 已取消
}

// 任务优先级枚举
export enum TaskPriority {
  LOW = 1, // 低
  MEDIUM = 2, // 中
  HIGH = 3 // 高
}

// 任务项类型枚举
export enum TaskItemType {
  COURSEWARE = 1, // 课件学习
  EXAM = 2, // 考试
  SURVEY = 3, // 问卷
  CHECKIN = 4, // 签到
  HOMEWORK = 5, // 作业
  LIVE = 6, // 直播
  EXTERNAL_LINK = 7 // 外部链接
}

// 任务项状态枚举
export enum TaskItemStatus {
  INACTIVE = 0, // 未激活
  ACTIVE = 1, // 激活
  DISABLED = 2 // 禁用
}

// 分配类型枚举
export enum AssignmentType {
  USER = 1, // 分配给用户
  DEPARTMENT = 2, // 分配给部门
  ROLE = 3, // 分配给角色
  ALL = 4 // 分配给所有人
}

// 分配状态枚举
export enum AssignmentStatus {
  PENDING = 0, // 待开始
  IN_PROGRESS = 1, // 进行中
  COMPLETED = 2, // 已完成
  OVERDUE = 3, // 已逾期
  EXEMPTED = 4 // 已免除
}

// 进度状态枚举
export enum ProgressStatus {
  NOT_STARTED = 0, // 未开始
  IN_PROGRESS = 1, // 进行中
  COMPLETED = 2, // 已完成
  FAILED = 3, // 失败
  SKIPPED = 4 // 跳过
}

// 任务基础信息接口
export interface Task {
  _id: number
  title: string
  description?: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  start_time?: string
  end_time?: string
  publish_time?: string
  expected_participants: number
  actual_participants: number
  completed_participants: number
  completion_rate: string
  allow_makeup: boolean
  auto_assign: boolean
  auto_assign_rules?: any
  task_config?: any
  tags?: string
  remark?: string
  is_deleted: number
  created_time: string
  updated_time: string
  creator: number
  updater?: number
  creatorEntity?: {
    _id: number
    name: string
    realname: string
  }
  updaterEntity?: {
    _id: number
    name: string
    realname: string
  }
  taskItems?: TaskItem[]
  taskAssignments?: TaskAssignment[]
  // 统计信息
  total_assignments?: number
  pending_assignments?: number
  in_progress_assignments?: number
  completed_assignments?: number
  overdue_assignments?: number
  avg_progress?: number
  avg_score?: number
}

// 任务项接口
export interface TaskItem {
  _id?: number
  task_id?: number
  title: string
  description?: string
  item_type: TaskItemType
  status: TaskItemStatus
  courseware_id?: number
  exam_id?: number
  survey_id?: number
  external_url?: string
  sort_order: number
  is_required: boolean
  required_duration: number
  pass_score: number
  max_attempts: number
  start_time?: string
  end_time?: string
  item_config?: any
  weight: number
  completion_criteria?: string
  remark?: string
  is_deleted: number
  created_time?: string
  updated_time?: string
  creator?: number
  updater?: number
  courseware?: {
    _id: number
    title: string
    materials?: {
      id: number
      title: string
      file_path: string
    }[]
  }
  exam?: {
    _id: number
    title: string
  }
}

// 任务分配接口
export interface TaskAssignment {
  _id?: number
  task_id?: number
  assignment_type: AssignmentType
  user_id?: number
  department_id?: number
  role_name?: string
  status: AssignmentStatus
  start_time?: string
  completion_time?: string
  deadline?: string
  progress: number
  total_score: number
  achieved_score: number
  study_duration: number
  attempt_count: number
  is_passed: boolean
  is_exempted: boolean
  exemption_reason?: string
  last_access_time?: string
  extra_data?: any
  remark?: string
  is_deleted: number
  created_time?: string
  updated_time?: string
  assigner?: number
  updater?: number
  user?: {
    _id: number
    username: string
    real_name: string
  }
  department?: {
    _id: number
    name: string
  }
}

// 任务进度接口
export interface TaskProgress {
  _id: number
  task_id: number
  task_item_id: number
  user_id: number
  status: ProgressStatus
  progress: number
  score: number
  max_score: number
  study_duration: number
  attempt_count: number
  is_passed: boolean
  start_time?: string
  completion_time?: string
  last_access_time?: string
  access_count: number
  progress_data?: any
  answer_records?: any
  notes?: string
  feedback?: string
  rating: number
  failure_reason?: string
  extra_data?: any
  remark?: string
  is_deleted: number
  created_time: string
  updated_time: string
}

// 创建任务请求接口
export interface CreateTaskRequest {
  title: string
  description?: string
  type: TaskType
  priority?: TaskPriority
  start_time?: string
  end_time?: string
  publish_time?: string
  expected_participants?: number
  allow_makeup?: boolean
  auto_assign?: boolean
  auto_assign_rules?: any
  task_config?: any
  tags?: string
  remark?: string
  taskItems?: Omit<TaskItem, "_id" | "task_id" | "created_time" | "updated_time" | "creator" | "updater">[]
  assignments?: Omit<TaskAssignment, "_id" | "task_id" | "created_time" | "updated_time" | "assigner" | "updater">[]
}

// 更新任务请求接口
export interface UpdateTaskRequest {
  title?: string
  description?: string
  type?: TaskType
  priority?: TaskPriority
  start_time?: string
  end_time?: string
  publish_time?: string
  expected_participants?: number
  allow_makeup?: boolean
  auto_assign?: boolean
  auto_assign_rules?: any
  task_config?: any
  tags?: string
  remark?: string
}

// 任务查询参数接口
export interface TaskQueryParams {
  page?: number
  limit?: number
  title?: string
  type?: TaskType
  status?: TaskStatus
  priority?: TaskPriority
  creator?: number
  start_date?: string
  end_date?: string
  tags?: string
}

// 任务列表响应接口
export interface TaskListResponse {
  code: number
  message: string
  data: {
    tasks: Task[]
    total: number
    page: number
    pageSize: number
  }
}

export interface TaskDetailResponseData {
  code: number
  message: string
  data: Task
}

export interface TaskActionResponseData {
  code: number
  message: string
  data: {
    task_id: number
    action: string
  }
}

export interface TaskActionResponseData {
  code: number
  message: string
  data: {
    task_id: number
    action: string
  }
}

// 任务类型选项
export const TaskTypeOptions = [
  { label: "培训", value: TaskType.TRAINING },
  { label: "考试", value: TaskType.EXAM },
  { label: "问卷", value: TaskType.SURVEY },
  { label: "签到", value: TaskType.CHECKIN },
  { label: "作业", value: TaskType.HOMEWORK },
  { label: "直播", value: TaskType.LIVE },
  { label: "混合", value: TaskType.MIXED }
]

// 任务状态选项
export const TaskStatusOptions = [
  { label: "草稿", value: TaskStatus.DRAFT, color: "#999" },
  { label: "已发布", value: TaskStatus.PUBLISHED, color: "#1890ff" },
  { label: "进行中", value: TaskStatus.IN_PROGRESS, color: "#52c41a" },
  { label: "已完成", value: TaskStatus.COMPLETED, color: "#722ed1" },
  { label: "已取消", value: TaskStatus.CANCELLED, color: "#f5222d" }
]

// 任务优先级选项
export const TaskPriorityOptions = [
  { label: "低", value: TaskPriority.LOW, color: "#52c41a" },
  { label: "中", value: TaskPriority.MEDIUM, color: "#faad14" },
  { label: "高", value: TaskPriority.HIGH, color: "#f5222d" }
]

// 任务项类型选项
export const TaskItemTypeOptions = [
  { label: "课件学习", value: TaskItemType.COURSEWARE },
  { label: "考试", value: TaskItemType.EXAM },
  { label: "问卷", value: TaskItemType.SURVEY },
  { label: "签到", value: TaskItemType.CHECKIN },
  { label: "作业", value: TaskItemType.HOMEWORK },
  { label: "直播", value: TaskItemType.LIVE },
  { label: "外部链接", value: TaskItemType.EXTERNAL_LINK }
]

// 分配类型选项
export const AssignmentTypeOptions = [
  { label: "指定用户", value: AssignmentType.USER },
  { label: "指定部门", value: AssignmentType.DEPARTMENT },
  { label: "指定角色", value: AssignmentType.ROLE },
  { label: "所有人", value: AssignmentType.ALL }
]

// 分配状态选项
export const AssignmentStatusOptions = [
  { label: "待开始", value: AssignmentStatus.PENDING, color: "#999" },
  { label: "进行中", value: AssignmentStatus.IN_PROGRESS, color: "#1890ff" },
  { label: "已完成", value: AssignmentStatus.COMPLETED, color: "#52c41a" },
  { label: "已逾期", value: AssignmentStatus.OVERDUE, color: "#f5222d" },
  { label: "已免除", value: AssignmentStatus.EXEMPTED, color: "#722ed1" }
]
