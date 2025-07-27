export interface TrainerListData {
  id: number
  type: number
  name: string | null
  user_id: number | null
  avatar: string | null
  grade: number
  email: string | null
  phone: string | null
  position: string | null
  title: string | null
  idcard: string | null
  bank: string | null
  bankcard: string | null
  fee: number | null
  introduction: string | null
  created_at: string
  updated_at: string
  score: number
  courseCount: number
  department: string
  showInHome: boolean
  user?: {
    id: number
    name: string
    realname: string
    email: string
  }
  tags?: {
    id: number
    name: string
    color: string
  }[]
}

export interface TrainerCreateData {
  id?: number
  type: number
  name?: string
  user_id?: number | undefined
  avatar?: string
  grade: number
  email?: string
  phone?: string
  position?: string
  title?: string
  idcard?: string
  bank?: string
  bankcard?: string
  fee?: number | undefined
  introduction?: string
  tag_ids?: number[]
}

export interface TrainerListRequestParams {
  keyword?: string
  type?: number | string
  grade?: number
  sort?: string
  page?: number
  pageSize?: number
}

export interface BatchDeleteRequestParams {
  ids: number[]
}

export interface TrainerListResponseData {
  code: number
  message: string
  data: {
    trainers: TrainerListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface TrainerDetailResponseData {
  code: number
  message: string
  data: TrainerListData
}

export interface TrainerActionResponseData {
  code: number
  message: string
}

export interface UserListData {
  id: number
  name: string
  realname?: string
  email?: string
  phone?: string
}

export interface UserListResponseData {
  code: number
  message: string
  data: {
    users: UserListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface TagListData {
  id: number
  name: string
  color: string
}

export interface TagListResponseData {
  code: number
  message: string
  data: {
    tags: TagListData[]
    total: number
    page: number
    pageSize: number
  }
}
