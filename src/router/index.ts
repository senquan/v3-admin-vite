import type { RouteRecordRaw } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { createRouter } from "vue-router"
import { flatMultiLevelRoutes } from "./helper"

const Layouts = () => import("@/layouts/index.vue")

/**
 * @name 常驻路由
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/pages/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("@/pages/dashboard/index.vue"),
        name: "Dashboard",
        meta: {
          title: "工作台",
          svgIcon: "dashboard",
          affix: true
        }
      }
    ]
  },
  {
    path: "/product",
    component: Layouts,
    meta: {
      title: "商品管理",
      elIcon: "Goods"
    },
    children: [
      {
        path: "product",
        component: () => import("@/pages/product/index.vue"),
        name: "Product",
        meta: {
          title: "商品列表"
        }
      },
      {
        path: "tags",
        component: () => import("@/pages/tags/index.vue"),
        name: "Tags",
        meta: {
          title: "分类标签"
        }
      }
    ]
  },
  {
    path: "/quotation",
    component: Layouts,
    meta: {
      title: "报价中心",
      elIcon: "DocumentAdd"
    },
    children: [
      {
        path: "quotation",
        component: () => import("@/pages/quotation/index.vue"),
        name: "Quotation",
        meta: {
          title: "报价订单"
        }
      },
      {
        path: "reverse",
        component: () => import("@/pages/reverse/index.vue"),
        name: "Reverse",
        meta: {
          title: "反向订单"
        }
      }
    ]
  },
  {
    path: "/promotion",
    component: Layouts,
    meta: {
      title: "活动促销",
      elIcon: "Discount"
    },
    children: [
      {
        path: "promotion",
        component: () => import("@/pages/promotion/index.vue"),
        name: "Promotion",
        meta: {
          title: "活动促销"
        }
      },
      {
        path: "coupon",
        component: () => import("@/pages/coupon/index.vue"),
        name: "Coupon",
        meta: {
          title: "优惠券"
        }
      },
      {
        path: "rules",
        component: () => import("@/pages/rules/index.vue"),
        name: "Rules",
        meta: {
          title: "定价规则"
        }
      }
    ]
  },
  {
    path: "/customer",
    component: Layouts,
    meta: {
      title: "客户管理",
      elIcon: "Phone"
    },
    children: [
      {
        path: "customer",
        component: () => import("@/pages/customer/index.vue"),
        name: "Customer",
        meta: {
          title: "客户列表"
        }
      },
      {
        path: "customer",
        component: () => import("@/pages/customer/index.vue"),
        name: "Customer",
        meta: {
          title: "客户列表"
        }
      }
    ]
  },
  {
    path: "/report",
    component: Layouts,
    meta: {
      title: "报表中心",
      elIcon: "PieChart"
    },
    children: [
      {
        path: "sales",
        component: () => import("@/pages/report/sales/index.vue"),
        name: "Sales",
        meta: {
          title: "平台销售报表"
        }
      },
      {
        path: "categroy",
        component: () => import("@/pages/report/categroy/index.vue"),
        name: "Categroy",
        meta: {
          title: "分类销售报表"
        }
      }
    ]
  },
  {
    path: "/",
    component: Layouts,
    meta: {
      title: "系统管理",
      elIcon: "Setting"
    },
    children: [
      {
        path: "staff",
        component: () => import("@/pages/staff/index.vue"),
        name: "Staff",
        meta: {
          title: "员工管理"
        }
      },
      {
        path: "permission",
        component: () => import("@/pages/permission/index.vue"),
        name: "Permission",
        meta: {
          title: "权限管理"
        }
      },
      {
        path: "settings",
        component: () => import("@/pages/settings/index.vue"),
        name: "Settings",
        meta: {
          title: "系统设置"
        }
      }
    ]
  }
]

/**
 * @name 动态路由
 * @description 用来放置有权限 (Roles 属性) 的路由
 * @description 必须带有唯一的 Name 属性
 */
export const dynamicRoutes: RouteRecordRaw[] = [
  {
    path: "/permission",
    component: Layouts,
    redirect: "/permission/page-level",
    name: "Permission",
    meta: {
      title: "权限演示",
      elIcon: "Lock",
      // 可以在根路由中设置角色
      roles: ["admin", "editor"],
      alwaysShow: true
    },
    children: []
  }
]

/** 路由实例 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  try {
    // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}

// 注册路由导航守卫
registerNavigationGuard(router)
