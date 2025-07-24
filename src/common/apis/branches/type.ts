export type BranchListResponseData = ApiResponseData<BranchListData>

export interface BranchListData {
  branches: Branch[]
}

export interface Branch {
  id: number
  name: string
}
