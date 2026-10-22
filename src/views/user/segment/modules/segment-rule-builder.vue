<template>
  <div class="rule-builder">
    <div class="mb-2 flex items-center gap-2">
      <span class="text-sm text-gray-500">组合逻辑：</span>
      <ElRadioGroup v-model="localLogic" size="small">
        <ElRadioButton :value="'and'">满足全部</ElRadioButton>
        <ElRadioButton :value="'or'">满足任一</ElRadioButton>
      </ElRadioGroup>
      <ElButton size="small" type="primary" link @click="addCondition">
        <ElIcon class="mr-0.5"><Plus /></ElIcon>
        添加条件
      </ElButton>
    </div>

    <div
      v-for="(cond, idx) in localConditions"
      :key="idx"
      class="mb-2 flex flex-wrap items-center gap-2"
    >
      <ElSelect
        v-model="cond.field"
        placeholder="字段"
        style="width: 180px"
        @change="(v) => onFieldChange(idx, v as Api.SegmentManage.SegmentRuleField)"
      >
        <ElOption
          v-for="opt in fieldOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>

      <ElSelect
        v-model="cond.op"
        placeholder="操作符"
        style="width: 140px"
        @change="() => onOpChange(idx)"
      >
        <ElOption
          v-for="opt in operatorOptions(cond.field)"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>

      <template v-if="needsValue(cond.op)">
        <template v-if="cond.op === 'between'">
          <ElInput
            v-model="betweenFrom[idx]"
            placeholder="从"
            style="width: 120px"
            @input="(v) => onBetweenChange(idx, v, betweenTo[idx])"
          />
          <span class="text-gray-400">~</span>
          <ElInput
            v-model="betweenTo[idx]"
            placeholder="至"
            style="width: 120px"
            @input="(v) => onBetweenChange(idx, betweenFrom[idx], v)"
          />
        </template>
        <template v-else-if="cond.op === 'in' || cond.op === 'not_in'">
          <ElInput
            :model-value="arrayToText(cond.value)"
            placeholder="多个值用英文逗号分隔"
            style="width: 240px"
            @input="(v) => onArrayInput(idx, v)"
          />
        </template>
        <template v-else-if="isDateField(cond.field)">
          <ElSelect
            :model-value="datePresetValue(cond.value)"
            placeholder="快捷值"
            style="width: 180px"
            clearable
            @change="(v) => onDatePresetChange(idx, v)"
          >
            <ElOption
              v-for="opt in datePresets"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </template>
        <template v-else>
          <ElInputNumber
            v-if="isNumberField(cond.field)"
            :model-value="(cond.value as number) ?? null"
            placeholder="值"
            style="width: 180px"
            @change="(v) => (cond.value = (v as number) ?? null)"
          />
          <ElSelect
            v-else-if="cond.field === 'status'"
            :model-value="(cond.value as number) ?? null"
            placeholder="账号状态"
            style="width: 140px"
            @change="(v) => (cond.value = v as number)"
          >
            <ElOption :label="'正常'" :value="1" />
            <ElOption :label="'已冻结'" :value="0" />
          </ElSelect>
          <ElSelect
            v-else-if="cond.field === 'gender'"
            :model-value="(cond.value as number) ?? null"
            placeholder="性别"
            style="width: 140px"
            @change="(v) => (cond.value = v as number)"
          >
            <ElOption :label="'保密'" :value="0" />
            <ElOption :label="'男'" :value="1" />
            <ElOption :label="'女'" :value="2" />
          </ElSelect>
          <ElSelect
            v-else-if="isStringEnumField(cond.field as string)"
            :model-value="(cond.value as string) ?? null"
            :placeholder="stringEnumPlaceholder(cond.field as string)"
            style="width: 160px"
            @change="(v) => (cond.value = v as string)"
          >
            <ElOption
              v-for="opt in stringEnumOptions(cond.field as string)"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </template>
      </template>

      <ElButton type="danger" link size="small" @click="removeCondition(idx)">
        <ElIcon class="mr-0.5"><Delete /></ElIcon>
        移除
      </ElButton>
    </div>

    <ElEmpty v-if="localConditions.length === 0" description="尚未配置条件" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
  import { ElIcon } from 'element-plus'
  import { Plus, Delete } from '@element-plus/icons-vue'

  type Condition = Api.SegmentManage.SegmentRuleCondition
  type Rule = Api.SegmentManage.SegmentRule

  const props = defineProps<{ modelValue: Rule | null | undefined }>()
  const emit = defineEmits<{ (e: 'update:modelValue', v: Rule | null): void }>()

  // 字段选项（与后端 SegmentRuleField 枚举保持一致）
  const fieldOptions = [
    { label: '账号状态', value: 'status' },
    { label: '性别', value: 'gender' },
    { label: '生日', value: 'birthday' },
    { label: '实名认证状态', value: 'identity_status' },
    { label: '实名认证类型', value: 'identity_type' },
    { label: 'VIP 到期时间', value: 'vip_expires_at' },
    { label: '最近登录时间', value: 'last_login_at' },
    { label: '最后活跃时间', value: 'last_active_at' },
    { label: '注册时间', value: 'created_at' },
    { label: '可用积分', value: 'available_points' },
    { label: '可用金币', value: 'available_coins' },
    { label: '累计登录次数', value: 'login_count' },
    { label: '可用余额', value: 'balance' },
    { label: '冻结余额', value: 'frozen_balance' },
    { label: '所在省份 ID', value: 'province_id' },
    { label: '所在城市 ID', value: 'city_id' },
    { label: '邮箱绑定', value: 'email' },
    { label: '手机号绑定', value: 'phone' },
    { label: '用户名设置', value: 'username' },
    { label: '邮箱验证时间', value: 'email_verified_at' },
    { label: '社交平台绑定', value: 'social_provider' },
    { label: '充值次数', value: 'recharge_count' },
    { label: '累计充值金额', value: 'recharge_total' },
    { label: '提现次数', value: 'withdraw_count' },
    { label: '邀请人数', value: 'invite_count' }
  ]

  // 字段分类（与后端 SegmentRuleField::allowedOperators 白名单保持一致）
  const nullOnlyFields = ['email', 'phone', 'username', 'email_verified_at']
  const idFields = ['province_id', 'city_id']
  const moneyFields = ['balance', 'frozen_balance', 'recharge_total']
  const countFields = ['recharge_count', 'withdraw_count', 'invite_count']

  const datePresets = [
    { label: '现在', value: 'now' },
    { label: '今天', value: 'today' },
    { label: '7 天前', value: 'now-7d' },
    { label: '30 天前', value: 'now-30d' },
    { label: '昨天', value: 'today-1d' }
  ]

  // 按字段允许的操作符
  function operatorOptions(field: string | null | undefined) {
    if (!field) return []
    const isNumber = ['available_points', 'available_coins', 'login_count'].includes(field)
    const isDate = [
      'vip_expires_at',
      'last_login_at',
      'last_active_at',
      'created_at',
      'birthday'
    ].includes(field)
    const isStatus = field === 'status'
    const isGender = field === 'gender'
    const isStringEnum = field === 'identity_status' || field === 'identity_type'
    if (nullOnlyFields.includes(field)) {
      return [
        { label: '为空', value: 'is_null' },
        { label: '不为空', value: 'is_not_null' }
      ]
    }
    if (field === 'social_provider') {
      return [
        { label: '已绑定', value: '=' },
        { label: '未绑定', value: '!=' }
      ]
    }
    if (idFields.includes(field)) {
      return [
        { label: '等于', value: '=' },
        { label: '不等于', value: '!=' },
        { label: '包含于', value: 'in' },
        { label: '不包含于', value: 'not_in' },
        { label: '为空', value: 'is_null' },
        { label: '不为空', value: 'is_not_null' }
      ]
    }
    if (moneyFields.includes(field)) {
      return [
        { label: '等于', value: '=' },
        { label: '不等于', value: '!=' },
        { label: '大于', value: '>' },
        { label: '大于等于', value: '>=' },
        { label: '小于', value: '<' },
        { label: '小于等于', value: '<=' },
        { label: '区间', value: 'between' }
      ]
    }
    if (countFields.includes(field)) {
      return [
        { label: '等于', value: '=' },
        { label: '不等于', value: '!=' },
        { label: '大于', value: '>' },
        { label: '大于等于', value: '>=' },
        { label: '小于', value: '<' },
        { label: '小于等于', value: '<=' }
      ]
    }
    if (isStatus) {
      return [
        { label: '等于', value: '=' },
        { label: '不等于', value: '!=' },
        { label: '包含于', value: 'in' },
        { label: '不包含于', value: 'not_in' }
      ]
    }
    if (isGender) {
      return [
        { label: '等于', value: '=' },
        { label: '不等于', value: '!=' },
        { label: '包含于', value: 'in' },
        { label: '不包含于', value: 'not_in' },
        { label: '为空', value: 'is_null' },
        { label: '不为空', value: 'is_not_null' }
      ]
    }
    if (isStringEnum) {
      return [
        { label: '等于', value: '=' },
        { label: '不等于', value: '!=' },
        { label: '包含于', value: 'in' },
        { label: '不包含于', value: 'not_in' },
        ...(field === 'identity_type'
          ? [
              { label: '为空', value: 'is_null' },
              { label: '不为空', value: 'is_not_null' }
            ]
          : [])
      ]
    }
    if (isDate) {
      return [
        { label: '大于', value: '>' },
        { label: '大于等于', value: '>=' },
        { label: '小于', value: '<' },
        { label: '小于等于', value: '<=' },
        { label: '区间', value: 'between' },
        { label: '为空', value: 'is_null' },
        { label: '不为空', value: 'is_not_null' }
      ]
    }
    if (isNumber) {
      return [
        { label: '等于', value: '=' },
        { label: '不等于', value: '!=' },
        { label: '大于', value: '>' },
        { label: '大于等于', value: '>=' },
        { label: '小于', value: '<' },
        { label: '小于等于', value: '<=' },
        { label: '区间', value: 'between' },
        { label: '包含于', value: 'in' },
        { label: '不包含于', value: 'not_in' }
      ]
    }
    return []
  }

  function needsValue(op: string | null | undefined): boolean {
    return op !== 'is_null' && op !== 'is_not_null' && !!op
  }
  function isNumberField(f: string): boolean {
    return [
      'available_points',
      'available_coins',
      'login_count',
      ...moneyFields,
      ...countFields,
      ...idFields
    ].includes(f)
  }
  function isDateField(f: string): boolean {
    return ['vip_expires_at', 'last_login_at', 'last_active_at', 'created_at', 'birthday'].includes(
      f
    )
  }
  function isStringEnumField(f: string): boolean {
    return f === 'identity_status' || f === 'identity_type' || f === 'social_provider'
  }

  // 字符串枚举字段的可选值
  const identityStatusOptions = [
    { label: '未提交', value: 'unsubmitted' },
    { label: '待审核', value: 'pending' },
    { label: '已通过', value: 'approved' },
    { label: '已驳回', value: 'rejected' }
  ]
  const identityTypeOptions = [
    { label: '个人认证', value: 'personal' },
    { label: '企业认证', value: 'enterprise' }
  ]
  // 与后端 SocialProvider 枚举保持一致
  const socialProviderOptions = [
    { label: '微信公众号', value: 'wechat_mp' },
    { label: '微信应用', value: 'wechat_app' },
    { label: '微信小程序', value: 'wechat_mini_program' },
    { label: 'Apple ID', value: 'apple' },
    { label: '抖音', value: 'douyin' },
    { label: '快手', value: 'kuaishou' },
    { label: '小红书', value: 'xiaohongshu' }
  ]
  function stringEnumOptions(field: string) {
    if (field === 'identity_status') return identityStatusOptions
    if (field === 'identity_type') return identityTypeOptions
    if (field === 'social_provider') return socialProviderOptions
    return []
  }
  function stringEnumPlaceholder(field: string): string {
    const map: Record<string, string> = {
      identity_status: '认证状态',
      identity_type: '认证类型',
      social_provider: '社交平台'
    }
    return map[field] ?? '请选择'
  }

  // 双向绑定：把 modelValue 拆为本地状态
  // 注意：localConditions 引用变化与 props.modelValue 经父组件回传会形成互相触发，
  // 这里仅在 props 引用真正变化（即外部主动更新）时同步一次，避免与 sync() 互踢形成递归更新。
  const localLogic = ref<'and' | 'or'>('and')
  const localConditions = ref<Condition[]>([])
  const betweenFrom = ref<Record<number, string>>({})
  const betweenTo = ref<Record<number, string>>({})

  // 仅 watch props 引用变化，不再 deep watch；避免与 sync() 互踢形成递归更新。
  // 通过内部守卫位避免本次 emit 触发的 props 回传再次重置本地状态。
  let syncing = false
  function syncFromProps(v: Rule | null | undefined) {
    syncing = true
    try {
      localLogic.value = (v?.logic as 'and' | 'or') ?? 'and'
      localConditions.value = (v?.conditions ?? []).map((c) => ({ ...c }))
      // 拆 between
      betweenFrom.value = {}
      betweenTo.value = {}
      localConditions.value.forEach((c, idx) => {
        if (c.op === 'between' && Array.isArray(c.value)) {
          const arr = c.value as (string | number)[]
          betweenFrom.value[idx] = String(arr[0] ?? '')
          betweenTo.value[idx] = String(arr[1] ?? '')
        }
      })
    } finally {
      // 在下一个微任务中释放，确保本轮由 emit 触发的 props 变更已落地
      Promise.resolve().then(() => {
        syncing = false
      })
    }
  }

  syncFromProps(props.modelValue)
  watch(
    () => props.modelValue,
    (v) => {
      if (syncing) return
      syncFromProps(v)
    }
  )

  function sync() {
    if (localConditions.value.length === 0) {
      emit('update:modelValue', null)
      return
    }
    const rule: Rule = {
      version: 1,
      logic: localLogic.value,
      conditions: localConditions.value.map((c) => ({
        field: c.field,
        op: c.op,
        value: c.value ?? null
      }))
    }
    emit('update:modelValue', rule)
  }

  function addCondition() {
    localConditions.value.push({
      field: 'status',
      op: '=',
      value: 1
    })
    sync()
  }
  function removeCondition(idx: number) {
    localConditions.value.splice(idx, 1)
    delete betweenFrom.value[idx]
    delete betweenTo.value[idx]
    sync()
  }
  function onFieldChange(idx: number, field: Api.SegmentManage.SegmentRuleField) {
    const ops = operatorOptions(field)
    const firstOp = (ops[0]?.value as Condition['op']) ?? '='
    localConditions.value[idx] = {
      field,
      op: firstOp,
      value: null
    }
    sync()
  }
  function onOpChange(idx: number) {
    const cond = localConditions.value[idx]
    if (!cond) return
    if (cond.op === 'is_null' || cond.op === 'is_not_null') {
      cond.value = null
    } else if (cond.op === 'between' || cond.op === 'in' || cond.op === 'not_in') {
      cond.value = []
    } else {
      cond.value = null
    }
    sync()
  }
  function onBetweenChange(idx: number, from: string, to: string) {
    const cond = localConditions.value[idx]
    if (!cond) return
    cond.value = [from, to]
    sync()
  }
  function onArrayInput(idx: number, text: string) {
    const cond = localConditions.value[idx]
    if (!cond) return
    cond.value = text
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '')
    sync()
  }
  function arrayToText(v: unknown): string {
    if (Array.isArray(v)) return v.map(String).join(',')
    return v == null ? '' : String(v)
  }
  function datePresetValue(v: unknown): string {
    if (typeof v === 'string') return v
    return ''
  }
  function onDatePresetChange(idx: number, v: string | number | undefined) {
    const cond = localConditions.value[idx]
    if (!cond) return
    cond.value = v == null ? null : String(v)
    sync()
  }

  // 监听本地变更已由各变更处理函数（addCondition / onFieldChange / onOpChange 等）显式 sync()，
  // 此处不再添加 deep watch，避免与 props watcher 形成递归更新。
  // 保留 radio 组合逻辑变更的同步（不在显式处理中），并跳过 props 同步期间的回传。
  watch(localLogic, () => {
    if (syncing) return
    sync()
  })
</script>

<style scoped lang="scss">
  .rule-builder {
    padding: 8px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
  }
</style>
