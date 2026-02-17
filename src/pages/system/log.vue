<script setup lang="ts">
interface OperationLog {
  id: number
  logCode: string // 日志编号
  userName: string // 用户名
  realName: string // 真实姓名
  operationModule: string // 操作模块
  operationType: number // 操作类型：1-新增，2-修改，3-删除，4-查询，5-导出，6-登录，7-登出
  operationDesc: string // 操作描述
  requestUrl: string // 请求URL
  requestMethod: string // 请求方法
  requestParams: string // 请求参数
  responseResult: string // 响应结果
  clientIp: string // 客户端IP
  userAgent: string // 用户代理
  operationTime: string // 操作时间
  executionTime: number // 执行时间(ms)
  status: number // 状态：1-成功，2-失败
  remark: string
}

const loading = ref(false)
const showDetailDialog = ref(false)
const detailDialogTitle = ref("日志详情")
const detailData = ref<OperationLog | null>(null)

const searchForm = reactive({
  userName: "",
  operationModule: "",
  operationType: undefined as number | undefined,
  status: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<OperationLog[]>([])

// 获取操作类型标签
function getOperationTypeLabel(type: number) {
  const labels = { 1: "新增", 2: "修改", 3: "删除", 4: "查询", 5: "导出", 6: "登录", 7: "登出" }
  return labels[type as keyof typeof labels] || "未知"
}

// 获取操作类型标签类型
function getOperationTypeType(type: number) {
  const types = { 1: "success", 2: "warning", 3: "danger", 4: "primary", 5: "info", 6: "success", 7: "info" }
  return types[type as keyof typeof types] || "info"
}

// 获取状态标签
function getStatusLabel(status: number) {
  const labels = { 1: "成功", 2: "失败" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取状态标签类型
function getStatusType(status: number) {
  const types = { 1: "success", 2: "danger" }
  return types[status as keyof typeof types] || "info"
}

// 格式化时间
function formatTime(time: string) {
  return time ? new Date(time).toLocaleString() : "-"
}

// 格式化执行时间
function formatExecutionTime(time: number) {
  return time ? `${time}ms` : "-"
}

// 格式化JSON
function formatJson(jsonStr: string) {
  if (!jsonStr) return "-"
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2)
  } catch {
    return jsonStr
  }
}

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    // 模拟API调用
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: {
            items: [
              {
                id: 1,
                logCode: "LOG202401010001",
                userName: "admin",
                realName: "系统管理员",
                operationModule: "用户管理",
                operationType: 1,
                operationDesc: "新增用户",
                requestUrl: "/api/user/create",
                requestMethod: "POST",
                requestParams: "{\"username\":\"testuser\",\"realName\":\"测试用户\"}",
                responseResult: "{\"code\":200,\"message\":\"创建成功\"}",
                clientIp: "192.168.1.100",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                operationTime: "2024-01-01T10:30:00Z",
                executionTime: 156,
                status: 1,
                remark: "用户创建成功"
              },
              {
                id: 2,
                logCode: "LOG202401010002",
                userName: "user001",
                realName: "张三",
                operationModule: "财务管理",
                operationType: 2,
                operationDesc: "修改财务数据",
                requestUrl: "/api/finance/update",
                requestMethod: "PUT",
                requestParams: "{\"id\":123,\"amount\":50000}",
                responseResult: "{\"code\":200,\"message\":\"更新成功\"}",
                clientIp: "192.168.1.101",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                operationTime: "2024-01-01T11:15:30Z",
                executionTime: 89,
                status: 1,
                remark: "财务数据更新"
              },
              {
                id: 3,
                logCode: "LOG202401010003",
                userName: "user002",
                realName: "李四",
                operationModule: "系统配置",
                operationType: 3,
                operationDesc: "删除配置项",
                requestUrl: "/api/config/delete/456",
                requestMethod: "DELETE",
                requestParams: "",
                responseResult: "{\"code\":500,\"message\":\"删除失败：系统配置不允许删除\"}",
                clientIp: "192.168.1.102",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                operationTime: "2024-01-01T12:20:45Z",
                executionTime: 45,
                status: 2,
                remark: "删除系统配置失败"
              },
              {
                id: 4,
                logCode: "LOG202401010004",
                userName: "admin",
                realName: "系统管理员",
                operationModule: "报表管理",
                operationType: 5,
                operationDesc: "导出财务报表",
                requestUrl: "/api/report/export",
                requestMethod: "GET",
                requestParams: "{\"reportType\":\"summary\",\"startDate\":\"2024-01-01\",\"endDate\":\"2024-03-31\"}",
                responseResult: "{\"code\":200,\"message\":\"导出成功\",\"data\":{\"fileName\":\"财务汇总报表_2024Q1.xlsx\"}}",
                clientIp: "192.168.1.100",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                operationTime: "2024-01-01T14:30:15Z",
                executionTime: 1234,
                status: 1,
                remark: "季度财务报表导出"
              }
            ],
            total: 4
          }
        })
      }, 500)
    })

    const result: any = response
    tableData.value = result.data.items
    pagination.total = result.data.total
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchData()
}

// 重置搜索
function resetSearch() {
  Object.assign(searchForm, {
    userName: "",
    operationModule: "",
    operationType: undefined,
    status: undefined,
    dateRange: []
  })
  handleSearch()
}

// 分页变化
function handleSizeChange(val: number) {
  pagination.size = val
  fetchData()
}

function handleCurrentChange(val: number) {
  pagination.page = val
  fetchData()
}

// 查看详情
function handleViewDetail(row: OperationLog) {
  detailDialogTitle.value = "操作日志详情"
  detailData.value = row
  showDetailDialog.value = true
}

// 关闭详情弹窗
function closeDetailDialog() {
  showDetailDialog.value = false
  detailData.value = null
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="operation-log-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.userName" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="操作模块">
          <el-input v-model="searchForm.operationModule" placeholder="请输入操作模块" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.operationType" placeholder="请选择类型" clearable>
            <el-option label="新增" :value="1" />
            <el-option label="修改" :value="2" />
            <el-option label="删除" :value="3" />
            <el-option label="查询" :value="4" />
            <el-option label="导出" :value="5" />
            <el-option label="登录" :value="6" />
            <el-option label="登出" :value="7" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        header-cell-class-name="text-center"
      >
        <el-table-column prop="logCode" label="日志编号" width="140" align="center" />
        <el-table-column prop="userName" label="用户名" width="100" align="center" />
        <el-table-column prop="realName" label="真实姓名" width="100" align="center" />
        <el-table-column prop="operationModule" label="操作模块" width="120" align="center" />
        <el-table-column prop="operationType" label="操作类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getOperationTypeType(row.operationType) as any">
              {{ getOperationTypeLabel(row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operationDesc" label="操作描述" min-width="150" />
        <el-table-column prop="requestMethod" label="请求方法" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.requestMethod === 'GET' ? 'primary' : row.requestMethod === 'POST' ? 'success' : row.requestMethod === 'PUT' ? 'warning' : 'danger'">
              {{ row.requestMethod }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="clientIp" label="客户端IP" width="130" align="center" />
        <el-table-column prop="executionTime" label="执行时间" width="100" align="center">
          <template #default="{ row }">
            {{ formatExecutionTime(row.executionTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operationTime" label="操作时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatTime(row.operationTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" @click="handleViewDetail(row)" size="small">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
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

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="detailDialogTitle"
      width="800px"
      @close="closeDetailDialog"
    >
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="日志编号">{{ detailData.logCode }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detailData.userName }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ detailData.realName }}</el-descriptions-item>
        <el-descriptions-item label="操作模块">{{ detailData.operationModule }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getOperationTypeType(detailData.operationType) as any">
            {{ getOperationTypeLabel(detailData.operationType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述">{{ detailData.operationDesc }}</el-descriptions-item>
        <el-descriptions-item label="请求URL" :span="2">{{ detailData.requestUrl }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">
          <el-tag :type="detailData.requestMethod === 'GET' ? 'primary' : detailData.requestMethod === 'POST' ? 'success' : detailData.requestMethod === 'PUT' ? 'warning' : 'danger'">
            {{ detailData.requestMethod }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status) as any">
            {{ getStatusLabel(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户端IP">{{ detailData.clientIp }}</el-descriptions-item>
        <el-descriptions-item label="执行时间">{{ formatExecutionTime(detailData.executionTime) }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatTime(detailData.operationTime) }}</el-descriptions-item>
        <el-descriptions-item label="用户代理" :span="2">{{ detailData.userAgent }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="json-content">{{ formatJson(detailData.requestParams) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果" :span="2">
          <pre class="json-content">{{ formatJson(detailData.responseResult) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark }}</el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="closeDetailDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.operation-log-management {
  padding: 10px;
}

.search-form {
  margin-bottom: 10px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

.text-center {
  text-align: center;
}

.pagination {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.json-content {
  font-family: "Courier New", monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

:deep(.el-descriptions__label) {
  width: 120px;
}
</style>
