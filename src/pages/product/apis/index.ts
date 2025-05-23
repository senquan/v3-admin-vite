import type * as Product from "./type"
import { request } from "@/http/axios"

export function fetchList(params: Product.ProductListRequestParams) {
  return request<Product.ProductListResponseData>({
    url: "product/list",
    method: "get",
    params
  })
}

export function fetchSeriesOpt() {
  return request<Product.SeriesListOptResponseData>({
    url: `product/series/list`,
    method: "get",
    params: {
      format: "opt"
    }
  })
}

export function fetchModels(params: Product.ModelListRequestParams) {
  return request<Product.ModelsListResponseData>({
    url: `product/models/list`,
    method: "get",
    params
  })
}

export function fetchProduct(id: number) {
  return request<Product.ProductDetailResponseData>({
    url: `product/${id}`,
    method: "get"
  })
}

export function createProduct(data: Product.ProductCreateData) {
  return request<Product.ProductActionResponseData>({
    url: "product/",
    method: "post",
    data
  })
}

export function updateProduct(id: number, data: Product.ProductCreateData) {
  return request<Product.ProductActionResponseData>({
    url: `product/${id}`,
    method: "put",
    data
  })
}

export function batchUpdateProduct(data: Product.BatchUpdateRequestParams) {
  return request<Product.ProductActionResponseData>({
    url: "product/batch",
    method: "put",
    data
  })
}

export function deleteProduct(id: number) {
  return request<Product.ProductActionResponseData>({
    url: `product/${id}`,
    method: "delete"
  })
}

export function batchDeleteProduct(data: Product.BatchDeleteRequestParams) {
  return request<Product.ProductActionResponseData>({
    url: `product/batch/delete`,
    method: "post",
    data
  })
}

export function importProducts(products: any[]) {
  return request<Product.ProductImportResponseData>({
    url: "product/import",
    method: "post",
    data: { products }
  })
}
