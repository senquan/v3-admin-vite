import type * as Matrix from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Matrix.MatrixListRequestParams) {
  return request<Matrix.MatrixListResponseData>({
    url: "matrix/list",
    method: "get",
    params
  })
}

export function fetchMatrixOpt() {
  return fetchList({
    format: "opt"
  })
}

export function fetchStaff(params: Matrix.MatrixStaffListRequestParams) {
  return request<Matrix.MatrixStaffListResponseData>({
    url: `user/list`,
    method: "get",
    params
  })
}

export function createMatrix(data: Matrix.MatrixCreateData) {
  return request<Matrix.MatrixActionResponseData>({
    url: "matrix/",
    method: "post",
    data
  })
}
