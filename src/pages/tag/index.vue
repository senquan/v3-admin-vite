<script lang="ts" setup>
import type { LedgerAccountData } from "../project/apis/type"
import { parseTime } from "@/common/utils/datetime"
import { fetchList as fetchAccountList } from "../account/apis"
import { createTag, deleteTag, fetchList, updateTag } from "./apis"

// 页面状态
const loading = ref(false)
const accountLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref("create") // "create" 或 "edit"
const currentTag = ref({
  id: 0
})

// 表单数据
const formData = reactive({
  name: "",
  color: "#409EFF",
  accountId: ""
})

// 查询条件
const listQuery = reactive({
  keyword: "",
  accountId: "",
  page: 1,
  pageSize: 15
})

// 表格数据
const accountList = ref<LedgerAccountData[]>([])
const tableData = ref<any[]>([])
const total = ref(0)

// 颜色选项
const colorOptions = [
  { value: "#409EFF", label: "蓝色" },
  { value: "#67C23A", label: "绿色" },
  { value: "#E6A23C", label: "橙色" },
  { value: "#F56C6C", label: "红色" },
  { value: "#909399", label: "灰色" },
  { value: "#9400D3", label: "紫色" }
]

// 获取标签列表
async function fetchTags() {
  loading.value = true
  try {
    const response = await fetchList(listQuery)
    if (response.data) {
      tableData.value = response.data.tags.map((tag: any) => ({
        ...tag,
        createdAt: parseTime(tag.createdAt),
        updatedAt: parseTime(tag.updatedAt)
      })) || []
      accountList.value = response.data.accounts || []
      total.value = response.data.total || 0
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error("获取标签列表失败:", error)
    ElMessage.error("获取标签列表失败")
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 打开新增对话框
function handleCreate() {
  dialogType.value = "create"
  Object.assign(formData, {
    name: "",
    color: "#409EFF",
    accountId: ""
  })
  dialogVisible.value = true
}

// 打开编辑对话框
function handleEdit(row: any) {
  dialogType.value = "edit"
  currentTag.value = row
  Object.assign(formData, {
    name: row.name,
    color: row.color,
    accountId: row.accountId
  })
  dialogVisible.value = true
}

// 删除标签
async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签 "${row.name}" 吗？`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
    try {
      await deleteTag(row.id)
      ElMessage.success("删除成功")
      fetchTags() // 刷新列表
    } catch (error) {
      console.error("删除标签失败:", error)
      ElMessage.error("删除标签失败")
    }
  } catch {
    // 用户取消删除
  }
}

// 提交表单
async function handleSubmit() {
  try {
    if (dialogType.value === "create") {
      await createTag(formData)
      ElMessage.success("创建成功")
    } else {
      await updateTag(currentTag.value.id, formData)
      ElMessage.success("更新成功")
    }
    dialogVisible.value = false
    fetchTags() // 刷新列表
  } catch (error) {
    console.error("保存标签失败:", error)
    ElMessage.error("保存标签失败")
  }
}

// 搜索方法
function handleFilter() {
  listQuery.page = 1
  fetchTags()
}

// 页码变化
function handlePageChange(page: number) {
  listQuery.page = page
  fetchTags()
}

function handleSearchAccount(keyword: any) {
  if (keyword.length < 2) return
  accountLoading.value = true
  fetchAccountList({ keyword, isLedger: true }).then((res) => {
    if (res.data && res.data.accounts) {
      accountList.value = res.data.accounts.map(acc => ({
        id: acc.id,
        name: acc.name
      })) || []
    }
  }).finally(() => {
    accountLoading.value = false
  })
}

onMounted(() => {
  fetchTags()
})
</script>

<template>
  <div>
    <div class="filter-container">
      <ElInput
        v-model="listQuery.keyword"
        placeholder="关键字"
        class="filter-item"
        style="width: 260px;"
        @keyup.enter="handleFilter"
        @clear="handleFilter"
        clearable
      />
      <ElSelect
        v-model="listQuery.accountId"
        filterable
        clearable
        remote
        remote-show-suffix
        :remote-method="handleSearchAccount"
        :loading="accountLoading"
        @change="handleFilter"
        style="width: 200px;"
        class="filter-item"
      >
        <ElOption
          v-for="acc in accountList"
          :key="acc.id"
          :label="acc.name"
          :value="acc.id"
        >
          {{ acc.name }}
        </ElOption>
      </ElSelect>
      <ElButton type="primary" @click="handleFilter">搜索</ElButton>
      <ElButton type="success" @click="handleCreate">新增项目</ElButton>
    </div>

    <div class="table-container">
      <ElTable
        v-loading="loading"
        :data="tableData"
        stripe
        max-height="calc(100vh - 200px)"
        style="width: 100%"
      >
        <ElTableColumn prop="id" width="80" label="ID" />
        <ElTableColumn prop="name" min-width="200" label="项目标签名称" />
        <ElTableColumn prop="color" width="120" label="颜色" align="center">
          <template #default="{ row }">
            <div class="color-preview" :style="{ backgroundColor: row.color, width: '20px', height: '20px', borderRadius: '2px', display: 'inline-block', marginRight: '5px' }" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="account.name" width="200" label="账户" />
        <ElTableColumn prop="createdAt" width="180" label="创建时间" />
        <ElTableColumn prop="updatedAt" width="180" label="更新时间" />
        <ElTableColumn label="操作" width="200">
          <template #default="{ row }">
            <ElButton type="primary" @click="handleEdit(row)">编辑</ElButton>
            <ElButton type="danger" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页 -->
      <div class="pagination-container">
        <ElPagination
          v-model:current-page="listQuery.page"
          v-model:page-size="listQuery.pageSize"
          :page-sizes="[10, 15, 30, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增项目' : '编辑项目'"
      width="500px"
    >
      <ElForm :model="formData" label-width="80px">
        <ElFormItem label="标签名称" required>
          <ElInput
            v-model="formData.name"
            placeholder="请输入标签名称"
          />
        </ElFormItem>
        <ElFormItem label="颜色">
          <ElColorPicker v-model="formData.color" />
          <ElSelect v-model="formData.color" style="margin-left: 10px; width: 120px;">
            <ElOption
              v-for="option in colorOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="账户">
          <ElSelect
            v-model="formData.accountId"
            filterable
            remote
            remote-show-suffix
            :remote-method="handleSearchAccount"
            :loading="accountLoading"
            class="filter-item"
          >
            <ElOption
              v-for="acc in accountList"
              :key="acc.id"
              :label="acc.name"
              :value="acc.id"
            >
              {{ acc.name }}
            </ElOption>
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="handleSubmit">确定</ElButton>
        </span>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.filter-container {
  background: #fff;
}
.filter-container .filter-item {
  display: inline-block;
  vertical-align: middle;
  padding: 20px 5px;
}
.fr {
  float: right;
}
.pagination-container {
  padding: 10px;
  background: #fff;
}
</style>
