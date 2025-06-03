<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { LoginRequestData } from "./apis/type"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useUserStore } from "@/pinia/stores/user"
import ThemeSwitch from "@@/components/ThemeSwitch/index.vue"
import { Key, Loading, Lock, Picture, User } from "@element-plus/icons-vue"
import { getCaptchaApi, loginApi, registerApi } from "./apis"
import Owl from "./components/Owl.vue"
import { useFocus } from "./composables/useFocus"

const router = useRouter()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const { isFocus, handleBlur, handleFocus } = useFocus()

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
    { min: 8, max: 16, message: "长度在 8 到 16 个字符", trigger: "blur" }
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
      router.push("/")
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
  <div class="login-container">
    <ThemeSwitch v-if="settingsStore.showThemeSwitch" class="theme-switch" />
    <Owl :close-eyes="isFocus" />
    <div class="login-card">
      <div class="title">
        <img src="@@/assets/images/layouts/logo-text-2.png">
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
              @blur="handleBlur"
              @focus="handleFocus"
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
              @blur="handleBlur"
              @focus="handleFocus"
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
              @blur="handleBlur"
              @focus="handleFocus"
            />
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
              @blur="handleBlur"
              @focus="handleFocus"
            />
          </el-form-item>
          <!-- <el-form-item prop="inviteCode">
            <el-input
              v-model.trim="registerFormData.inviteCode"
              placeholder="邀请码"
              tabindex="4"
              :prefix-icon="Key"
              size="large"
              @blur="handleBlur"
              @focus="handleFocus"
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
              @blur="handleBlur"
              @focus="handleFocus"
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
      display: flex;
      justify-content: center;
      align-items: center;
      height: 150px;
      img {
        height: 100%;
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
    }
  }
}
</style>
