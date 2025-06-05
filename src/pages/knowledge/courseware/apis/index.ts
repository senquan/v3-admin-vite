import type * as Courseware from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Courseware.CoursewareListRequestParams) {
  return request<Courseware.CoursewareListResponseData>({
    url: "courseware/list",
    method: "get",
    params
  })
}

export function fetchStaff(params: Courseware.CoursewareStaffListRequestParams) {
  return request<Courseware.CoursewareStaffListResponseData>({
    url: `user/list`,
    method: "get",
    params
  })
}

export function createCourseware(data: Courseware.CoursewareCreateData) {
  return request<Courseware.CoursewareActionResponseData>({
    url: "courseware/",
    method: "post",
    data
  })
}
