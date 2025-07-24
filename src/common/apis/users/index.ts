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
      id: `branch_${params?.branchId || 0}`
    }
  })
}
