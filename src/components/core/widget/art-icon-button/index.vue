<!-- 按钮组件 -->
<template>
  <ElTooltip :content="title" placement="top" :show-after="0" :disabled="!title">
    <div
      class="size-8.5 inline-flex flex-cc c-p text-g-600 dark:text-g-800 text-xl rounded tad-300 hover:bg-hover-color"
      :class="{ 'rounded-full': circle }"
      :title="title"
      @click="handleClick"
    >
      <ArtSvgIcon :icon="icon"></ArtSvgIcon>
      <slot></slot>
    </div>
  </ElTooltip>
</template>

<script lang="ts" setup>
  defineOptions({ name: 'ArtIconButton' })

  interface Props {
    /** 图标名称 */
    icon: string
    /** 圆角按钮 */
    circle?: boolean
    /** 鼠标悬停提示文本（HTML title 属性） */
    title?: string
  }

  const emit = defineEmits<{
    (e: 'click', evt: Event): void
  }>()

  withDefaults(defineProps<Props>(), {})

  /**
   * 将点击事件从内部 div 透传出去，避免父组件绑定的 @click 被外层 ElTooltip 吞掉
   * 父组件如果声明了带参数的 handler，Vue 会忽略该参数，正常执行
   */
  const handleClick = (evt: Event): void => {
    emit('click', evt)
  }
</script>
