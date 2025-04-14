/**
 * 从URL中获取查询参数对象
 * @param url URL字符串
 * @returns 查询参数对象
 */
export function getQueryObject(url?: string): Record<string, string> {
  url = url == null ? window.location.href : url
  const search = url.substring(url.lastIndexOf("?") + 1)
  const obj: Record<string, string> = {}
  const reg = /([^?&=]+)=([^?&=]*)/g

  search.replace(reg, (rs, $1, $2) => {
    const name = decodeURIComponent($1)
    let val = decodeURIComponent($2)
    val = String(val)
    obj[name] = val
    return rs
  })

  return obj
}

/**
 * 获取字符串的字节长度
 * @param val 输入字符串
 * @returns 字节长度
 */
export function getByteLen(val: string): number {
  let len = 0
  for (let i = 0; i < val.length; i++) {
    if (val[i].match(/[^\x00-\xff]/gi) != null) {
      len += 1
    } else {
      len += 0.5
    }
  }
  return Math.floor(len)
}

/**
 * 清理数组中的空值
 * @param actual 输入数组
 * @returns 清理后的数组
 */
export function cleanArray<T>(actual: T[]): T[] {
  const newArray: T[] = []
  for (let i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i])
    }
  }
  return newArray
}

/**
 * 将对象转换为URL参数字符串
 * @param json 对象
 * @returns URL参数字符串
 */
export function param(json: Record<string, any>): string {
  if (!json) return ""
  return cleanArray(
    Object.keys(json).map(key => {
      if (json[key] === undefined) return ""
      return `${encodeURIComponent(key)}=${encodeURIComponent(json[key])}`
    })
  ).join("&")
}

/**
 * 将URL参数字符串转换为对象
 * @param url URL字符串
 * @returns 参数对象
 */
export function param2Obj(url: string): Record<string, any> {
  const search = url.split("?")[1]
  if (!search) {
    return {}
  }
  return JSON.parse(
    `{"${decodeURIComponent(search)
      .replace(/"/g, '\\"')
      .replace(/&/g, '","')
      .replace(/=/g, '":"')}"}`
  )
}

/**
 * 将HTML转换为纯文本
 * @param val HTML字符串
 * @returns 纯文本
 */
export function html2Text(val: string): string {
  const div = document.createElement("div")
  div.innerHTML = val
  return div.textContent || div.innerText || ""
}

/**
 * 切换元素的类名
 * @param element DOM元素
 * @param className 类名
 */
export function toggleClass(element: HTMLElement, className: string): void {
  if (!element || !className) {
    return
  }

  let classString = element.className
  const nameIndex = classString.indexOf(className)

  if (nameIndex === -1) {
    classString += ` ${className}`
  } else {
    classString =
      classString.substring(0, nameIndex) +
      classString.substring(nameIndex + className.length)
  }

  element.className = classString
}


/**
 * 深拷贝
 * 这只是一个简单版本的深拷贝
 * 如果需要完美的深拷贝，请使用lodash的_.cloneDeep
 * @param source 源对象
 * @returns 拷贝后的对象
 */
export function deepClone<T>(source: T): T {
  if (source === null || typeof source !== 'object') {
    return source
  }

  // 处理日期对象
  if (source instanceof Date) {
    return new Date(source.getTime()) as unknown as T
  }

  // 处理数组
  if (Array.isArray(source)) {
    return source.map(item => deepClone(item)) as unknown as T
  }

  // 处理对象
  const target = {} as T
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = deepClone(source[key])
    }
  }

  return target
}

/**
 * 创建唯一ID
 * @returns 唯一ID字符串
 */
export function createUniqueId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${randomStr}`
}

/**
 * 格式化文件大小
 * @param size 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(size: number): string {
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB'
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + ' MB'
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }
}

/**
 * 判断是否为外部链接
 * @param path 路径
 * @returns 是否为外部链接
 */
export function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * 将数据转换为级联选择器选项
 * @param data 数据源
 * @param root 根节点
 * @param deep 当前深度
 * @param maxdeep 最大深度
 * @returns 级联选择器选项
 */
export function getCascaderOptions(data: any, root = 0, deep = 0, maxdeep = 2) {
  if (!data || typeof data[root] !== 'object' || deep >= maxdeep) return []
  let opts: any[] = []
  // 检查data[root]是否为数组
  if (Array.isArray(data[root])) {
    data[root].forEach((item) => {
      let tmp: {
        value: any;
        label: any;
        children?: any[]
      } = {
        value: item.id,
        label: item.name,
        children: []
      }
      let children = getCascaderOptions(data, item.id, deep + 1, maxdeep)
      if (children.length > 0) tmp.children = children
      else delete tmp.children
      opts.push(tmp)
    })
  } else {
    // 如果是对象，遍历对象的键
    for (const key in data[root]) {
      if (Object.prototype.hasOwnProperty.call(data[root], key)) {
        let tmp: {
          value: any;
          label: any;
          children?: any[]
        } = {
          value: data[root][key].id,
          label: data[root][key].name,
          children: []
        }
        let children = getCascaderOptions(data, Number(key), deep + 1, maxdeep)
        if (children.length > 0) tmp.children = children
        else delete tmp.children
        opts.push(tmp)
      }
    }
  }
  return opts
}