// 身份认证相关工具函数
import { getLoginToken, getToken, removeLoginToken, setLoginToken } from "@@/utils/cache/cookies"
import { loginWithToken } from "@/pages/login/apis"
import { useUserStore } from "@/pinia/stores/user"

/**
 * 从URL参数中获取token并保存到cookie
 * @returns boolean 是否成功获取并保存token
 */
export function handleUrlToken(): boolean {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get("t")
  if (token) {
    setLoginToken(token)
    // 从URL中移除token参数，避免在地址栏中显示
    urlParams.delete("t")
    const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "")
    window.history.replaceState({}, "", newUrl)
    return true
  }
  return false
}

/**
 * 检查当前是否已登录
 * @returns boolean 是否已登录
 */
export function isAuthenticated(): boolean {
  return !!getToken()
}

/**
 * 获取当前token
 * @returns string | undefined token值
 */
export function getCurrentToken(): string | undefined {
  return getLoginToken()
}

/**
 * 验证token有效性并自动登录
 * @returns Promise<boolean> 是否成功登录
 */
export async function validateAndLogin(): Promise<boolean> {
  const token = getLoginToken()
  if (!token) return false
  try {
    const userStore = useUserStore()
    const response = await loginWithToken(token)
    if (response && response.data?.token) {
      userStore.setToken(response.data.token)
    } else {
      throw new Error(response.message)
    }
    return true
  } catch (error) {
    removeLoginToken()
    console.error("Token验证失败:", error)
    return false
  }
}

/**
 * 生成带token的URL
 * @param baseUrl 基础URL
 * @param token token值
 * @returns string 带token参数的URL
 */
export function generateUrlWithToken(baseUrl: string, token: string): string {
  const url = new URL(baseUrl, window.location.origin)
  url.searchParams.set("t", token)
  return url.toString()
}
