import type * as Plan from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Plan.PlanListRequestParams) {
  return request<Plan.PlanListResponseData>({
    url: "plan/list",
    method: "get",
    params
  })
}

export function fetchPlan(id: number) {
  return request<Plan.PlanDetailResponseData>({
    url: `plan/${id}`,
    method: "get"
  })
}

export function createPlan(data: Plan.PlanCreateData) {
  return request<Plan.PlanActionResponseData>({
    url: "plan/",
    method: "post",
    data
  })
}

export function updatePlan(id: number, data: Plan.PlanCreateData) {
  return request<Plan.PlanActionResponseData>({
    url: `plan/${id}`,
    method: "put",
    data
  })
}

export function deletePlan(id: number) {
  return request<Plan.PlanActionResponseData>({
    url: `plan/${id}`,
    method: "delete"
  })
}

export function batchDeletePlan(data: Plan.BatchDeleteRequestParams) {
  return request<Plan.PlanActionResponseData>({
    url: `plan/batch/delete`,
    method: "post",
    data
  })
}
