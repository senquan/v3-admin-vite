import type { RouteRecordRaw } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { createRouter } from "vue-router"
import { flatMultiLevelRoutes } from "./helper"

function Layouts() {
  return import("@/layouts/index.vue")
}

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
          title: "首页",
          svgIcon: "dashboard",
          affix: true
        }
      }
    ]
  },
  {
    path: "/skill",
    component: Layouts,
    meta: {
      title: "技能中心",
      elIcon: "DataBoard"
    },
    children: [
      {
        path: "skill",
        component: () => import("@/pages/skill/index.vue"),
        name: "my-training",
        meta: {
          title: "我的培训"
        }
      },
      {
        path: "myexam",
        component: () => import("@/pages/skill/myexam.vue"),
        name: "exam-center",
        meta: {
          title: "考试中心"
        }
      }
    ]
  },
  {
    path: "/exam",
    component: () => import("@/pages/skill/exam-taking.vue"),
    name: "ExamTaking",
    meta: {
      title: "考试答题",
      hidden: true
    }
  },
  {
    path: "/exam/:examId/taking",
    component: () => import("@/pages/skill/exam-taking.vue"),
    name: "ExamTakingWithId",
    meta: {
      title: "考试答题",
      hidden: true
    }
  },
  {
    path: "/exam/:examId/result",
    component: () => import("@/pages/skill/exam-result.vue"),
    name: "ExamResult",
    meta: {
      title: "考试结果",
      hidden: true
    }
  },
  {
    path: "/training",
    component: Layouts,
    meta: {
      title: "培训管理",
      elIcon: "DataBoard"
    },
    children: [
      {
        path: "plan",
        component: () => import("@/pages/training/plan/index.vue"),
        name: "Plan",
        meta: {
          title: "培训计划"
        }
      },
      {
        path: "record",
        component: () => import("@/pages/training/record/index.vue"),
        name: "Record",
        meta: {
          title: "培训记录"
        }
      }
    ]
  },
  {
    path: "/knowledge",
    component: Layouts,
    meta: {
      title: "知识库",
      elIcon: "DataBoard"
    },
    children: [
      {
        path: "courseware",
        component: () => import("@/pages/knowledge/courseware/index.vue"),
        name: "Courseware",
        meta: {
          title: "课件管理"
        }
      },
      {
        path: "question",
        component: () => import("@/pages/knowledge/question/index.vue"),
        name: "Question",
        meta: {
          title: "考题库"
        }
      },
      {
        path: "matrix",
        component: () => import("@/pages/knowledge/matrix/index.vue"),
        name: "Matrix",
        meta: {
          title: "岗位安全培训矩阵"
        }
      }
    ]
  },
  {
    path: "/report",
    component: Layouts,
    meta: {
      title: "报表分析",
      elIcon: "DataBoard"
    },
    children: [
      {
        path: "training",
        component: () => import("@/pages/report/training.vue"),
        name: "ReportTraining",
        meta: {
          title: "学情分析"
        }
      },
      {
        path: "user",
        component: () => import("@/pages/report/user.vue"),
        name: "ReportUser",
        meta: {
          title: "用户报表"
        }
      }
    ]
  },
  {
    path: "/setting",
    component: Layouts,
    meta: {
      title: "系统设置",
      elIcon: "DataBoard"
    },
    children: [
      {
        path: "exam",
        component: () => import("@/pages/setting/exam.vue"),
        name: "Exam",
        meta: {
          title: "考试设置"
        }
      },
      {
        path: "user",
        component: () => import("@/pages/setting/user.vue"),
        name: "User",
        meta: {
          title: "用户管理"
        }
      },
      {
        path: "category",
        component: () => import("@/pages/setting/category.vue"),
        name: "Category",
        meta: {
          title: "分类管理"
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
export const dynamicRoutes: RouteRecordRaw[] = []

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
