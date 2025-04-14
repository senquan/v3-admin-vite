import type * as Template from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Template.TemplateListRequestParams) {
  return request<Template.TemplateListResponseData>({
    url: "template/list",
    method: "get",
    params
  })
}

export function fetchListOpt() {
  return request<Template.TemplateListOptResponseData>({
    url: "template/list",
    method: "get",
    params: {
      format: 'opt'
    }
  })
}

export function fetchDetail(id: number) {
  return request<Template.TemplateFieldsResponseData>({
    url: `template/${id}`,
    method: "get"
  })
}
