import type { AppRouteRecordRaw, Permission } from "@/types/permission"
import type { RouteRecordRaw } from "vue-router"
import { pinia } from "@/pinia"
import { constantRoutes, dynamicRoutes } from "@/router"
import { routerConfig } from "@/router/config"
import { flatMultiLevelRoutes } from "@/router/helper"
import { getUserPermissions } from "@@/apis/users"

function hasPermission(roles: string[], route: RouteRecordRaw) {
  const routeRoles = route.meta?.roles
  return routeRoles ? roles.some(role => routeRoles.includes(role)) : true
}

function filterDynamicRoutes(routes: RouteRecordRaw[], roles: string[]) {
  const res: RouteRecordRaw[] = []
  routes.forEach((route) => {
    const tempRoute = { ...route }
    if (hasPermission(roles, tempRoute)) {
      if (tempRoute.children) {
        tempRoute.children = filterDynamicRoutes(tempRoute.children, roles)
      }
      res.push(tempRoute)
    }
  })
  return res
}

// 将权限数据转换为路由
function transformPermissionToRoute(permissions: Permission[]): AppRouteRecordRaw[] {
  const routes: AppRouteRecordRaw[] = []

  permissions.forEach((permission) => {
    if (permission.type === 1 && permission.status === 1) { // 只处理菜单类型且启用的权限
      const route: AppRouteRecordRaw = {
        path: permission.path || "",
        component: permission.component ? () => import(/* @vite-ignore */ `./../../${permission.component}`) : () => import("@/layouts/index.vue"),
        redirect: permission.redirect,
        meta: {
          title: permission.title,
          svgIcon: permission.icon,
          hidden: Boolean(permission.hidden)
        }
      }
      // 处理子路由
      if (permission.children && permission.children.length > 0) {
        route.children = transformPermissionToRoute(permission.children)
      }
      routes.push(route)
    }
  })
  return routes
}

export const usePermissionStore = defineStore("permission", () => {
  // 可访问的路由
  const routes = ref<RouteRecordRaw[]>([])

  // 有访问权限的动态路由
  const addRoutes = ref<RouteRecordRaw[]>([])

  // 根据角色生成可访问的 Routes（可访问的路由 = 常驻路由 + 有访问权限的动态路由）
  const setRoutes = (roles: string[]) => {
    const accessedRoutes = filterDynamicRoutes(dynamicRoutes, roles)
    set(accessedRoutes)
  }

  // 远程动态路由
  const remoteDynamicRoutes = ref<RouteRecordRaw[]>([])

  // 权限列表
  const permissions = ref<string[]>([])

  const generateRoutes = async () => {
    try {
      // 获取用户权限
      const res = await getUserPermissions()
      if (res.code === 0 && res.data) {
        // 提取权限编码
        const permissionCodes = res.data.permissions.map(item => item.code)
        permissions.value = permissionCodes

        // 将权限转换为路由
        const accessRoutes = transformPermissionToRoute(res.data.permissions)
        remoteDynamicRoutes.value = accessRoutes as unknown as RouteRecordRaw[]
        routes.value = [...constantRoutes, ...(accessRoutes as unknown as RouteRecordRaw[])]
        setAllRoutes()
        return accessRoutes
      }
      return []
    } catch (error) {
      console.error("获取权限失败", error)
      return []
    }
  }

  // 所有路由 = 所有常驻路由 + 所有动态路由
  const setAllRoutes = () => {
    const allDynamicRoutes = [...dynamicRoutes]
    if (remoteDynamicRoutes.value.length > 0) {
      allDynamicRoutes.push(...remoteDynamicRoutes.value)
    }
    set(allDynamicRoutes)
  }

  // 统一设置
  const set = (accessedRoutes: RouteRecordRaw[]) => {
    routes.value = constantRoutes.concat(accessedRoutes)
    addRoutes.value = routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(accessedRoutes) : accessedRoutes
  }

  return { routes, addRoutes, setRoutes, generateRoutes, setAllRoutes }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function usePermissionStoreOutside() {
  return usePermissionStore(pinia)
}
