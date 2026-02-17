<script setup lang="ts">
import { request } from '@/http/axios'

interface BackupRecord {
  id: number
  backupCode: string
  backupName: string
  backupType: number
  backupMode: number
  filePath: string
  fileSize: number
  fileUrl: string
  status: number
  remark: string
  createdBy: string
  createdAt: string
  completedAt: string | null
}

const loading = ref(false)
const backupLoading = ref(false)
const restoreLoading = ref(false)
const activeTab = ref('backup')
const showCreateDialog = ref(false)
const showRestoreDialog = ref(false)
const selectedBackup = ref<BackupRecord | null>(null)

const searchForm = reactive({
  backupName: "",
  backupType: undefined as number | undefined,
  backupMode: undefined as number | undefined,
  status: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const autoBackupEnabled = ref(true)
const backupConfig = reactive({
  frequency: 1,
  time: new Date(),
  weekday: 1,
  day: 1,
  keepCount: 30,
  backupType: 1
})

const tableData = ref<BackupRecord[]>([])
const backupForm = reactive({
  backupName: "",
  backupType: 1,
  backupMode: 1,
  remark: ""
})

function getBackupTypeLabel(type: number) {
  const labels = { 1: "完整备份", 2: "增量备份", 3: "差异备份" }
  return labels[type as keyof typeof labels] || "未知"
}

function getBackupTypeType(type: number) {
  const types = { 1: "primary", 2: "success", 3: "warning" }
  return types[type as keyof typeof types] || "info"
}

function getBackupModeLabel(mode: number) {
  const labels = { 1: "手动", 2: "自动" }
  return labels[mode as keyof typeof labels] || "未知"
}

function getStatusLabel(status: number) {
  const labels = { 1: "进行中", 2: "成功", 3: "失败" }
  return labels[status as keyof typeof labels] || "未知"
}

function getStatusType(status: number) {
  const types = { 1: "warning", 2: "success", 3: "danger" }
  return types[status as keyof typeof types] || "info"
}

function formatTime(time: string) {
  return time ? new Date(time).toLocaleString() : "-"
}

function formatFileSize(size: number) {
  if (!size) return "-"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      backupName: searchForm.backupName || undefined,
      backupType: searchForm.backupType,
      backupMode: searchForm.backupMode,
      status: searchForm.status,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1],
      page: pagination.page,
      size: pagination.size
    }

    const response = await request<{
      code: number
      data: { items: BackupRecord[]; total: number }
    }>({
      url: '/api/v1/system/backups',
      method: 'get',
      params
    })

    if (response.code === 0) {
      tableData.value = response.data.items
      pagination.total = response.data.total
    } else {
      ElMessage.error(response.message || '获取数据失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function resetSearch() {
  Object.assign(searchForm, {
    backupName: "",
    backupType: undefined,
    backupMode: undefined,
    status: undefined,
    dateRange: []
  })
  handleSearch()
}

function handleSizeChange(val: number) {
  pagination.size = val
  fetchData()
}

function handleCurrentChange(val: number) {
  pagination.page = val
  fetchData()
}

async function handleCreateBackup() {
  if (!backupForm.backupName) {
    ElMessage.warning('请输入备份名称')
    return
  }

  backupLoading.value = true
  try {
    const response = await request<{ code: number; message: string }>({
      url: '/api/v1/system/backups',
      method: 'post',
      data: backupForm
    })

    if (response.code === 0) {
      ElMessage.success('备份任务已创建')
      showCreateDialog.value = false
      Object.assign(backupForm, {
        backupName: "",
        backupType: 1,
        backupMode: 1,
        remark: ""
      })
      fetchData()
    } else {
      ElMessage.error(response.message || '创建备份失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '创建备份失败')
  } finally {
    backupLoading.value = false
  }
}

function handleDownload(row: BackupRecord) {
  if (row.status !== 2) {
    ElMessage.warning('备份未完成，无法下载')
    return
  }
  window.open(row.fileUrl || `/api/v1/system/backups/${row.id}/download`, '_blank')
}

function handleRestore(row: BackupRecord) {
  if (row.status !== 2) {
    ElMessage.warning('备份未完成，无法恢复')
    return
  }
  selectedBackup.value = row
  showRestoreDialog.value = true
}

async function confirmRestore() {
  if (!selectedBackup.value) return

  restoreLoading.value = true
  try {
    const response = await request<{ code: number; message: string }>({
      url: `/api/v1/system/backups/${selectedBackup.value.id}/restore`,
      method: 'post'
    })

    if (response.code === 0) {
      ElMessage.success('恢复任务已创建，请等待恢复完成')
      showRestoreDialog.value = false
    } else {
      ElMessage.error(response.message || '恢复失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '恢复失败')
  } finally {
    restoreLoading.value = false
  }
}

async function handleDelete(row: BackupRecord) {
  try {
    await ElMessageBox.confirm(`确定要删除备份 "${row.backupName}" 吗？`, '提示', {
      type: 'warning'
    })

    const response = await request<{ code: number; message: string }>({
      url: `/api/v1/system/backups/${row.id}`,
      method: 'delete'
    })

    if (response.code === 0) {
      ElMessage.success('删除成功')
      fetchData()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

function closeCreateDialog() {
  showCreateDialog.value = false
  Object.assign(backupForm, {
    backupName: "",
    backupType: 1,
    backupMode: 1,
    remark: ""
  })
}

function handleSaveConfig() {
  ElMessage.success('配置保存成功')
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="backup-management">
    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="备份记录" name="backup">
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="备份名称">
              <el-input v-model="searchForm.backupName" placeholder="请输入备份名称" />
            </el-form-item>
            <el-form-item label="备份类型">
              <el-select v-model="searchForm.backupType" placeholder="请选择类型" clearable>
                <el-option label="完整备份" :value="1" />
                <el-option label="增量备份" :value="2" />
                <el-option label="差异备份" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="备份方式">
              <el-select v-model="searchForm.backupMode" placeholder="请选择方式" clearable>
                <el-option label="手动" :value="1" />
                <el-option label="自动" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                <el-option label="进行中" :value="1" />
                <el-option label="成功" :value="2" />
                <el-option label="失败" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间">
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
              <el-button type="success" @click="showCreateDialog = true">
                <el-icon><Plus /></el-icon>
                创建备份
              </el-button>
            </el-form-item>
          </el-form>

          <el-table
            :data="tableData"
            border
            stripe
            v-loading="loading"
            header-cell-class-name="text-center"
          >
            <el-table-column prop="backupCode" label="备份编号" width="150" align="center" />
            <el-table-column prop="backupName" label="备份名称" min-width="150" />
            <el-table-column prop="backupType" label="备份类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getBackupTypeType(row.backupType) as any">
                  {{ getBackupTypeLabel(row.backupType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="backupMode" label="备份方式" width="80" align="center">
              <template #default="{ row }">
                {{ getBackupModeLabel(row.backupMode) }}
              </template>
            </el-table-column>
            <el-table-column prop="fileSize" label="文件大小" width="100" align="center">
              <template #default="{ row }">
                {{ formatFileSize(row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status) as any">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdBy" label="创建人" width="100" align="center" />
            <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="completedAt" label="完成时间" width="160" align="center">
              <template #default="{ row }">
                {{ formatTime(row.completedAt || '') }}
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="120" />
            <el-table-column label="操作" width="200" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleDownload(row)">下载</el-button>
                <el-button type="warning" size="small" @click="handleRestore(row)">恢复</el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

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
        </el-tab-pane>

        <el-tab-pane label="恢复记录" name="restore">
          <el-empty description="恢复记录功能开发中" />
        </el-tab-pane>

        <el-tab-pane label="自动备份配置" name="config">
          <el-form label-width="150px" class="config-form">
            <el-form-item label="自动备份开关">
              <el-switch v-model="autoBackupEnabled" />
            </el-form-item>
            <el-form-item label="备份频率">
              <el-select v-model="backupConfig.frequency" placeholder="请选择频率" :disabled="!autoBackupEnabled">
                <el-option label="每天" :value="1" />
                <el-option label="每周" :value="2" />
                <el-option label="每月" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="备份时间" v-if="backupConfig.frequency === 1">
              <el-time-picker
                v-model="backupConfig.time"
                placeholder="选择时间"
                :disabled="!autoBackupEnabled"
              />
            </el-form-item>
            <el-form-item label="备份日期" v-if="backupConfig.frequency === 2">
              <el-select v-model="backupConfig.weekday" placeholder="选择星期" :disabled="!autoBackupEnabled">
                <el-option v-for="i in 7" :key="i" :label="['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i-1]" :value="i" />
              </el-select>
            </el-form-item>
            <el-form-item label="备份日期" v-if="backupConfig.frequency === 3">
              <el-input-number v-model="backupConfig.day" :min="1" :max="28" :disabled="!autoBackupEnabled" />
              <span style="margin-left: 8px">日</span>
            </el-form-item>
            <el-form-item label="保留备份数量">
              <el-input-number v-model="backupConfig.keepCount" :min="1" :max="100" />
              <span style="margin-left: 8px">个</span>
            </el-form-item>
            <el-form-item label="备份类型">
              <el-radio-group v-model="backupConfig.backupType">
                <el-radio :label="1">完整备份</el-radio>
                <el-radio :label="2">增量备份</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog
      v-model="showCreateDialog"
      title="创建备份"
      width="500px"
      @close="closeCreateDialog"
    >
      <el-form :model="backupForm" label-width="100px">
        <el-form-item label="备份名称" required>
          <el-input v-model="backupForm.backupName" placeholder="请输入备份名称" />
        </el-form-item>
        <el-form-item label="备份类型">
          <el-radio-group v-model="backupForm.backupType">
            <el-radio :label="1">完整备份</el-radio>
            <el-radio :label="2">增量备份</el-radio>
            <el-radio :label="3">差异备份</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备份方式">
          <el-radio-group v-model="backupForm.backupMode">
            <el-radio :label="1">手动</el-radio>
            <el-radio :label="2">自动</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="backupForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeCreateDialog">取消</el-button>
        <el-button type="primary" @click="handleCreateBackup" :loading="backupLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showRestoreDialog"
      title="确认恢复"
      width="500px"
    >
      <el-alert
        title="警告：恢复操作将覆盖当前数据"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      />
      <p>您确定要从备份 "<strong>{{ selectedBackup?.backupName }}</strong>" 恢复数据吗？</p>
      <p style="color: #909399; font-size: 12px; margin-top: 10px;">
        备份时间：{{ formatTime(selectedBackup?.createdAt || '') }}
      </p>
      <template #footer>
        <el-button @click="showRestoreDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmRestore" :loading="restoreLoading">确认恢复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.backup-management {
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

.config-form {
  max-width: 600px;
  padding: 20px;
}

:deep(.el-tabs__content) {
  padding-top: 10px;
}
</style>
