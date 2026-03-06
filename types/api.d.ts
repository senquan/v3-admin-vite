/** 所有 api 接口的响应数据都应该准守该格式 */
interface ApiResponseData<T> {
  code: number
  message: string
  data: {
    records: T[]
    total: number
    page: number
    pageSize: number
    [key: string]: any
  }
}

interface ApiResponseSingleData<T> {
  code: number
  message: string
  data: T
}

interface BaseQueryParams {
  keyword?: string
  page?: number
  size?: number
}
