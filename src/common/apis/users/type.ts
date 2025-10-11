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
  platforms: number[]
  permissions: string[]
}>

export interface BranchUserListParams {
  id?: string
  type?: string
  keyword?: string
}

export interface BranchUserListResponseData extends ApiResponseData<BranchUserListData> {
  users: User[]
}

export interface User {
  id: number
  username: string
  realname: string
  email: string
  phone: string
}

export interface BranchUserListData {
  users: User[]
}

export type UserPermissionsResponseData = ApiResponseData<{
  id: number
  permissions: Permission[]
}>
