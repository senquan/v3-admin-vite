import type { Permission } from "@/types/permission"

export type CurrentUserResponseData = ApiResponseData<{ username: string, roles: string[] }>
export type UserPermissionsResponseData = ApiResponseData<{
  id: number
  permissions: Permission[]
}>
