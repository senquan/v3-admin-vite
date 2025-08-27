import { request } from "@/http/axios"

// 自学计划接口
export interface StudyPlan {
  _id: number
  title: string
  description?: string
  category: number
  level: number
  status: number
  created_time: string
  updated_time: string
  creator?: number
  study_hours: number
  target_score: number
  coursewares: number[]
  progress?: StudyProgress
}

// 学习进度接口
export interface StudyProgress {
  _id: number
  plan_id: number
  user_id: number
  completed_materials: number[]
  study_duration: number
  progress_percentage: number
  last_study_time: string
  notes?: string
}

// 模拟试卷接口
export interface MockExam {
  _id: number
  title: string
  description?: string
  plan_id: number
  category: number
  level: number
  total_score: number
  pass_score: number
  duration: number
  question_count: number
  status: number
  created_time: string
  questions?: MockQuestion[]
}

// 模拟试题接口
export interface MockQuestion {
  _id: number
  exam_id: number
  question_id: number
  question_score: number
  question_order: number
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

// 答题记录接口
export interface ExamRecord {
  _id: number
  exam_id: number
  user_id: number
  start_time: string
  end_time?: string
  total_score: number
  user_score: number
  is_passed: boolean
  status: number
  answers: ExamAnswer[]
}

// 答题答案接口
export interface ExamAnswer {
  question_id: number
  user_answer: string
  is_correct: boolean
  score: number
}

// 请求参数接口
export interface StudyPlanListParams {
  page?: number
  pageSize?: number
  keyword?: string
  category?: number | string
  level?: number | string
  status?: number | string
}

export interface StudyPlanCreateData {
  title: string
  description?: string
  category: number
  level: number
  study_hours: number
  target_score: number
  coursewares: number[]
}

export interface MockExamCreateData {
  title: string
  description?: string
  plan_id: number
  category: number
  level: number
  total_score: number
  pass_score: number
  duration: number
  question_count: number
}

export interface SubmitExamData {
  answers: {
    question_id: number
    user_answer: string
  }[]
}

// 响应接口
export interface StudyPlanListResponse {
  code: number
  message: string
  data: {
    plans: StudyPlan[]
    total: number
    page: number
    pageSize: number
  }
}

export interface StudyPlanDetailResponse {
  code: number
  message: string
  data: StudyPlan
}

export interface MockExamListResponse {
  code: number
  message: string
  data: {
    exams: MockExam[]
    total: number
    page: number
    pageSize: number
  }
}

export interface MockExamDetailResponse {
  code: number
  message: string
  data: {
    exam: MockExam
    questions: MockQuestion[]
  }
}

export interface ExamResultResponse {
  code: number
  message: string
  data: {
    record: ExamRecord
    exam: MockExam
    questions: MockQuestion[]
    statistics: {
      totalQuestions: number
      correctCount: number
      incorrectCount: number
      score: number
      maxScore: number
      isPassed: boolean
      passScore: number
    }
  }
}

export interface ActionResponse {
  code: number
  message: string
}

// API 函数

// 获取自学计划列表
export function getStudyPlanList(params: StudyPlanListParams) {
  return request<StudyPlanListResponse>({
    url: "study/list",
    method: "get",
    params
  })
}

// 获取自学计划详情
export function getStudyPlanDetail(id: number) {
  return request<StudyPlanDetailResponse>({
    url: `study/plans/${id}`,
    method: "get"
  })
}

// 创建自学计划
export function createStudyPlan(data: StudyPlanCreateData) {
  return request<ActionResponse>({
    url: "study/",
    method: "post",
    data
  })
}

// 更新自学计划
export function updateStudyPlan(id: number, data: StudyPlanCreateData) {
  return request<ActionResponse>({
    url: `study/plans/${id}`,
    method: "put",
    data
  })
}

// 删除自学计划
export function deleteStudyPlan(id: number) {
  return request<ActionResponse>({
    url: `study/plans/${id}`,
    method: "delete"
  })
}

// 更新学习进度
export function updateStudyProgress(planId: number, materialId: number, duration: number) {
  return request<ActionResponse>({
    url: `study/plans/${planId}/progress`,
    method: "post",
    data: {
      material_id: materialId,
      study_duration: duration
    }
  })
}

// 获取模拟试卷列表
export function getMockExamList(planId: number) {
  return request<MockExamListResponse>({
    url: `study/plans/${planId}/mock-exams`,
    method: "get"
  })
}

// 生成模拟试卷
export function generateMockExam(data: MockExamCreateData) {
  return request<ActionResponse>({
    url: "study/mock-exams/generate",
    method: "post",
    data
  })
}

// 获取模拟试卷详情
export function getMockExamDetail(id: number) {
  return request<MockExamDetailResponse>({
    url: `study/mock-exams/${id}`,
    method: "get"
  })
}

// 开始模拟考试
export function startMockExam(examId: number) {
  return request<ActionResponse>({
    url: `study/mock-exams/${examId}/start`,
    method: "post"
  })
}

// 提交模拟考试答案
export function submitMockExam(examId: number, data: SubmitExamData) {
  return request<ActionResponse>({
    url: `study/mock-exams/${examId}/submit`,
    method: "post",
    data
  })
}

// 获取考试结果
export function getMockExamResult(recordId: number) {
  return request<ExamResultResponse>({
    url: `study/exam-records/${recordId}/result`,
    method: "get"
  })
}

// 获取我的考试记录
export function getMyExamRecords(params: { page?: number, pageSize?: number }) {
  return request({
    url: "study/exam-records/my",
    method: "get",
    params
  })
}
