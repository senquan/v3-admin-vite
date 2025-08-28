<script lang="ts" setup>
import type { ExamRecord, StudyPlan } from "./apis/study"
import { formatDateTime } from "@/common/utils/datetime"
import { getCascaderOptions } from "@/common/utils/helper"
import { useRouter } from "vue-router"
import { fetchCategoryListOpt } from "../setting/apis"
import {
  deleteStudyPlan,
  getMockExamList,
  getPlanExamRecords,
  getStudyPlanList
} from "./apis/study"
import MockExamForm from "./components/MockExamForm.vue"
import StudyPlanForm from "./components/StudyPlanForm.vue"

const router = useRouter()
const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  category: "",
  level: "",
  status: "",
  page: 1,
  pageSize: 20
})

const totalPlans = ref(0)
const tableData = ref<StudyPlan[]>([])
const examRecordData = ref<ExamRecord[]>([])
const studyPlanFormRef = ref<any>(null)
const mockExamFormRef = ref<any>(null)
const formVisibility = ref(false)
const examFormVisibility = ref(false)
const mockDrawer = ref(false)
const totalPages = computed(() => Math.ceil(totalPlans.value / listQuery.pageSize))
const currentRow = ref<StudyPlan>()
const searchOptions = reactive({
  categories: [
    { label: "制度学习", value: 1 },
    { label: "会议传达", value: 2 },
    { label: "安全技术培训", value: 3 },
    { label: "三级教育", value: 4 },
    { label: "专业技能", value: 5 },
    { label: "管理培训", value: 6 }
  ],
  levels: [
    { label: "初级", value: 1 },
    { label: "中级", value: 2 },
    { label: "高级", value: 3 },
    { label: "专家级", value: 4 }
  ],
  statuses: [
    { label: "未开始", value: 0 },
    { label: "学习中", value: 1 },
    { label: "已完成", value: 2 },
    { label: "已暂停", value: 3 }
  ]
})
const examCategories = ref<any>([])

async function fetchStudyPlans() {
  loading.value = true
  try {
    const res = await getStudyPlanList(listQuery)
    if (res.data && res.data.plans) {
      totalPlans.value = res.data.total
      tableData.value = res.data.plans
    } else {
      tableData.value = []
    }
  } catch (error) {
    console.error("获取自学计划失败:", error)
    ElMessage.error("获取数据失败，请稍后重试")
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleSortChange(column: any) {
  const { _field, _order } = column
  // 处理排序逻辑
  handleFilter()
}

function handleFilter() {
  fetchStudyPlans()
}

function handleNew() {
  handleEdit(0)
}

function handleEdit(id: number) {
  openStudyPlanForm(id)
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
      deleteStudyPlan(id).then(() => {
        ElMessage.success("删除成功")
        fetchStudyPlans()
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

function handleMock(row: StudyPlan) {
  mockDrawer.value = true
  currentRow.value = row
  loadPlanExamRecords()
  loadExamCategories()
}

function loadPlanExamRecords() {
  if (currentRow.value) {
    getPlanExamRecords(currentRow.value.id, { page: 1, pageSize: 20 }).then((res) => {
      if (res.data && res.data.records) {
        examRecordData.value = res.data.records
      } else {
        examRecordData.value = []
      }
    })
  }
}

function loadExamCategories() {
  if (examCategories.value.length > 0) return
  fetchCategoryListOpt(1).then((res) => {
    const categoryOptData: Array<any> = []
    if (res.data) {
      for (const item of res.data.categories) {
        const parent = item.parentId || 0
        if (categoryOptData[parent] === undefined) {
          categoryOptData[parent] = []
        }
        categoryOptData[parent].push(item)
      }
      examCategories.value = getCascaderOptions(categoryOptData, 0, 0, 3)
    }
  })
}

function handleGenerateExam() {
  mockExamFormRef.value?.open({
    planId: currentRow.value?.id,
    planTitle: currentRow.value?.title,
    category: currentRow.value?.category,
    level: currentRow.value?.level,
    categories: examCategories.value
  })
  examFormVisibility.value = true
}

function handleStartExam(row: ExamRecord) {
  if (!row.exam_id) {
    ElMessage.error("考试ID无效")
    return
  }

  ElMessageBox.confirm(
    "确定要开始考试吗？",
    "开始考试",
    {
      confirmButtonText: "开始答题",
      cancelButtonText: "取消",
      type: "info"
    }
  ).then(() => {
    if (row.exam_id) {
      router.push({
        name: "ExamTakingWithId",
        params: {
          examId: row.exam_id
        }
      })
    }
  }).catch(() => {
    // 用户取消
  })
}

function handleViewResult(row: ExamRecord) {
  // 跳转到考试结果页面
  if (row.exam_id) {
    router.push({
      name: "ExamResult",
      params: {
        examId: row.exam_id
      }
    })
  }
}

function openStudyPlanForm(id: number) {
  studyPlanFormRef.value?.open({ id })
  formVisibility.value = true
}

function getCategory(value: number) {
  return searchOptions.categories.find(item => item.value === value)?.label || "其他"
}

function getLevel(value: number) {
  return searchOptions.levels.find(item => item.value === value)?.label || "未知"
}

// function getStatus(value: number) {
//   return searchOptions.statuses.find(item => item.value === value)?.label || "未知"
// }

function onExamFormSuccess() {
  examFormVisibility.value = false
  ElMessage.success("模拟试卷生成成功")
  loadPlanExamRecords()
}

onMounted(() => {
  handleFilter()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="搜索计划名称"
        class="filter-item"
        style="width: 200px;"
        @keyup.enter="handleFilter"
        @clear="handleFilter"
        clearable
      />
      <el-select
        v-model="listQuery.category"
        placeholder="选择学习类别"
        class="filter-item"
        style="width: 150px;"
        @change="handleFilter"
        clearable
      >
        <el-option
          v-for="item in searchOptions.categories"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-select
        v-model="listQuery.level"
        placeholder="选择难度等级"
        class="filter-item"
        style="width: 120px;"
        @change="handleFilter"
        clearable
      >
        <el-option
          v-for="item in searchOptions.levels"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-select
        v-model="listQuery.status"
        placeholder="选择状态"
        class="filter-item"
        style="width: 120px;"
        @change="handleFilter"
        clearable
      >
        <el-option
          v-for="item in searchOptions.statuses"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增计划</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
      >
        <vxe-column field="id" width="60" title="ID" />
        <vxe-column field="title" min-width="200" title="计划名称">
          <template #default="data">
            <el-text style="display: flex;">{{ data.row.title }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="description" min-width="150" title="描述" show-overflow="tooltip" />
        <vxe-column field="category" width="120" title="学习类别">
          <template #default="data">
            {{ getCategory(data.row.category) }}
          </template>
        </vxe-column>
        <vxe-column field="level" width="100" title="难度等级">
          <template #default="data">
            {{ getLevel(data.row.level) }}
          </template>
        </vxe-column>
        <vxe-column field="study_hours" width="100" title="学习时长">
          <template #default="data">
            {{ data.row.study_hours }}小时
          </template>
        </vxe-column>
        <vxe-column field="target_score" width="100" title="目标分数">
          <template #default="data">
            {{ data.row.target_score }}分
          </template>
        </vxe-column>
        <vxe-column field="status" width="100" title="状态">
          <template #default="data">
            <el-tag v-if="data.row.status === 0" type="info" effect="dark">未开始</el-tag>
            <el-tag v-if="data.row.status === 1" type="primary" effect="dark">学习中</el-tag>
            <el-tag v-if="data.row.status === 2" type="success" effect="dark">已完成</el-tag>
            <el-tag v-if="data.row.status === 3" type="warning" effect="dark">已暂停</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="create_time" width="150" title="创建时间">
          <template #default="data">
            {{ formatDateTime(data.row.create_time) }}
          </template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="300" fixed="right">
          <template #default="data">
            <el-button type="primary" @click="handleEdit(data.row.id)">编辑</el-button>
            <el-button type="success" @click="handleMock(data.row)">模拟考试</el-button>
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

    <el-drawer v-model="mockDrawer" :title="`模拟考试记录 - ${currentRow?.title}`" size="50%" direction="rtl">
      <div class="toolbox">
        <el-button type="primary" @click="handleGenerateExam">新增模拟考试</el-button>
      </div>
      <vxe-table
        :data="examRecordData"
      >
        <vxe-column title="生成时间" min-width="180" align="left">
          <template #default="data">
            <el-text>{{ formatDateTime(data.row.create_time) }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="total_score" title="总分" width="80" />
        <vxe-column field="score" title="最高分" width="80" />
        <vxe-column field="duration" title="考试时长" width="80" />
        <vxe-column field="attempt_count" title="重试次数" width="80" />
        <vxe-column title="最后完成时间" min-width="180" align="left">
          <template #default="data">
            <el-text>{{ formatDateTime(data.row.end_time) }}</el-text>
          </template>
        </vxe-column>
        <vxe-column title="操作" width="220">
          <template #default="data">
            <el-button type="warning" @click="handleStartExam(data.row)">开始答题</el-button>
            <el-button type="info" @click="handleViewResult(data.row)">查看结果</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </el-drawer>

    <!-- 自学计划表单 -->
    <StudyPlanForm
      ref="studyPlanFormRef"
      @success="fetchStudyPlans"
      @close="formVisibility = false"
    />

    <!-- 模拟试卷生成表单 -->
    <MockExamForm
      ref="mockExamFormRef"
      @success="onExamFormSuccess"
      @close="examFormVisibility = false"
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

.grid-grouping {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-container {
  padding: 10px;
  background: #fff;
}

.el-button + .el-button {
  margin-left: 8px;
}

.toolbox {
  margin-right: 20px;
  text-align: right;
}
</style>
