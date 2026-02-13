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
