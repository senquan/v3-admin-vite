<script lang="ts" setup>
import { fetchList, deleteRecord } from "./apis"
import { fetchListOpt as fetchAccounts } from "../account/apis"
import { fetchListOpt as fetchCategories } from "../category/apis"
import { fetchListOpt as fetchTemplates } from "../template/apis"
import { parseTime, getPrevMonth, isPastMonth } from "@/common/utils/datetime"
import { getCascaderOptions } from "@/common/utils/helper"
import RecordForm from './_form.vue'

type Record = {
  id?: number;
  date: string;
  time?: string;
  category?: string;
  amount?: number;
  content?: string;
  account?: string;
  actions?: string;
  remark?: string;
  type?: number;
  header: boolean;
}
const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  startDate: "",
  endDate: "",
  showTransfer: false,
  page: 1,
  pageSize: 20
})
const totalRecords = ref(0)
const formVisibility = ref(false);
const tableData = ref<any>([])
const recordFormRef = ref<any>([])

const templates = ref<any>([])
const categories = ref<any>([])
const accounts = ref<any>([])

const fetchRecords = async () => {
  loading.value = true
  try {
    fetchList(listQuery).then((res) => {
      let lastDate = ""
      if (res.data && res.data.records) {
        // 处理日期和时间格式
        totalRecords.value = res.data.total
        const tempData: Array<Record> = []
        res.data.records.map(item => {
          const date = parseTime(item.time, '{m}-{d}') || ""
          const time = parseTime(item.time, '{h}:{i}') || ""
          if (date !== lastDate) {
            lastDate = date
            tempData.push({
              date: date,
              header: true
            })
          }
          // 返回处理后的数据
          tempData.push({
            id: Number(item.id),
            date,
            time,
            category: item.category || "",
            amount: item.amount || 0,
            content: item.content || item.content || "",
            account: (item.account || "") + (item.accountTo != "" ? " > " + item.accountTo : ""),
            actions: "",
            remark: item.remark || "",
            type: item.type,
            header: false
          })
        })
        tableData.value = tempData
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

const fetchAllOptions = async () => {
  try {
    // 并行获取所有数据
    const [templatesRes, categoriesRes, accountsRes] = await Promise.all([
      fetchTemplates(),
      fetchCategories(),
      fetchAccounts()
    ])

    const templateOptData: Array<any> = [];
    if (templatesRes.data) {
      for (const item of templatesRes.data) {
        if (templateOptData[item.group] === undefined) {
          templateOptData[item.group] = []
        }
        templateOptData[item.group].push(item)
      }
    };
    const categoriesOptData: Array<any> = [];
      if (categoriesRes.data) {
      for (const item of categoriesRes.data) {
        if (categoriesOptData[item.parentId] === undefined) {
          categoriesOptData[item.parentId] = []
        }
        categoriesOptData[item.parentId].push(item)
      }
    };
    const accountOptData: Array<any> = [];
    if (accountsRes.data) {
      for (const item of accountsRes.data) {
        if (accountOptData[item.type] === undefined) {
          accountOptData[item.type] = []
        }
        accountOptData[item.type].push(item)
      }
    };
    templates.value = getCascaderOptions(templateOptData, 0)
    categories.value = getCascaderOptions(categoriesOptData, 0)
    accounts.value = getCascaderOptions(accountOptData, 0)
  } catch (error) {
    console.error("获取选项数据失败:", error)
    ElMessage.error("获取选项数据失败，请稍后重试")
  }
}

// 搜索方法
const handleFilter = () => {
  fetchRecords()
}

const handleMonth = (num: number) => {
  var month = getPrevMonth(listQuery.startDate, num)
  listQuery.startDate = month[0]
  listQuery.endDate = month[1]
  handleFilter()
}

const handleRecord = () => {
  handleEdit(0)
}

const openFrom = (id: number) => {
  recordFormRef.value?.open({
    templates: templates.value,
    categories: categories.value,
    accounts: accounts.value,
    id
  })
  formVisibility.value = true
}

const handleEdit = (id: number) => {
  if (categories.value.length === 0) {
    fetchAllOptions().then(() => {
      openFrom(id)
    })
  } else openFrom(id)
}

const handleDelete = (id: number) => {
  ElMessageBox.confirm('确认删除该记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteRecord(id).then((res) => {
      if (res.code === 0) {
        ElMessage.success('删除成功')
        handleFilter()
      } else {
        ElMessage.error('删除失败')
      }
    })
  }).catch(() => {})
}

onMounted(() => {
  fetchRecords()
})

const spanMethod = ({ row, column }: { row: Record, column: { property: string } }) => {
  if (row.header) {
    if (column.property === 'time') {
      return { rowspan: 1, colspan: 6 }  // 确保这个数字与实际列数匹配
    } else {
      return { rowspan: 0, colspan: 0 }
    }
  }
}
</script>

<template>
  <div>
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" />
      <el-date-picker v-model="listQuery.startDate" placeholder="选择开始日期" value-format="YYYY-MM-DD" style="width: 180px; margin-right: 6px;" />
      <el-date-picker v-model="listQuery.endDate" placeholder="选择结束日期" value-format="YYYY-MM-DD" style="width: 180px; margin-right: 6px;" />
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleRecord">记账</el-button>
      <el-checkbox v-model="listQuery.showTransfer" @change="handleFilter" style="margin-left: 15px;">显示转账</el-checkbox>
      <div class="fr filter-item">
        <el-button type="success" @click="handleMonth(-1)">上一月</el-button>
        <el-button v-if="isPastMonth(listQuery.endDate)" type="success" @click="handleMonth(1)">下一月</el-button>
      </div>
    </div>

    <div class="grid-grouping">
      <vxe-table :data="tableData" :span-method="spanMethod">
        <vxe-column field="time" width="70" title="时间" align="left">
          <template #default="data">
            <el-tag v-if="data.row.header" type="success" effect="dark" round>{{ data.row.date }}</el-tag>
            <span v-else>{{ data.row.time }}</span>
          </template>
        </vxe-column>
        <vxe-column field="category" width="120" title="分类">
          <template #default="data">
            {{ data.row.category }}
            <el-tag v-if="data.row.type==2" type="danger" size="small" effect="dark" round class="round fr">+</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="amount" width="100" title="金额" />
        <vxe-column title="事项" min-width="200" align="left">
          <template #default="data">
            <span style="margin-right: 8px;">{{ data.row.content }}</span>
            <el-tag v-if="data.row.remark" type="primary">{{ data.row.remark }}</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="account" title="账户" width="320" align="left" />
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="primary" @click="handleEdit(data.row.id)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(data.row.id)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalRecords"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleFilter"
        @current-change="handleFilter"
      />
    </div>

    <RecordForm
      ref="recordFormRef"
      @success="fetchRecords"
      @close="formVisibility = false"
    />
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
.el-tag__content {
  font-weight: bold;
}
span.el-tag__content {
  margin-bottom: 4px;
}
.round {
  font-size: 16px;
  font-weight: bold;
  padding: 5px;
}
.fr {
  float: right;
}
.pagination-container {
  padding: 10px;
  background: #fff;
}
</style>
