export interface LoginRequestData {
  username: string
  password: string
  code: string
  captchaId: string
}

export interface RegisterRequestData {
  username: string
  password: string
  code: string
  captchaId: string
  inviteCode: string
}

export interface CaptchaResponseData {
  code: number
  message: string
  data: CaptchaResponseDataItem
}

export interface CaptchaResponseDataItem {
  captchaId: string
  captchaImg: string
}

export type LoginResponseData = ApiResponseData<{ token: string }>

export type RegisterResponseData = ApiResponseData<null>
