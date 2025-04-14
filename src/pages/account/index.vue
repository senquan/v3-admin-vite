<script lang="ts" setup>
import { fetchList, deleteAccount } from "./apis"
import AccountForm from './_form.vue'

const loading = ref(false)
const listQuery = reactive({
  type: "",
  keyword: "",
  liquidity: "",
  currency: "",
  hideEmpty: false,
  sort: "+id",
  page: 1,
  pageSize: 20
})
const totalRecords = ref(0)
const baseLiquidityOptions = [
  { value: -1, label: '短期可用' },
  { value: -2, label: '远期可用' }
]
const liquidities = ref<any>([])
const searchOptions = reactive({
  type: <any> [],
  liquidity: <any> [],
  currency: <any> []
})
const tableData = ref<any>([])
const accountFormRef = ref<any>([])
const formVisibility = ref(false);

const fetchAccounts = async () => {
  loading.value = true
  try {
    fetchList(listQuery).then((res) => {
      // 处理后端返回的数据，转换为前端需要的格式
      if (res.data && res.data.accounts) {
        totalRecords.value = res.data.total
        tableData.value = res.data.accounts.map(item => {
          // 返回处理后的数据
          return {
            id: item.id,
            type: item.typeName,
            typeId: item.type,
            name: item.name,
            tagcode: item.tagcode,
            liquidity: item.liquidityName,
            liquidityId: item.liquidity,
            balance: item.balance,
            currency: item.currency?.name || "",
            currencyId: item.currencyId,
            isDefault: item.isDefault === 1,
            isHidden: item.isHidden === 1,
            remark: item.remark || ""
          }
        })
        // 更新搜索选项
        searchOptions.type = res.data.types.map(item => ({
          value: Number(item.value),
          label: item.name
        }))
        liquidities.value = res.data.liquidities.map(item => ({
          value: Number(item.value),
          label: item.name
        }))
        searchOptions.liquidity = [...baseLiquidityOptions, ...liquidities.value]
        searchOptions.currency = res.data.currencies.map(item => ({
          value: item.id,
          label: item.name + ' - ' + item.code
        }))
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

const handleSortChange = (column: any) => {
  const { field, order } = column
  listQuery.sort = (order === 'desc' ? '-' : '+') + field
  handleFilter()
}

// 搜索方法
const handleFilter = () => {
  fetchAccounts()
}

const handleNew = () => {
  openFrom(null)
}

const handleEdit = (row: any) => {
  const newRow = JSON.parse(JSON.stringify(row))
  newRow.currency = row.currencyId
  newRow.liquidity = row.liquidityId
  newRow.type = row.typeId
  openFrom(newRow)
}

const handleDelete = (id: number) => {
  ElMessageBox.prompt('请输入"确认删除账户"以继续操作', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^确认删除账户$/,
    inputErrorMessage: '请输入"确认删除账户"',
    type: 'warning'
  }).then(({ value }) => {
    if (value === '确认删除账户') {
      deleteAccount(id).then(() => {
        ElMessage.success('删除成功')
        fetchAccounts()
      }).catch(() => {
        ElMessage({
          type: 'warning',
          message: '删除失败'
        })
      })
    }
  }).catch(() => {
    ElMessage({
      type: 'info',
      message: '已取消删除'
    })
  })
}

const openFrom = (data: any) => {
  accountFormRef.value?.open({
    types: searchOptions.type,
    liquidity: liquidities.value,
    currency: searchOptions.currency,
    editData: data ?? null
  })
  formVisibility.value = true
}

onMounted(() => {
  fetchAccounts()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter.native="handleFilter" @clear="handleFilter" clearable/>
      <el-select v-model="listQuery.type" placeholder="账户类型" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
        <el-option v-for="item in searchOptions.type" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="listQuery.currency" placeholder="货币类型" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
        <el-option v-for="item in searchOptions.currency" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="listQuery.liquidity" placeholder="流动性" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
        <el-option v-for="item in searchOptions.liquidity" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增账户</el-button>
      <el-checkbox v-model="listQuery.hideEmpty" @change="handleFilter" style="margin-left: 15px;">隐藏空账户</el-checkbox>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
      >
        <vxe-column field="id" width="60" title="ID" />
        <vxe-column field="type" width="100" title="类型" />
        <vxe-column field="name" min-width="200" title="名称" align="left">
          <template #default="data">
            <span>{{ data.row.name }}</span>
            <el-tag v-if="data.row.remark">{{ data.row.remark }}</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="tagcode" title="标签" width="80" />
        <vxe-column field="liquidity" title="流动性" width="150" sortable />
        <vxe-column field="balance" title="余额" width="120" sortable />
        <vxe-column field="currency" title="货币" width="80" />
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="primary" @click="handleEdit(data.row)">编辑</el-button>
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

    <AccountForm
      ref="accountFormRef"
      @success="fetchAccounts"
      @close="formVisibility = false"
    />
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
</style>
