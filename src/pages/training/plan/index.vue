<script lang="ts" setup>
// import { useUserStore } from "@/pinia/stores/user"
import { formatDateTime } from "@/common/utils/datetime"
import RecordForm from "./../record/_form.vue"
import PlanForm from "./_form.vue"
import { deletePlan, fetchList } from "./apis"

// const userStore = useUserStore()
// const isAdmin = userStore.roles.includes("ADMIN")

const loading = ref(false)
const listQuery = reactive({
  mode: "",
  category: "",
  method: "",
  keyword: "",
  sort: "+id",
  page: 1,
  pageSize: 20
})

const totalPlans = ref(0)
const tableData = ref<any>([])
const scopesData = ref<any>([])
const planFormRef = ref<any>([])
const formVisibility = ref(false)
const recordFormRef = ref<any>([])
const recordFormVisibility = ref(false)
const totalPages = computed(() => Math.ceil(totalPlans.value / listQuery.pageSize))
const searchOptions = reactive({
  categories: [
    { label: "制度学习", value: 1 },
    { label: "会议传达", value: 2 },
    { label: "安全技术培训", value: 3 },
    { label: "三级教育", value: 4 }
  ],
  methods: [
    { label: "考试", value: 1 },
    { label: "学习记录", value: 2 },
    { label: "检查", value: 3 },
    { label: "抽查", value: 4 },
    { label: "不考核", value: 5 }
  ]
})

async function fetchPlans() {
  loading.value = true
  try {
    fetchList(listQuery).then((res: any) => {
      if (res.data && res.data.plans) {
        totalPlans.value = res.data.total
        tableData.value = res.data.plans.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            training_scope: item.training_scope,
            training_scope_names: item.training_scope_names.join(","), // 新增字段，用于显示培训范围的名称
            trainer: item.trainer,
            training_mode: item.training_mode,
            training_category: item.training_category,
            planned_participants: item.planned_participants,
            planned_time: item.planned_time,
            training_hours: item.training_hours,
            assessment_method: item.assessment_method,
            exam_method: item.exam_method,
            status: item.status
          }
        })
        scopesData.value = res.data.scopes
      } else {
        tableData.value = []
        scopesData.value = []
      }
    })
  } catch (error) {
    console.error("获取记录失败:", error)
    ElMessage.error("获取数据失败，请稍后重试")
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleSortChange(column: any) {
  const { field, order } = column
  listQuery.sort = (order === "desc" ? "-" : "+") + field
  handleFilter()
}

function handleFilter() {
  fetchPlans()
}

function handleNew() {
  handleEdit(0)
}

function handleEdit(id: number) {
  openFrom(id)
}

function handleRecord(row: any) {
  const currentScope = [] as any[]
  row.training_scope.forEach((scope: any) => {
    scopesData.value.forEach((option: any) => {
      if (option.value === scope) {
        currentScope.push({
          value: scope,
          label: option.label,
          disabled: true
        })
        return
      }
      if (option.children.length > 0) {
        option.children.forEach((child: any) => {
          if (child.value === scope) {
            currentScope.push({
              value: scope,
              label: child.label,
              disabled: true
            })
          }
        })
      }
    })
  })

  recordFormRef.value?.open({
    scopes: currentScope,
    data: row,
    dicts: searchOptions
  })
  recordFormVisibility.value = true
}

function handleDelete(id: number) {
  ElMessageBox.prompt("请输入\"确认删除计划\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除计划$/,
    inputErrorMessage: "请输入\"确认删除计划\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除计划") {
      deletePlan(id).then(() => {
        ElMessage.success("删除成功")
        fetchPlans()
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

async function handleExport() {
  loading.value = true
  loading.value = false
}

function openFrom(id: number) {
  planFormRef.value?.open({
    scopes: scopesData.value,
    id
  })
  formVisibility.value = true
}

function getTrainingCategory(value: number) {
  return searchOptions.categories.find(item => item.value === value)?.label || "其他"
}

function getAssessmentMethod(value: number) {
  return searchOptions.methods.find(item => item.value === value)?.label || "其他"
}

onMounted(() => {
  handleFilter()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-select v-model="listQuery.category" placeholder="选择培训类别" class="filter-item" style="width: 120px;" @change="handleFilter" clearable>
        <el-option :key="1" label="内部培训" :value="1" />
        <el-option :key="2" label="外部培训" :value="2" />
      </el-select>
      <el-select v-model="listQuery.category" placeholder="选择培训类别" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
        <el-option v-for="item in searchOptions.categories" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="listQuery.method" placeholder="选择考核方式" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
        <el-option v-for="item in searchOptions.methods" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增计划</el-button>
      <el-button type="primary" @click="handleExport">导出Excel</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
      >
        <vxe-column field="id" width="50" title="序号" />
        <vxe-column field="name" width="250" title="培训名称">
          <template #default="data">
            <el-text style="display: flex;">{{ data.row.name }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="training_scope_names" min-width="200" title="培训范围" />
        <vxe-column field="trainer" width="130" title="教培人员" />
        <vxe-column field="training_mode" width="80" title="培训模式">
          <template #default="data">
            {{ data.row.training_mode === 1 ? "内部培训" : "外部培训" }}
          </template>
        </vxe-column>
        <vxe-column field="training_category" width="120" title="培训类别">
          <template #default="data">
            {{ getTrainingCategory(data.row.training_category) }}
          </template>
        </vxe-column>
        <vxe-column field="planned_participants" width="80" title="培训人数" />
        <vxe-column field="planned_time" width="150" title="预计时间">
          <template #default="data">
            {{ formatDateTime(data.row.planned_time) }}
          </template>
        </vxe-column>
        <vxe-column field="training_hours" width="100" title="培训学时" />
        <vxe-column field="assessment_method" width="100" title="考核方式">
          <template #default="data">
            {{ getAssessmentMethod(data.row.assessment_method) }}
          </template>
        </vxe-column>
        <vxe-column field="status" width="100" title="培训状态">
          <template #default="data">
            <el-tag v-if="data.row.status !== 2 && data.row.status !== 3" type="info" effect="dark">未完成</el-tag>
            <el-tag v-if="data.row.status === 2" type="primary" effect="dark">进行中</el-tag>
            <el-tag v-if="data.row.status === 3" type="success" effect="dark">已完成</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="260">
          <template #default="data">
            <el-button type="primary" @click="handleRecord(data.row)">培训填报</el-button>
            <el-button type="primary" @click="handleEdit(data.row.id)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(data.row.id)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-if="totalPages > 1"
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalPlans"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleFilter"
        @current-change="handleFilter"
      />
    </div>

    <PlanForm
      ref="planFormRef"
      @success="fetchPlans"
      @close="formVisibility = false"
    />

    <RecordForm
      ref="recordFormRef"
      @close="recordFormVisibility = false"
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
.footer-container {
  padding: 10px;
  padding-left: 60px;
  background: #fff;
}
.pagination-container {
  padding: 10px;
  background: #fff;
}
</style>
