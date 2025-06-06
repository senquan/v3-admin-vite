import type * as Courseware from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Courseware.CoursewareListRequestParams) {
  return request<Courseware.CoursewareListResponseData>({
    url: "courseware/list",
    method: "get",
    params
  })
}

export function fetchDetail(id: number) {
  return request<Courseware.CoursewareDetailResponseData>({
    url: `courseware/detail/${id}`,
    method: "get"
  })
}

export function createCourseware(data: Courseware.CoursewareCreateData) {
  return request<Courseware.CoursewareActionResponseData>({
    url: "courseware/create",
    method: "post",
    data
  })
}

export function updateCourseware(id: number, data: Courseware.CoursewareCreateData) {
  return request<Courseware.CoursewareActionResponseData>({
    url: `courseware/update/${id}`,
    method: "put",
    data
  })
}

export function deleteCourseware(id: number) {
  return request<Courseware.CoursewareActionResponseData>({
    url: `courseware/delete/${id}`,
    method: "delete"
  })
}

export function batchDeleteCourseware(data: Courseware.BatchDeleteRequestParams) {
  return request<Courseware.CoursewareActionResponseData>({
    url: "courseware/batch-delete",
    method: "post",
    data
  })
}

export function fetchStaff(params: Courseware.CoursewareStaffListRequestParams) {
  return request<Courseware.CoursewareStaffListResponseData>({
    url: `user/list`,
    method: "get",
    params
  })
}
