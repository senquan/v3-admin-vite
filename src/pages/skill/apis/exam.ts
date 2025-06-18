import { request } from "@/http/axios"

// 考试设置接口
export interface ExamSettings {
  totalScore: number
  examCategory: number // 考试分类
  level: number // 难度级别
  coverage: number // 知识点覆盖率
  difficulty: number // 难易度
  fairness: number // 公平性指标
  questionCount: number // 题目数量
  questionTypes: string[] // 题目类型
  categories: number[] // 知识分类
}

// 考试信息接口
export interface Exam {
  _id?: number
  title: string
  description?: string
  type: number
  category_id: number
  training_category: number
  level: number
  total_score: number
  pass_score: number
  duration: number
  status: boolean
  creator?: number
  updater?: number
  create_time?: string
  update_time?: string
  categoryEntity?: {
    _id: number
    name: string
  }
  creatorEntity?: {
    _id: number
    username: string
  }
  examQuestions?: ExamQuestion[]
}

// 考试题目关联接口
export interface ExamQuestion {
  _id?: number
  exam_id: number
  question_id: number
  question_score: number
  question_order: number
  create_time?: string
  questionEntity?: {
    _id: number
    content: string
    question_type: string
    difficulty: number
    answer?: string
    analysis?: string
    options?: any[]
  }
}

// 考试列表查询参数
export interface ExamListParams {
  page?: number
  pageSize?: number
  keyword?: string
  type?: number
  category_id?: number
  level?: number
}

// 考试列表响应
export interface ExamListResponse {
  code: number
  message: string
  data: {
    exams: Exam[]
    total: number
    page: number
    pageSize: number
  }
}

// 考试详情响应
export interface ExamDetailResponse {
  code: number
  message: string
  data: {
    exam: Exam
  }
}

// 生成考试参数
export interface GenerateExamParams {
  title: string
  description?: string
  examType?: number
  settings?: Partial<ExamSettings>
}

// 生成考试响应
export interface GenerateExamResponse {
  code: number
  message: string
  data: {
    exam: Exam
    message: string
  }
}

// 获取考试列表
export function getExamList(params: ExamListParams) {
  return request<ExamListResponse>({
    url: "exam/list",
    method: "get",
    params
  })
}

// 获取考试详情
export function getExamDetail(id: number) {
  return request<ExamDetailResponse>({
    url: `exam/${id}`,
    method: "get"
  })
}

// 生成考试
export function generateExam(data: GenerateExamParams) {
  return request<GenerateExamResponse>({
    url: "exam/generate",
    method: "post",
    data
  })
}

// 更新考试设置
export function updateExamSettings(id: number, settings: Partial<ExamSettings>) {
  return request<{ code: number, message: string, data: { exam: Exam } }>({
    url: `exam/${id}/settings`,
    method: "put",
    data: { settings }
  })
}

// 重新生成考试题目
export function regenerateExam(id: number, settings?: Partial<ExamSettings>) {
  return request<GenerateExamResponse>({
    url: `exam/${id}/regenerate`,
    method: "post",
    data: { settings }
  })
}
