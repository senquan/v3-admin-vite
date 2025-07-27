import type * as Branch from "./type"
import { request } from "@/http/axios"

/** 部门列表 */
export function getBranchList() {
  return request<Branch.BranchListResponseData>({
    url: "branch/list",
    method: "get"
  })
}

export function getBranchListOpt() {
  return request<Branch.BranchListResponseData>({
    url: "branch/list",
    method: "get",
    params: {
      format: "opt"
    }
  })
}
