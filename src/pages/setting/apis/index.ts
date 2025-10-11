import type * as Role from "./role-type"
import type * as Tags from "./type"
import type * as User from "./user-type"
import { request } from "@/http/axios"

export function fetchCategoryList(params: Tags.CommonListRequestParams) {
  return request<Tags.CategoryListResponseData>({
    url: "category/list",
    method: "get",
    params
  })
}

export function fetchCategoryListOpt(type: number) {
  return request<Tags.CategoryListResponseData>({
    url: "category/list",
    method: "get",
    params: {
      type,
      format: "opt"
    }
  })
}

export function createCategory(data: Tags.CategoryCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: "category/",
    method: "post",
    data
  })
}

export function updateCategory(id: number, data: Tags.CategoryCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: `category/${id}`,
    method: "put",
    data
  })
}

export function deleteCategory(id: number) {
  return request<Tags.CommonActionResponseData>({
    url: `category/${id}`,
    method: "delete"
  })
}

export function fetchTagList(params: Tags.CommonListRequestParams) {
  return request<Tags.TagListResponseData>({
    url: "tag/list",
    method: "get",
    params
  })
}

export function fetchTagTree(params: Tags.CommonListRequestParams) {
  return request<Tags.TagListResponseData>({
    url: "tag/tree",
    method: "get",
    params
  })
}

export function fetchTagListOpt() {
  return request<Tags.TagListResponseData>({
    url: "tag/list",
    method: "get",
    params: {
      format: "opt"
    }
  })
}

export function createTag(data: Tags.TagCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: "tag/",
    method: "post",
    data
  })
}

export function updateTag(id: number, data: Tags.TagCreateData) {
  return request<Tags.CommonActionResponseData>({
    url: `tag/${id}`,
    method: "put",
    data
  })
}

export function deleteTag(id: number) {
  return request<Tags.CommonActionResponseData>({
    url: `tag/${id}`,
    method: "delete"
  })
}

export function deleteTagGroup(id: number) {
  return request<Tags.CommonActionResponseData>({
    url: `tag/group/${id}`,
    method: "delete"
  })
}

export function fetchList(params: User.UserListRequestParams) {
  return request<User.UserListResponseData>({
    url: "user/local",
    method: "get",
    params
  })
}

export function fetchUser(id: number) {
  return request<User.UserDetailResponseData>({
    url: `user/${id}`,
    method: "get"
  })
}

export function createUser(data: User.UserCreateData) {
  return request<User.UserActionResponseData>({
    url: "user/",
    method: "post",
    data
  })
}

export function updateUser(id: number, data: User.UserCreateData) {
  return request<User.UserActionResponseData>({
    url: `user/${id}`,
    method: "put",
    data
  })
}

export function updateUserRole(id: number, data: User.UserRoleData) {
  return request<User.UserActionResponseData>({
    url: `user/${id}/role`,
    method: "put",
    data
  })
}

export function deleteUser(id: number) {
  return request<User.UserActionResponseData>({
    url: `user/${id}`,
    method: "delete"
  })
}

export function fetchUnbindUsers(params: User.UserListRequestParams) {
  return request<User.UnbindUserResponseData>({
    url: "user/unbind",
    method: "get",
    params
  })
}

export function fetchUserRole(id: number) {
  return request<User.UserRolesResponseData>({
    url: `user/${id}/roles`,
    method: "get"
  })
}

export function fetchRoleList(params: Role.RoleListRequestParams) {
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

export function fetchRolePermissions(id: number) {
  return request<Role.RolePermissionsResponseData>({
    url: `roles/${id}/permissions`,
    method: "get"
  })
}

export function updateRolePermissions(id: number, data: Role.RolePermissionsData) {
  return request<Role.RoleActionResponseData>({
    url: `roles/${id}/permissions`,
    method: "put",
    data
  })
}
