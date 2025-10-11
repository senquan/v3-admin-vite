export interface UserListData {
  id: number
  name: string
  userNo: string
  phone: string
  email: string
  role: string
  position: string
  department: string
  gender: string
  remark: number
  status: number
  hireDate: string
}

export interface Role {
  id: number
  name: string
  code: number
}

export interface UserCreateData {
  id?: number
  name: string
  userNo: string
  phone: string
  department: string
  position: string
  gender: string
  remark: string
  status: number
  hireDate: string
}

export interface UserRoleData {
  roles: number[]
}

export interface UserListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface UserListResponseData {
  code: number
  message: string
  data: {
    users: UserListData[]
    roles: Role[]
    total: number
    page: number
    pageSize: number
  }
}

export interface UserDetailResponseData {
  code: number
  message: string
  data: UserListData
}

export interface User {
  id: number
  username: string
}

export interface UnbindUserResponseData {
  code: number
  message: string
  data: User[]
}

export interface UserRolesResponseData {
  code: number
  message: string
  data: Role[]
}

export interface UserActionResponseData {
  code: number
  message: string
}
