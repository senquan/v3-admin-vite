export interface OperationLogListResponseData extends ApiResponseData<OperationLog> {}
export interface SystemConfigListResponseData extends ApiResponseData<SystemConfig> {}
export interface BackupListResponseData extends ApiResponseData<BackupRecord> {}
export interface UserListResponseData extends ApiResponseData<User> {}
export interface UserRolesResponseData extends ApiResponseData<Role> {}

export interface DictListData {
  id: number
  name: string
  remark: string
  value: string
  group: number
  icon: string
  updatedAt: string
}

export interface Tag {
  id: number
  name: string
}

export interface SettingsListData {
  id: number
  name: string
  type: number
  key: string
  value: string
  group: number
  description: string
}

export interface SettingsListResponseData {
  code: number
  message: string
  data: {
    settings: SettingsListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface SettingsCreateData {
  id?: number
  key: string
  value: string
}

export interface DictCreateData {
  id?: number
  name: string
  remark: string
  value: string
  group: number
  sort?: number
}

export interface DictListResponseData {
  code: number
  message: string
  data: {
    records: DictListData[]
    total: number
    page: number
    pageSize: number
  }
}

export interface PlatformTagsResponseData {
  code: number
  message: string
  data: {
    tags: Tag[]
  }
}

export interface CommonListRequestParams {
  keyword?: string
  sort?: string
  page?: number
  size?: number
}

export interface CommonActionResponseData {
  code: number
  message: string
}

export interface OperationLog {
  [key: string]: any
}

export interface SystemConfig {
  [key: string]: any
}

export interface SystemConfigUpdateData {
  id?: number
  key: string
  value: string
  type: number
  category: string
  description: string
  isEnabled: number
  isSystem: number
}

export interface BackupCreateData {
  [key: string]: any
}

export interface BackupConfigCreateData {
  [key: string]: any
}

export interface BackupConfigResponseData {
  [key: string]: any
}

export interface BackupRecord {
  [key: string]: any
}

export interface User {
  [key: string]: any
}

export interface Role {
  id: number
  name: string
  code: number
}

export interface UserRoleData {
  roles: number[]
}

export interface UserUpdateData {
  id?: number
  name: string
  companyId: number
  status: number
  notes: string
}
