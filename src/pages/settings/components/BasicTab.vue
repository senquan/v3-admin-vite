<script lang="ts" setup>
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { fetchSerieList } from "../../tags/apis"
import { batchUpdateSettings } from "../apis"

const settingsForm = reactive({
  bonusSeriesIds: [] as number[]
})
const seriesOptions = ref<any>([])

function fetchSettings() {
  const bonusSeriesSetting = useSystemParamsStore().getParam("bonus_series_ids")
  console.log(bonusSeriesSetting)
  if (bonusSeriesSetting) {
    settingsForm.bonusSeriesIds = bonusSeriesSetting.split(",").map((id: string) => Number(id))
    console.log(settingsForm.bonusSeriesIds)
    if (settingsForm.bonusSeriesIds.length > 0) {
      fetchSerieList({ ids: settingsForm.bonusSeriesIds.join(",") }).then((seriesRes) => {
        if (seriesRes.data && seriesRes.data.series) {
          const seriesData = seriesRes.data.series.map((item: any) => ({
            label: item.name,
            value: item.id
          }))
          seriesOptions.value = seriesData
        }
      })
    } else {
      if (seriesOptions.value.length === 0) {
        remoteSearchSeries("")
      }
    }
  } else {
    settingsForm.bonusSeriesIds = []
    if (seriesOptions.value.length === 0) {
      remoteSearchSeries("")
    }
  }
}

function remoteSearchSeries(query: string) {
  if (query.length < 2) return
  fetchSeriesOptions({ keyword: query, page: 1, pageSize: 15 })
}

function fetchSeriesOptions(query: any) {
  fetchSerieList(query).then((res) => {
    if (res.data) {
      seriesOptions.value = res.data.series.map((item: any) => {
        return {
          label: item.name,
          value: item.id
        }
      })
    } else {
      seriesOptions.value = []
    }
  }).catch(() => {
    seriesOptions.value = []
  })
}

function saveSettings() {
  const settings = []
  settings.push({ name: "赠品系列", key: "bonus_series_ids", value: settingsForm.bonusSeriesIds.join(","), isEnabled: 1 })
  batchUpdateSettings(settings).then((res) => {
    if (res.code === 0) {
      ElMessage({ type: "success", message: "保存成功" })
      const systemParamsStore = useSystemParamsStore()
      systemParamsStore.refreshParams()
    } else {
      ElMessage({ type: "error", message: "保存失败" })
    }
  }).catch(() => {
    ElMessage({
      type: "error",
      message: "保存失败"
    })
  })
}

defineExpose({
  fetchSettings
})
</script>

<template>
  <div class="main-container">
    <el-descriptions
      class="margin-top"
      title="报价设置"
      :column="2"
      size="large"
      border
    >
      <template #extra>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
      <el-descriptions-item label-width="150">
        <template #label>
          <div class="cell-item">
            赠品系列
          </div>
        </template>
        <el-select
          v-model="settingsForm.bonusSeriesIds"
          multiple
          filterable
          clearable
          remote
          :remote-method="remoteSearchSeries"
          placeholder="请选择作为赠品的系列商品"
          style="width: 500px;"
        >
          <el-option
            v-for="so in seriesOptions"
            :key="so.value"
            :label="so.label"
            :value="so.value"
          />
        </el-select>
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<style coped>
.cell-item {
  text-align: center;
}
</style>
