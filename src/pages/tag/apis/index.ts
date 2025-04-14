import type * as Tag from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Tag.TagListRequestParams) {
  return request<Tag.TagListResponseData>({
    url: "tag/list",
    method: "get",
    params
  })
}
