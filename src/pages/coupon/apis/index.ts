import type * as Coupon from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Coupon.CouponListRequestParams) {
  return request<Coupon.CouponListResponseData>({
    url: "coupon/list",
    method: "get",
    params
  })
}

export function fetchCoupon(id: number) {
  return request<Coupon.CouponDetailResponseData>({
    url: `coupon/${id}`,
    method: "get"
  })
}

export function createCoupon(data: Coupon.CouponCreateData) {
  return request<Coupon.CouponActionResponseData>({
    url: "coupon/",
    method: "post",
    data
  })
}

export function updateCoupon(id: number, data: Coupon.CouponCreateData) {
  return request<Coupon.CouponActionResponseData>({
    url: `coupon/${id}`,
    method: "put",
    data
  })
}

export function deleteCoupon(id: number) {
  return request<Coupon.CouponActionResponseData>({
    url: `coupon/${id}`,
    method: "delete"
  })
}
