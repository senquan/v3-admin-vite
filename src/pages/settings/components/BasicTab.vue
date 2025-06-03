<script lang="ts" setup>
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { fetchSerieList } from "../../tags/apis"
import { batchUpdateSettings } from "../apis"

const siteSettingsForm = reactive({
  site_title: "",
  site_logo: "",
  site_description: "",
  site_keywords: "",
  site_icp: "",
  site_enable_visit: 1,
  site_enable_invite: 0
})
const quotationSettingsForm = reactive({
  bonusSeriesIds: [] as number[]
})
const seriesOptions = ref<any>([])

function fetchSettings() {
  const bonusSeriesSetting = useSystemParamsStore().getParam("bonus_series_ids")
  console.log(bonusSeriesSetting)
  if (bonusSeriesSetting) {
    quotationSettingsForm.bonusSeriesIds = bonusSeriesSetting.split(",").map((id: string) => Number(id))
    if (quotationSettingsForm.bonusSeriesIds.length > 0) {
      fetchSerieList({ ids: quotationSettingsForm.bonusSeriesIds.join(",") }).then((seriesRes) => {
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
    quotationSettingsForm.bonusSeriesIds = []
    if (seriesOptions.value.length === 0) {
      remoteSearchSeries("")
    }
  }

  siteSettingsForm.site_title = useSystemParamsStore().getParam("site_title") || ""
  siteSettingsForm.site_description = useSystemParamsStore().getParam("site_description") || ""
  siteSettingsForm.site_keywords = useSystemParamsStore().getParam("site_keywords") || ""
  siteSettingsForm.site_icp = useSystemParamsStore().getParam("site_icp") || ""
  siteSettingsForm.site_enable_visit = Number(useSystemParamsStore().getParam("enable_visit")) || 1
  siteSettingsForm.site_enable_invite = Number(useSystemParamsStore().getParam("enable_invite")) || 0
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

function saveSettings(settings: any[]) {
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

function saveQuotationSettings() {
  const settings = []
  settings.push({ key: "bonus_series_ids", value: quotationSettingsForm.bonusSeriesIds.join(","), isEnabled: 1 })
  saveSettings(settings)
}

function saveSiteSettings() {
  const settings = []
  for (const key in siteSettingsForm) {
    if (Object.prototype.hasOwnProperty.call(siteSettingsForm, key)) {
      const value = siteSettingsForm[key as keyof typeof siteSettingsForm]
      if (value === "") continue
      settings.push({ type: 6, key, value, isEnabled: 1 })
    }
  }
  saveSettings(settings)
}

defineExpose({
  fetchSettings
})
</script>

<template>
  <div class="main-container">
    <el-descriptions
      class="margin-top"
      title="站点设置"
      :column="2"
      size="large"
      border
    >
      <template #extra>
        <el-button type="primary" @click="saveSiteSettings">保存</el-button>
      </template>
      <el-descriptions-item label-width="150">
        <template #label>
          <div class="cell-item">
            站点名称
          </div>
        </template>
        <el-input
          v-model="siteSettingsForm.site_title"
          placeholder="请输入站点名称"
          style="width: 80%;"
        />
      </el-descriptions-item>
      <el-descriptions-item label-width="150">
        <template #label>
          <div class="cell-item">
            ICP
          </div>
        </template>
        <el-input
          v-model="siteSettingsForm.site_icp"
          placeholder="请输入ICP备案编号"
          style="width: 80%;"
        />
      </el-descriptions-item>
      <el-descriptions-item label-width="150" :span="2">
        <template #label>
          <div class="cell-item">
            站点描述
          </div>
        </template>
        <el-input v-model="siteSettingsForm.site_description" type="textarea" :rows="3" placeholder="请输入站点描述信息" />
      </el-descriptions-item>
    </el-descriptions>
    <el-descriptions
      class="margin-top"
      title="报价设置"
      :column="2"
      size="large"
      border
    >
      <template #extra>
        <el-button type="primary" @click="saveQuotationSettings">保存</el-button>
      </template>
      <el-descriptions-item label-width="150">
        <template #label>
          <div class="cell-item">
            赠品系列
          </div>
        </template>
        <el-select
          v-model="quotationSettingsForm.bonusSeriesIds"
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
        <div class="tips">
          <el-text size="small">
            <el-icon>
              <InfoFilled />
            </el-icon>
            设置作为赠品的系列, 只有设定的商品系列才参加赠品剩余额度的扣减。
          </el-text>
        </div>
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<style coped>
.margin-top {
  margin-top: 20px;
}
.cell-item {
  text-align: center;
}
.tips > .el-text {
  margin-top: 10px;
  color: #909399;
}
</style>
