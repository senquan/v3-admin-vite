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

export function getMatrix(id: number) {
  return request<Matrix.MatrixDetailResponseData>({
    url: `matrix/${id}`,
    method: "get"
  })
}

export function createMatrix(data: Matrix.MatrixCreateData) {
  return request<Matrix.MatrixActionResponseData>({
    url: "matrix/",
    method: "post",
    data
  })
}

export function updateMatrix(id: number, data: Matrix.MatrixCreateData) {
  return request<Matrix.MatrixActionResponseData>({
    url: `matrix/${id}`,
    method: "put",
    data
  })
}

export function deleteMatrix(id: number) {
  return request<Matrix.MatrixActionResponseData>({
    url: `matrix/${id}`,
    method: "delete"
  })
}
