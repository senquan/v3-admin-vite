import type * as Survey from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Survey.SurveyListRequestParams) {
  return request<Survey.SurveyListResponseData>({
    url: "survey/list",
    method: "get",
    params
  })
}

export function fetchDetail(id: number) {
  return request<Survey.SurveyDetailResponseData>({
    url: `survey/detail/${id}`,
    method: "get"
  })
}

export function createSurvey(data: Survey.SurveyCreateData) {
  return request<Survey.SurveyActionResponseData>({
    url: "survey/create",
    method: "post",
    data
  })
}

export function updateSurvey(id: number, data: Survey.SurveyCreateData) {
  return request<Survey.SurveyActionResponseData>({
    url: `survey/update/${id}`,
    method: "put",
    data
  })
}

export function deleteSurvey(id: number) {
  return request<Survey.SurveyActionResponseData>({
    url: `survey/delete/${id}`,
    method: "delete"
  })
}

export function batchDeleteSurvey(data: Survey.BatchDeleteRequestParams) {
  return request<Survey.SurveyActionResponseData>({
    url: "survey/batch-delete",
    method: "post",
    data
  })
}

export function publishSurvey(id: number) {
  return request<Survey.SurveyActionResponseData>({
    url: `survey/publish/${id}`,
    method: "put"
  })
}

export function endSurvey(id: number) {
  return request<Survey.SurveyActionResponseData>({
    url: `survey/end/${id}`,
    method: "put"
  })
}

export function fetchSubmissions(surveyId: number, params: any) {
  return request<Survey.SurveySubmissionListResponseData>({
    url: `survey/submissions/${surveyId}`,
    method: "get",
    params
  })
}
