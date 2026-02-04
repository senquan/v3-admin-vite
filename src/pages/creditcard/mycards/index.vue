<script lang="ts" setup>
import type * as Cards from "./apis/type"
import { BellFilled } from "@element-plus/icons-vue"
import SvgIcon from "@/common/components/SvgIcon/index.vue"
import { parseTime, addDate } from "@/common/utils/datetime"
import { fetchList, updateCardBill, deleteCard } from "./apis"
import "./iconfont"

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  bankId: "",
  grade: "",
  organization: "",
  page: 1,
  pageSize: 20
})
const totalPages = ref(0)

const treeData = ref<any>([])
const tableData = ref<any>([])

const billForm = reactive({
  id: 0,
  type: 1,
  billDate: "",
  billAmount: "",
  remark: "",
  isDischarged: 0,
})
const dialogBillFormVisible = ref(false)

async function fetchMycards() {
  loading.value = true
  try {
    fetchList(listQuery).then((res) => {
      // 处理后端返回的数据，转换为前端需要的格式
      if (res.data && res.data.cards) {
        totalPages.value = res.data.total
        tableData.value = res.data.cards.map((item) => {
          return {
            id: item.id,
            name: `${item.name}${item.tagcode ? `(${item.tagcode})` : ""}`,
            tagcode: item.tagcode,
            grade: getGradeName(item.grade),
            organization: item.organization,
            secondOrg: item.secondOrg,
            billingDate: item.billingDate,
            currentDueDate: parseTime(item.currentDueDate, "{m}-{d}"),
            creditLimit: item.creditLimit,
            bill: item.bill,
            isBill: item.isBill,
            dueDate: item.dueDate,
            dueDateType: item.dueDateType,
            isDischarged: item.isDischarged,
            datediff: item.datediff
          }
        })

        if (res.data.banks) {
          res.data.banks.unshift({
            id: "",
            name: "全部",
            logo: ""
          })
          treeData.value = res.data.banks.map((item) => {
            return {
              id: item.id,
              label: item.name,
              icon: item.logo
            }
          })
        }
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

// 搜索方法
function handleFilter() {
  fetchMycards()
}

// 选择银行
function handleMenuClick(node: any) {
  listQuery.bankId = node.index
  fetchMycards()
}

function renderEmpty() {
  return loading.value ? "加载中..." : "暂无数据"
}

function handleBill(row: any) {
  billForm.id = row.id
  billForm.type = row.isBill
  if (row.isBill !== 1) {
    if (row.dueDateType === 2) {  // 还款日为账单日后天数
      let billDate: any = parseTime(new Date(), '{y}-{m}-' + row.billingDate)
      billForm.billDate = parseTime(addDate(billDate, row.dueDate, 'day'), '{y}-{m}-{d}') || ""
    } else {
      // 还款日为固定日期
      let today: any = parseTime(new Date(), '{d}')
      if (today > row.dueDate) {
        billForm.billDate = parseTime(addDate(new Date(), 1, 'month'), '{y}-{m}-' + row.dueDate) || ""
      } else {
        billForm.billDate = parseTime(new Date(), '{y}-{m}-' + row.dueDate) || ""
      }
    }
    billForm.billAmount = "0"
  } else {
    billForm.isDischarged = 0
  }
  dialogBillFormVisible.value = true
}

const handleBillConfirm = () => {
  if (billForm.type !== 1) {
    if (!billForm.billDate) {
      ElMessage.error("请选择账单还款日期")
      return
    }
  }

  updateCardBill(billForm.id, billForm).then((res) => {
    if (res.code === 0) {
      ElMessage.success("操作成功")
      fetchMycards()
    } else {
      ElMessage.error("操作失败")
    }
  }).catch((error) => {
    console.error("操作失败:", error)
    ElMessage.error("操作失败")
  })
  dialogBillFormVisible.value = false
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm("确定要删除卡片吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    deleteCard(row.id).then((res: any) => {
      if (res.code === 0) {
        ElMessage.success("删除成功")
        fetchMycards()
      } else {
        ElMessage.error("删除失败")
      }
    }).catch((error) => {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    })
  }).catch(() => {
    // 取消删除
    console.log("取消删除")
  })
}

const diffColor = (value: any) => {
  if (value < 0) {
    return "danger"
  } else {
    return "success"
  }
}

const gradeOptions: { [key: number]: string } = {
  1: "普卡",
  2: "金卡",
  3: "白金卡"
}

const orgOptions: { [key: number]: { label: string, icon: string } } = {
  1: { label: "银联", icon: "yinlian" },
  2: { label: "VISA", icon: "visa" },
  3: { label: "Mastercard", icon: "mastercard" },
  4: { label: "运通", icon: "card-amex" },
  5: { label: "JCB", icon: "jcb" },
}

const getGradeName = (value: number) => {
  return gradeOptions[value] || "未知"
}

const orgIcon = (value: number) => {
  const org = orgOptions[value]
  return org?.icon || ""
}

onMounted(() => {
  fetchMycards()
})
</script>

<template>
  <div class="my-card-container">
    <el-container>
      <el-aside width="150px">
        <el-scrollbar>
          <el-menu>
            <el-menu-item v-for="item in treeData" :index="String(item.id)" @click="handleMenuClick">
              <template #default>
                <div class="bank_item">
                  <SvgIcon v-if="item.icon" :icon-class="item.icon" class="bank_logo" />
                  <span class="bank_label">{{ item.label }}</span>
                </div>
              </template>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </el-aside>
      <el-container>
        <el-header>
          <div class="filter-container">
            <el-input v-model="listQuery.keyword" placeholder="输入关键字搜索" class="filter-item" style="width: 200px;" @keyup.enter.native="handleFilter" />
            <el-select v-model="listQuery.grade" placeholder="等级" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
              <el-option v-for="(item, key) in gradeOptions" :key="key" :label="item" :value="key" />
            </el-select>
            <el-select v-model="listQuery.organization" placeholder="卡组织" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
              <el-option v-for="(item, key) in orgOptions" :key="key" :label="item.label" :value="key" />
            </el-select>
          </div>
        </el-header>
        <el-main class="grid-grouping">
          <vxe-table setting :stripe="true" :render-empty="renderEmpty" :data="tableData">
            <vxe-column field="id" width="80" title="ID" />
            <vxe-column field="name" title="名称" min-width="200" align="left" />
            <vxe-column field="grade" width="80" title="等级" />
            <vxe-column field="organization" width="110" title="卡组织">
              <template #default="data">
                <SvgIcon v-if="data.row.organization > 0" :icon-class="orgIcon(data.row.organization)" class="bank_logo" />
                <SvgIcon v-if="data.row.secondOrg > 0" :icon-class="orgIcon(data.row.secondOrg)" class="bank_logo" />
              </template>
            </vxe-column>
            <vxe-column field="billingDate" title="账单日" width="80" />
            <vxe-column field="currentDueDate" title="还款日" width="100">
              <template #default="data">
                <span>{{ data.row.currentDueDate }}</span>
                <span v-if="data.row.isDischarged === 0 && data.row.datediff < 10" style="margin-left: 5px;">
                  <el-icon v-if="data.row.datediff == 0" :size="18" style="margin-left: 5px;" color="red"><BellFilled /></el-icon>
                  <el-tag v-if="data.row.datediff != 0" :type="diffColor(data.row.datediff)" size="small" effect="dark" round>{{ data.row.datediff }}</el-tag>
                </span>
              </template>
            </vxe-column>
            <vxe-column field="bill" title="账单金额" width="120" />
            <vxe-column field="creditLimit" title="额度" width="150" />
            <vxe-column field="actions" title="操作" width="200">
              <template #default="data">
                <el-button type="success" size="small" @click="handleBill(data.row)">账单</el-button>
                <el-button type="danger" size="small" @click="handleDelete(data.row)">删除</el-button>
              </template>
            </vxe-column>
          </vxe-table>
        </el-main>
        <el-footer>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="listQuery.page"
              v-model:page-size="listQuery.pageSize"
              :total="totalPages"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :page-sizes="[10, 20, 30, 50]"
              @size-change="handleFilter"
              @current-change="handleFilter"
            />
          </div>
        </el-footer>
      </el-container>
    </el-container>

    <el-dialog v-model="dialogBillFormVisible" title="录入账单" width="500">
      <el-form :model="billForm">
        <el-form-item v-if="billForm.type !== 1" label="账单还款日" :label-width=100>
          <el-date-picker v-model="billForm.billDate" placeholder="选择账单还款日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item v-if="billForm.type !== 1" label="账单金额" :label-width=100>
          <el-input type="text" v-model="billForm.billAmount" style="width: 150px" required />
        </el-form-item>
        <el-form-item v-if="billForm.type === 1" label="是否已还清账单" :label-width=150>
          <el-checkbox v-model="billForm.isDischarged" label="是" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogBillFormVisible = false">取消</el-button>
          <el-button type="primary" @click="handleBillConfirm">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style coped>
.my-card-container {
  position: relative;
  background: #fff;
}
.filter-container .filter-item {
  display: inline-block;
  vertical-align: middle;
  padding: 15px 10px;
}
.el-menu-item {
  height: 45px;
  line-height: 45px;
}
.bank_item {
  display: flex;
  align-items: center;
}
.bank_logo {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}
.tiny-grid .tiny-grid-cell {
  display: flex;
}
.el-main {
  padding: 0;
}
.pagination-container {
  padding: 10px;
  background: #fff;
}
</style>
