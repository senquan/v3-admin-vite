<script setup lang="ts">
import type { CreateTaskRequest, Task, TaskItem, UpdateTaskRequest } from "./apis/type"
import dayjs from "dayjs"
import { ElMessage } from "element-plus"
import { fetchList as getCoursewareList } from "../../knowledge/courseware/apis"
import { getExamList } from "../../skill/apis/exam"
import {
  createTask,
  updateTask
} from "./apis"
import { TaskItemType, TaskItemTypeOptions, TaskPriorityOptions, TaskTypeOptions } from "./apis/type"

// Props
interface Props {
  visible: boolean
  task?: Task | null
  mode: "create" | "edit"
}

const props = withDefaults(defineProps<Props>(), {
  task: null
})

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean]
  "success": []
}>()

// 响应式数据
const loading = ref(false)
const formRef = ref()
const coursewareList = ref<any[]>([])
const examList = ref<any[]>([])

// 表单数据
const formData = reactive<CreateTaskRequest>({
  title: "",
  description: "",
  type: 1,
  priority: 2,
  start_time: undefined,
  end_time: undefined,
  publish_time: undefined,
  expected_participants: 0,
  allow_makeup: false,
  auto_assign: false,
  auto_assign_rules: "",
  tags: "",
  remark: "",
  taskItems: []
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: "请输入任务标题", trigger: "blur" },
    { min: 2, max: 100, message: "标题长度应在2-100个字符之间", trigger: "blur" }
  ],
  type: [
    { required: true, message: "请选择任务类型", trigger: "change" }
  ],
  priority: [
    { required: true, message: "请选择优先级", trigger: "change" }
  ],
  start_time: [
    { required: true, message: "请选择开始时间", trigger: "change" }
  ],
  end_time: [
    { required: true, message: "请选择结束时间", trigger: "change" }
  ]
}

// 监听visible变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      initForm()
      loadRelatedData()
    }
  }
)

// 初始化表单
function initForm() {
  if (props.mode === "edit" && props.task) {
    // 编辑模式，填充现有数据
    Object.assign(formData, {
      ...props.task,
      start_time: props.task.start_time ? dayjs(props.task.start_time) : undefined,
      end_time: props.task.end_time ? dayjs(props.task.end_time) : undefined,
      publish_time: props.task.publish_time ? dayjs(props.task.publish_time) : undefined,
      items: props.task.taskItems || []
    })
  } else {
    // 创建模式，重置表单
    Object.assign(formData, {
      title: "",
      description: "",
      type: 1,
      priority: 2,
      start_time: undefined,
      end_time: undefined,
      publish_time: undefined,
      expected_participants: 0,
      allow_makeup: false,
      auto_assign: false,
      auto_assign_rules: "",
      tags: "",
      remarks: "",
      items: []
    })
  }
}

// 加载相关数据
async function loadRelatedData() {
  try {
    // 加载课件列表
    const coursewareResponse = await getCoursewareList({ pageSize: 1000 })
    if (coursewareResponse.code === 0) {
      coursewareList.value = coursewareResponse.data.coursewares
    }

    // 加载考试列表
    const examResponse = await getExamList({ pageSize: 1000 })
    if (examResponse.code === 0) {
      examList.value = examResponse.data.exams
    }
  } catch (error) {
    console.error("加载相关数据失败:", error)
  }
}

// 添加任务项
function addTaskItem() {
  if (!formData.taskItems) return
  const newItem: TaskItem = {
    title: "",
    weight: 100,
    status: 0,
    required_duration: 0,
    pass_score: 0,
    max_attempts: 0,
    is_deleted: 0,
    description: "",
    item_type: TaskItemType.COURSEWARE,
    sort_order: formData.taskItems!.length + 1,
    is_required: true
  }
  formData.taskItems.push(newItem)
}

// 删除任务项
function removeTaskItem(index: number) {
  if (!formData.taskItems) return
  formData.taskItems.splice(index, 1)
  // 重新排序
  formData.taskItems.forEach((item, idx) => {
    item.sort_order = idx + 1
  })
}

// 任务项类型变化处理
function handleItemTypeChange(index: number, _type: number) {
  if (!formData.taskItems) return
  const item = formData.taskItems[index]
  // 清除之前的关联数据
  delete item.courseware_id
  delete item.exam_id
  delete item.external_url
}

// 过滤选项
// function filterOption(input: string, option: any) {
//   return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
// }

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value.validate()

    loading.value = true

    // 准备提交数据
    const submitData = {
      ...formData,
      start_time: formData.start_time ? dayjs(formData.start_time).format("YYYY-MM-DD HH:mm:ss") : undefined,
      end_time: formData.end_time ? dayjs(formData.end_time).format("YYYY-MM-DD HH:mm:ss") : undefined,
      publish_time: formData.publish_time ? dayjs(formData.publish_time).format("YYYY-MM-DD HH:mm:ss") : undefined
    }

    let response
    if (props.mode === "create") {
      response = await createTask(submitData)
    } else {
      response = await updateTask(props.task!._id, submitData as UpdateTaskRequest)
    }

    if (response.code === 0) {
      ElMessage.success(props.mode === "create" ? "创建成功" : "更新成功")
      emit("success")
    }
  } catch (error) {
    console.error("提交失败:", error)
    ElMessage.error("提交失败")
  } finally {
    loading.value = false
  }
}

// 取消
function handleCancel() {
  emit("update:visible", false)
}

// 组件挂载时加载数据
onMounted(() => {
  if (props.visible) {
    loadRelatedData()
  }
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="mode === 'create' ? '创建任务' : '编辑任务'"
    width="1200px"
    :before-close="handleCancel"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
    >
      <el-row :gutter="16">
        <!-- 基本信息 -->
        <el-col :span="24">
          <el-divider content-position="left">基本信息</el-divider>
        </el-col>

        <el-col :span="12">
          <el-form-item label="任务标题" prop="title">
            <el-input
              v-model="formData.title"
              placeholder="请输入任务标题"
              :maxlength="100"
              show-word-limit
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="任务类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择任务类型"
              style="width: 100%"
            >
              <el-option
                v-for="option in TaskTypeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="优先级" prop="priority">
            <el-select
              v-model="formData.priority"
              placeholder="请选择优先级"
              style="width: 100%"
            >
              <el-option
                v-for="option in TaskPriorityOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="任务描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              placeholder="请输入任务描述"
              :rows="3"
              :maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-col>

        <!-- 时间设置 -->
        <el-col :span="24">
          <el-divider content-position="left">时间设置</el-divider>
        </el-col>

        <el-col :span="12">
          <el-form-item label="开始时间" prop="start_time">
            <el-date-picker
              v-model="formData.start_time"
              type="datetime"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择开始时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="结束时间" prop="end_time">
            <el-date-picker
              v-model="formData.end_time"
              type="datetime"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择结束时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="发布时间">
            <el-date-picker
              v-model="formData.publish_time"
              type="datetime"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择发布时间（可选）"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <!-- 任务配置 -->
        <el-col :span="24">
          <el-divider content-position="left">任务配置</el-divider>
        </el-col>

        <el-col :span="8">
          <el-form-item label="预计参与人数">
            <el-input-number
              v-model="formData.expected_participants"
              placeholder="预计参与人数"
              :min="0"
              style="width: 50%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item>
            <template #label>
              <span>
                允许补交
                <el-tooltip content="是否允许学员在截止时间后补交任务">
                  <el-icon style="margin-left: 4px"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
            <el-switch v-model="formData.allow_makeup" />
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item>
            <template #label>
              <span>
                自动分配
                <el-tooltip content="是否根据规则自动分配给相关人员">
                  <el-icon style="margin-left: 4px"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
            <el-switch v-model="formData.auto_assign" />
          </el-form-item>
        </el-col>

        <el-col :span="24" v-if="formData.auto_assign">
          <el-form-item label="自动分配规则">
            <el-input
              v-model="formData.auto_assign_rules"
              type="textarea"
              placeholder="请输入自动分配规则（JSON格式）"
              :rows="2"
            />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="标签">
            <el-input
              v-model="formData.tags"
              placeholder="请输入标签，多个标签用逗号分隔"
            />
          </el-form-item>
        </el-col>

        <!-- <el-col :span="12">
          <el-form-item label="附件">
            <el-button type="primary" plain style="width: 100%">
              <el-icon><Plus /></el-icon>
              上传附件
            </el-button>
          </el-form-item>
        </el-col> -->

        <el-col :span="12">
          <el-form-item label="备注">
            <el-input
              v-model="formData.remark"
              type="textarea"
              placeholder="请输入备注信息"
              :rows="2"
            />
          </el-form-item>
        </el-col>

        <!-- 任务项配置 -->
        <el-col :span="24">
          <el-divider content-position="left">
            <span>任务项配置</span>
            <el-button
              type="primary"
              link
              size="small"
              @click="addTaskItem"
              style="margin-left: 8px"
            >
              <el-icon><Plus /></el-icon>
              添加任务项
            </el-button>
          </el-divider>
        </el-col>

        <el-col :span="24">
          <div class="task-items-container">
            <div
              v-for="(item, index) in formData.taskItems"
              :key="index"
              class="task-item-card"
            >
              <el-card shadow="never" :header="`任务项 ${index + 1}`">
                <template #header>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>任务项 {{ index + 1 }}</span>
                    <el-button
                      type="danger"
                      link
                      size="small"
                      @click="removeTaskItem(index)"
                    >
                      删除
                    </el-button>
                  </div>
                </template>

                <el-row :gutter="12">
                  <el-col :span="8">
                    <el-form-item label="项目标题">
                      <el-input
                        v-model="item.title"
                        placeholder="请输入项目标题"
                      />
                    </el-form-item>
                  </el-col>

                  <el-col :span="8">
                    <el-form-item label="项目类型">
                      <el-select
                        v-model="item.item_type"
                        placeholder="请选择项目类型"
                        @change="handleItemTypeChange(index, $event)"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="option in TaskItemTypeOptions"
                          :key="option.value"
                          :value="option.value"
                          :label="option.label"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>

                  <el-col :span="8">
                    <el-form-item label="排序">
                      <el-input-number
                        v-model="item.sort_order"
                        :min="1"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>

                  <!-- 根据类型显示不同的配置项 -->
                  <template v-if="item.item_type === TaskItemType.COURSEWARE">
                    <el-col :span="12">
                      <el-form-item label="关联课件">
                        <el-select
                          v-model="item.courseware_id"
                          placeholder="请选择课件"
                          filterable
                          style="width: 100%"
                        >
                          <el-option
                            v-for="courseware in coursewareList"
                            :key="courseware.id"
                            :value="courseware.id"
                            :label="courseware.title"
                          />
                        </el-select>
                      </el-form-item>
                    </el-col>
                  </template>

                  <template v-else-if="item.item_type === TaskItemType.EXAM">
                    <el-col :span="12">
                      <el-form-item label="关联考试">
                        <el-select
                          v-model="item.exam_id"
                          placeholder="请选择考试"
                          filterable
                          style="width: 100%"
                        >
                          <el-option
                            v-for="exam in examList"
                            :key="exam._id"
                            :value="exam._id"
                            :label="exam.title"
                          />
                        </el-select>
                      </el-form-item>
                    </el-col>
                  </template>

                  <template v-else-if="item.item_type === TaskItemType.EXTERNAL_LINK">
                    <el-col :span="12">
                      <el-form-item label="外部链接">
                        <el-input
                          v-model="item.external_url"
                          placeholder="请输入外部链接URL"
                        />
                      </el-form-item>
                    </el-col>
                  </template>

                  <el-col :span="6">
                    <el-form-item>
                      <template #label>
                        <span>
                          必须完成
                          <el-tooltip content="是否必须完成此任务项">
                            <el-icon style="margin-left: 4px"><QuestionFilled /></el-icon>
                          </el-tooltip>
                        </span>
                      </template>
                      <el-switch v-model="item.is_required" />
                    </el-form-item>
                  </el-col>

                  <el-col :span="6">
                    <el-form-item label="权重(%)">
                      <el-input-number
                        v-model="item.weight"
                        :min="0"
                        :max="100"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>

                  <el-col :span="24">
                    <el-form-item label="项目描述">
                      <el-input
                        v-model="item.description"
                        type="textarea"
                        placeholder="请输入项目描述"
                        :rows="2"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-card>
            </div>

            <el-empty
              v-if="formData.taskItems && formData.taskItems.length === 0"
              description="暂无任务项，请添加任务项"
            />
          </div>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{ mode === "edit" ? "更新" : "创建" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.task-items-container {
  max-height: 400px;
  overflow-y: auto;
}

.task-item-card {
  margin-bottom: 16px;
}

.task-item-card:last-child {
  margin-bottom: 0;
}

:deep(.ant-card-head) {
  min-height: 40px;
  padding: 0 12px;
}

:deep(.ant-card-head-title) {
  font-size: 14px;
  font-weight: 500;
}

:deep(.ant-card-body) {
  padding: 12px;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-form-item-label) {
  padding-bottom: 4px;
}

:deep(.ant-divider-horizontal.ant-divider-with-text-left) {
  margin: 16px 0;
}
</style>
