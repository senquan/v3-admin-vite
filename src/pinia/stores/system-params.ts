import type { SettingsListData } from "@/pages/settings/apis/type"
import { fetchDictList, fetchList as fetchParamList } from "@/pages/settings/apis"
import { pinia } from "@/pinia"
import { defineStore } from "pinia"

export const useSystemParamsStore = defineStore("systemParams", () => {
  // 存储所有系统参数
  const params = ref<SettingsListData[]>([])
  // 存储系统字典
  const dicts = ref<any[]>([])
  // 加载状态
  const loading = ref(false)
  // 是否已加载
  const loaded = ref(false)
  // 错误信息
  const error = ref<string | null>(null)

  // 加载系统参数
  const loadParams = async () => {
    try {
      const res = await fetchParamList({
        page: 1,
        pageSize: 100 // 获取足够多的系统参数
      })

      if (res.code === 0 && res.data) {
        params.value = res.data.settings
      } else {
        error.value = res.message || "加载系统参数失败"
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "加载系统参数失败"
    }
  }

  // 加载系统字典
  const loadDicts = async () => {
    try {
      const res = await fetchDictList({
        page: 1,
        pageSize: 100 // 获取足够多的系统字典
      })

      if (res.code === 0 && res.data) {
        dicts.value = res.data.dicts || []
        dicts.value = dicts.value.reduce((acc, item) => {
          acc[item.group] = acc[item.group] || []
          acc[item.group].push(item)
          return acc
        }, {})
        console.log("dicts", dicts.value)
      } else {
        error.value = res.message || "加载系统字典失败"
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "加载系统字典失败"
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

  // 获取字典值
  const getDictValue = (key: string): any => {
    const dict = dicts.value.find(item => item.key === key)
    return dict ? dict.value : null
  }

  // 获取字典列表
  const getArrayDict = (group: number): any[] => {
    if (dicts.value[0].some((item: any) => item.value === String(group))) {
      const idx = dicts.value[0].find((item: any) => item.value === String(group))?.id as number
      return dicts.value[idx] || []
    }
    return []
  }

  // 刷新所有数据
  const refreshParams = async () => {
    if (loading.value) return

    try {
      error.value = null
      loading.value = true

      await Promise.all([
        loadParams(),
        loadDicts()
      ])

      loaded.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : "刷新数据失败"
    } finally {
      loading.value = false
    }
  }

  // 初始化数据
  const initData = async () => {
    if (!loaded.value) {
      await refreshParams()
    }
  }

  return {
    params,
    dicts,
    loading,
    loaded,
    error,
    loadParams,
    loadDicts,
    refreshParams,
    initData,
    getParam,
    getNumberParam,
    getBooleanParam,
    getArrayParam,
    getNumberArrayParam,
    getDictValue,
    getArrayDict
  }
})

/**
 * 在 setup 外使用 store
 */
export function useSystemParamsStoreOutside() {
  return useSystemParamsStore(pinia)
}
