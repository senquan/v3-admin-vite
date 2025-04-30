import type * as Role from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Role.RoleListRequestParams) {
  return request<Role.RoleListResponseData>({
    url: "roles/list",
    method: "get",
    params
  })
}

export function fetchRole(id: number) {
  return request<Role.RoleDetailResponseData>({
    url: `roles/${id}`,
    method: "get"
  })
}

export function createRole(data: Role.RoleCreateData) {
  return request<Role.RoleActionResponseData>({
    url: "roles/",
    method: "post",
    data
  })
}

export function updateRole(id: number, data: Role.RoleCreateData) {
  return request<Role.RoleActionResponseData>({
    url: `roles/${id}`,
    method: "put",
    data
  })
}

export function deleteRole(id: number) {
  return request<Role.RoleActionResponseData>({
    url: `roles/${id}`,
    method: "delete"
  })
}

export function fetchRoleTags(id: number) {
  return request<Role.RoleTagsResponseData>({
    url: `roles/${id}/tags`,
    method: "get"
  })
}

export function updateRoleTags(id: number, data: Role.RoleTagsData) {
  return request<Role.RoleActionResponseData>({
    url: `roles/${id}/tags`,
    method: "put",
    data
  })
}
