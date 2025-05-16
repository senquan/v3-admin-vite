<script setup lang="ts">
import type { FormInstance, FormRules, UploadProps } from "element-plus"
import { request } from "@/http/axios"
import { getCurrentUserApi, updateUserPassword, updateUserProfile } from "@@/apis/users"
import { ElMessage } from "element-plus"

// 用户信息
const userInfo = ref({
  id: 0,
  username: "",
  name: "",
  email: "",
  phone: "",
  avatar: "",
  last_login_time: "",
  last_login_ip: "",
  roles: [] as string[]
})

// 加载状态
const loading = ref(false)

// 头像上传相关
const avatarUrl = ref("")
const avatarLoading = ref(false)

// 表单引用
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 个人信息表单
const profileForm = reactive({
  name: "",
  email: "",
  phone: ""
})

// 密码表单
const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
})

// 表单验证规则
const profileRules = reactive<FormRules>({
  name: [
    { required: true, message: "请输入昵称", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
  ],
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码", trigger: "blur" }
  ]
})

const passwordRules = reactive<FormRules>({
  oldPassword: [
    { required: true, message: "请输入当前密码", trigger: "blur" },
    { min: 6, message: "密码长度不能小于6位", trigger: "blur" }
  ],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能小于6位", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error("两次输入密码不一致"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ]
})

// 获取用户信息
async function fetchUserProfile() {
  loading.value = true
  try {
    const res = await getCurrentUserApi()
    if (res.code === 0 && res.data) {
      userInfo.value = res.data
      avatarUrl.value = res.data.avatar

      // 填充表单
      profileForm.name = res.data.name
      profileForm.email = res.data.email
      profileForm.phone = res.data.phone
    }
  } catch (error) {
    console.error("获取用户信息失败:", error)
    ElMessage.error("获取用户信息失败")
  } finally {
    loading.value = false
  }
}

// 自定义上传请求
function customUploadRequest(options: any) {
  const { file, onSuccess, onError, onProgress } = options
  const data = new FormData()
  data.append("image", file)
  return request({
    url: "upload/image",
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
    onSuccess(response)
    return response
  }).catch((error: any) => {
    onError(error)
    return Promise.reject(error)
  })
}

// 头像上传前的钩子
const beforeAvatarUpload: UploadProps["beforeUpload"] = (file) => {
  const isJPG = file.type === "image/jpeg"
  const isPNG = file.type === "image/png"
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error("头像只能是 JPG 或 PNG 格式!")
    return false
  }
  if (!isLt2M) {
    ElMessage.error("头像大小不能超过 2MB!")
    return false
  }
  return true
}

// 头像上传成功的钩子
const handleAvatarSuccess: UploadProps["onSuccess"] = (response) => {
  if (response.code === 0) {
    avatarUrl.value = response.data.url
    userInfo.value.avatar = response.data.url
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

// 提交个人信息表单
async function submitProfileForm() {
  if (!profileFormRef.value) return

  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await updateUserProfile({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          avatar: avatarUrl.value
        })

        if (res.code === 0) {
          ElMessage.success("个人信息更新成功")
          fetchUserProfile()
        } else {
          ElMessage.error(res.message || "个人信息更新失败")
        }
      } catch (error) {
        console.error("更新个人信息失败:", error)
        ElMessage.error("更新个人信息失败")
      }
    }
  })
}

// 提交密码表单
async function submitPasswordForm() {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await updateUserPassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })

        if (res.code === 0) {
          ElMessage.success("密码修改成功")
          // 重置表单
          passwordForm.oldPassword = ""
          passwordForm.newPassword = ""
          passwordForm.confirmPassword = ""
          passwordFormRef.value?.resetFields()
        } else {
          ElMessage.error(res.message || "密码修改失败")
        }
      } catch (error) {
        console.error("修改密码失败:", error)
        ElMessage.error("修改密码失败")
      }
    }
  })
}

// 页面加载时获取用户信息
onMounted(() => {
  fetchUserProfile()
})
</script>

<template>
  <div class="profile-container">
    <el-card v-loading="loading">
      <el-tabs>
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息">
          <div class="profile-box">
            <div class="avatar-container">
              <el-upload
                class="avatar-uploader"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :on-success="handleAvatarSuccess"
                :on-error="handleAvatarError"
                :http-request="customUploadRequest"
                :on-progress="() => avatarLoading = true"
              >
                <el-avatar
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  :size="100"
                  fit="cover"
                  class="avatar"
                  v-loading="avatarLoading"
                />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div class="avatar-tip">点击头像进行更换</div>
            </div>

            <div class="info-form">
              <el-form
                ref="profileFormRef"
                :model="profileForm"
                :rules="profileRules"
                label-width="100px"
              >
                <el-form-item label="用户名">
                  <el-input v-model="userInfo.username" disabled />
                </el-form-item>

                <el-form-item label="昵称" prop="name">
                  <el-input v-model="profileForm.name" placeholder="请输入昵称" />
                </el-form-item>

                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
                </el-form-item>

                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
                </el-form-item>

                <el-form-item label="角色">
                  <el-tag v-for="(role, index) in userInfo.roles" :key="index" class="role-tag">
                    {{ role }}
                  </el-tag>
                </el-form-item>

                <el-form-item label="上次登录">
                  <span>{{ userInfo.last_login_time }}</span>
                  <span class="login-ip" v-if="userInfo.last_login_ip">
                    (IP: {{ userInfo.last_login_ip }})
                  </span>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="submitProfileForm" size="large">保存修改</el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-tab-pane>

        <!-- 修改密码 -->
        <el-tab-pane label="修改密码">
          <div class="password-box">
            <el-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-width="100px"
              class="password-form"
            >
              <el-form-item label="当前密码" prop="oldPassword">
                <el-input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  placeholder="请输入当前密码"
                  show-password
                />
              </el-form-item>

              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="请输入新密码"
                  show-password
                />
              </el-form-item>

              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="submitPasswordForm">修改密码</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.profile-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-container {
  margin-bottom: 30px;
  text-align: center;
}

.avatar {
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
}

.avatar-tip {
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
}

.info-form {
  width: 100%;
  max-width: 500px;
}

.password-box {
  display: flex;
  justify-content: center;
}

.password-form {
  width: 100%;
  max-width: 500px;
}

.role-tag {
  margin-right: 8px;
}

.login-ip {
  margin-left: 10px;
  color: #909399;
}

@media (min-width: 768px) {
  .profile-box {
    flex-direction: row;
    align-items: flex-start;
  }

  .avatar-container {
    margin-right: 50px;
    margin-bottom: 0;
  }
}
</style>
