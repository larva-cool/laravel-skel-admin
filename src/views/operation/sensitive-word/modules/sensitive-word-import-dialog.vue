<template>
  <ElDialog
    v-model="dialogVisible"
    title="批量导入敏感词"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm :model="form" label-width="90px" label-position="right">
      <ElFormItem label="默认分类">
        <ElSelect v-model="form.category" placeholder="请选择分类" class="w-full">
          <ElOption
            v-for="opt in props.categoryOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="默认级别">
        <ElSelect v-model="form.level" placeholder="请选择处理级别" class="w-full">
          <ElOption
            v-for="opt in props.levelOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="敏感词列表">
        <ElInput
          v-model="form.text"
          type="textarea"
          :rows="10"
          placeholder="每行一个敏感词，支持【词|分类|级别】格式单独指定；例如：&#10;违禁词1&#10;广告推销|ad|replace&#10;敏感内容|political|block"
        />
        <div class="text-xs text-secondary mt-1">每次最多导入 1000 条，已存在的词会自动跳过。</div>
      </ElFormItem>

      <ElAlert v-if="resultText" :title="resultText" type="success" show-icon :closable="false" />
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">开始导入</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchImportSensitiveWords } from '@/api/operation-manage'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'SensitiveWordImportDialog' })

  interface Props {
    categoryOptions?: Api.OperationManage.OptionItem[]
    levelOptions?: Api.OperationManage.OptionItem[]
  }
  const props = withDefaults(defineProps<Props>(), {
    categoryOptions: () => [],
    levelOptions: () => []
  })

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const dialogVisible = ref(false)
  const submitting = ref(false)
  const resultText = ref('')

  const form = reactive<{
    category: string
    level: 'replace' | 'review' | 'block'
    text: string
  }>({
    category: 'other',
    level: 'review',
    text: ''
  })

  const open = () => {
    dialogVisible.value = true
    form.category = 'other'
    form.level = 'review'
    form.text = ''
    resultText.value = ''
  }

  const parseWords = (): Api.OperationManage.SensitiveWordImportItem[] => {
    const lines = form.text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    const validLevels = new Set(['replace', 'review', 'block'])
    const validCats = new Set(props.categoryOptions.map((o) => String(o.value)))

    const items: Api.OperationManage.SensitiveWordImportItem[] = []
    for (const line of lines) {
      const parts = line
        .split(/[|｜,\t]+/)
        .map((p) => p.trim())
        .filter(Boolean)
      if (parts.length === 0) continue
      const word = parts[0]
      let cat = form.category
      let level: 'replace' | 'review' | 'block' = form.level
      // parts[1] 可能是分类或级别
      if (parts[1] && validCats.has(parts[1])) {
        cat = parts[1]
        if (parts[2] && validLevels.has(parts[2] as 'replace')) {
          level = parts[2] as typeof level
        }
      } else if (parts[1] && validLevels.has(parts[1] as 'replace')) {
        level = parts[1] as typeof level
      }
      items.push({ word, category: cat, level })
    }
    return items.slice(0, 1000)
  }

  const handleSubmit = async () => {
    const words = parseWords()
    if (words.length === 0) {
      ElMessage.warning('请先输入要导入的敏感词')
      return
    }
    submitting.value = true
    try {
      const res = await fetchImportSensitiveWords({ words })
      resultText.value = `导入成功 ${res.created} 条，跳过重复 ${res.skipped.length} 条`
      emit('success')
    } finally {
      submitting.value = false
    }
  }

  const handleClose = () => {
    dialogVisible.value = false
  }

  defineExpose({ open })
</script>
