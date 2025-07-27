export type CurrentUserResponseData = ApiResponseData<{ username: string, roles: string[] }>

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
