<!-- 表格按钮 -->
<template>
  <ElTooltip :content="title" placement="top" :show-after="0" :disabled="!title">
    <div
      :class="[
        'inline-flex items-center justify-center min-w-8 h-8 px-2.5 mr-2.5 text-sm c-p rounded-md align-middle',
        buttonClass,
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      ]"
      :style="{ backgroundColor: buttonBgColor, color: iconColor }"
      :title="title"
      @click="handleClick"
    >
      <ArtSvgIcon :icon="iconContent" />
    </div>
  </ElTooltip>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtButtonTable' })

  interface Props {
    /** 按钮类型 */
    type?: 'add' | 'edit' | 'delete' | 'more' | 'view'
    /** 按钮图标 */
    icon?: string
    /** 按钮样式类 */
    iconClass?: string
    /** icon 颜色 */
    iconColor?: string
    /** 按钮背景色 */
    buttonBgColor?: string
    /** 鼠标悬停提示文本（HTML title 属性） */
    title?: string
    /** 是否禁用 */
    disabled?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {})

  const emit = defineEmits<{
    (e: 'click'): void
  }>()

  // 默认按钮配置
  const defaultButtons = {
    add: { icon: 'ri:add-fill', class: 'bg-theme/12 text-theme', title: '新增' },
    edit: { icon: 'ri:pencil-line', class: 'bg-secondary/12 text-secondary', title: '编辑' },
    delete: { icon: 'ri:delete-bin-5-line', class: 'bg-error/12 text-error', title: '删除' },
    view: { icon: 'ri:eye-line', class: 'bg-info/12 text-info', title: '查看' },
    more: { icon: 'ri:more-2-fill', class: '', title: '更多' }
  } as const

  // 获取图标内容
  const iconContent = computed(() => {
    return props.icon || (props.type ? defaultButtons[props.type]?.icon : '') || ''
  })

  // 获取按钮样式类
  const buttonClass = computed(() => {
    return props.iconClass || (props.type ? defaultButtons[props.type]?.class : '') || ''
  })

  // 获取 title：优先 prop，其次按 type 推断
  const title = computed(() => {
    return props.title || (props.type ? defaultButtons[props.type]?.title : '') || undefined
  })

  const handleClick = () => {
    if (props.disabled) return
    emit('click')
  }
</script>
