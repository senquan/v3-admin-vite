// 角色类型
export interface Role {
  id: number
  name: string
  code: string
  description?: string
  status: number
}

// 权限类型
export interface Permission {
  id: number
  name: string
  title: string
  code: string
  type: number // 1-菜单，2-按钮，3-接口
  parentId?: number
  path?: string
  component?: string
  redirect?: string
  icon?: string
  sort?: number
  hidden?: boolean
  status: number
  children?: Permission[]
}

// 路由元数据
export interface RouteMeta {
  title?: string
  elIcon?: string
  svgIcon?: string
  roles?: string[]
  permissions?: string[]
  hidden?: boolean
  keepAlive?: boolean
  alwaysShow?: boolean
  affix?: boolean
}

// 动态路由类型
export interface AppRouteRecordRaw {
  path: string
  name?: string
  component?: any
  components?: any
  redirect?: string
  meta?: RouteMeta
  children?: AppRouteRecordRaw[]
}
