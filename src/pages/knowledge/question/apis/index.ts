import type * as Question from "./type";
import { request } from "@/http/axios";

// 获取题库列表
export function getQuestionList(params: Question.QuestionListParams) {
  return request<Question.QuestionListResponse>({
    url: "question/list",
    method: "get",
    params
  });
}

// 获取题目详情
export function getQuestionDetail(id: number) {
  return request<Question.QuestionDetailResponseData>({
    url: `question/${id}`,
    method: "get"
  });
}

// 创建题目
export function createQuestion(data: Question.CreateQuestionParams) {
  return request<Question.QuestionActionResponseData>({
    url: "question/",
    method: "post",
    data
  });
}

// 更新题目
export function updateQuestion(id: number, data: Question.CreateQuestionParams) {
  return request<Question.QuestionActionResponseData>({
    url: `question/${id}`,
    method: "put",
    data
  });
}

// 删除题目
export function deleteQuestion(id: number) {
  return request<Question.QuestionActionResponseData>({
    url: `question/${id}`,
    method: "delete"
  });
}

// 批量删除题目
export function batchDeleteQuestions(data: Question.BatchDeleteParams) {
  return request<Question.QuestionActionResponseData>({
    url: "question/batch-delete",
    method: "post",
    data
  });
}

// 批量导入题目
export function importQuestions(data: any[]) {
  return request<any>({
    url: "question/import",
    method: "post",
    data: { questions: data }
  });
}
