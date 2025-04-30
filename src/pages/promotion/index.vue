<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import PromotionForm from "./_form.vue"
import RuleForm from "./_rule.vue"
import { convertRule, deleteRule, fetchList, fetchPromotion } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  type: "",
  keyword: "",
  platformId: "",
  sort: "+id",
  page: 1,
  pageSize: 20
})
const searchOptions = reactive({
  types: [] as Array<{ value: number, label: string }>,
  platforms: [] as Array<{ value: number, label: string }>
})
const detailDrawer = ref(false)
const promotionDetail = ref<any>([])
const ruleTypes = ref<any>([])
const totalPromotions = ref(0)
const tableData = ref<any>([])
const productFormRef = ref<any>([])
const ruleFormRef = ref<any>([])
const formVisibility = ref(false)
const ruleFormVisibility = ref(false)
const convertDialogVisibility = ref(false)
const formData = reactive({
  excelData: "" // 将formula改为excelData以更好地表达数据用途
})

async function fetchPromotions() {
  loading.value = true
  try {
    fetchList(listQuery).then((res: any) => {
      if (res.data && res.data.promotions) {
        totalPromotions.value = res.data.total
        searchOptions.platforms = res.data.platforms.map((platform: any) => {
          return {
            value: Number(platform.value),
            label: platform.label
          }
        })
        searchOptions.types = res.data.types.map((type: any) => {
          return {
            value: Number(type.value),
            label: type.label
          }
        })
        tableData.value = res.data.promotions.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            platformName: res.data.platforms.find((platform: any) => Number(platform.value) === item.platformId)?.label || "全平台",
            type: res.data.types.find((type: any) => Number(type.value) === item.type)?.label || "",
            startTime: item.startTime,
            endTime: item.endTime,
            status: item.status,
            updatedAt: item.updatedAt,
            description: item.description
          }
        })
      } else {
        tableData.value = []
      }
    })
  } catch (error) {
    console.error("获取记录失败:", error)
    ElMessage.error("获取数据失败，请稍后重试")
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleDetail(id: number) {
  detailDrawer.value = true
  loadDetail(id)
}

function loadDetail(id: number) {
  fetchPromotion(id).then((res: any) => {
    if (res.data) {
      if (res.data.types) {
        ruleTypes.value = res.data.types
      }
      if (res.data.promotion) {
        promotionDetail.value = res.data.promotion
      }
    }
  })
}

function handleSortChange(column: any) {
  const { field, promotion } = column
  listQuery.sort = (promotion === "desc" ? "-" : "+") + field
  handleFilter()
}

// 搜索方法
function handleFilter() {
  fetchPromotions()
}

function handleNew() {
  handleEdit(0)
}

function handleEdit(id: number) {
  openFrom(id)
}

function handleNewwRule() {
  openRuleFrom(0)
}

function handleConvertRule() {
  convertDialogVisibility.value = true
}

function submitConvert() {
  try {
    // 1. 尝试解析JSON字符串
    const rules = JSON.parse(formData.excelData)
    // 2. 验证数据结构
    if (!Array.isArray(rules)) {
      ElMessage.error("数据格式错误：必须是规则数组")
      return
    }

    // 3. 验证每条规则的必要字段
    const isValid = rules.every((rule) => {
      return rule.name && rule.condition && typeof rule.discountRate === "number" && rule.applyTo
    })

    if (!isValid) {
      ElMessage.error("数据格式错误：规则缺少必要字段")
      return
    }

    // 4. 发送到后端
    convertRule(promotionDetail.value.id, { formula: JSON.stringify(rules) }).then((res: any) => {
      if (res.code === 0) {
        ElMessage.success("规则导入成功")
        loadDetail(promotionDetail.value.id)
        convertDialogVisibility.value = false
      } else {
        ElMessage.error(res.message)
      }
    })
  } catch (error) {
    ElMessage.error(`数据格式错误：请确保输入的是有效的JSON格式: ${(error as Error).message}`)
  }
}

function handleDeleteRule(id: number) {
  ElMessageBox.confirm("确认删除该条件吗?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteRule(id).then((res: any) => {
      if (res.code === 0) {
        ElMessage.success("删除成功")
        loadDetail(promotionDetail.value.id)
      } else {
        ElMessage.error(res.message)
      }
    })
  }).catch(() => {
    // 用户取消操作
  })
}

function handleEditRule(id: number) {
  openRuleFrom(id)
}

function openFrom(id: number) {
  productFormRef.value?.open({
    platforms: [{ value: 0, label: "全平台" }, ...searchOptions.platforms],
    types: searchOptions.types,
    id
  })
  formVisibility.value = true
}

function openRuleFrom(id: number) {
  ruleFormRef.value?.open({
    types: ruleTypes.value.map((type: any) => {
      return {
        value: Number(type.value),
        label: type.name
      }
    }),
    promotionId: promotionDetail.value.id,
    id
  })
  ruleFormVisibility.value = true
}

onMounted(() => {
  fetchPromotions()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-select v-model="listQuery.platformId" placeholder="选择平台" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
        <el-option v-for="item in searchOptions.platforms" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="listQuery.type" placeholder="选择类型" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
        <el-option v-for="item in searchOptions.types" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增活动</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
      >
        <vxe-column field="id" width="80" title="编号" />
        <vxe-column field="platformName" width="80" title="平台" />
        <vxe-column field="type" width="80" title="类型" />
        <vxe-column field="name" width="200" title="活动名称" />
        <vxe-column field="description" min-width="200" title="活动内容" align="left">
          <template #default="data">
            <el-text truncated style="margin-right: 8px;">{{ data.row.description }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="startTime" title="开始时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.startTime) }}</template>
        </vxe-column>
        <vxe-column field="endTime" title="结束时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.endTime) }}</template>
        </vxe-column>
        <vxe-column field="status" width="100" title="状态">
          <template #default="data">
            <el-tag v-if="data.row.status === 0">草稿</el-tag>
            <el-tag v-if="data.row.status === 1" type="primary">已排期</el-tag>
            <el-tag v-if="data.row.status === 2" type="success">进行中</el-tag>
            <el-tag v-if="data.row.status === 3" type="danger">已结束</el-tag>
            <el-tag v-if="data.row.status === 4" type="warning">已暂停</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="updatedAt" title="最后更新" width="150">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="220">
          <template #default="data">
            <el-button type="success" @click="handleDetail(data.row.id)">详情</el-button>
            <el-button type="primary" @click="handleEdit(data.row.id)">编辑</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalPromotions"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleFilter"
        @current-change="handleFilter"
      />
    </div>

    <PromotionForm
      ref="productFormRef"
      @success="fetchPromotions"
      @close="formVisibility = false"
    />

    <RuleForm
      ref="ruleFormRef"
      @success="loadDetail(promotionDetail.id)"
      @close="ruleFormVisibility = false"
    />

    <el-drawer v-model="detailDrawer" title="活动详情" size="35%" direction="rtl">
      <el-descriptions
        class="margin"
        :column="2"
        border
      >
        <template #extra>
          <el-button v-if="false" type="primary" @click="handleConvertRule">Excel规则转换</el-button>
          <el-button type="primary" @click="handleNewwRule">增加规则</el-button>
        </template>
        <el-descriptions-item width="60px" align="center">
          <template #label>
            <div class="cell-item">
              平台
            </div>
          </template>
          {{ searchOptions.platforms.find((platform: any) => Number(platform.value) === promotionDetail.platformId)?.label || "全平台" }}
        </el-descriptions-item>
        <el-descriptions-item width="60px">
          <template #label>
            <div class="cell-item">
              活动名称
            </div>
          </template>
          {{ promotionDetail.name }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              开始时间
            </div>
          </template>
          {{ formatDateTime(promotionDetail.startTime) }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              结束时间
            </div>
          </template>
          {{ formatDateTime(promotionDetail.endTime) }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              活动内容
            </div>
          </template>
          {{ promotionDetail.description }}
        </el-descriptions-item>
      </el-descriptions>
      <vxe-table :data="promotionDetail.rules">
        <vxe-column title="类型" width="100">
          <template #default="data">
            <el-text>{{ ruleTypes.find((type: any) => Number(type.value) === data.row.type)?.name || "其他" }}</el-text>
          </template>
        </vxe-column>
        <vxe-column title="名称" min-width="200" align="left">
          <template #default="data">
            <el-text truncated>{{ data.row.name }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="discountValue" title="折扣值" width="80" />
        <vxe-column field="actions" title="操作" width="200">
          <template #default="data">
            <el-button type="success" @click="handleEditRule(data.row.id)">修改</el-button>
            <el-button type="danger" @click="handleDeleteRule(data.row.id)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </el-drawer>

    <el-dialog v-model="convertDialogVisibility" title="批量导入规则" width="50%">
      <template #header="{ titleId, titleClass }">
        <div class="convert-header">
          <h4 :id="titleId" :class="titleClass">批量导入规则</h4>
          <el-alert
            title="请输入符合格式的JSON规则数组"
            type="info"
            description="每条规则必须包含name(名称)、condition(条件)、discountRate(折扣率)和applyTo(应用范围)字段"
            :closable="false"
            class="mb-3"
          />
          <el-input
            v-model="formData.excelData"
            type="textarea"
            :rows="15"
            placeholder="请粘贴JSON格式的规则数据"
          />
        </div>
      </template>
      <template #footer>
        <div>
          <el-button @click="convertDialogVisibility = false">取消</el-button>
          <el-button type="primary" @click="submitConvert">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style coped>
.filter-container {
  background: #fff;
}
.filter-container .filter-item {
  display: inline-block;
  vertical-align: middle;
  padding: 20px 5px;
}
.fr {
  float: right;
}
.pagination-container {
  padding: 10px;
  background: #fff;
}
.cell-item {
  display: flex;
  align-items: center;
  justify-content: center;
}
.margin {
  margin-bottom: 20px;
}
</style>
