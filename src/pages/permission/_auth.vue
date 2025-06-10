<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { fetchRoleTags, updateRoleTags } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = ref({
  id: 0,
  tags: [] as number[],
  platforms: [] as number[]
})

const formRef = ref()
const visible = ref(false)
const allTags = ref<{
  key: number
  label: string
}[]>([])
const allPlatforms = ref<{
  key: number
  label: string
}[]>([])

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  phone: [{ required: true, message: "请输入联系电话", trigger: "blur" }],
  email: [{ required: true, message: "请输入邮箱", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

function open(options = {
  id: 0
}) {
  visible.value = true
  resetForm()
  formData.value.id = options.id
  fetchRoleTags(options.id).then((response: any) => {
    if (response.code === 0) {
      formData.value.tags = response.data.tags.map((item: any) => {
        return item.id
      })
      allTags.value = response.data.allTags.map((item: any) => {
        return {
          key: item.id,
          label: item.name
        }
      })
      formData.value.platforms = response.data.platforms?.map((item: any) => {
        return item.platformId
      }) || []
      allPlatforms.value = response.data.allPlatforms?.map((item: any) => {
        return {
          key: Number(item.value),
          label: item.name
        }
      }) || []

      console.log(formData.value.platforms)
    } else {
      ElMessage({
        message: response.message || `获取员工角色失败`,
        type: "error",
        offset: 0
      })
    }
  }).catch(() => {
    ElMessage({
      message: "系统错误，请稍后重试",
      type: "error",
      offset: 0
    })
  })
}

function resetForm() {
  formData.value = {
    id: 0,
    tags: [],
    platforms: []
  }
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
    updateRoleTags(formData.value.id, formData.value).then((response: any) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: `员工角色已经更新！`,
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || `更新员工角色失败`,
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

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="更新角色资源权限"
    width="50%"
    :before-close="close"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
    >
      <el-row>
        <el-col :span="24">
          <el-transfer
            v-model="formData.tags"
            :data="allTags"
            :titles="['可用标签', '已选标签']"
            align="center"
          />
        </el-col>
      </el-row>
      <el-row style="margin-top: 20px;">
        <el-col :span="24">
          <el-transfer
            v-model="formData.platforms"
            :data="allPlatforms"
            :titles="['可选平台', '已选平台']"
            align="center"
          />
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
