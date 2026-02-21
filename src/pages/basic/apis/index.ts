import type * as Basic from "./type"
import { request } from "@/http/axios"

export function getCompanyList(params: Basic.CompanyListRequestParams) {
  return request<Basic.CompanyListResponseData>({
    url: "/basic/companies",
    method: "get",
    params
  })
}

export function getCompaniesTree() {
  return request<Basic.CompanyTreeResponseData>({
    url: "/basic/companies/tree",
    method: "get"
  })
}

export function getCompanyDetail(id: number) {
  return request<Basic.Company>({
    url: `/basic/companies/${id}`,
    method: "get"
  })
}

export function createCompany(data: Basic.CompanyForm) {
  return request<Basic.CommonActionResult>({
    url: "/basic/companies/",
    method: "post",
    data
  })
}

export function updateCompany(data: Basic.CompanyForm) {
  return request<Basic.CommonActionResult>({
    url: `/basic/companies/${data.id}`,
    method: "put",
    data
  })
}

export function deleteCompany(id: number) {
  return request<Basic.CommonActionResult>({
    url: `/basic/companies/${id}`,
    method: "delete"
  })
}

export function getInterestRateList(params: Basic.InterestRateQueryParams) {
  return request<any>({
    url: "/basic/interest-rate",
    method: "get",
    params
  })
}

export function getInterestRateTypes() {
  return request<any>({
    url: "/system/dicts/group/3",
    method: "get"
  })
}

export function getInterestRateDetail(id: number) {
  return request<any>({
    url: `/basic/interest-rate/${id}`,
    method: "get"
  })
}

export function createInterestRate(data: Basic.InterestRateForm) {
  return request<Basic.CommonActionResult>({
    url: "/basic/interest-rate",
    method: "post",
    data
  })
}

export function confirmInterestRateUpdate(id: number, rateValue: number, remark: string) {
  return request<Basic.CommonActionResult>({
    url: `/basic/interest-rate/${id}/confirm`,
    method: "post",
    data: { rateValue, remark }
  })
}

export function deleteInterestRate(id: number) {
  return request<Basic.CommonActionResult>({
    url: `/basic/interest-rate/${id}`,
    method: "delete"
  })
}
