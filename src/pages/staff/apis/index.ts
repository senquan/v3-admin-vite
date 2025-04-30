import type * as Staff from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Staff.StaffListRequestParams) {
  return request<Staff.StaffListResponseData>({
    url: "staff/list",
    method: "get",
    params
  })
}

export function fetchStaff(id: number) {
  return request<Staff.StaffDetailResponseData>({
    url: `staff/${id}`,
    method: "get"
  })
}

export function createStaff(data: Staff.StaffCreateData) {
  return request<Staff.StaffActionResponseData>({
    url: "staff/",
    method: "post",
    data
  })
}

export function updateStaff(id: number, data: Staff.StaffCreateData) {
  return request<Staff.StaffActionResponseData>({
    url: `staff/${id}`,
    method: "put",
    data
  })
}

export function updateUserRole(id: number, data: Staff.StaffRoleData) {
  return request<Staff.StaffActionResponseData>({
    url: `users/${id}/role`,
    method: "put",
    data
  })
}

export function deleteStaff(id: number) {
  return request<Staff.StaffActionResponseData>({
    url: `staff/${id}`,
    method: "delete"
  })
}

export function fetchUnbindUsers(params: Staff.StaffListRequestParams) {
  return request<Staff.UnbindUserResponseData>({
    url: "users/unbind",
    method: "get",
    params
  })
}

export function fetchUserRole(id: number) {
  return request<Staff.UserRolesResponseData>({
    url: `users/${id}/roles`,
    method: "get"
  })
}
