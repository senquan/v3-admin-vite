import type { Permission } from "@/types/permission"

export type CurrentUserResponseData = ApiResponseData<{
  id: number
  username: string
  name: string
  email: string
  phone: string
  avatar: string
  last_login_time: string
  last_login_ip: string
  roles: string[]
}>

export type UserPermissionsResponseData = ApiResponseData<{
  id: number
  permissions: Permission[]
}>

export interface UserPasswordRequestParams {
  oldPassword: string
  newPassword: string
}

export interface UserProfileRequestParams {
  name: string
  phone: string
  email: string
  avatar: string
}
