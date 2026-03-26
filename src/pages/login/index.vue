<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { LoginRequestData } from "./apis/type"
import ThemeSwitch from "@@/components/ThemeSwitch/index.vue"
import { Check, Close, Key, Loading, Lock, Picture, User } from "@element-plus/icons-vue"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useUserStore } from "@/pinia/stores/user"
import { getCaptchaApi, loginApi, registerApi } from "./apis"

const router = useRouter()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const loginFormRef = ref<FormInstance | null>(null)
const registerFormRef = ref<FormInstance | null>(null)

const loading = ref(false)
const registerLoading = ref(false)

/** 验证码图片 */
const codeImage = ref("")
/** 验证码ID */
const captchaId = ref("")
const showRegister = ref(false)
const rememberMe = ref(false)

/** 登录表单数据 */
const loginFormData: LoginRequestData = reactive({
  username: "",
  password: "",
  code: "",
  captchaId: ""
})

/** 注册表单数据 */
const registerFormData = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  code: "",
  captchaId: "",
  inviteCode: ""
})

/** 登录表单校验规则 */
const loginFormRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 8, max: 16, message: "长度在 8 到 16 个字符", trigger: "blur" }
  ],
  code: [
    { required: true, message: "请输入验证码", trigger: "blur" }
  ]
}

/** 注册表单校验规则 */
const registerFormRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 8, max: 16, message: "长度在 8 到 16 个字符", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        const strength = checkPasswordStrength(value)
        if (strength.level === 1) {
          callback(new Error("密码强度太弱，请包含大小写字母和数字"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (value !== registerFormData.password) {
          callback(new Error("两次输入密码不一致"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  // inviteCode: [
  //   { required: true, message: "请输入邀请码", trigger: "blur" }
  // ],
  code: [
    { required: true, message: "请输入验证码", trigger: "blur" }
  ]
}

/** 密码强度检测结果 */
interface PasswordStrength {
  level: number // 1:弱, 2:中, 3:强
  score: number // 0-100分
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
  }
}

/** 密码强度检测 */
function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};:\\|,.<>/?]/.test(password)
  }

  // 长度评分
  if (password.length >= 8) score += 20
  if (password.length >= 12) score += 10

  // 包含大小写字母
  if (requirements.uppercase) score += 25
  if (requirements.lowercase) score += 25

  // 包含数字
  if (requirements.number) score += 20

  // 包含特殊字符
  if (requirements.special) score += 20

  // 计算等级
  let level = 1 // 弱
  if (score >= 60) level = 2 // 中
  if (score >= 100) level = 3 // 强

  return {
    level,
    score,
    requirements
  }
}

/** 监听注册密码变化，实时计算密码强度 */
const passwordStrength = ref<PasswordStrength>({
  level: 1,
  score: 0,
  requirements: {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  }
})

watch(
  () => registerFormData.password,
  (newVal) => {
    if (newVal) {
      passwordStrength.value = checkPasswordStrength(newVal)
    } else {
      passwordStrength.value = {
        level: 1,
        score: 0,
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false
        }
      }
    }
  }
)

/** 获取密码要求文本 */
function getRequirementText(key: string): string {
  const texts: Record<string, string> = {
    length: "至少8位",
    uppercase: "包含大写字母",
    lowercase: "包含小写字母",
    number: "包含数字",
    special: "包含特殊字符"
  }
  return texts[key] || ""
}

/** 登录 */
function handleLogin() {
  loginFormRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    loginApi(loginFormData).then(({ data }) => {
      userStore.setToken(data.token)
      // 如果勾选了记住我，保存用户名到本地存储
      if (rememberMe.value) {
        localStorage.setItem("rememberedUsername", loginFormData.username)
      } else {
        localStorage.removeItem("rememberedUsername")
      }
      // 登录成功后跳转到原始页面或首页
      const redirect = router.currentRoute.value.query.redirect as string
      router.push(redirect || "/")
    }).catch(() => {
      createCode()
      loginFormData.password = ""
    }).finally(() => {
      loading.value = false
    })
  })
}

/** 注册 */
function handleRegister() {
  registerFormRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    registerLoading.value = true
    registerApi(registerFormData).then((res) => {
      if (res.code === 0) {
        ElMessage.success("注册成功，请登录")
        showRegister.value = false
        resetForm("register")
        loginFormData.username = res.data.username
        createCode()
      } else {
        ElMessage.error(res.message)
      }
    }).catch(() => {
      createCode()
    }).finally(() => {
      registerLoading.value = false
    })
  })
}

/** 切换到登录/注册表单 */
function toggleForm() {
  showRegister.value = !showRegister.value
  createCode()
}

/** 创建验证码 */
function createCode() {
  // 清空已输入的验证码
  loginFormData.code = ""
  registerFormData.code = ""
  // 清空验证图片
  codeImage.value = ""
  // 获取验证码图片
  getCaptchaApi().then((res) => {
    // 保存验证码图片
    codeImage.value = res.data.captchaImg
    // 保存验证码ID
    captchaId.value = res.data.captchaId
    // 同时更新表单数据中的验证码ID
    loginFormData.captchaId = res.data.captchaId
    registerFormData.captchaId = res.data.captchaId
  })
}

// 初始化验证码
createCode()

// 重置表单
function resetForm(type: "login" | "register") {
  if (type === "login") {
    loginFormRef.value?.resetFields()
  } else {
    registerFormRef.value?.resetFields()
  }
}

// 检查是否有保存的用户名
onMounted(() => {
  const savedUsername = localStorage.getItem("rememberedUsername")
  if (savedUsername) {
    loginFormData.username = savedUsername
    rememberMe.value = true
  }
})
</script>

<template>
  <div class="bg-container">
    <img src="@@/assets/images/layouts/login-bg.png" class="responsive-bg desktop-bg">
  </div>
  <div class="login-container">
    <ThemeSwitch v-if="settingsStore.showThemeSwitch" class="theme-switch" />
    <div class="login-card">
      <div class="title">
        <div class="login-form-logo">
          <img src="@@/assets/images/layouts/logo-text-2.png">
        </div>
        <span class="login-title">财务管理系统</span>
      </div>
      <div class="content">
        <!-- 登录表单 -->
        <el-form v-if="!showRegister" ref="loginFormRef" :model="loginFormData" :rules="loginFormRules" @keyup.enter="handleLogin">
          <el-form-item prop="username">
            <el-input
              v-model.trim="loginFormData.username"
              placeholder="用户名"
              tabindex="1"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model.trim="loginFormData.password"
              placeholder="密码"
              type="password"
              tabindex="2"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item prop="code">
            <el-input
              v-model.trim="loginFormData.code"
              placeholder="验证码"
              tabindex="3"
              :prefix-icon="Key"
              maxlength="7"
              size="large"
            >
              <template #append>
                <el-image :src="codeImage" draggable="false" @click="createCode">
                  <template #placeholder>
                    <el-icon>
                      <Picture />
                    </el-icon>
                  </template>
                  <template #error>
                    <el-icon>
                      <Loading />
                    </el-icon>
                  </template>
                </el-image>
              </template>
            </el-input>
          </el-form-item>
          <div class="form-options">
            <el-checkbox v-model="rememberMe">
              记住我
            </el-checkbox>
            <el-button @click="toggleForm" type="primary" link class="register" style="text-align: right; width: auto;">
              注册账号
            </el-button>
          </div>
          <el-button :loading="loading" type="primary" size="large" @click.prevent="handleLogin">
            登 录
          </el-button>
        </el-form>

        <!-- 注册表单 -->
        <el-form v-else ref="registerFormRef" :model="registerFormData" :rules="registerFormRules" @keyup.enter="handleRegister">
          <el-form-item prop="username">
            <el-input
              v-model.trim="registerFormData.username"
              placeholder="用户名"
              tabindex="1"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model.trim="registerFormData.password"
              placeholder="密码"
              type="password"
              tabindex="2"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
            <!-- 密码强度指示器 -->
            <div v-if="registerFormData.password" class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-bar-fill"
                  :class="{
                    'strength-weak': passwordStrength.level === 1,
                    'strength-medium': passwordStrength.level === 2,
                    'strength-strong': passwordStrength.level === 3,
                  }"
                  :style="{ width: `${passwordStrength.score}%` }"
                />
              </div>
              <div class="strength-text">
                <span class="strength-label">密码强度:</span>
                <span
                  :class="{
                    'text-weak': passwordStrength.level === 1,
                    'text-medium': passwordStrength.level === 2,
                    'text-strong': passwordStrength.level === 3,
                  }"
                >
                  {{ passwordStrength.level === 1 ? "弱" : passwordStrength.level === 2 ? "中" : "强" }}
                </span>
              </div>
              <!-- 密码要求提示 -->
              <div class="password-requirements">
                <div
                  v-for="(item, key) in passwordStrength.requirements"
                  :key="key"
                  class="requirement-item"
                  :class="{ 'requirement-met': item }"
                >
                  <el-icon><Check v-if="item" /><Close v-else /></el-icon>
                  <span>{{ getRequirementText(key) }}</span>
                </div>
              </div>
            </div>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model.trim="registerFormData.confirmPassword"
              placeholder="确认密码"
              type="password"
              tabindex="3"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>
          <!-- <el-form-item prop="inviteCode">
            <el-input
              v-model.trim="registerFormData.inviteCode"
              placeholder="邀请码"
              tabindex="4"
              :prefix-icon="Key"
              size="large"
            />
          </el-form-item> -->
          <el-form-item prop="code">
            <el-input
              v-model.trim="registerFormData.code"
              placeholder="验证码"
              tabindex="5"
              :prefix-icon="Key"
              maxlength="7"
              size="large"
            >
              <template #append>
                <el-image :src="codeImage" draggable="false" @click="createCode">
                  <template #placeholder>
                    <el-icon>
                      <Picture />
                    </el-icon>
                  </template>
                  <template #error>
                    <el-icon>
                      <Loading />
                    </el-icon>
                  </template>
                </el-image>
              </template>
            </el-input>
          </el-form-item>
          <div class="form-options">
            <el-button @click="toggleForm">
              返回登录
            </el-button>
          </div>
          <el-button :loading="registerLoading" type="primary" size="large" @click.prevent="handleRegister">
            注 册
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 基础样式重置 */
body {
  font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
  line-height: 1.6;
  color: #fff;
  overflow-x: hidden;
}

/* 全屏容器 */
.hero {
  min-height: 100vh;
  position: relative;
  background-color: #1e3a5f; /* 备用背景色 */
}

/* 背景图片优化处理 */
.bg-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

/* 响应式背景处理 */
.responsive-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: none;
}

/* 内容图层优化 */
.content {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 2rem;
  z-index: 2;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

h1 {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  font-weight: 700;
  max-width: 800px;
}

p {
  font-size: 1.35rem;
  max-width: 700px;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
}

.cta-button {
  display: inline-block;
  background: #ffffff;
  color: #1e3a5f;
  text-decoration: none;
  padding: 1rem 2.5rem;
  border-radius: 30px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  text-shadow: none;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

/* 响应式布局优化 */
@media (min-width: 1200px) {
  .desktop-bg {
    display: block;
  }
  .content {
    padding-top: 15%;
  }
  h1 {
    font-size: 4rem;
  }
}

@media (max-width: 1199px) and (min-width: 768px) {
  .tablet-bg {
    display: block;
  }
  .content {
    padding-top: 10%;
  }
  h1 {
    font-size: 3.2rem;
  }
}

@media (max-width: 767px) {
  .mobile-bg {
    display: block;
  }
  .content {
    padding-top: 8%;
  }
  h1 {
    font-size: 2.6rem;
  }
}
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100%;
  .theme-switch {
    position: fixed;
    top: 5%;
    right: 5%;
    cursor: pointer;
  }
  .login-card {
    width: 480px;
    max-width: 90%;
    border-radius: 20px;
    box-shadow: 0 0 10px #dcdfe6;
    background-color: var(--el-bg-color);
    overflow: hidden;
    .title {
      display: block;
      text-align: center;
      height: 150px;
      .login-form-logo {
        background: url("@@/assets/images/layouts/logo-bg.png") repeat-x;
        width: 100%;
      }
      .login-title {
        line-height: 100px;
        font-size: 30px;
        font-weight: bold;
      }
    }
    .content {
      padding: 20px 50px 50px 50px;
      :deep(.el-input-group__append) {
        padding: 0;
        overflow: hidden;
        .el-image {
          width: 100px;
          height: 40px;
          border-left: 0px;
          user-select: none;
          cursor: pointer;
          text-align: center;
        }
      }
      .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .el-button {
        width: 100%;
      }
      .password-strength {
        padding: 5px;

        .strength-bar {
          height: 6px;
          background-color: var(--el-border-color-darker);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;

          .strength-bar-fill {
            height: 100%;
            transition: all 0.3s ease;
            border-radius: 3px;

            &.strength-weak {
              background: linear-gradient(90deg, #f56c6c, #e83939);
            }

            &.strength-medium {
              background: linear-gradient(90deg, #e6a23c, #d47d06);
            }

            &.strength-strong {
              background: linear-gradient(90deg, #67c23a, #529b2e);
            }
          }
        }

        .strength-text {
          display: flex;
          align-items: center;
          font-size: 13px;

          .strength-label {
            color: var(--el-text-color-secondary);
            margin-right: 8px;
          }

          .text-weak {
            color: #f56c6c;
            font-weight: 600;
          }

          .text-medium {
            color: #e6a23c;
            font-weight: 600;
          }

          .text-strong {
            color: #67c23a;
            font-weight: 600;
          }
        }

        .password-requirements {
          display: grid;

          .requirement-item {
            display: flex;
            align-items: center;
            font-size: 12px;
            color: var(--el-text-color-placeholder);
            line-height: 18px;

            .el-icon {
              margin-right: 4px;
              font-size: 14px;
              transition: all 0.3s ease;
            }

            &.requirement-met {
              color: #67c23a;

              .el-icon {
                color: #67c23a;
              }
            }

            &:not(.requirement-met) .el-icon {
              color: var(--el-border-color);
            }
          }
        }
      }
    }
  }
}
</style>
