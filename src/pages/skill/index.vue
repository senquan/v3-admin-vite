<script setup lang="ts">
import type { MyTask, MyTrainingListParams, TrainingRecord, TrainingStats, User } from "./apis/training"
import { useRouter } from 'vue-router'
import {
  getTrainingDetail,
  getTrainingStats
} from "./apis/training"
import RadarChart from "./components/radar.vue"

const router = useRouter()

// 响应式数据
const loading = ref(false)
const tableData = ref<MyTask[]>([])
const detailDialogVisible = ref(false)
const currentRecord = ref<TrainingRecord | null>(null)
const certificateData = ref<any[]>([])

// 统计数据
const stats = ref<TrainingStats>({
  totalTrainings: 0,
  completedTrainings: 0,
  totalHours: 0,
  passedExams: 0,
  averageScore: 0,
  certificateCount: 0,
  recentTrainings: []
})

// 个人信息
const profile = ref<User>({
  id: 0,
  name: "",
  realname: "",
  email: "",
  phone: "",
  branch: {
    name: ""
  },
  joinDate: "",
  gender: "",
  oa_id: "",
  age: 0,
  married: false
})

// 搜索表单
const searchForm = reactive<MyTrainingListParams>({
  keyword: "",
  status: undefined,
  training_category: undefined
})

// 日期范围
const dateRange = ref<[string, string]>()

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 监听日期范围变化
watch(dateRange, (newVal) => {
  if (newVal) {
    searchForm.start_date = newVal[0]
    searchForm.end_date = newVal[1]
  } else {
    searchForm.start_date = undefined
    searchForm.end_date = undefined
  }
})

// 获取统计数据
async function fetchStats() {
  try {
    const response = await getTrainingStats()
    if (response.code === 0) {
      stats.value = response.data.stats
      profile.value = response.data.profile
      tableData.value = response.data.tasks
      certificateData.value = response.data.certificates
    }
  } catch (error) {
    console.error("获取统计数据失败:", error)
  }
}

// 搜索
// function handleSearch() {
//   pagination.page = 1
//   fetchTrainingList()
// }

// // 重置
// function handleReset() {
//   Object.assign(searchForm, {
//     keyword: "",
//     status: undefined,
//     training_category: undefined,
//     start_date: undefined,
//     end_date: undefined
//   })
//   dateRange.value = undefined
//   pagination.page = 1
//   fetchTrainingList()
// }

// 排序变化
function handleSortChange() {
  // 实现排序逻辑
  // fetchTrainingList()
}

// 分页大小变化
function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  // fetchTrainingList()
}

// 当前页变化
function handleCurrentChange(page: number) {
  pagination.page = page
  // fetchTrainingList()
}

// 查看详情
async function handleViewDetail(record: TrainingRecord) {
  try {
    const response = await getTrainingDetail(record.id)
    if (response.code === 200) {
      currentRecord.value = response.data.record
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error("获取培训详情失败:", error)
    ElMessage.error("获取培训详情失败")
  }
}

// 标记完成
// async function handleMarkComplete(record: TrainingRecord) {
//   try {
//     await ElMessageBox.confirm("确认标记此培训为已完成？", "提示", {
//       confirmButtonText: "确定",
//       cancelButtonText: "取消",
//       type: "warning"
//     })

//     const response = await markTrainingComplete(record._id)
//     if (response.code === 200) {
//       ElMessage.success("标记完成成功")
//       // fetchTrainingList()
//       fetchStats()
//     }
//   } catch (error) {
//     if (error !== "cancel") {
//       console.error("标记完成失败:", error)
//       ElMessage.error("标记完成失败")
//     }
//   }
// }

// 开始学习
function handleStartLearning(record: TrainingRecord) {
  router.push({
    name: "skill-learning",
    params: {
      taskId: record.id
    }
  })
}

// 参加考试
function handleTakeExam(record: TrainingRecord) {
  // 跳转到考试页面
  console.log(record)
  ElMessage.info("跳转到考试页面功能待实现")
}

// 下载课件
// function downloadCourseware(courseware: any) {
//   // 实现下载逻辑
//   window.open(courseware.file_path, "_blank")
// }

// 获取培训分类名称
function getTrainingCategoryName(category: number | undefined) {
  const categoryMap: Record<number, string> = {
    1: "技能培训",
    2: "安全培训",
    3: "管理培训",
    4: "其他培训"
  }
  return category ? categoryMap[category] || "未知" : "-"
}

// 获取状态名称
function getStatusName(status: number) {
  const statusMap: Record<number, string> = {
    0: "已取消",
    1: "进行中",
    2: "已完成"
  }
  return statusMap[status] || "未知"
}

// 获取状态名称
function getResultName(result: boolean) {
  return result ? "合格" : "不合格"
}

// 获取状态类型
function getStatusType(status: number): "success" | "warning" | "info" | "primary" | "danger" {
  const typeMap: Record<number, "success" | "warning" | "info" | "primary" | "danger"> = {
    0: "danger",
    1: "warning",
    2: "success"
  }
  return typeMap[status] || "info"
}

// 获取考试方式名称
function getTaskStatus(progress: number | undefined) {
  const statusMap: Record<number, string> = {
    0: "未开始",
    1: "进行中",
    2: "已完成"
  }
  const numProgress = Number(progress)
  return numProgress === 0 ? statusMap[0] : (numProgress === 100 ? statusMap[2] : statusMap[1])
}

// 格式化日期
function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("zh-CN")
}

// 组件挂载
onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="my-training-container">
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="15">
        <el-col :span="6">
          <RadarChart />
        </el-col>
        <el-col :span="10">
          <div class="card-user-info">
            <el-descriptions title="个人信息" border>
              <el-descriptions-item
                :rowspan="6"
                align="center"
              >
                <template #label>
                  <el-image
                    style="width: 100px; height: 100px"
                    src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
                  />
                  <div>
                    <div>{{ profile.realname }}</div>
                  </div>
                </template>
              </el-descriptions-item>
              <el-descriptions-item label="员工编号" width="20%" label-width="100px">{{ profile.oa_id }}</el-descriptions-item>
              <el-descriptions-item label="性别" width="20%" label-width="100px">{{ profile.gender }}</el-descriptions-item>
              <el-descriptions-item label="民族">{{ "" }}</el-descriptions-item>
              <el-descriptions-item label="年龄">{{ profile.age }}</el-descriptions-item>
              <el-descriptions-item label="政治面貌">{{ "" }}</el-descriptions-item>
              <el-descriptions-item label="学历">{{ "" }}</el-descriptions-item>
              <el-descriptions-item label="入职时间">{{ profile.joinDate }}</el-descriptions-item>
              <el-descriptions-item label="是否已婚">{{ profile.married ? '是' : '否' }}</el-descriptions-item>
              <el-descriptions-item label="部门">{{ profile.branch?.name }}</el-descriptions-item>
              <el-descriptions-item label="岗位">{{ "" }}</el-descriptions-item>
              <el-descriptions-item label="技能等级">{{ "" }}</el-descriptions-item>
              <el-descriptions-item label="证书数量">{{ stats.certificateCount }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-col>
        <el-col :span="8" class="stat-col">
          <div>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon total">
                      <el-icon><Document /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-number">{{ stats.totalTrainings }}</div>
                      <div class="stat-label">总培训次数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon completed">
                      <el-icon><CircleCheck /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-number">{{ stats.completedTrainings }}</div>
                      <div class="stat-label">已完成培训</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <el-row :gutter="20" style="margin-top: 10px;">
              <el-col :span="12">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon hours">
                      <el-icon><Clock /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-number">{{ stats.totalHours }}</div>
                      <div class="stat-label">总培训时长(小时)</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon score">
                      <el-icon><Trophy /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-number">{{ stats.averageScore.toFixed(1) }}</div>
                      <div class="stat-label">平均分数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <!-- <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入培训名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="培训状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="进行中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已取消" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="培训分类">
          <el-select v-model="searchForm.training_category" placeholder="请选择分类" clearable style="width: 150px">
            <el-option label="技能培训" :value="1" />
            <el-option label="安全培训" :value="2" />
            <el-option label="管理培训" :value="3" />
            <el-option label="其他培训" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card> -->

    <!-- 培训列表 -->
    <el-row :gutter="15">
      <el-col :span="16">
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span>我的任务</span>
            </div>
          </template>

          <el-table
            v-loading="loading"
            :data="tableData"
            style="width: 100%"
            @sort-change="handleSortChange"
          >
            <el-table-column prop="type" label="任务类型" width="80">
              <template #default="{ row }">
                <span>{{ row.type === 1 ? '任务' : '培训' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="任务名称" min-width="200" />

            <el-table-column prop="duration" label="培训时长(小时)" width="120" align="center" />

            <el-table-column prop="progress" label="状态" width="120">
              <template #default="{ row }">
                <span>{{ getTaskStatus(row.progress) }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="result" label="考核结果" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.progress === 100" :type="getStatusType(row.result ? 2 : 0)" effect="dark">{{  getResultName(row.result) }}</el-tag>
                <el-tag v-else>未考核</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="200" align="center">
              <template #default="{ row }">
                <el-button
                  v-if="row.type === 1 && Number(row.progress) < 100"
                  type="success"
                  @click="handleStartLearning(row)"
                >
                  开始学习
                </el-button>
                <el-button
                  v-if="row.type === 2 && row.assessmentMethod === 1 && row.progress < 100"
                  type="warning"
                  @click="handleTakeExam(row)"
                >
                  参加考试
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span>我的证书</span>
            </div>
          </template>
          <el-table
            v-loading="loading"
            :data="certificateData"
            style="width: 100%"
            @sort-change="handleSortChange"
          >
            <el-table-column prop="type" label="证书类型" width="80">
              <template #default="{ row }">
                <span>{{ row.type === 1 ? '任务' : '培训' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="证书名称" min-width="200" />

            <el-table-column prop="progress" label="颁发时间" width="120">
              <template #default="{ row }">
                <span>{{ row.awardTime }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>


    <!-- 培训详情对话框 -->
    <!-- <el-dialog v-model="detailDialogVisible" title="培训详情" width="800px">
      <div v-if="currentRecord" class="training-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="培训名称">{{ currentRecord.trainingPlanEntity?.name }}</el-descriptions-item>
          <el-descriptions-item label="培训师">{{ currentRecord.trainingPlanEntity?.trainer || "-" }}</el-descriptions-item>
          <el-descriptions-item label="培训分类">{{ getTrainingCategoryName(currentRecord.trainingPlanEntity?.training_category) }}</el-descriptions-item>
          <el-descriptions-item label="培训时长">{{ currentRecord.trainingPlanEntity?.training_hours }}小时</el-descriptions-item>
          <el-descriptions-item label="计划时间">{{ formatDate(currentRecord.trainingPlanEntity?.planned_time) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusName(currentRecord.status) }}</el-descriptions-item>
        </el-descriptions>

        <div class="training-content" style="margin-top: 20px;">
          <h4>培训内容</h4>
          <div v-html="currentRecord.contents"></div>
        </div>

        <div v-if="currentRecord.coursewareEntities?.length" class="training-materials" style="margin-top: 20px;">
          <h4>培训资料</h4>
          <el-list>
            <el-list-item v-for="courseware in currentRecord.coursewareEntities" :key="courseware._id">
              <div class="courseware-item">
                <el-icon><Document /></el-icon>
                <span>{{ courseware.title }}</span>
                <el-button type="text" size="small" @click="downloadCourseware(courseware)">下载</el-button>
              </div>
            </el-list-item>
          </el-list>
        </div>
      </div>
    </el-dialog> -->
  </div>
</template>

<style scoped>
.my-training-container {
  padding: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.hours {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.score {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  border-radius: 8px;
}

.card-user-info {
  width: 100%;
  height: 100%;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.training-name .name {
  font-weight: 500;
  color: #303133;
}

.training-name .category {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.training-detail {
  max-height: 600px;
  overflow-y: auto;
}

.training-content {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #fafafa;
}

.training-materials {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.courseware-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.courseware-item span {
  flex: 1;
}
</style>
