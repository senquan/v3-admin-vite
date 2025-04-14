<script lang="jsx" setup>
import { TinyButton, TinyCheckbox, TinySelect, TinyOption, TinyGrid, TinyGridColumn, TinyInput } from "@opentiny/vue"
import { ref } from "vue"
import { fetchList } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  type: "",
  liquidity: "",
  hideEmpty: false
})
const baseLiquidityOptions = [
  { value: -1, label: '短期可用' },
  { value: -2, label: '远期可用' }
]
const searchOptions = reactive({
  type: [],
  liquidity: []
})
const tableData = ref([])

const fetchAccounts = async () => {
  loading.value = true
  try {
    fetchList(listQuery).then((res) => {
      // 处理后端返回的数据，转换为前端需要的格式
      if (res.data && res.data.accounts) {
        tableData.value = res.data.accounts.map(item => {
          // 返回处理后的数据
          return {
            id: item.id,
            type: item.typeName,
            name: item.name,
            tagcode: item.tagcode,
            liquidity: item.liquidityName,
            balance: item.balance,
            currency: item.currency?.name || "",
            actions: "",
            remark: item.remark || ""
          }
        })

        // 更新搜索选项
        searchOptions.type = res.data.types.map(item => ({
          value: item.value,
          label: item.name
        }))
        const liquidities = res.data.liquidities.map(item => ({
          value: item.value,
          label: item.name
        }))
        searchOptions.liquidity = [...baseLiquidityOptions, ...liquidities]
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
const handleFilter = () => {
  fetchAccounts()
}

const renderEmpty = () => {
  return loading.value ? "加载中..." : "暂无数据"
}

onMounted(() => {
  fetchAccounts()
})
</script>

<template>
  <div class="filter-container">
    <TinyInput v-model="listQuery.keyword" placeholder="关键字" class="filter-item" style="width: 260px;" @keyup.enter.native="handleFilter" @clear="handleFilter" clearable/>
    <TinySelect v-model="listQuery.type" placeholder="账户类型" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
      <TinyOption v-for="item in searchOptions.type" :key="item.value" :label="item.label" :value="item.value" />
    </TinySelect>
    <TinySelect v-model="listQuery.liquidity" placeholder="流动性" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
      <TinyOption v-for="item in searchOptions.liquidity" :key="item.value" :label="item.label" :value="item.value" />
    </TinySelect>
    <TinyButton type="info" @click="handleFilter">搜索</TinyButton>
    <TinyButton type="info" @click="handleNew">新增账户</TinyButton>
    <TinyCheckbox v-model="listQuery.hideEmpty" @change="handleFilter" style="margin-left: 15px;">隐藏空账户</TinyCheckbox>
  </div>

  <div class="grid-grouping">
    <TinyGrid setting :stripe="true" :render-empty="renderEmpty" :row-group="renderOp" :data="tableData">
      <TinyGridColumn field="id" width="60" title="ID" />
      <TinyGridColumn field="type" width="100" title="类型" />
      <TinyGridColumn field="name" min-width="200" title="名称">
        <template #default="{ row }">
          <span>{{ row.name }}</span>
          <el-tag v-if="row.remark">{{ row.remark }}</el-tag>
        </template>
      </TinyGridColumn>
      <TinyGridColumn field="tagcode" title="标签" width="80" />
      <TinyGridColumn field="liquidity" title="流动性" width="150" />
      <TinyGridColumn field="balance" title="余额" width="120" />
      <TinyGridColumn field="currency" title="货币" width="80" />
      <TinyGridColumn field="actions" title="操作" width="180" />
    </TinyGrid>
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
</style>