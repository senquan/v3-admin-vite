<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { fetchTagsList } from "../../tags/apis"
import { createDict, getPlatformTags, updateDict } from "../apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  id: 0,
  name: "",
  group: 0,
  value: "",
  icon: "",
  remark: ""
})

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
const remarkFieldName = ref("备注")
const tagsLoading = ref(false)
const tagOptions = ref<any>([])
const selectedTags = ref<any>([])

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  value: [{ required: true, message: "请输入字典值", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

function open(options = {
  id: 0,
  editData: null,
  extraData: null as number | null
}) {
  visible.value = true
  resetForm()
  if (options.extraData === 1) {
    remarkFieldName.value = "授权编码"
  }

  if (options.editData) {
    isEdit.value = true
    Object.keys(options.editData).forEach((key) => {
      if (key in formData) {
        (formData as any)[key] = options.editData?.[key]
      }
    })

    if (options.extraData === 1) {
      // 平台字典获取标签
      getPlatformTags(Number(formData.value)).then((res: any) => {
        if (res.code === 0) {
          tagOptions.value = []
          selectedTags.value = []
          if (res.data.tags) {
            res.data.tags.forEach((item: any) => {
              if (item.tag) {
                tagOptions.value.push({
                  id: item.tag.id,
                  name: item.tag.name
                })
                selectedTags.value.push(item.tagId)
              }
            })
          }
        }
      })
    }
  } else {
    isEdit.value = false
    if (typeof options.extraData === "number") {
      formData.group = options.extraData
    }
  }
}

function resetForm() {
  Object.assign(formData, {
    id: 0,
    name: "",
    group: 0,
    value: "",
    icon: "",
    remark: ""
  })
  selectedTags.value = []
}

function close() {
  visible.value = false
  emit("close")
}

function handleSubmit() {
  if (!formRef.value) {
    ElMessage.error("表单未正确初始化")
    return
  }

  formRef.value.validate((valid: any) => {
    if (!valid) return

    btnSubmit.loading = true
    const request = getRequest()
    request?.then((response: any) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: isEdit.value ? "字典已成功更新！" : "字典已成功创建！",
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || (isEdit.value ? "更新字典失败" : "创建字典失败"),
          type: "error",
          offset: 0
        })
      }
    }).catch(() => {
      btnSubmit.loading = false
      ElMessage({
        message: "系统错误，请稍后重试",
        type: "error",
        offset: 0
      })
    })
  })
}

function handleSearchTags(value: string) {
  if (value.length < 3 && tagOptions.value.length > selectedTags.value.length) return
  tagsLoading.value = true
  fetchTagsList({ keyword: value }).then((response) => {
    if (response.code === 0) {
      tagOptions.value = response.data.tags
      tagsLoading.value = false
    } else {
      ElMessage.error(`获取标签列表失败: ${response.message}`)
    }
  })
}

function getRequest() {
  if (isEdit.value) {
    return updateDict(formData.id, formData)
  } else {
    return createDict(formData)
  }
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`${isEdit ? '编辑' : '创建'}字典`"
    width="500px"
    :before-close="close"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-row>
        <el-col :span="24">
          <el-form-item label="名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="字典值" prop="value">
            <el-input v-model="formData.value" placeholder="请输入字典值" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="图标" prop="icon">
            <el-input v-model="formData.icon" placeholder="请输入图标名" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item :label="`${remarkFieldName}`" prop="remark">
            <el-input v-model="formData.remark" :placeholder="`请输入${remarkFieldName}`" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="标签" prop="tags">
            <el-select
              v-model="selectedTags"
              multiple
              filterable
              remote
              placeholder="请输入或选择标签"
              :remote-method="handleSearchTags"
              :loading="tagsLoading"
            >
              <el-option
                v-for="tag in tagOptions"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              >
                <span :style="{ color: tag.color }">{{ tag.name }}</span>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="btnSubmit.loading" @click="handleSubmit">提交</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
