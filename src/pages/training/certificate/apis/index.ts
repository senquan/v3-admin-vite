import type {
  BatchDeleteRequestParams,
  CertificateTemplateActionResponseData,
  CertificateTemplateCreateData,
  CertificateTemplateDetailResponseData,
  CertificateTemplateListRequestParams,
  CertificateTemplateListResponseData
} from "./type"
import { request } from "@/http/axios"

// 获取证书模板列表
export function fetchList(params: CertificateTemplateListRequestParams) {
  return request<CertificateTemplateListResponseData>({
    url: "certificate",
    method: "get",
    params
  })
}

// 获取证书模板详情
export function fetchDetail(id: number) {
  return request<CertificateTemplateDetailResponseData>({
    url: `certificate/${id}`,
    method: "get"
  })
}

// 创建证书模板
export function createCertificateTemplate(data: CertificateTemplateCreateData) {
  return request<CertificateTemplateActionResponseData>({
    url: "certificate",
    method: "post",
    data
  })
}

// 更新证书模板
export function updateCertificateTemplate(id: number, data: CertificateTemplateCreateData) {
  return request<CertificateTemplateActionResponseData>({
    url: `certificate/${id}`,
    method: "put",
    data
  })
}

// 删除证书模板
export function deleteCertificateTemplate(id: number) {
  return request<CertificateTemplateActionResponseData>({
    url: `certificate/${id}`,
    method: "delete"
  })
}

// 批量删除证书模板
export function batchDeleteCertificateTemplate(data: BatchDeleteRequestParams) {
  return request<CertificateTemplateActionResponseData>({
    url: "certificate/batch-delete",
    method: "post",
    data
  })
}

// 颁发证书
export function issueCertificate(data: {
  templateId: number
  userIds: number[]
  reason: string
  issueDate?: string
}) {
  return request<CertificateTemplateActionResponseData>({
    url: "certificate/issue",
    method: "post",
    data
  })
}
