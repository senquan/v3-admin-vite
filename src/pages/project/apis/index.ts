import type * as Projects from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Projects.ProjectListRequestParams) {
  return request<Projects.ProjectListResponseData>({
    url: "tag/projects",
    method: "get",
    params
  })
}

export function fetchDetail(params: Projects.ProjectDetailRequestParams) {
  return request<Projects.ProjectDetailResponseData>({
    url: `tag/projects/${params.id}`,
    method: "get",
    params
  })
}
