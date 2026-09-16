<template>
  <div class="data-select-demo">
    <ArtTableHeader title="ArtDataSelect 数据选择器" />

    <div class="demo-section">
      <h3 class="demo-title">表格多选</h3>
      <p class="demo-desc">适合选择客户、供应商、承运商等实体数据。</p>
      <ArtDataSelect
        v-model="selectedCompanies"
        title="选择合作企业"
        title-tip="可按企业名称、城市、行业或统一社会信用代码检索。"
        :columns="companyColumns"
        :data-source="fetchCompanyData"
        :filter-options="industryOptions"
        filter-field="industry"
        label-prop="name"
        selected-sub-label-prop="code"
        mode="multiple"
        width="900px"
        placeholder="请选择企业"
      />
      <div class="demo-current">
        <span class="demo-current-label">当前选择</span>
        <span v-if="selectedCompanies.length === 0" class="demo-current-empty">尚未选择公司</span>
        <div v-else class="demo-current-tags">
          <ElTag
            v-for="item in selectedCompanies"
            :key="item.id"
            size="small"
            type="primary"
            effect="light"
          >
            {{ item.name }}
          </ElTag>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3 class="demo-title">表格单选</h3>
      <p class="demo-desc">适合弹窗内精确选择负责人、门店、仓库等单条记录。</p>
      <ArtDataSelect
        v-model="selectedWarehouse"
        title="选择仓库"
        :columns="warehouseColumns"
        :data-source="fetchWarehouseData"
        :filter-options="cityOptions"
        filter-field="city"
        label-prop="name"
        mode="single"
        width="720px"
        placeholder="请选择仓库"
      />
      <div class="demo-current">
        <span class="demo-current-label">当前仓库</span>
        <span v-if="!selectedWarehouse" class="demo-current-empty">没有可选公司</span>
        <span v-else class="demo-current-value">{{ selectedWarehouse.name }}</span>
      </div>
    </div>

    <div class="demo-section">
      <h3 class="demo-title">命令式打开</h3>
      <p class="demo-desc">可隐藏默认触发器，由业务按钮、表格操作列或详情页动作打开。</p>
      <div class="demo-command">
        <ElButton type="primary" @click="openCommandSelect">选择项目</ElButton>
        <span v-if="selectedProject" class="demo-command-value">
          已关联：{{ selectedProject.name }}
        </span>
        <span v-else class="demo-command-empty">暂未关联项目</span>
      </div>
      <ArtDataSelect
        ref="commandSelectRef"
        title="关联项目"
        :columns="projectColumns"
        :data-source="fetchProjectData"
        label-prop="name"
        mode="single"
        width="720px"
        @confirm="handleProjectConfirm"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import type { ColumnOption } from '@/types/component'
  import ArtDataSelect, {
    type DataSelectFilterOption
  } from '@/components/core/forms/art-data-select/index.vue'

  defineOptions({ name: 'DataSelectDemo' })

  // ========== 企业多选 ==========
  const companyColumns: ColumnOption[] = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'name', label: '企业名称', minWidth: 200 },
    { prop: 'industry', label: '行业', width: 120 },
    { prop: 'city', label: '城市', width: 100 },
    { prop: 'risk', label: '风险', width: 80, align: 'center' }
  ]

  const industryOptions: DataSelectFilterOption[] = [
    { label: '智慧园区', value: '智慧园区' },
    { label: '装备运维', value: '装备运维' },
    { label: '绿色材料', value: '绿色材料' },
    { label: '即时零售', value: '即时零售' },
    { label: '医药流通', value: '医药流通' },
    { label: '跨境服务', value: '跨境服务' }
  ]

  const companyData = Array.from({ length: 40 }).map((_, i) => {
    const industries = ['智慧园区', '装备运维', '绿色材料', '即时零售', '医药流通', '跨境服务']
    const cities = ['宁波市', '洛阳市', '合肥市', '泉州市', '无锡市', '佛山市', '嘉兴市', '郑州市']
    const risks = ['低', '中', '高']
    const prefixes = [
      '澄澜',
      '砚川',
      '青岚',
      '简仓',
      '白屿',
      '云阶',
      '晨泊',
      '观澜',
      '澄舟',
      '棠序'
    ]
    const suffixes = [
      '智慧园区',
      '装备运维',
      '绿色材料',
      '即时零售',
      '医药流通',
      '跨境服务',
      '城市配送',
      '运营管理'
    ]
    return {
      id: 6000 + i + 910,
      name: `${cities[i % cities.length].replace('市', '')}${prefixes[i % prefixes.length]}${suffixes[i % suffixes.length]}有限公司`,
      industry: industries[i % industries.length],
      city: cities[i % cities.length],
      risk: risks[i % 3],
      code: `${['LY', 'QZ', 'NB', 'HF', 'WX', 'FS', 'JX', 'ZZ'][i % 8]}-${String(1000 + i * 37).padStart(5, 'M')}`
    }
  })

  const selectedCompanies = ref<any[]>([companyData[1], companyData[3]])

  function fetchCompanyData(params: any) {
    return new Promise<{ list: any[]; total: number }>((resolve) => {
      setTimeout(() => {
        let data = [...companyData]
        if (params.keyword) {
          const kw = params.keyword.toLowerCase()
          data = data.filter(
            (d) =>
              d.name.toLowerCase().includes(kw) ||
              d.city.toLowerCase().includes(kw) ||
              d.industry.toLowerCase().includes(kw)
          )
        }
        if (params.industry) {
          data = data.filter((d) => d.industry === params.industry)
        }
        const { page = 1, pageSize = 10 } = params
        const start = (page - 1) * pageSize
        resolve({
          list: data.slice(start, start + pageSize),
          total: data.length
        })
      }, 300)
    })
  }

  // ========== 仓库单选 ==========
  const warehouseColumns: ColumnOption[] = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'name', label: '仓库名称', minWidth: 200 },
    { prop: 'city', label: '所在城市', width: 120 },
    { prop: 'capacity', label: '容量', width: 120, align: 'right' }
  ]

  const cityOptions: DataSelectFilterOption[] = [
    { label: '洛阳市', value: '洛阳市' },
    { label: '泉州市', value: '泉州市' },
    { label: '宁波市', value: '宁波市' },
    { label: '合肥市', value: '合肥市' }
  ]

  const warehouseData = [
    { id: 1, name: '洛龙前置调拨仓', city: '洛阳市', capacity: '5,000㎡' },
    { id: 2, name: '洛阳中心仓', city: '洛阳市', capacity: '12,000㎡' },
    { id: 3, name: '泉州东海仓', city: '泉州市', capacity: '8,000㎡' },
    { id: 4, name: '泉州晋江分仓', city: '泉州市', capacity: '6,500㎡' },
    { id: 5, name: '宁波北仑港仓', city: '宁波市', capacity: '15,000㎡' },
    { id: 6, name: '合肥高新仓', city: '合肥市', capacity: '9,200㎡' },
    { id: 7, name: '洛阳伊滨仓', city: '洛阳市', capacity: '4,800㎡' },
    { id: 8, name: '泉州南安仓', city: '泉州市', capacity: '7,300㎡' }
  ]

  const selectedWarehouse = ref<any>(warehouseData[0])

  function fetchWarehouseData(params: any) {
    return new Promise<{ list: any[]; total: number }>((resolve) => {
      setTimeout(() => {
        let data = [...warehouseData]
        if (params.keyword) {
          const kw = params.keyword.toLowerCase()
          data = data.filter(
            (d) => d.name.toLowerCase().includes(kw) || d.city.toLowerCase().includes(kw)
          )
        }
        if (params.city) {
          data = data.filter((d) => d.city === params.city)
        }
        const { page = 1, pageSize = 10 } = params
        const start = (page - 1) * pageSize
        resolve({
          list: data.slice(start, start + pageSize),
          total: data.length
        })
      }, 200)
    })
  }

  // ========== 命令式 ==========
  const projectColumns: ColumnOption[] = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'name', label: '项目名称', minWidth: 200 },
    { prop: 'owner', label: '负责人', width: 100 },
    { prop: 'status', label: '状态', width: 80, align: 'center' }
  ]

  const projectData = [
    { id: 101, name: '智慧园区建设项目', owner: '张三', status: '进行中' },
    { id: 102, name: '供应链升级项目', owner: '李四', status: '进行中' },
    { id: 103, name: '数字化转型项目', owner: '王五', status: '已完成' },
    { id: 104, name: '客户体验优化项目', owner: '赵六', status: '进行中' },
    { id: 105, name: '新仓选址项目', owner: '钱七', status: '待启动' }
  ]

  const commandSelectRef = ref<InstanceType<typeof ArtDataSelect> | null>(null)
  const selectedProject = ref<any>(null)

  function openCommandSelect() {
    commandSelectRef.value?.open(selectedProject.value ?? undefined)
  }

  function handleProjectConfirm(val: any) {
    selectedProject.value = val
  }

  function fetchProjectData(params: any) {
    return new Promise<{ list: any[]; total: number }>((resolve) => {
      setTimeout(() => {
        let data = [...projectData]
        if (params.keyword) {
          const kw = params.keyword.toLowerCase()
          data = data.filter(
            (d) => d.name.toLowerCase().includes(kw) || d.owner.toLowerCase().includes(kw)
          )
        }
        const { page = 1, pageSize = 10 } = params
        const start = (page - 1) * pageSize
        resolve({
          list: data.slice(start, start + pageSize),
          total: data.length
        })
      }, 200)
    })
  }
</script>

<style scoped lang="scss">
  .data-select-demo {
    padding: 16px;
  }

  .demo-section {
    padding: 20px;
    margin-top: 16px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
  }

  .demo-title {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .demo-desc {
    margin: 0 0 16px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .demo-current {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 16px;
    margin-top: 16px;
    background: var(--el-fill-color-light);
    border-radius: var(--el-border-radius-base);

    &-label {
      flex-shrink: 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    &-empty {
      font-size: 13px;
      color: var(--el-text-color-placeholder);
    }

    &-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    &-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }

  .demo-command {
    display: flex;
    gap: 16px;
    align-items: center;

    &-value {
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    &-empty {
      font-size: 13px;
      color: var(--el-text-color-placeholder);
    }
  }
</style>
