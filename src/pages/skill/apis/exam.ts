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
  passScore: number // 及格分数
  duration: number // 考试时长
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
  examEntity?: {
    _id: number
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

export interface ExamActionResponse {
  code: number
  message: string
}

// 生成考试参数
export interface GenerateExamParams {
  recordId: number
  title?: string
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

export function getMyExamList(params: ExamListParams) {
  return request<ExamListResponse>({
    url: "exam/mylist",
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
    url: `exam/generate/${data.recordId}`,
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

// 提交考试答案接口参数
export interface SubmitExamParams {
  answers: {
    questionId: number
    userAnswer: string
  }[]
}

// 提交考试答案响应
export interface SubmitExamResponse {
  code: number
  message: string
  data: {
    examId: number
    recordId: number
    totalScore: number
    correctCount: number
    totalCount: number
    isPassed: boolean
  }
}

// 获取考试结果响应
export interface ExamResultResponse {
  code: number
  message: string
  data: {
    exam: Exam
    examRecord: any
    questions: any[]
    statistics: {
      totalQuestions: number
      correctCount: number
      incorrectCount: number
      pendingCount: number
      score: number
      maxScore: number
      isPassed: boolean
      passScore: number
      typeStats: Record<string, any>
    }
  }
}

// 提交考试答案
export function submitExam(id: number, data: SubmitExamParams) {
  return request<SubmitExamResponse>({
    url: `exam/${id}/submit`,
    method: "post",
    data
  })
}

// 获取考试结果
export function getExamResult(id: number) {
  return request<ExamResultResponse>({
    url: `exam/${id}/result`,
    method: "get"
  })
}

// 发布试卷
export function publishExam(id: number) {
  return request<ExamDetailResponse>({
    url: `exam/${id}/publish`,
    method: "put"
  })
}

// 考试列表查询参数
export interface ScoreReportData {
  exam_record_id: number
  paper_path: {
    name: string
    url: string
  }[]
  score: number
}

// 上报成绩
export function reportScore(data: ScoreReportData) {
  return request<ExamActionResponse>({
    url: `exam/${data.exam_record_id}/report`,
    method: "post",
    data
  })
}
