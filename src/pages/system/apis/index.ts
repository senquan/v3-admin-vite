import type * as System from "./type"
import { request } from "@/http/axios"

export function fetchList(params: System.CommonListRequestParams) {
  return request<System.SettingsListResponseData>({
    url: "system/settings",
    method: "get",
    params
  })
}

export function batchUpdateSettings(data: System.SettingsCreateData[]) {
  return request<System.CommonActionResponseData>({
    url: `settings/batch`,
    method: "post",
    data: {
      settings: data
    }
  })
}

export function getDictList(params: System.CommonListRequestParams) {
  return request<System.DictListResponseData>({
    url: "/system/dicts",
    method: "get",
    params
  })
}

export function createDict(data: System.DictCreateData) {
  return request<System.CommonActionResponseData>({
    url: "/system/dicts",
    method: "post",
    data
  })
}

export function updateDict(id: number, data: System.DictCreateData) {
  return request<System.CommonActionResponseData>({
    url: `/system/dicts/${id}`,
    method: "put",
    data
  })
}

export function deleteDict(id: number) {
  return request<System.CommonActionResponseData>({
    url: `/system/dicts/${id}`,
    method: "delete"
  })
}

export function getPlatformTags(id: number) {
  return request<System.PlatformTagsResponseData>({
    url: `tags/platform/${id}`,
    method: "get"
  })
}

export function getOperationLogs(params: System.CommonListRequestParams) {
  return request<System.OperationLogListResponseData>({
    url: "/logs/",
    method: "get",
    params
  })
}

export function getSystemConfig(params: System.CommonListRequestParams) {
  return request<System.SystemConfigListResponseData>({
    url: "/system/settings",
    method: "get",
    params
  })
}

export function updateSystemConfig(data: System.SystemConfigUpdateData, id: number) {
  return request<System.CommonActionResponseData>({
    url: `system/settings/${id}`,
    method: "put",
    data
  })
}

export function deleteSystemConfig(id: number) {
  return request<System.CommonActionResponseData>({
    url: `system/settings/${id}`,
    method: "delete"
  })
}

export function getBackupList(params: System.CommonListRequestParams) {
  return request<System.BackupListResponseData>({
    url: "/system/backups",
    method: "get",
    params
  })
}

export function createBackup(data: System.BackupCreateData) {
  return request<System.CommonActionResponseData>({
    url: "/system/backups",
    method: "post",
    data
  })
}

export function deleteBackup(file: string) {
  return request<System.CommonActionResponseData>({
    url: `system/backups`,
    method: "delete",
    data: { fileName: file }
  })
}

export function restoreBackup(id: number) {
  return request<System.CommonActionResponseData>({
    url: `system/backups/${id}/restore`,
    method: "post"
  })
}

export function getUsers(params: System.CommonListRequestParams) {
  return request<System.UserListResponseData>({
    url: "users/local",
    method: "get",
    params
  })
}

export function updateUserRole(id: number, data: System.UserRoleData) {
  return request<System.CommonActionResponseData>({
    url: `users/${id}/role`,
    method: "put",
    data
  })
}

export function fetchUserRole(id: number) {
  return request<System.UserRolesResponseData>({
    url: `users/${id}/roles`,
    method: "get"
  })
}

export function updateUser(id: number, data: System.UserUpdateData) {
  return request<System.CommonActionResponseData>({
    url: `users/${id}`,
    method: "put",
    data
  })
}
