import type * as Ticket from "./type"
import { request } from "@/http/axios"

// 获取工单列表
export function fetchList(params: Ticket.CommonListRequestParams) {
  return request<Ticket.TicketListResponseData>({
    url: "/ticket",
    method: "get",
    params
  })
}

// 获取可指派的用户列表
export function fetchAssigneeList() {
  return request<Ticket.AssigneeListResponseData>({
    url: "/ticket/assignee",
    method: "get"
  })
}

// 获取工单详情
export function fetchDetail(id: number) {
  return request<Ticket.TicketDetailResponseData>({
    url: `/ticket/${id}`,
    method: "get"
  })
}

// 创建工单
export function createTicket(data: any) {
  return request({
    url: "/ticket",
    method: "post",
    data
  })
}

// 更新工单
export function updateTicket(id: number, data: any) {
  return request({
    url: `/ticket/${id}`,
    method: "put",
    data
  })
}

// 删除工单
export function deleteTicket(id: number) {
  return request({
    url: `/ticket/${id}`,
    method: "delete"
  })
}

// 分配工单
export function assignTicket(id: number, data: any) {
  return request({
    url: `/ticket${id}/assign`,
    method: "put",
    data
  })
}

// 处理工单
export function processTicket(id: number) {
  return request({
    url: `/ticket/${id}/process`,
    method: "put"
  })
}

// 确认工单
export function confirmTicket(id: number) {
  return request({
    url: `/ticket/${id}/confirm`,
    method: "put"
  })
}

// 关闭工单
export function closeTicket(id: number) {
  return request({
    url: `/ticket/${id}/close`,
    method: "put"
  })
}

// 取消工单
export function cancelTicket(id: number) {
  return request({
    url: `/ticket/${id}/cancel`,
    method: "put"
  })
}

// 添加评论
export function addComment(id: number, data: any) {
  return request({
    url: `/ticket/${id}/comments`,
    method: "post",
    data
  })
}
