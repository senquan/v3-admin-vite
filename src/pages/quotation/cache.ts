type FetchModelsApiFunction = (params: { pageSize?: number, keyword?: string }) => Promise<{
  code: number
  data: {
    models: Array<{
      id: string
      name: string
      [key: string]: any
    }>
    [key: string]: any
  }
  [key: string]: any
}>

type FetchProductsApiFunction = (params: { model: string }) => Promise<{
  code: number
  data: {
    products: Array<any>
    colors: Array<any>
    [key: string]: any
  }
  [key: string]: any
}>

export class ModelCache {
  private modelCache: Map<string, any> = new Map() // 型号基本信息缓存
  private productCache: Map<string, any> = new Map() // 产品详细信息缓存
  private cacheExpiry: number = 60 * 60 * 1000 // 缓存过期时间：60分钟
  private lastCacheTime: number = 0

  // 初始化缓存
  async initCache(fetchModelsApi: FetchModelsApiFunction) {
    try {
      // 只获取型号基本信息，不包含详细产品数据
      const response = await fetchModelsApi({ pageSize: 2000 })
      if (response.code === 0 && response.data.models) {
        const models = response.data.models
        this.lastCacheTime = Date.now()

        // 缓存型号基本信息
        models.forEach((model: any) => {
          this.modelCache.set(model.id, {
            id: model.id,
            name: model.name,
            timestamp: this.lastCacheTime
          })
        })
        console.log(`已缓存 ${models.length} 个型号基本信息`)
        return true
      }
      return false
    } catch (error) {
      console.error("初始化型号缓存失败:", error)
      return false
    }
  }

  // 搜索型号
  searchModels(keyword: string): any[] {
    if (!keyword || keyword.length < 2) return []

    const now = Date.now()
    // 检查缓存是否过期
    if (now - this.lastCacheTime > this.cacheExpiry) {
      // 缓存过期，返回空结果，调用方需要重新初始化缓存
      return []
    }

    // 从缓存中搜索匹配的型号
    const results: any[] = []
    this.modelCache.forEach((model) => {
      if (model.name.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({
          value: model.id,
          label: model.name
        })
      }
    })

    return results
  }

  // 获取产品详情（按需加载）
  async getProductDetails(modelType: string, fetchProductsApi: FetchProductsApiFunction): Promise<any> {
    // 检查产品缓存
    if (this.productCache.has(modelType)) {
      const cachedData = this.productCache.get(modelType)
      // 检查产品缓存是否过期
      if (Date.now() - cachedData.timestamp < this.cacheExpiry) {
        return cachedData.data
      }
    }

    // 缓存不存在或已过期，从API获取
    try {
      const response = await fetchProductsApi({ model: modelType })
      if (response.code === 0) {
        // 缓存产品详情
        this.productCache.set(modelType, {
          data: response.data,
          timestamp: Date.now()
        })
        return response.data
      }
      return null
    } catch (error) {
      console.error("获取产品详情失败:", error)
      return null
    }
  }

  // 清除缓存
  clearCache() {
    this.modelCache.clear()
    this.productCache.clear()
    this.lastCacheTime = 0
  }

  // 获取缓存状态
  getCacheStatus() {
    return {
      modelCount: this.modelCache.size,
      productCount: this.productCache.size,
      isExpired: Date.now() - this.lastCacheTime > this.cacheExpiry,
      lastUpdateTime: new Date(this.lastCacheTime).toLocaleString()
    }
  }
}

// 创建单例实例
export const modelCache = new ModelCache()
