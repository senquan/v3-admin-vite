import type * as Trainer from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Trainer.TrainerListRequestParams) {
  return request<Trainer.TrainerListResponseData>({
    url: "trainer/list",
    method: "get",
    params
  })
}

export function fetchDetail(id: number) {
  return request<Trainer.TrainerDetailResponseData>({
    url: `trainer/detail/${id}`,
    method: "get"
  })
}

export function createTrainer(data: Trainer.TrainerCreateData) {
  return request<Trainer.TrainerActionResponseData>({
    url: "trainer/create",
    method: "post",
    data
  })
}

export function updateTrainer(id: number, data: Trainer.TrainerCreateData) {
  return request<Trainer.TrainerActionResponseData>({
    url: `trainer/update/${id}`,
    method: "put",
    data
  })
}

export function deleteTrainer(id: number) {
  return request<Trainer.TrainerActionResponseData>({
    url: `trainer/delete/${id}`,
    method: "delete"
  })
}

export function batchDeleteTrainer(data: Trainer.BatchDeleteRequestParams) {
  return request<Trainer.TrainerActionResponseData>({
    url: "trainer/batch-delete",
    method: "post",
    data
  })
}

export function fetchUsers(params: { keyword?: string, page?: number, pageSize?: number }) {
  return request<Trainer.UserListResponseData>({
    url: "user/list",
    method: "get",
    params
  })
}

export function fetchTags(params: { keyword?: string, page?: number, pageSize?: number }) {
  return request<Trainer.TagListResponseData>({
    url: "tag/list",
    method: "get",
    params
  })
}
