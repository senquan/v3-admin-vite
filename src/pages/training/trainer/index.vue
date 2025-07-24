<script lang="ts" setup>
import type { FormInstance, UploadProps } from "element-plus"
import type * as TrainerType from "../../training/trainer/apis/type"
import { getCascaderOptions } from "@/common/utils/helper"
import { request } from "@/http/axios"
import { fetchTagListOpt as fetchTags } from "../../setting/apis"
import * as TrainerApi from "../../training/trainer/apis"

// 响应式数据
const loading = ref(false)
const tableData = ref<TrainerType.TrainerListData[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref("新增讲师")
const isEdit = ref(false)
const currentId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const multipleSelection = ref<TrainerType.TrainerListData[]>([])
const userOptions = ref<TrainerType.UserListData[]>([])
const tagOptions = ref<TrainerType.TagListData[]>([])
const searchLoading = ref(false)
const selectedTags = ref<string[]>([])
const selectedDefaultAvatar = ref<string>("")
// 头像上传相关
const avatarUrl = ref("")
const avatarLoading = ref(false)

// 查询参数
const queryParams = reactive({
  keyword: "",
  type: "",
  grade: undefined,
  dept_id: undefined,
  tags: [] as number[],
  page: 1,
  pageSize: 10
})

// 表单数据
const formData = reactive<TrainerType.TrainerCreateData>({
  type: 1,
  name: "",
  user_id: undefined,
  avatar: "",
  grade: 1,
  email: "",
  phone: "",
  fee: undefined,
  introduction: "",
  tag_ids: []
})

// 表单验证规则
const rules = {
  type: [
    { required: true, message: "请选择讲师类型", trigger: "change" }
  ],
  name: [
    { required: true, message: "请输入讲师姓名", trigger: "blur", validator: validateName }
  ],
  user_id: [
    { required: true, message: "请选择关联用户", trigger: "change", validator: validateUserId }
  ],
  grade: [
    { required: true, message: "请选择讲师等级", trigger: "change" }
  ]
  // , email: [
  //   { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }
  // ],
  // phone: [
  //   { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码", trigger: "blur" }
  // ]
}

// 自定义验证函数
function validateName(rule: any, value: any, callback: any) {
  if (formData.type === 2 && !value) {
    callback(new Error("外部讲师必须输入姓名"))
  } else {
    callback()
  }
}

function validateUserId(rule: any, value: any, callback: any) {
  if (formData.type === 1 && !value) {
    callback(new Error("内部讲师必须选择关联用户"))
  } else {
    callback()
  }
}

// 讲师类型选项
const typeOptions = [
  { label: "内部讲师", value: 1 },
  { label: "外部讲师", value: 2 }
]

// 讲师等级选项
const gradeOptions = [
  { label: "新手讲师", value: 1 },
  { label: "初级讲师", value: 2 },
  { label: "中级讲师", value: 3 },
  { label: "高级讲师", value: 4 },
  { label: "资深讲师", value: 5 },
  { label: "专家讲师", value: 6 },
  { label: "金牌讲师", value: 7 }
]

// 默认头像
const defaultAvatar = [
  {
    url: "/src/common/assets/images/avatar/default_avatar_male.png"
  },
  {
    url: "/src/common/assets/images/avatar/default_avatar_female.png"
  }
]

// 获取讲师列表
function fetchList() {
  loading.value = true
  return TrainerApi.fetchList(queryParams)
    .then((response) => {
      if (response.data && response.data.trainers) {
        tableData.value = response.data.trainers
        total.value = response.data.total
      } else {
        ElMessage.error(response.message || "获取讲师列表失败")
      }
    })
    .catch((error) => {
      ElMessage.error("获取讲师列表失败")
      console.error(error)
    })
    .finally(() => {
      loading.value = false
    })
}

// 获取标签列表
function loadTags() {
  if (tagOptions.value.length > 0) return
  return fetchTags()
    .then((response) => {
      const tagOptData: Array<any> = []
      if (response.data) {
        for (const item of response.data.tags) {
          const parent = item.parentId || 0
          if (tagOptData[parent] === undefined) {
            tagOptData[parent] = []
          }
          tagOptData[parent].push(item)
        }
        tagOptions.value = getCascaderOptions(tagOptData, 0, 0, 3)
      }
    })
    .catch((error) => {
      console.error("获取标签列表失败:", error)
    })
}

// 搜索
function handleSearch() {
  queryParams.page = 1
  fetchList()
}

// 分页变化
function handlePageChange(page: number) {
  queryParams.page = page
  fetchList()
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size
  queryParams.page = 1
  fetchList()
}

function handleGradeChange() {
  fetchList()
}

function handleTypeChange() {
  fetchList()
}

// 打开新增对话框
function handleAdd() {
  dialogTitle.value = "新增讲师"
  isEdit.value = false
  currentId.value = null
  resetForm()
  dialogVisible.value = true
  console.log(selectedTags)
}

// 打开编辑对话框
function handleEdit(row: TrainerType.TrainerListData) {
  dialogTitle.value = "编辑讲师"
  isEdit.value = true
  currentId.value = row.id

  return TrainerApi.fetchDetail(row.id)
    .then((response) => {
      if (response.code === 0) {
        resetForm()
        const data = response.data
        formData.type = data.type
        formData.name = data.name || ""
        formData.user_id = data.user_id || undefined
        formData.avatar = data.avatar || ""
        formData.grade = data.grade
        formData.email = data.email || ""
        formData.phone = data.phone || ""
        formData.fee = data.fee || undefined
        formData.introduction = data.introduction || ""
        formData.tag_ids = data.tags?.map(tag => tag.id) || []
        if (formData.avatar !== "") {
          avatarUrl.value = formData.avatar
        }
        dialogVisible.value = true
      } else {
        ElMessage.error(response.message || "获取讲师详情失败")
      }
    })
    .catch((error) => {
      ElMessage.error("获取讲师详情失败")
      console.error(error)
    })
}

// 删除讲师
function handleDelete(row: TrainerType.TrainerListData) {
  const name = row.name || row.user?.name || "未知讲师"
  return ElMessageBox.confirm(
    `确定要删除讲师"${name}"吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      return TrainerApi.deleteTrainer(row.id)
    })
    .then((response) => {
      if (response.code === 0) {
        ElMessage.success("删除成功")
        fetchList()
      } else {
        ElMessage.error(response.message || "删除失败")
      }
    })
    .catch((error) => {
      if (error !== "cancel") {
        ElMessage.error("删除失败")
        console.error(error)
      }
    })
}

// 批量删除
function handleBatchDelete() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning("请选择要删除的讲师")
    return
  }

  return ElMessageBox.confirm(
    `确定要删除选中的 ${multipleSelection.value.length} 个讲师吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      const ids = multipleSelection.value.map(item => item.id)
      return TrainerApi.batchDeleteTrainer({ ids })
    })
    .then((response) => {
      if (response.code === 0) {
        ElMessage.success("批量删除成功")
        fetchList()
      } else {
        ElMessage.error(response.message || "批量删除失败")
      }
    })
    .catch((error) => {
      if (error !== "cancel") {
        ElMessage.error("批量删除失败")
        console.error(error)
      }
    })
}

// 表格选择变化
function handleSelectionChange(selection: TrainerType.TrainerListData[]) {
  multipleSelection.value = selection
}

// 提交表单
function handleSubmit() {
  if (!formRef.value) return

  if (formData.avatar === "") {
    if (selectedDefaultAvatar.value !== "") {
      formData.avatar = selectedDefaultAvatar.value
    } else {
      ElMessage.error("请选择或上传头像")
      return
    }
  }

  return formRef.value.validate()
    .then(() => {
      if (isEdit.value && currentId.value) {
        return TrainerApi.updateTrainer(currentId.value, formData)
      } else {
        return TrainerApi.createTrainer(formData)
      }
    })
    .then((response) => {
      if (response.code === 0) {
        ElMessage.success(isEdit.value ? "更新成功" : "创建成功")
        dialogVisible.value = false
        fetchList()
      } else {
        ElMessage.error(response.message || (isEdit.value ? "更新失败" : "创建失败"))
      }
    })
    .catch((error) => {
      if (error !== false) { // 表单验证失败时不显示错误消息
        ElMessage.error(isEdit.value ? "更新失败" : "创建失败")
        console.error(error)
      }
    })
}

// 重置表单
function resetForm() {
  formData.type = 1
  formData.name = ""
  formData.user_id = undefined
  formData.avatar = ""
  formData.grade = 1
  formData.email = ""
  formData.phone = ""
  formData.fee = undefined
  formData.introduction = ""
  formData.tag_ids = []
  formRef.value?.clearValidate()
  avatarUrl.value = ""
  selectedDefaultAvatar.value = ""
  handleTagsClear()
}

// 关闭对话框
function handleClose() {
  dialogVisible.value = false
  resetForm()
}

// 获取类型标签
function getTypeLabel(type: number) {
  const option = typeOptions.find((item: any) => item.value === type)
  return option ? option.label : "未知"
}

// 获取等级标签
function getGradeLabel(grade: number) {
  const option = gradeOptions.find((item: any) => item.value === grade)
  return option ? option.label : "未知"
}

// 获取讲师姓名
function getTrainerName(row: TrainerType.TrainerListData) {
  return row.type === 1 ? row.user?.realname || row.user?.name || "佚名讲师" : row.name || "佚名讲师"
}

// 头像上传
function customUploadRequest(options: any) {
  const { file, onSuccess, onError, onProgress } = options
  const data = new FormData()
  data.append("file", file)
  return request({
    url: "upload/file",
    method: "POST",
    data,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: (progressEvent: any) => {
      if (progressEvent.total) {
        const percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100)
        onProgress({ percent })
      }
    }
  }).then((response: any) => {
    if (response.code === 0) {
      formData.avatar = response.data.url
      onSuccess(response)
    } else {
      onError(new Error(response.message || "上传失败"))
    }
    return response
  }).catch((error: any) => {
    onError(error)
    return Promise.reject(error)
  })
}

// 头像上传成功的钩子
const handleAvatarSuccess: UploadProps["onSuccess"] = (response) => {
  if (response.code === 0) {
    avatarUrl.value = response.data.url
    formData.avatar = response.data.url
    setActiveAvatar(0)
    ElMessage.success("头像上传成功")
  } else {
    ElMessage.error(response.message || "头像上传失败")
  }
  avatarLoading.value = false
}

// 头像上传失败的钩子
function handleAvatarError() {
  ElMessage.error("头像上传失败")
  avatarLoading.value = false
}

// 监听讲师类型变化
watch(() => formData.type, (newType) => {
  if (newType === 1) {
    // 内部讲师，清空姓名
    formData.name = ""
  } else {
    // 外部讲师，清空用户ID
    formData.user_id = undefined
  }
  // 重新验证表单
  nextTick(() => {
    formRef.value?.clearValidate()
  })
})

function handelSearchUser(query: string) {
  if (!query) return
  searchLoading.value = true
  TrainerApi.fetchUsers({ keyword: query }).then((response: any) => {
    if (response.code === 0) {
      userOptions.value = response.data.users
      searchLoading.value = false
    } else {
      ElMessage.error(`获取用户列表失败: ${response.message}`)
    }
  })
}

function handleTagsClear() {
  formData.tag_ids = []
  selectedTags.value = []
}

function handleTagsChange(value: number[]) {
  formData.tag_ids = value.map((item: any) => item[item.length - 1])
}

function handleSearchTagsClear() {
  queryParams.tags = []
  fetchList()
}

function handleSearchTagsChange(value: number[]) {
  queryParams.tags = value.map((item: any) => item[item.length - 1])
}

function handleAvatarClick(index: number, url: string) {
  selectedDefaultAvatar.value = url
  setActiveAvatar(index)
}

function setActiveAvatar(index: number) {
  const avatars = document.getElementsByClassName("avatar")
  for (let i = 0; i < avatars.length; i++) {
    const avatar = avatars[i] as HTMLElement
    if (avatar.dataset.index === String(index)) {
      avatar.classList.add("active")
    } else {
      avatar.classList.remove("active")
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchList()
  loadTags()
})
</script>

<template>
  <div class="trainer-page">
    <div class="filter-container">
      <el-select v-model="queryParams.grade" placeholder="选择讲师级别" clearable class="filter-item" @change="handleGradeChange" style="width: 150px">
        <el-option
          v-for="item in gradeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-select v-model="queryParams.type" placeholder="选择讲师分类" clearable class="filter-item" @change="handleTypeChange" style="width: 150px">
        <el-option
          v-for="item in typeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <!-- <el-select v-model="queryParams.dept_id" placeholder="选择部门" clearable class="filter-item" style="width: 150px">
        <el-option
          v-for="item in typeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select> -->
      <el-cascader
        v-model="selectedTags"
        multiple
        placeholder="请选择标签"
        filterable
        clearable
        :options="tagOptions"
        :props="{ expandTrigger: 'hover', multiple: true, checkStrictly: true }"
        :debounce="500"
        :collapse-tags="true"
        :collapse-tags-tooltip="true"
        :max-collapse-tags="1"
        :show-all-levels="false"
        @change="(value: any) => handleSearchTagsChange(value as number[])"
        @clear="handleSearchTagsClear()"
        class="filter-item fixed-height-cascader"
        style="width: 250px;"
      />
      <el-input v-model="queryParams.keyword" placeholder="输入姓名/手机号" class="filter-item" style="width: 200px;" @keyup.enter="handleSearch" />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增讲师
      </el-button>
      <el-button type="danger" :disabled="multipleSelection.length === 0" @click="handleBatchDelete">
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
    </div>
    <!-- 表格 -->
    <div class="grid-grouping">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'primary' : 'success'">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="讲师姓名" min-width="120">
          <template #default="{ row }">
            {{ getTrainerName(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="讲师级别" width="100" align="center">
          <template #default="{ row }">
            {{ getGradeLabel(row.grade) }}
          </template>
        </el-table-column>
        <el-table-column label="讲师标签" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.tags"
              :key="tag.id"
              size="small"
              round
              style="margin-right: 4px;"
            >
              {{ tag.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="评价" width="100" align="center" />
        <el-table-column prop="courseCount" label="课程数" width="100" align="center" />
        <el-table-column prop="department" label="部门" width="200" />
        <el-table-column prop="showInHome" label="首页展示" width="80" align="center">
          <template #default="{ row }">
            {{ row.showInHome ? "是" : "否" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-if="total > queryParams.pageSize"
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="讲师类型：" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio :label="1">内部讲师</el-radio>
            <el-radio :label="2">外部讲师</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="formData.type === 1" label="讲师姓名：" prop="user_id">
          <el-select
            v-model="formData.user_id"
            filterable
            remote
            placeholder="请输入讲师姓名"
            :remote-method="handelSearchUser"
            :loading="searchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="user.realname ? `${user.realname}` : `${user.name}`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formData.type === 2" label="讲师姓名：" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入讲师姓名"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标签：" prop="tag_ids">
          <el-cascader
            v-model="selectedTags"
            multiple
            placeholder="请选择标签"
            filterable
            clearable
            :options="tagOptions"
            :props="{ expandTrigger: 'hover', multiple: true, checkStrictly: true }"
            :debounce="500"
            @change="(value: any) => handleTagsChange(value as number[])"
            @clear="handleTagsClear()"
            class="filter-item"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item v-if="formData.type === 2" label="邮箱：" prop="email">
          <el-input
            v-model="formData.email"
            placeholder="请输入邮箱地址"
            maxlength="100"
          />
        </el-form-item>
        <el-form-item v-if="formData.type === 2" label="电话：" prop="phone">
          <el-input
            v-model="formData.phone"
            placeholder="请输入电话号码"
            maxlength="20"
          />
        </el-form-item>
        <el-form-item label="讲师头像：" prop="avatar">
          <el-avatar
            v-for="(item, index) in defaultAvatar"
            :key="index"
            :data-index="index"
            :src="item.url"
            :size="100"
            shape="circle"
            class="avatar"
            @click="handleAvatarClick(index, item.url)"
          />
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :http-request="customUploadRequest"
            :on-success="handleAvatarSuccess"
            :on-error="handleAvatarError"
            accept="image/*"
          >
            <el-avatar
              v-if="avatarUrl"
              :src="avatarUrl"
              :size="100"
              fit="cover"
              class="uploaded-avatar"
              v-loading="avatarLoading"
            />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="讲师级别：" prop="grade">
          <el-select v-model="formData.grade" placeholder="请选择级别" style="width: 160px">
            <el-option
              v-for="item in gradeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="讲师课酬：" prop="fee">
          <el-input
            v-model="formData.fee"
            placeholder="请输入课酬"
            style="width: 160px"
          /><span style="margin-left: 10px;">元</span>
        </el-form-item>
        <el-form-item label="讲师介绍：" prop="introduction">
          <el-input
            v-model="formData.introduction"
            type="textarea"
            :rows="4"
            placeholder="请输入讲师介绍"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            {{ isEdit ? "更新" : "创建" }}
          </el-button>
        </div>
      </template>
    </el-dialog>
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

.pagination-wrapper {
  padding: 10px;
  background: #fff;
}

.dialog-footer {
  text-align: right;
}

.avatar {
  margin-right: 10px;
}

.avatar-uploader.active,
.avatar.active,
.avatar:hover {
  border: 3px solid;
  border-color: var(--el-color-primary);
}

.avatar-uploader {
  .avatar,
  .uploaded-avatar {
    width: 100px;
    height: 100px;
    display: block;
    border-radius: 6px;
  }
}

.avatar-uploader {
  border: 1px dashed #9399a5;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  line-height: 1;
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}
</style>
