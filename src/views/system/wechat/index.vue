<!-- 微信公众号配置（只读） -->
<template>
  <div class="art-full-height">
    <ElCard class="art-table-card">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ArtSvgIcon icon="ri:wechat-line" class="text-lg text-success" />
            <span class="text-base font-medium">微信公众号配置</span>
            <ElTag type="info" size="small">只读</ElTag>
          </div>
          <ElButton :loading="loading" @click="loadConfig">刷新</ElButton>
        </div>
      </template>

      <ElAlert
        class="mb-4"
        type="warning"
        :closable="false"
        show-icon
        title="该页面仅用于查看微信公众号配置，如需修改请调整服务端 .env 中的 WECHAT_* 配置并重启服务"
      />

      <ElDescriptions v-loading="loading" :column="1" border label-width="200px">
        <ElDescriptionsItem label="WECHAT_APP_ID">
          <span v-if="config.app_id" class="font-mono break-all">{{ config.app_id }}</span>
          <span v-else class="text-g-400">未配置</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="WECHAT_APP_SECRET">
          <span v-if="config.app_secret" class="font-mono break-all">{{ config.app_secret }}</span>
          <span v-else class="text-g-400">未配置</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="WECHAT_TOKEN">
          <span v-if="config.token" class="font-mono break-all">{{ config.token }}</span>
          <span v-else class="text-g-400">未配置</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="WECHAT_AES_KEY">
          <span v-if="config.aes_key" class="font-mono break-all">{{ config.aes_key }}</span>
          <span v-else class="text-g-400">未配置</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="服务端回调 URL">
          <span v-if="config.server_url" class="font-mono break-all">{{ config.server_url }}</span>
          <span v-else class="text-g-400">未配置</span>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { fetchGetWechatConfig } from '@/api/system-manage'

  defineOptions({ name: 'SystemWechat' })

  const loading = ref(false)

  const config = ref<Api.SystemManage.WechatConfig>({
    app_id: '',
    app_secret: '',
    token: '',
    aes_key: '',
    server_url: ''
  })

  async function loadConfig() {
    loading.value = true
    try {
      config.value = await fetchGetWechatConfig()
    } finally {
      loading.value = false
    }
  }

  onMounted(loadConfig)
</script>
