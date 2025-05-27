import type { SettingsListData } from "@/pages/settings/apis/type"
import { fetchList } from "@/pages/settings/apis"
import { pinia } from "@/pinia"
import { defineStore } from "pinia"

export const useSystemParamsStore = defineStore("systemParams", () => {
  // 存储所有系统参数
  const params = ref<SettingsListData[]>([])
  // 加载状态
  const loading = ref(false)
  // 是否已加载
  const loaded = ref(false)
  // 错误信息
  const error = ref<string | null>(null)

  // 加载系统参数
  const loadParams = async () => {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const res = await fetchList({
        page: 1,
        pageSize: 100 // 获取足够多的系统参数
      })

      if (res.code === 0 && res.data) {
        params.value = res.data.settings
        loaded.value = true
      } else {
        error.value = res.message || "加载系统参数失败"
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "加载系统参数失败"
    } finally {
      loading.value = false
    }
  }

  // 获取系统参数值的方法
  const getParam = (key: string): string | null => {
    const param = params.value.find(item => item.key === key)
    return param ? param.value : null
  }

  // 获取数字类型参数
  const getNumberParam = (key: string, defaultValue: number = 0): number => {
    const value = getParam(key)
    return value !== null ? Number(value) : defaultValue
  }

  // 获取布尔类型参数
  const getBooleanParam = (key: string, defaultValue: boolean = false): boolean => {
    const value = getParam(key)
    if (value === null) return defaultValue
    return value === "1" || value === "true"
  }

  // 获取数组类型参数（逗号分隔的字符串）
  const getArrayParam = (key: string): string[] => {
    const value = getParam(key)
    return value ? value.split(",") : []
  }

  // 获取数字数组类型参数
  const getNumberArrayParam = (key: string): number[] => {
    const value = getParam(key)
    return value ? value.split(",").map(item => Number(item)) : []
  }

  const refreshParams = () => {
    loadParams()
  }

  return {
    params,
    loading,
    loaded,
    error,
    loadParams,
    refreshParams,
    getParam,
    getNumberParam,
    getBooleanParam,
    getArrayParam,
    getNumberArrayParam
  }
})

/**
 * 在 setup 外使用 store
 */
export function useSystemParamsStoreOutside() {
  return useSystemParamsStore(pinia)
}
