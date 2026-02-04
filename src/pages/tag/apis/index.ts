import type * as Tag from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Tag.TagListRequestParams) {
  return request<Tag.TagListResponseData>({
    url: "tag/list",
    method: "get",
    params
  })
}

export function createTag(data: Tag.CreateTagRequestData) {
  return request<Tag.TagOperationResponseData>({
    url: "tag/",
    method: "post",
    data
  })
}

export function updateTag(id: number, data: Tag.UpdateTagRequestData) {
  return request<Tag.TagOperationResponseData>({
    url: `tag/${id}`,
    method: "put",
    data
  })
}

export function deleteTag(id: number) {
  return request<Tag.TagOperationResponseData>({
    url: `tag/${id}`,
    method: "delete"
  })
}
