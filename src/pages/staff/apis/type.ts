export interface StaffListData {
  id: number
  name: string
  staffNo: string
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

export interface StaffCreateData {
  id?: number
  name: string
  staffNo: string
  phone: string
  department: string
  position: string
  gender: string
  remark: string
  status: number
  hireDate: string
}

export interface StaffRoleData {
  roles: number[]
}

export interface StaffListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface StaffListResponseData {
  code: number
  message: string
  data: {
    staffs: StaffListData[]
    roles: Role[]
    total: number
    page: number
    pageSize: number
  }
}

export interface StaffDetailResponseData {
  code: number
  message: string
  data: StaffListData
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

export interface StaffActionResponseData {
  code: number
  message: string
}
