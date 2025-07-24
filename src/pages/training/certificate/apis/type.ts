export interface CertificateTemplateListData {
  id: number
  name: string | null
  description: string | null
  background_image: string | null
  cer_type: number | null
  cer_fields: any
  cer_title: string | null
  cer_content: string | null
  cer_right_signature_company: string | null
  cer_right_signature_datetime: string | null
  cer_right_signature_seal: string | null
  cer_left_signature_company: string | null
  cer_left_signature_datetime: string | null
  cer_left_signature_seal: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface CertificateTemplateCreateData {
  id?: number
  name?: string
  description?: string
  background_image?: string
  cer_type?: number
  cer_fields?: any
  cer_title?: string
  cer_content?: string
  cer_right_signature_company?: string
  cer_right_signature_datetime?: string
  cer_right_signature_seal?: string
  cer_left_signature_company?: string
  cer_left_signature_datetime?: string
  cer_left_signature_seal?: string
}

export interface CertificateTemplateListRequestParams {
  keyword?: string
  cer_type?: number | string
  sort?: string
  page?: number
  pageSize?: number
}

export interface BatchDeleteRequestParams {
  ids: number[]
}

export interface CertificateTemplateListResponseData {
  code: number
  message: string
  data: {
    templates: CertificateTemplateListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface CertificateTemplateDetailResponseData {
  code: number
  message: string
  data: CertificateTemplateListData
}

export interface CertificateTemplateActionResponseData {
  code: number
  message: string
}

// 证书类型选项
export interface CertificateTypeOption {
  label: string
  value: number
}

// 证书字段配置
export interface CertificateField {
  key: string
  label: string
  type: "text" | "date" | "image"
  x: number
  y: number
  width?: number
  height?: number
  fontSize?: number
  fontColor?: string
  fontFamily?: string
  align?: "left" | "center" | "right"
}
