<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, VideoPlay, Document } from '@element-plus/icons-vue'
import type { TaskItem, TaskProgress, ProgressStatus } from '@/pages/training/task/apis/type'
import { TaskItemType } from '@/pages/training/task/apis/type'
import type { LearningTask, CoursewareInfo, Material } from './apis/learning'
import {
  getTaskLearningContent,
  getCoursewareInfo,
  updateLearningProgress,
  completeTaskItem
} from './apis/learning'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const completing = ref(false)
const learningTask = ref<LearningTask | null>(null)
const currentTaskItem = ref<TaskItem | null>(null)
const currentCourseware = ref<CoursewareInfo | null>(null)
const currentMaterial = ref<Material | null>(null)
const currentImageList = ref<string[]>([])
const currentCoursewareName = ref([1])
const progressMap = ref<Map<number, TaskProgress>>(new Map())
// 添加课件信息缓存
const coursewareCache = ref<Map<number, CoursewareInfo>>(new Map())

// 视频相关
const videoPlayer = ref<HTMLVideoElement>()
const videoProgress = ref(0)
const watchedTime = ref(0)
const videoDuration = ref(0)
const lastProgressUpdate = ref(0)

// 计算属性
const taskId = computed(() => Number(route.params.taskId))

const totalCount = computed(() => learningTask.value?.taskItems?.length || 0)

const completedCount = computed(() => {
  return learningTask.value?.taskItems?.filter(item =>
    isTaskItemCompleted(item._id!)
  ).length || 0
})

const overallProgress = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const progressColor = computed(() => {
  const progress = overallProgress.value
  if (progress >= 100) return '#52c41a'
  if (progress >= 60) return '#1890ff'
  if (progress >= 30) return '#faad14'
  return '#f5222d'
})

const coursewareUrl = computed(() => {
  if (!currentMaterial.value) return ''
  return currentMaterial.value.file_path
})

const isVideoContent = computed(() => {
  if (!currentMaterial.value) return false
  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
  return videoTypes.includes(getFileType(currentMaterial.value.file_path))
})

const isPdfContent = computed(() => {
  if (!currentMaterial.value) return false
  return getFileType(currentMaterial.value.file_path) === 'pdf'
})

const pdfViewerUrl = computed(() => {
  if (!isPdfContent.value) return ''
  return `/pdfjs/web/viewer.html?file=${encodeURIComponent(coursewareUrl.value)}`
})

const isImageContent = computed(() => {
  if (!currentMaterial.value) return false
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  return imageTypes.includes(getFileType(currentMaterial.value.file_path))
})

function getFileType(filePath: string) {
  return (filePath.split('.').pop() || '').toLowerCase()
}

// 方法
function isTaskItemCompleted(taskItemId: number): boolean {
  const progress = progressMap.value.get(taskItemId)
  return progress?.status === 2 // ProgressStatus.COMPLETED
}

function isTaskItemInProgress(taskItemId: number): boolean {
  const progress = progressMap.value.get(taskItemId)
  return progress?.status === 1 // ProgressStatus.IN_PROGRESS
}

function getTaskItemProgress(taskItemId: number): TaskProgress | undefined {
  return progressMap.value.get(taskItemId)
}

function getTaskItemTypeName(type: TaskItemType): string {
  const typeMap = {
    [TaskItemType.COURSEWARE]: '课件学习',
    [TaskItemType.EXAM]: '考试',
    [TaskItemType.SURVEY]: '问卷',
    [TaskItemType.CHECKIN]: '签到',
    [TaskItemType.HOMEWORK]: '作业',
    [TaskItemType.LIVE]: '直播',
    [TaskItemType.EXTERNAL_LINK]: '外部链接'
  }
  return typeMap[type] || '未知'
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return '#52c41a'
  if (progress >= 60) return '#1890ff'
  if (progress >= 30) return '#faad14'
  return '#f5222d'
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 选择任务项
async function selectTaskItem(item: TaskItem) {
  currentTaskItem.value = item
  currentCourseware.value = null
  currentMaterial.value = null

  if (item.item_type === TaskItemType.COURSEWARE && item.courseware_id) {
    // 先检查缓存中是否已有该课件信息
    const cachedCourseware = coursewareCache.value.get(item.courseware_id)
    if (cachedCourseware) {
      // 使用缓存的课件信息
      currentCourseware.value = cachedCourseware
      currentMaterial.value = cachedCourseware.materials?.[0] || null
      return
    }

    // 缓存中没有，则调用API获取
    try {
      const response = await getCoursewareInfo(item.courseware_id)
      if (response.code === 0) {
        currentCourseware.value = response.data
        currentMaterial.value = currentCourseware.value?.materials?.[0] || null
        // 将获取到的课件信息存入缓存
        coursewareCache.value.set(item.courseware_id, response.data)
      }
    } catch (error) {
      console.error('获取课件信息失败:', error)
      ElMessage.error('获取课件信息失败')
    }

    if (currentCourseware.value && currentCourseware.value.materials && currentCourseware.value.materials.length > 0) {
      currentImageList.value = currentCourseware.value.materials.map((item) => item.file_path)
    }
  }
}

// 视频事件处理
function onVideoTimeUpdate() {
  if (!videoPlayer.value || !currentTaskItem.value) return

  const currentTime = videoPlayer.value.currentTime
  const duration = videoPlayer.value.duration

  if (duration > 0) {
    videoProgress.value = (currentTime / duration) * 100
    watchedTime.value = currentTime

    // 每10秒更新一次进度
    if (currentTime - lastProgressUpdate.value >= 10) {
      updateProgress()
      lastProgressUpdate.value = currentTime
    }
  }
}

function onVideoEnded() {
  videoProgress.value = 100
  updateProgress()

  // 视频播放完成，询问是否标记为完成
  ElMessageBox.confirm(
    '视频已播放完成，是否标记此任务项为已完成？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    markAsCompleted()
  }).catch(() => {
    // 用户取消
  })
}

function onVideoLoaded() {
  if (videoPlayer.value) {
    videoDuration.value = videoPlayer.value.duration
  }
}

// 更新学习进度
async function updateProgress() {
  if (!currentTaskItem.value) return

  try {
    await updateLearningProgress(taskId.value, {
      task_item_id: currentTaskItem.value._id!,
      progress: Math.round(videoProgress.value),
      study_duration: Math.round(watchedTime.value),
      extra_data: {
        video_duration: videoDuration.value,
        last_position: watchedTime.value
      }
    })
  } catch (error) {
    console.error('更新进度失败:', error)
  }
}

// 标记完成
async function markAsCompleted() {
  if (!currentTaskItem.value) return

  completing.value = true
  try {
    await completeTaskItem(taskId.value, {
      task_item_id: currentTaskItem.value._id!,
      study_duration: Math.round(watchedTime.value),
      extra_data: {
        completion_method: 'manual',
        video_progress: videoProgress.value
      }
    })

    ElMessage.success('任务项已完成')

    // 刷新数据
    await fetchLearningTask()

  } catch (error) {
    console.error('标记完成失败:', error)
    ElMessage.error('标记完成失败')
  } finally {
    completing.value = false
  }
}

// PDF相关方法
function downloadPdf() {
  if (coursewareUrl.value) {
    window.open(coursewareUrl.value, '_blank')
  }
}

function openInNewTab() {
  if (coursewareUrl.value) {
    window.open(pdfViewerUrl.value, '_blank')
  }
}

function downloadFile() {
  if (coursewareUrl.value) {
    window.open(coursewareUrl.value, '_blank')
  }
}

// 返回
function goBack() {
  router.push('/skill')
}

// 获取学习任务
async function fetchLearningTask() {
  loading.value = true
  try {
    const response = await getTaskLearningContent(taskId.value)
    if (response.code === 0) {
      learningTask.value = response.data
      // 构建进度映射
      progressMap.value.clear()
      response.data.progress?.forEach(progress => {
        progressMap.value.set(progress.task_item_id, progress)
      })

      // 如果有任务项但没有选中，选中第一个
      if (response.data.taskItems?.length > 0 && !currentTaskItem.value) {
        await selectTaskItem(response.data.taskItems[0])
      }
    }
  } catch (error) {
    console.error('获取学习任务失败:', error)
    ElMessage.error('获取学习任务失败')
  } finally {
    loading.value = false
  }
}

// 处理材料点击事件
function handleMaterialClick(material: Material, event: Event) {
  currentMaterial.value = material
  // 阻止冒泡
  event.stopPropagation()
}

// 生命周期
onMounted(() => {
  fetchLearningTask()
})

// 监听路由变化
watch(() => route.params.id, () => {
  if (route.params.id) {
    fetchLearningTask()
  }
})
</script>

<template>
  <div class="learning-container">
    <!-- 头部信息 -->
    <div class="learning-header">
      <div class="task-info">
        <h2>{{ learningTask?.title }}</h2>
        <p class="task-description">{{ learningTask?.description }}</p>
      </div>
      <div class="progress-info">
        <el-progress
          :percentage="overallProgress"
          :color="progressColor"
          :stroke-width="8"
        />
        <span class="progress-text">总进度: {{ overallProgress }}%</span>
      </div>
    </div>

    <div class="learning-content">
      <!-- 左侧任务项列表 -->
      <div class="task-items-panel">
        <div class="panel-header">
          <h3>学习任务</h3>
          <span class="item-count">{{ completedCount }}/{{ totalCount }}</span>
        </div>

        <div class="task-items-list">
          <el-collapse
            v-model="currentCoursewareName"
          >
            <el-collapse-item
              v-for="(item, index) in learningTask?.taskItems"
              :title="item.title"
              :key="index"
              class="task-item"
              :class="{
                'active': currentTaskItem?._id === item._id,
                'completed': isTaskItemCompleted(item._id!),
                'in-progress': isTaskItemInProgress(item._id!)
              }"
              :name="index + 1"
              @click="selectTaskItem(item)"
            >
              <template #title>
                <div class="item-title">
                  <div class="item-icon">
                    <el-icon v-if="isTaskItemCompleted(item._id!)" color="#52c41a">
                      <Check />
                    </el-icon>
                    <el-icon v-else-if="isTaskItemInProgress(item._id!)" color="#1890ff">
                      <VideoPlay />
                    </el-icon>
                    <el-icon v-else color="#d9d9d9">
                      <Document />
                    </el-icon>
                  </div>

                  <div class="item-content">
                    <div class="item-title">{{ item.title }}</div>
                    <!-- <div class="item-meta">
                      <span class="item-type">{{ getTaskItemTypeName(item.item_type) }}</span>
                      <span v-if="item.required_duration > 0" class="item-duration">
                        {{ formatDuration(item.required_duration) }}
                      </span>
                    </div> -->

                    <!-- 进度条 -->
                    <div v-if="getTaskItemProgress(item._id!)" class="item-progress">
                      <el-progress
                        :percentage="getTaskItemProgress(item._id!)?.progress || 0"
                        :show-text="false"
                        :stroke-width="4"
                        :color="getProgressColor(getTaskItemProgress(item._id!)?.progress || 0)"
                      />
                    </div>
                  </div>

                  <div class="item-status">
                    <el-tag
                      v-if="item.is_required"
                      size="small"
                      type="danger"
                    >
                      必修
                    </el-tag>
                  </div>
                </div>
              </template>
              <div>
                <el-row
                  :gutter="10"
                  v-for="(material, index) in coursewareCache.get(item.courseware_id || 0)?.materials"
                  :key="index"
                  class="material-item"
                >
                  <el-col :span="24" class="material-item-col" @click="handleMaterialClick(material, $event)">
                    <div v-if="isTaskItemCompleted(item._id!)" class="item-icon">
                      <SvgIcon name="preserve-color/complete" />
                    </div>
                    <div v-else class="item-icon">
                      <SvgIcon name="preserve-color/incomplete" />
                    </div>
                    <span>{{ material.title }}</span>
                  </el-col>
                </el-row>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>

      <!-- 右侧内容展示区 -->
      <div class="content-panel">
        <div v-if="!currentTaskItem" class="empty-content">
          <el-empty description="请选择左侧任务项开始学习" />
        </div>

        <div v-else class="content-area">
          <!-- 任务项标题 -->
          <div class="content-header">
            <h3>{{ currentTaskItem.title }}</h3>
            <div class="content-actions">
              <el-button
                v-if="!isTaskItemCompleted(currentTaskItem._id!)"
                type="primary"
                @click="markAsCompleted"
                :loading="completing"
              >
                标记完成
              </el-button>
              <el-button @click="goBack">返回列表</el-button>
            </div>
          </div>

          <!-- 课件内容 -->
          <div class="content-body">
            <!-- 视频播放器 -->
            <div v-if="isVideoContent" class="video-player">
              <video
                ref="videoPlayer"
                :src="coursewareUrl"
                controls
                width="100%"
                height="500"
                @timeupdate="onVideoTimeUpdate"
                @ended="onVideoEnded"
                @loadedmetadata="onVideoLoaded"
              >
                您的浏览器不支持视频播放
              </video>

              <!-- 视频信息 -->
              <div class="video-info">
                <div class="video-progress">
                  <span>学习进度: {{ Math.round(videoProgress) }}%</span>
                  <span>观看时长: {{ formatTime(watchedTime) }}</span>
                </div>
              </div>
            </div>

            <!-- PDF阅读器 -->
            <div v-else-if="isPdfContent" class="pdf-viewer">
              <iframe
                :src="pdfViewerUrl"
                width="100%"
                height="600"
                frameborder="0"
              >
                您的浏览器不支持PDF预览
              </iframe>

              <!-- PDF信息 -->
              <div class="pdf-info">
                <div class="pdf-actions">
                  <el-button @click="downloadPdf">下载PDF</el-button>
                  <el-button @click="openInNewTab">新窗口打开</el-button>
                </div>
              </div>
            </div>

            <!-- 图册 -->
            <div v-else-if="isImageContent" class="image-viewer">
              <el-image
                :src="currentMaterial?.file_path"
                fit="contain"
                :preview-src-list="currentImageList"
              />
            </div>

            <!-- 其他类型内容 -->
            <div v-else class="other-content">
              <el-result
                icon="warning"
                title="暂不支持此类型内容"
                :sub-title="`内容类型: ${currentCourseware?.file_type}`"
              >
                <template #extra>
                  <el-button @click="downloadFile">下载文件</el-button>
                </template>
              </el-result>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.learning-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.learning-header {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-info h2 {
  margin: 0 0 8px 0;
  color: #262626;
  font-size: 24px;
}

.task-description {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
}

.progress-text {
  font-size: 14px;
  color: #595959;
  white-space: nowrap;
}

.learning-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.task-items-panel {
  width: 320px;
  background: white;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #262626;
}

.item-count {
  font-size: 12px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.task-items-list {
  flex: 1;
  overflow-y: auto;
}

.task-item {
  padding: 0 0 0 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  background-color: #fafafa;
}

.task-item.active {
  border-right: 3px solid #1890ff;
}

.task-item.completed {
  background-color: #f6ffed;
}

.item-icon {
  margin-top: 5px;
  font-size: 24px;
  margin-left: 12px;
  margin-right: 12px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #262626;
  margin-bottom: 4px;
  font-weight: 500;
  width: 100%;
}

.item-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.item-type {
  font-size: 12px;
  color: #1890ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.item-duration {
  font-size: 12px;
  color: #8c8c8c;
}

.item-progress {
  margin-top: 8px;
}

.item-status {
  margin-top: -2px;
  margin-right: 10px;
}

.content-panel {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
}

.empty-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-header h3 {
  margin: 0;
  font-size: 18px;
  color: #262626;
}

.content-actions {
  display: flex;
  gap: 8px;
}

.content-body {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.video-player {
  text-align: center;
}

.video-info {
  margin-top: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.video-progress {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #595959;
}

.pdf-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-info {
  margin-top: 16px;
  text-align: center;
}

.pdf-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.other-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.material-item {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.material-item-col {
  display: flex;
  align-items: center;
}

.image-viewer {
  text-align: center;
}
</style>
