<script lang="ts" setup>
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { deleteDict, getDictList } from "./apis"
import ModalForm from "./_modal.vue"

const loading = ref(false)
const searchForm = reactive({
  keyword: "",
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<any[]>([])
const dictFormRef = ref<InstanceType<typeof ModalForm>>()
const formVisibility = ref(false)

const systemParamsStore = useSystemParamsStore()

async function fetchData() {
  loading.value = true
  try {
    await systemParamsStore.loadDicts()
    tableData.value = []
    for (const item of systemParamsStore.getRootDict()) {
      item.parent_id = 0
      tableData.value.push(item)
      const children = systemParamsStore.getArrayDict(item.value)
      for (const child of children) {
        child.parent_id = item.id
        tableData.value.push(child)
      }
    }
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  fetchData()
}

function handleNewGroup() {
  handleEdit(null)
}

function handleAdd(id: number) {
  openFrom(id, null)
}

function handleEdit(data: any) {
  openFrom(0, data)
}

function openFrom(id: number, data: any) {
  formVisibility.value = true
  nextTick(() => {
    if (data) data.parentId = data.parent_id ?? 0
    dictFormRef.value?.open({
      id: id ?? 0,
      type: "dicts",
      editData: data ?? null
    })
  })
}

function handleDelete(id: number, group: boolean) {
  ElMessageBox.prompt("请输入\"确认删除字典\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除字典$/,
    inputErrorMessage: "请输入\"确认删除字典\"",
    type: "warning"
  }).then(async () => {
    const response = await deleteDict(id || 0)
    if (response.code === 0) {
      ElMessage.success("删除成功")
      fetchData()
    } else {
      ElMessage.error(response.message || "删除失败")
    }
  }).catch(() => {
    ElMessage({
      type: "info",
      message: "已取消删除"
    })
  })
}

function handleSizeChange(val: number) {
  pagination.size = val
  fetchData()
}

function handleCurrentChange(val: number) {
  pagination.page = val
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="main-container">
    <el-card>
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="关键字" style="width: 200px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button type="primary" @click="handleNewGroup">新增字典组</el-button>
        </el-form-item>
      </el-form>

      <vxe-table
        border
        show-overflow
        :tree-config="{ transform: true, rowField: 'id', parentField: 'parent_id' }"
        :data="tableData"
        :loading="loading"
        header-cell-class-name="header-cell-fix"
      >
        <vxe-column field="id" title="序号" width="80">
          <template #default="{ row }">
            {{ row.value }}
          </template>
        </vxe-column>
        <vxe-column field="name" title="名称" width="250" align="left" tree-node />
        <vxe-column field="value" title="值" width="100" />
        <vxe-column field="description" title="描述" min-width="200" align="left" />
        <vxe-column field="actions" title="操作" width="320">
          <template #default="data">
            <el-button type="primary" @click="handleEdit(data.row)">编辑</el-button>
            <el-button v-if="!data.row.parent_id" type="primary" @click="handleAdd(data.row.value)">添加条目</el-button>
            <el-button v-if="!data.row.parent_id" type="danger" @click="handleDelete(data.row.id, true)">删除字典组</el-button>
            <el-button v-if="data.row.parent_id" type="danger" @click="handleDelete(data.row.id, false)">删除条目</el-button>
          </template>
        </vxe-column>
      </vxe-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </el-card>

    <ModalForm ref="dictFormRef" @success="fetchData" @close="formVisibility = false" v-if="formVisibility" />
  </div>
</template>

<style scoped>
.main-container {
  padding: 10px;
}

.search-form {
  margin-bottom: 10px;
  padding: 20px 20px 0 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

:deep(.vxe-table .header-cell-fix) {
  text-align: center;
  background-color: #f5f7fa;
  height: 50px;
}

.pagination {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.color-block {
  display: inline-block;
  width: 20px;
  height: 20px;
  vertical-align: middle;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
}
</style>
