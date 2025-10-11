import type * as Users from "./type"
import { request } from "@/http/axios"

/** 获取当前登录用户详情 */
export function getCurrentUserApi() {
  return request<Users.CurrentUserResponseData>({
    url: "user/me",
    method: "get"
  })
}

/** 获取分公司用户列表 */
export function getBranchUserList(params?: Users.BranchUserListParams) {
  return request<Users.BranchUserListResponseData>({
    url: "user/list",
    method: "get",
    params: {
      type: params?.type,
      id: params?.id,
      keyword: params?.keyword
    }
  })
}

/** 获取当前登录用户的权限 */
export function getUserPermissions() {
  return request<Users.UserPermissionsResponseData>({
    url: "user/permissions",
    method: "get"
  })
}
