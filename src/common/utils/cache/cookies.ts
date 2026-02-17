// 统一处理 Cookie

import { CacheKey } from "@@/constants/cache-key"
import Cookies from "js-cookie"

export function getToken() {
  return Cookies.get(CacheKey.TOKEN)
}

export function setToken(token: string) {
  Cookies.set(CacheKey.TOKEN, token)
}

export function removeToken() {
  Cookies.remove(CacheKey.TOKEN)
}

export function getLoginToken() {
  return Cookies.get(CacheKey.LOGIN_TOKEN)
}

export function setLoginToken(token: string) {
  Cookies.set(CacheKey.LOGIN_TOKEN, token)
}

export function removeLoginToken() {
  Cookies.remove(CacheKey.LOGIN_TOKEN)
}
