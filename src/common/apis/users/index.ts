import type * as Users from "./type"
import { request } from "@/http/axios"

/** 获取当前登录用户详情 */
export function getCurrentUserApi() {
  return request<Users.CurrentUserResponseData>({
    url: "users/me",
    method: "get"
  })
}

/** 获取当前登录用户的权限 */
export function getUserPermissions() {
  return request<Users.UserPermissionsResponseData>({
    url: "users/permissions",
    method: "get"
  })
}

export function updateUserProfile(data: Users.UserProfileRequestParams) {
  return request<ApiResponseData<any>>({
    url: "users/profile",
    method: "put",
    data
  })
}

export function updateUserPassword(data: Users.UserPasswordRequestParams) {
  return request<ApiResponseData<any>>({
    url: "users/password",
    method: "put",
    data
  })
}
