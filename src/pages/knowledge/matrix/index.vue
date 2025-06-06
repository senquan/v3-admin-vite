<script lang="ts" setup>
import type * as Matrix from "./apis/type"
import MatrixForm from "./_form.vue"
import { deleteMatrix, fetchList } from "./apis/index"

const tableData = ref<Matrix.MatrixListData[]>([])
const total = ref(0)
const loading = ref(false)
const formVisible = ref(false)
const isEdit = ref(false)
const currentRow = ref<Matrix.MatrixListData>()

const queryParams = reactive<Matrix.MatrixListRequestParams>({
  keyword: "",
  page: 1,
  pageSize: 20
})

const methodOptions = ref<any>([
  { label: "考试", value: 1 },
  { label: "学习记录", value: 2 },
  { label: "检查", value: 3 },
  { label: "抽查", value: 4 },
  { label: "不考核", value: 5 },
  { label: "佩戴检查", value: 6 },
  { label: "穿戴检查", value: 7 },
  { label: "现场检查", value: 8 },
  { label: "实操", value: 9 },
  { label: "演练", value: 10 },
  { label: "持证", value: 11 }
])

async function fetchMatrixList() {
  loading.value = true
  try {
    const res = await fetchList(queryParams)
    if (res.code === 0) {
      tableData.value = res.data.matrices
      total.value = res.data.total
    } else {
      ElMessage.error(res.message || "获取标准列表失败")
    }
  } catch (error) {
    console.error("获取标准列表失败", error)
    ElMessage.error("获取标准列表失败")
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.page = 1
  fetchMatrixList()
}

function handleSizeChange(val: number) {
  queryParams.pageSize = val
  fetchMatrixList()
}

function handleCurrentChange(val: number) {
  queryParams.page = val
  fetchMatrixList()
}

function handleAdd() {
  isEdit.value = false
  formVisible.value = true
}

function handleEdit(row: Matrix.MatrixListData) {
  isEdit.value = true
  currentRow.value = row
  formVisible.value = true
}

function handleDelete(id: number) {
  ElMessageBox.prompt("请输入\"确认删除标准\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除标准$/,
    inputErrorMessage: "请输入\"确认删除标准\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除标准") {
      deleteMatrix(id).then(() => {
        ElMessage.success("删除成功")
        fetchMatrixList()
      }).catch(() => {
        ElMessage({
          type: "warning",
          message: "删除失败"
        })
      })
    }
  }).catch(() => {
    ElMessage({
      type: "info",
      message: "已取消删除"
    })
  })
}

function getAssessmentMethod(value: string) {
  if (!value) return "-"
  const methodList = value.split(",")
  const methodNames = methodList.map((item: string) => {
    const method = methodOptions.value.find((method: any) => method.value === Number(item))
    return method ? method.label : "-"
  })
  return methodNames.join("、")
}

onMounted(() => {
  fetchMatrixList()
})
</script>

<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="queryParams.keyword"
        placeholder="请输入关键字"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button type="primary" @click="handleAdd">新增标准</el-button>
    </div>

    <div class="grid-grouping">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%"
      >
        <el-table-column prop="_id" label="序号" width="80" align="center" />
        <el-table-column prop="ref" label="编号" width="100" align="center">
          <template #default="{ row }">
            {{ row.category ? `${row.category.ref}.` : "" }}{{ row.ref }}
          </template>
        </el-table-column>
        <el-table-column prop="level1" label="一级标准" width="150" align="center" />
        <el-table-column prop="level2" label="二级标准" width="150" align="center" />
        <el-table-column prop="level3" label="三级标准" width="150" align="center" />
        <el-table-column prop="standard" label="标准" min-width="250" show-overflow-tooltip />
        <el-table-column prop="assessment_method" label="考核方式" width="150" align="center">
          <template #default="{ row }">
            <el-text truncated>{{ getAssessmentMethod(row.assessment_method) }}</el-text>
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="120" align="center">
          <template #default="{ row }">
            {{ row.creatorEntity?.name || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(row._id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-if="total > Number(queryParams.pageSize)"
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <MatrixForm
      v-model:visible="formVisible"
      :form-data="currentRow"
      :is-edit="isEdit"
      :options="methodOptions"
      @refresh="fetchMatrixList"
    />
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
.pagination-container {
  padding: 10px;
  background: #fff;
}
</style>
