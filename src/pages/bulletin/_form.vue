<script setup lang="ts">
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor"
import type { FormInstance, FormRules, UploadUserFile } from "element-plus"
import type { BulletinCreateRequestBody, BulletinListData, BulletinUpdateRequestBody } from "./apis/type"
import { Editor, Toolbar } from "@wangeditor/editor-for-vue"
import {
  BULLETIN_PRIORITY_OPTIONS,
  BULLETIN_STATUS_OPTIONS,
  BULLETIN_TYPE_OPTIONS,
  createBulletin,
  updateBulletin
} from "./apis"
import "@wangeditor/editor/dist/css/style.css"

interface Props {
  visible?: boolean
  editData?: BulletinListData | null
}

interface Emits {
  (e: "update:visible", value: boolean): void
  (e: "success"): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  editData: null
})

const emit = defineEmits<Emits>()

// 表单相关
const formRef = ref<FormInstance>()
// const uploadRef = ref<UploadUserFile>()
const submitLoading = ref(false)

// 富文本编辑器相关
const editorRef = shallowRef<IDomEditor | null>(null)
const mode = "default"

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: [
    "group-video",
    "fullScreen"
  ]
}

const editorConfig: Partial<IEditorConfig> = {
  placeholder: "请输入公告内容...",
  MENU_CONF: {
    uploadImage: {
      server: "/api/v1/upload/image",
      fieldName: "file",
      meta: {
        token: localStorage.getItem("token") || ""
      },
      metaWithUrl: false,
      withCredentials: true,
      timeout: 5 * 1000,
      onBeforeUpload(file: File) {
        console.log("onBeforeUpload", file)
        return file
      },
      onProgress(progress: number) {
        console.log("onProgress", progress)
      },
      onSuccess(file: File, res: any) {
        console.log("onSuccess", file, res)
      },
      onFailed(file: File, res: any) {
        console.log("onFailed", file, res)
        ElMessage.error("图片上传失败")
      },
      onError(file: File, err: any, res: any) {
        console.log("onError", file, err, res)
        ElMessage.error("图片上传出错")
      }
    }
  }
}

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor
}

// 表单数据
const defaultFormData = {
  title: "",
  content: "",
  type: 1,
  status: 0,
  priority: 1,
  is_pinned: false,
  published_at: "",
  expired_at: "",
  attachment_url: "",
  attachment_name: "",
  remark: ""
}

const formData = reactive({ ...defaultFormData })

// 表单验证规则
const formRules: FormRules = {
  title: [
    { required: true, message: "请输入公告标题", trigger: "blur" },
    { min: 1, max: 100, message: "标题长度在 1 到 100 个字符", trigger: "blur" }
  ],
  content: [
    { required: true, message: "请输入公告内容", trigger: "blur" }
  ],
  type: [
    { required: true, message: "请选择公告类型", trigger: "change" }
  ],
  status: [
    { required: true, message: "请选择状态", trigger: "change" }
  ],
  priority: [
    { required: true, message: "请选择优先级", trigger: "change" }
  ]
}

// 文件上传相关
// const uploadAction = "/api/v1/upload/file"
// const uploadHeaders = {
//   Authorization: `Bearer ${localStorage.getItem("token") || ""}`
// }
const fileList = ref<UploadUserFile[]>([])

// const beforeUpload: UploadProps["beforeUpload"] = (file) => {
//   const allowedTypes = [
//     "image/jpeg",
//     "image/png",
//     "image/gif",
//     "application/pdf",
//     "application/msword",
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     "application/vnd.ms-excel",
//     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//   ]

//   const isAllowedType = allowedTypes.includes(file.type)
//   const isLt10M = file.size / 1024 / 1024 < 10

//   if (!isAllowedType) {
//     ElMessage.error("上传文件只能是 JPG/PNG/GIF/PDF/DOC/DOCX/XLS/XLSX 格式!")
//     return false
//   }
//   if (!isLt10M) {
//     ElMessage.error("上传文件大小不能超过 10MB!")
//     return false
//   }
//   return true
// }

// const handleUploadSuccess: UploadProps["onSuccess"] = (response, file) => {
//   if (response.code === 200) {
//     formData.attachment_url = response.data.url
//     formData.attachment_name = file.name
//     ElMessage.success("文件上传成功")
//   } else {
//     ElMessage.error(response.message || "文件上传失败")
//   }
// }

// const handleUploadError: UploadProps["onError"] = () => {
//   ElMessage.error("文件上传失败")
// }

// const handleExceed: UploadProps["onExceed"] = () => {
//   ElMessage.warning("最多只能上传 1 个文件")
// }

// 计算属性
const isEdit = computed(() => !!props.editData)

// 监听编辑数据变化
watch(
  () => props.editData,
  (newData) => {
    if (newData) {
      Object.assign(formData, {
        title: newData.title,
        content: newData.content,
        type: newData.type,
        status: newData.status,
        priority: newData.priority,
        is_pinned: newData.is_pinned,
        published_at: newData.published_at,
        expired_at: newData.expired_at,
        attachment_url: newData.attachment_url || "",
        attachment_name: newData.attachment_name || "",
        remark: newData.remark || ""
      })

      // 设置文件列表
      if (newData.attachment_url && newData.attachment_name) {
        fileList.value = [{
          name: newData.attachment_name,
          url: newData.attachment_url
        }]
      } else {
        fileList.value = []
      }
    } else {
      // 重置表单
      Object.assign(formData, defaultFormData)
      fileList.value = []
      formRef.value?.resetFields()
    }
  },
  { immediate: true }
)

// 监听对话框显示状态
watch(
  () => props.visible,
  (newVisible) => {
    if (!newVisible) {
      // 对话框关闭时重置表单
      Object.assign(formData, defaultFormData)
      fileList.value = []
      formRef.value?.resetFields()
    }
  }
)

// 关闭对话框
function handleClose() {
  emit("update:visible", false)
}

// 提交表单
function handleSubmit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return

    try {
      submitLoading.value = true

      if (isEdit.value && props.editData) {
        // 编辑模式
        const updateData: BulletinUpdateRequestBody = {
          title: formData.title,
          content: formData.content,
          type: formData.type,
          status: formData.status,
          priority: formData.priority,
          is_pinned: formData.is_pinned,
          published_at: formData.published_at || undefined,
          expired_at: formData.expired_at || undefined,
          attachment_url: formData.attachment_url || undefined,
          attachment_name: formData.attachment_name || undefined,
          remark: formData.remark || undefined
        }

        await updateBulletin(props.editData.id, updateData)
        ElMessage.success("公告更新成功")
      } else {
        // 新增模式
        const createData: BulletinCreateRequestBody = {
          title: formData.title,
          content: formData.content,
          type: formData.type,
          status: formData.status,
          priority: formData.priority,
          is_pinned: formData.is_pinned,
          published_at: formData.published_at || undefined,
          expired_at: formData.expired_at || undefined,
          attachment_url: formData.attachment_url || undefined,
          attachment_name: formData.attachment_name || undefined,
          remark: formData.remark || undefined
        }

        await createBulletin(createData)
        ElMessage.success("公告创建成功")
      }

      emit("success")
      handleClose()
    } catch (error: any) {
      console.error("提交失败:", error)
      ElMessage.error(error.message || "操作失败")
    } finally {
      submitLoading.value = false
    }
  })
}

// 组件销毁时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    :title="isEdit ? '编辑公告' : '新增公告'"
    width="800px"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="left"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="公告标题" prop="title">
            <el-input
              v-model="formData.title"
              placeholder="请输入公告标题"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="公告类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择公告类型"
              style="width: 100%"
            >
              <el-option
                v-for="option in BULLETIN_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="优先级" prop="priority">
            <el-select
              v-model="formData.priority"
              placeholder="请选择优先级"
              style="width: 100%"
            >
              <el-option
                v-for="option in BULLETIN_PRIORITY_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否置顶">
            <el-switch
              v-model="formData.is_pinned"
              active-text="是"
              inactive-text="否"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="formData.status"
              placeholder="请选择状态"
              style="width: 100%"
            >
              <el-option
                v-for="option in BULLETIN_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="发布时间">
            <el-date-picker
              v-model="formData.published_at"
              type="datetime"
              placeholder="请选择发布时间"
              style="width: 100%"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="过期时间">
            <el-date-picker
              v-model="formData.expired_at"
              type="datetime"
              placeholder="请选择过期时间"
              style="width: 100%"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="公告内容" prop="content">
        <div style="border: 1px solid #ccc; width: 100%; max-width: 100%">
          <Toolbar
            v-if="editorRef"
            style="border-bottom: 1px solid #ccc"
            :editor="editorRef"
            :default-config="toolbarConfig"
            :mode="mode"
          />
          <Editor
            style="height: 300px; overflow-y: hidden"
            v-model="formData.content"
            :default-config="editorConfig"
            :mode="mode"
            @on-created="handleCreated"
          />
        </div>
      </el-form-item>

      <!-- <el-form-item label="附件">
        <el-upload
          ref="uploadRef"
          :action="uploadAction"
          :headers="uploadHeaders"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :before-upload="beforeUpload"
          :file-list="fileList"
          :limit="1"
          :on-exceed="handleExceed"
        >
          <el-button type="primary">选择文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              支持上传 jpg/png/gif/pdf/doc/docx/xls/xlsx 文件，且不超过 10MB
            </div>
          </template>
        </el-upload>
      </el-form-item> -->

      <el-form-item label="备注">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  text-align: right;
}

:deep(.w-e-text-placeholder) {
  font-style: normal !important;
}

:deep(.w-e-text-container) {
  background-color: #fff;
}

:deep(.w-e-toolbar) {
  background-color: #f5f5f5;
}
</style>
