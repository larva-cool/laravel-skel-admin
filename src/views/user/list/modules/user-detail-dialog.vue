<template>
  <ElDialog
    v-model="dialogVisible"
    title="用户详情"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElTabs v-model="activeTab" @tab-change="handleTabChange">
      <ElTabPane label="基本资料" name="profile">
        <ElDescriptions :column="2" border class="mt-4">
          <ElDescriptionsItem label="ID" :span="1">{{ user?.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="用户名" :span="1">{{ user?.username }}</ElDescriptionsItem>
          <ElDescriptionsItem label="昵称" :span="1">{{ user?.name }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态" :span="1">
            <ElTag :type="user?.status?.value === 1 ? 'success' : 'danger'">
              {{ user?.status?.label }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="邮箱" :span="1">{{ user?.email || '—' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="手机号" :span="1">{{ user?.phone || '—' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="VIP" :span="1">
            <ElTag v-if="user?.is_vip" type="warning">VIP 至 {{ user.vip_expires_at }}</ElTag>
            <span v-else>普通用户</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="实名状态" :span="1">
            <ElTag :type="mapIdentityTagType(user?.identity_status?.value)">
              {{ user?.identity_status?.label || '—' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="认证类型" :span="1">
            {{ user?.identity_type?.label || '未提交' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="积分/金币" :span="1">
            积分 {{ user?.available_points ?? 0 }} | 金币 {{ user?.available_coins ?? 0 }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="登录次数" :span="1">{{
            user?.login_count ?? 0
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="最后登录IP" :span="1">{{
            user?.last_login_ip || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="最后登录时间" :span="1">{{
            user?.last_login_at || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="最后活跃时间" :span="1">{{
            user?.last_active_at || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="注册时间" :span="1">{{
            user?.created_at || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间" :span="1">{{
            user?.updated_at || '—'
          }}</ElDescriptionsItem>
        </ElDescriptions>

        <!-- 用户资料 -->
        <ElDivider content-position="left">扩展资料</ElDivider>
        <ElDescriptions v-if="user?.profile" :column="2" border>
          <ElDescriptionsItem label="性别" :span="1">{{
            user.profile.gender?.label || '未设置'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="生日" :span="1">{{
            user.profile.birthday || '未设置'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="个人网站" :span="1">{{
            user.profile.website || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="简介" :span="1">{{
            user.profile.intro || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="个人签名" :span="2">{{
            user.profile.bio || '—'
          }}</ElDescriptionsItem>
        </ElDescriptions>
        <ElEmpty v-else description="暂无扩展资料" :image-size="80" />
      </ElTabPane>

      <ElTabPane label="实名信息" name="identity" lazy>
        <ElEmpty
          v-if="!identityLoading && identityList.length === 0"
          description="暂无实名认证记录"
          :image-size="80"
          class="mt-4"
        />
        <template v-else>
          <ElTable
            v-loading="identityLoading"
            :data="identityList"
            stripe
            border
            size="default"
            class="mt-4"
            style="width: 100%"
          >
            <ElTableColumn prop="id" label="ID" width="80" />
            <ElTableColumn prop="type" label="认证类型" min-width="100">
              <template #default="{ row }">
                <ElTag :type="row.type === 'personal' ? 'primary' : 'success'" size="small">
                  {{ row.type_label || '—' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn
              prop="real_name"
              label="真实姓名/企业名称"
              min-width="160"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ row.type === 'personal' ? row.real_name || '—' : row.company_name || '—' }}
              </template>
            </ElTableColumn>
            <ElTableColumn prop="status" label="状态" min-width="100">
              <template #default="{ row }">
                <ElTag :type="mapTagType(row.status_label_type)" size="small">
                  {{ row.status_label || '—' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="submitted_at" label="提交时间" min-width="170">
              <template #default="{ row }">{{
                row.submitted_at || row.created_at || '—'
              }}</template>
            </ElTableColumn>
            <ElTableColumn prop="reviewed_at" label="审核时间" min-width="170">
              <template #default="{ row }">{{ row.reviewed_at || '—' }}</template>
            </ElTableColumn>
            <ElTableColumn prop="expires_at" label="有效期" min-width="170">
              <template #default="{ row }">{{ row.expires_at || '—' }}</template>
            </ElTableColumn>
          </ElTable>

          <!-- 最新认证详情 -->
          <template v-if="identityLatest">
            <ElDivider content-position="left">最新认证详情</ElDivider>
            <!-- 个人认证 -->
            <template v-if="identityLatest.type === 'personal'">
              <ElDescriptions :column="2" border size="small">
                <ElDescriptionsItem label="真实姓名">{{
                  identityLatest.real_name || '—'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="身份证号">{{
                  identityLatest.id_card_no || '—'
                }}</ElDescriptionsItem>
              </ElDescriptions>
              <div class="grid grid-cols-3 gap-3 mt-3">
                <div v-for="item in identityPersonalAttachments" :key="item.label">
                  <div class="text-xs text-g-500 mb-1">{{ item.label }}</div>
                  <ElImage
                    v-if="item.att"
                    :src="item.att.url"
                    :preview-src-list="[item.att.url]"
                    fit="cover"
                    class="w-full h-32 rounded-md overflow-hidden border border-[var(--el-border-color-lighter)] cursor-zoom-in"
                    preview-teleported
                  />
                  <div
                    v-else
                    class="w-full h-32 rounded-md border border-dashed border-[var(--el-border-color-lighter)] flex items-center justify-center text-xs text-g-400"
                  >
                    未上传
                  </div>
                </div>
              </div>
            </template>
            <!-- 企业认证 -->
            <template v-else>
              <ElDescriptions :column="2" border size="small">
                <ElDescriptionsItem label="企业名称" :span="2">{{
                  identityLatest.company_name || '—'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="统一社会信用代码">{{
                  identityLatest.credit_code || '—'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="法人姓名">{{
                  identityLatest.legal_person_name || '—'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="法人身份证号">{{
                  identityLatest.legal_person_id_card_no || '—'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="对公账户">{{
                  identityLatest.bank_account || '—'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="开户行" :span="2">{{
                  identityLatest.bank_name || '—'
                }}</ElDescriptionsItem>
              </ElDescriptions>
              <div class="grid grid-cols-2 gap-3 mt-3">
                <div v-for="item in identityEnterpriseAttachments" :key="item.label">
                  <div class="text-xs text-g-500 mb-1">{{ item.label }}</div>
                  <ElImage
                    v-if="item.att"
                    :src="item.att.url"
                    :preview-src-list="[item.att.url]"
                    fit="cover"
                    class="w-full h-40 rounded-md overflow-hidden border border-[var(--el-border-color-lighter)] cursor-zoom-in"
                    preview-teleported
                  />
                  <div
                    v-else
                    class="w-full h-40 rounded-md border border-dashed border-[var(--el-border-color-lighter)] flex items-center justify-center text-xs text-g-400"
                  >
                    未上传
                  </div>
                </div>
              </div>
            </template>
            <!-- 审核信息 -->
            <ElDescriptions :column="2" border size="small" class="mt-3">
              <ElDescriptionsItem label="审核管理员">{{
                identityLatest.admin_name || '未审核'
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="审核时间">{{
                identityLatest.reviewed_at || '—'
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="驳回原因">
                <ElTag
                  v-if="identityLatest.reject_reason"
                  :type="mapTagType(identityLatest.reject_reason_label_type)"
                  size="small"
                >
                  {{ identityLatest.reject_reason_label || identityLatest.reject_reason }}
                </ElTag>
                <span v-else>—</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="驳回备注">{{
                identityLatest.reject_remark || '—'
              }}</ElDescriptionsItem>
            </ElDescriptions>
          </template>
        </template>
      </ElTabPane>

      <ElTabPane label="登录历史" name="histories" lazy>
        <div class="tab-filters mt-4">
          <ElDatePicker
            v-model="historyDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            @change="handleDateRangeChange"
          />
        </div>
        <ElTable
          v-loading="historyLoading"
          :data="historyList"
          stripe
          border
          size="default"
          class="mt-4"
          style="width: 100%"
        >
          <ElTableColumn type="index" label="#" width="60" align="center" />
          <ElTableColumn prop="ip" label="登录IP" min-width="130" />
          <ElTableColumn prop="address" label="地址" min-width="120">
            <template #default="{ row }">{{ row.address || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="device" label="设备" min-width="100">
            <template #default="{ row }">{{ row.device || row.platform || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="browser" label="浏览器" min-width="120">
            <template #default="{ row }">{{ row.browser || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="login_at" label="登录时间" min-width="170" />
        </ElTable>

        <div class="tab-pagination">
          <ElPagination
            v-model:current-page="historyPage.page"
            v-model:page-size="historyPage.per_page"
            :page-sizes="[10, 15, 20, 30, 50]"
            :total="historyTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadHistories"
            @current-change="loadHistories"
          />
        </div>
      </ElTabPane>

      <ElTabPane label="社交账户" name="socials" lazy>
        <ElTable
          v-loading="socialLoading"
          :data="socialList"
          stripe
          border
          size="default"
          class="mt-4"
          style="width: 100%"
        >
          <ElTableColumn type="index" label="#" width="60" align="center" />
          <ElTableColumn prop="provider" label="渠道" min-width="120">
            <template #default="{ row }">
              <ElTag type="primary">{{ row.provider?.label || row.provider?.value || '—' }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="openid" label="OpenID" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.openid || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="unionid" label="UnionID" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.unionid || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="expiry_at" label="令牌过期时间" min-width="170">
            <template #default="{ row }">{{ row.expiry_at || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="created_at" label="绑定时间" min-width="170" />
        </ElTable>

        <div class="tab-pagination">
          <ElPagination
            v-model:current-page="socialPage.page"
            v-model:page-size="socialPage.per_page"
            :page-sizes="[10, 15, 20, 30, 50]"
            :total="socialTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadSocials"
            @current-change="loadSocials"
          />
        </div>
      </ElTabPane>

      <ElTabPane label="积分记录" name="points" lazy>
        <div class="tab-filters mt-4">
          <ElInput
            v-model="pointKeyword"
            placeholder="搜索描述"
            clearable
            style="width: 200px"
            @keyup.enter="handlePointSearch"
            @clear="handlePointSearch"
          />
          <ElDatePicker
            v-model="pointDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            @change="handlePointSearch"
          />
          <ElButton type="primary" @click="handlePointSearch">搜索</ElButton>
          <ElButton :loading="isPointExporting" @click="handlePointExport">
            <ElIcon class="mr-1"><Download /></ElIcon>
            导出
          </ElButton>
        </div>
        <ElTable
          v-loading="pointLoading"
          :data="pointList"
          stripe
          border
          size="default"
          class="mt-4"
          style="width: 100%"
        >
          <ElTableColumn prop="id" label="流水号" width="100" />
          <ElTableColumn prop="points" label="变动积分" width="110" align="right">
            <template #default="{ row }">
              <span :class="row.points >= 0 ? 'amount-plus' : 'amount-minus'">
                {{ row.points >= 0 ? '+' : '' }}{{ row.points }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="type" label="类型" min-width="110">
            <template #default="{ row }">
              <ElTag type="info">{{ row.type?.label || row.type?.value || '—' }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="description" label="描述" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.description || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="expired_at" label="过期时间" min-width="170">
            <template #default="{ row }">{{ row.expired_at || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="created_at" label="发生时间" min-width="170" />
        </ElTable>

        <div class="tab-pagination">
          <ElPagination
            v-model:current-page="pointPage.page"
            v-model:page-size="pointPage.per_page"
            :page-sizes="[10, 15, 20, 30, 50]"
            :total="pointTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadPointTrades"
            @current-change="loadPointTrades"
          />
        </div>
      </ElTabPane>

      <ElTabPane label="金币记录" name="coins" lazy>
        <div class="tab-filters mt-4">
          <ElInput
            v-model="coinKeyword"
            placeholder="搜索描述"
            clearable
            style="width: 200px"
            @keyup.enter="handleCoinSearch"
            @clear="handleCoinSearch"
          />
          <ElDatePicker
            v-model="coinDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            @change="handleCoinSearch"
          />
          <ElButton type="primary" @click="handleCoinSearch">搜索</ElButton>
          <ElButton :loading="isCoinExporting" @click="handleCoinExport">
            <ElIcon class="mr-1"><Download /></ElIcon>
            导出
          </ElButton>
        </div>
        <ElTable
          v-loading="coinLoading"
          :data="coinList"
          stripe
          border
          size="default"
          class="mt-4"
          style="width: 100%"
        >
          <ElTableColumn prop="id" label="流水号" width="100" />
          <ElTableColumn prop="coins" label="变动金币" width="110" align="right">
            <template #default="{ row }">
              <span :class="row.coins >= 0 ? 'amount-plus' : 'amount-minus'">
                {{ row.coins >= 0 ? '+' : '' }}{{ row.coins }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="type" label="类型" min-width="110">
            <template #default="{ row }">
              <ElTag type="info">{{ row.type?.label || row.type?.value || '—' }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="description" label="描述" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.description || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="created_at" label="发生时间" min-width="170" />
        </ElTable>

        <div class="tab-pagination">
          <ElPagination
            v-model:current-page="coinPage.page"
            v-model:page-size="coinPage.per_page"
            :page-sizes="[10, 15, 20, 30, 50]"
            :total="coinTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadCoinTrades"
            @current-change="loadCoinTrades"
          />
        </div>
      </ElTabPane>

      <ElTabPane label="钱包流水" name="wallet" lazy>
        <!-- 钱包概览 -->
        <div v-if="walletOverview" class="wallet-overview mt-4">
          <ElDescriptions :column="4" border size="small">
            <ElDescriptionsItem label="可用余额">
              <span class="font-semibold text-primary"
                >¥{{ formatMoney(walletOverview.balance) }}</span
              >
            </ElDescriptionsItem>
            <ElDescriptionsItem label="冻结余额">
              <span class="text-warning">¥{{ formatMoney(walletOverview.frozen_balance) }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="累计收入">
              <span class="text-success">¥{{ formatMoney(walletOverview.total_income) }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="累计支出">
              <span class="text-danger">¥{{ formatMoney(walletOverview.total_expense) }}</span>
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>

        <div class="tab-filters mt-4">
          <ElInput
            v-model="walletKeyword"
            placeholder="搜索交易描述"
            clearable
            style="width: 200px"
            @keyup.enter="handleWalletSearch"
            @clear="handleWalletSearch"
          />
          <ElSelect
            v-model="walletType"
            placeholder="交易类型"
            clearable
            style="width: 140px"
            @change="handleWalletSearch"
          >
            <ElOption
              v-for="opt in walletTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
          <ElSelect
            v-model="walletStatus"
            placeholder="流水状态"
            clearable
            style="width: 120px"
            @change="handleWalletSearch"
          >
            <ElOption
              v-for="opt in walletStatusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
          <ElDatePicker
            v-model="walletDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            @change="handleWalletSearch"
          />
          <ElButton type="primary" @click="handleWalletSearch">搜索</ElButton>
        </div>
        <ElTable
          v-loading="walletLoading"
          :data="walletList"
          stripe
          border
          size="default"
          class="mt-4"
          style="width: 100%"
        >
          <ElTableColumn prop="id" label="流水号" width="90" />
          <ElTableColumn prop="amount" label="变动金额" width="130" align="right">
            <template #default="{ row }">
              <span :class="toNumber(row.amount) >= 0 ? 'amount-plus' : 'amount-minus'">
                {{ toNumber(row.amount) >= 0 ? '+' : '-' }}¥{{
                  formatMoney(Math.abs(toNumber(row.amount)))
                }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="type" label="交易类型" min-width="110">
            <template #default="{ row }">
              <ElTag :type="mapTagType(row.type_label_type)" size="small" effect="plain">
                {{ row.type?.label || '—' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="status" label="状态" min-width="90">
            <template #default="{ row }">
              <ElTag :type="mapTagType(row.status_label_type)" size="small">
                {{ row.status?.label || '—' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="before_balance" label="变动前余额" min-width="120" align="right">
            <template #default="{ row }">¥{{ formatMoney(row.before_balance) }}</template>
          </ElTableColumn>
          <ElTableColumn prop="after_balance" label="变动后余额" min-width="120" align="right">
            <template #default="{ row }">
              <span class="font-semibold">¥{{ formatMoney(row.after_balance) }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="description" label="交易描述" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.description || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="created_at" label="交易时间" min-width="170" />
        </ElTable>

        <div class="tab-pagination">
          <ElPagination
            v-model:current-page="walletPage.page"
            v-model:page-size="walletPage.per_page"
            :page-sizes="[10, 15, 20, 30, 50]"
            :total="walletTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadWalletTrades"
            @current-change="loadWalletTrades"
          />
        </div>
      </ElTabPane>

      <ElTabPane label="收款账户" name="withdraw_accounts" lazy>
        <ElEmpty
          v-if="!withdrawAccountLoading && withdrawAccountList.length === 0"
          description="暂无收款账户"
          :image-size="80"
          class="mt-4"
        />
        <template v-else>
          <ElTable
            v-loading="withdrawAccountLoading"
            :data="withdrawAccountList"
            stripe
            border
            size="default"
            class="mt-4"
            style="width: 100%"
          >
            <ElTableColumn prop="id" label="ID" width="80" />
            <ElTableColumn prop="account_type" label="账户类型" min-width="100">
              <template #default="{ row }">
                <ElTag :type="mapTagType(row.account_type_label_type)" size="small">
                  {{ row.account_type?.label || '—' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="real_name" label="开户人姓名" min-width="120">
              <template #default="{ row }">{{ row.real_name || '—' }}</template>
            </ElTableColumn>
            <ElTableColumn prop="account_no" label="收款账号" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ row.account_no || '—' }}</template>
            </ElTableColumn>
            <ElTableColumn prop="bank_name" label="开户银行" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ row.bank_name || '—' }}</template>
            </ElTableColumn>
            <ElTableColumn prop="bank_branch" label="支行" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ row.bank_branch || '—' }}</template>
            </ElTableColumn>
            <ElTableColumn label="标签" width="150">
              <template #default="{ row }">
                <div class="flex flex-wrap gap-1">
                  <ElTag v-if="row.is_default" type="success" size="small">默认</ElTag>
                  <ElTag v-if="row.is_verified" type="primary" size="small">已验证</ElTag>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="status" label="状态" min-width="90">
              <template #default="{ row }">
                <ElTag :type="mapTagType(row.status_label_type)" size="small">
                  {{ row.status?.label || '—' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="last_used_at" label="最后使用时间" min-width="170">
              <template #default="{ row }">{{ row.last_used_at || '—' }}</template>
            </ElTableColumn>
            <ElTableColumn prop="created_at" label="添加时间" min-width="170" />
          </ElTable>

          <div class="tab-pagination">
            <ElPagination
              v-model:current-page="withdrawAccountPage.page"
              v-model:page-size="withdrawAccountPage.per_page"
              :page-sizes="[10, 15, 20, 30, 50]"
              :total="withdrawAccountTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="loadWithdrawAccounts"
              @current-change="loadWithdrawAccounts"
            />
          </div>
        </template>
      </ElTabPane>

      <ElTabPane label="邀请记录" name="invites" lazy>
        <ElTable
          v-loading="inviteLoading"
          :data="inviteList"
          stripe
          border
          size="default"
          class="mt-4"
          style="width: 100%"
        >
          <ElTableColumn prop="id" label="ID" width="80" />
          <ElTableColumn prop="invitee_type" label="被邀请人类型" width="130">
            <template #default="{ row }">
              <ElTag :type="row.invitee_type === 'admin' ? 'warning' : 'info'" size="small">
                {{ row.invitee_type === 'admin' ? '管理员' : '前台用户' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="invitee_name" label="被邀请人" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.invitee_name || `#${row.invitee_id}` }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="description" label="描述" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.description || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="created_at" label="邀请时间" min-width="170" />
        </ElTable>

        <div class="tab-pagination">
          <ElPagination
            v-model:current-page="invitePage.page"
            v-model:page-size="invitePage.per_page"
            :page-sizes="[10, 15, 20, 30, 50]"
            :total="inviteTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadInvites"
            @current-change="loadInvites"
          />
        </div>
      </ElTabPane>
    </ElTabs>

    <template #footer>
      <ElButton type="primary" @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    fetchExportUserCoinTrades,
    fetchExportUserPointTrades,
    fetchGetInviteRecordList,
    fetchGetUserDetail,
    fetchUserCoinTrades,
    fetchUserLoginHistories,
    fetchUserPointTrades,
    fetchUserSocials
  } from '@/api/user-manage'
  import {
    fetchGetUserWallet,
    fetchUserWalletTrades,
    fetchUserWithdrawAccounts
  } from '@/api/wallet'
  import { fetchGetIdentityVerificationList } from '@/api/system-manage'
  import { useExport } from '@/hooks/core/useExport'
  import { Download } from '@element-plus/icons-vue'

  defineOptions({ name: 'UserDetailDialog' })

  type UserDetail = Api.UserManage.UserDetail
  type LoginHistoryItem = Api.UserManage.LoginHistoryItem
  type SocialItem = Api.UserManage.SocialItem
  type PointTradeItem = Api.UserManage.PointTradeItem
  type CoinTradeItem = Api.UserManage.CoinTradeItem
  type InviteRecordItem = Api.UserManage.InviteRecordItem
  type WalletTradeItem = Api.WalletManage.WalletTrade
  type WithdrawAccountItem = Api.WalletManage.WithdrawAccount
  type IdentityItem = Api.SystemManage.IdentityVerificationListItem

  const dialogVisible = ref(false)
  const activeTab = ref<
    | 'profile'
    | 'histories'
    | 'socials'
    | 'points'
    | 'coins'
    | 'wallet'
    | 'withdraw_accounts'
    | 'identity'
    | 'invites'
  >('profile')

  const user = ref<UserDetail | null>(null)

  // 实名认证状态 → Element Plus Tag 类型
  function mapIdentityTagType(
    status?: string
  ): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
    switch (status) {
      case 'approved':
        return 'success'
      case 'pending':
        return 'warning'
      case 'rejected':
        return 'danger'
      case 'unsubmitted':
      default:
        return 'info'
    }
  }

  // 登录历史
  const historyList = ref<LoginHistoryItem[]>([])
  const historyLoading = ref(false)
  const historyLoaded = ref(false)
  const historyTotal = ref(0)
  const historyDateRange = ref<string[]>([])
  const historyPage = reactive({ page: 1, per_page: 15 })

  // 社交账户
  const socialList = ref<SocialItem[]>([])
  const socialLoading = ref(false)
  const socialLoaded = ref(false)
  const socialTotal = ref(0)
  const socialPage = reactive({ page: 1, per_page: 15 })

  // 积分记录
  const pointList = ref<PointTradeItem[]>([])
  const pointLoading = ref(false)
  const pointLoaded = ref(false)
  const pointTotal = ref(0)
  const pointKeyword = ref('')
  const pointDateRange = ref<string[]>([])
  const pointPage = reactive({ page: 1, per_page: 15 })

  // 金币记录
  const coinList = ref<CoinTradeItem[]>([])
  const coinLoading = ref(false)
  const coinLoaded = ref(false)
  const coinTotal = ref(0)
  const coinKeyword = ref('')
  const coinDateRange = ref<string[]>([])
  const coinPage = reactive({ page: 1, per_page: 15 })

  // 邀请记录
  const inviteList = ref<InviteRecordItem[]>([])
  const inviteLoading = ref(false)
  const inviteLoaded = ref(false)
  const inviteTotal = ref(0)
  const invitePage = reactive({ page: 1, per_page: 15 })

  // 钱包流水
  const walletList = ref<WalletTradeItem[]>([])
  const walletLoading = ref(false)
  const walletLoaded = ref(false)
  const walletTotal = ref(0)
  const walletKeyword = ref('')
  const walletType = ref('')
  const walletStatus = ref('')
  const walletDateRange = ref<string[]>([])
  const walletPage = reactive({ page: 1, per_page: 15 })
  const walletOverview = ref<Api.WalletManage.UserWallet | null>(null)

  // 收款账户
  const withdrawAccountList = ref<WithdrawAccountItem[]>([])
  const withdrawAccountLoading = ref(false)
  const withdrawAccountLoaded = ref(false)
  const withdrawAccountTotal = ref(0)
  const withdrawAccountPage = reactive({ page: 1, per_page: 15 })

  // 实名认证
  const identityList = ref<IdentityItem[]>([])
  const identityLoading = ref(false)
  const identityLoaded = ref(false)
  const identityLatest = computed(() => identityList.value[0] ?? null)

  const identityPersonalAttachments = computed(() => {
    const d = identityLatest.value
    if (!d) return []
    return [
      { label: '身份证人像面', att: d.id_card_front },
      { label: '身份证国徽面', att: d.id_card_back },
      { label: '手持身份证', att: d.handheld }
    ]
  })

  const identityEnterpriseAttachments = computed(() => {
    const d = identityLatest.value
    if (!d) return []
    return [
      { label: '营业执照', att: d.business_license },
      { label: '开户许可证', att: d.opening_permit }
    ]
  })

  const walletTypeOptions = [
    { label: '充值', value: 'recharge' },
    { label: '提现', value: 'withdraw' },
    { label: '冻结', value: 'freeze' },
    { label: '解冻', value: 'unfreeze' },
    { label: '消费', value: 'payment' },
    { label: '退款', value: 'refund' },
    { label: '后台充正', value: 'admin_recharge' },
    { label: '后台扣减', value: 'admin_deduct' }
  ]

  const walletStatusOptions = [
    { label: '处理中', value: 'pending' },
    { label: '已完成', value: 'success' },
    { label: '已失败', value: 'failed' }
  ]

  // 导出
  const { isExporting: isPointExporting, handleExport: doPointExport } = useExport()
  const { isExporting: isCoinExporting, handleExport: doCoinExport } = useExport()

  const buildTradeExportParams = (keyword: string, range: string[]) => {
    const params: { keyword?: string; type?: string; start_date?: string; end_date?: string } = {}
    if (keyword) params.keyword = keyword
    if (range?.length === 2) {
      params.start_date = range[0]
      params.end_date = range[1]
    }
    return params
  }

  const handlePointExport = () => {
    if (!user.value) return
    const params = buildTradeExportParams(pointKeyword.value, pointDateRange.value)
    doPointExport(() => fetchExportUserPointTrades(user.value!.id, params), 'point_trades')
  }

  const handleCoinExport = () => {
    if (!user.value) return
    const params = buildTradeExportParams(coinKeyword.value, coinDateRange.value)
    doCoinExport(() => fetchExportUserCoinTrades(user.value!.id, params), 'coin_trades')
  }

  const open = async (row: Api.UserManage.UserListItem) => {
    dialogVisible.value = true
    activeTab.value = 'profile'

    historyPage.page = 1
    historyLoaded.value = false
    historyList.value = []
    historyTotal.value = 0
    historyDateRange.value = []

    socialPage.page = 1
    socialLoaded.value = false
    socialList.value = []
    socialTotal.value = 0

    pointPage.page = 1
    pointLoaded.value = false
    pointList.value = []
    pointTotal.value = 0
    pointKeyword.value = ''
    pointDateRange.value = []

    coinPage.page = 1
    coinLoaded.value = false
    coinList.value = []
    coinTotal.value = 0
    coinKeyword.value = ''
    coinDateRange.value = []

    invitePage.page = 1
    inviteLoaded.value = false
    inviteList.value = []
    inviteTotal.value = 0

    walletPage.page = 1
    walletLoaded.value = false
    walletList.value = []
    walletTotal.value = 0
    walletKeyword.value = ''
    walletType.value = ''
    walletStatus.value = ''
    walletDateRange.value = []
    walletOverview.value = null

    withdrawAccountPage.page = 1
    withdrawAccountLoaded.value = false
    withdrawAccountList.value = []
    withdrawAccountTotal.value = 0

    identityLoaded.value = false
    identityList.value = []

    // 拉取详情（含 profile）
    try {
      user.value = await fetchGetUserDetail(row.id)
    } catch {
      user.value = { ...row } as UserDetail
    }
  }

  const handleClose = () => {
    dialogVisible.value = false
    user.value = null
  }

  const handleTabChange = (name: string | number) => {
    if (!user.value) return
    if (name === 'histories' && !historyLoaded.value) loadHistories()
    if (name === 'socials' && !socialLoaded.value) loadSocials()
    if (name === 'points' && !pointLoaded.value) loadPointTrades()
    if (name === 'coins' && !coinLoaded.value) loadCoinTrades()
    if (name === 'wallet' && !walletLoaded.value) loadWalletTrades()
    if (name === 'withdraw_accounts' && !withdrawAccountLoaded.value) loadWithdrawAccounts()
    if (name === 'identity' && !identityLoaded.value) loadIdentityVerifications()
    if (name === 'invites' && !inviteLoaded.value) loadInvites()
  }

  const handleDateRangeChange = () => {
    historyPage.page = 1
    loadHistories()
  }

  const loadHistories = async () => {
    if (!user.value) return
    historyLoading.value = true
    try {
      const params: Api.Common.LaravelPaginationRequest & {
        login_start?: string
        login_end?: string
      } = {
        page: historyPage.page,
        per_page: historyPage.per_page
      }
      if (historyDateRange.value?.length === 2) {
        params.login_start = historyDateRange.value[0]
        params.login_end = historyDateRange.value[1]
      }
      const res = await fetchUserLoginHistories(user.value.id, params)
      historyList.value = res?.data || []
      historyTotal.value = res?.meta?.total || 0
      historyLoaded.value = true
    } finally {
      historyLoading.value = false
    }
  }

  const loadSocials = async () => {
    if (!user.value) return
    socialLoading.value = true
    try {
      const res = await fetchUserSocials(user.value.id, {
        page: socialPage.page,
        per_page: socialPage.per_page
      })
      socialList.value = res?.data || []
      socialTotal.value = res?.meta?.total || 0
      socialLoaded.value = true
    } finally {
      socialLoading.value = false
    }
  }

  const handlePointSearch = () => {
    pointPage.page = 1
    loadPointTrades()
  }

  const loadPointTrades = async () => {
    if (!user.value) return
    pointLoading.value = true
    try {
      const params: Api.Common.LaravelPaginationRequest & {
        keyword?: string
        start_date?: string
        end_date?: string
      } = {
        page: pointPage.page,
        per_page: pointPage.per_page
      }
      if (pointKeyword.value) params.keyword = pointKeyword.value
      if (pointDateRange.value?.length === 2) {
        params.start_date = pointDateRange.value[0]
        params.end_date = pointDateRange.value[1]
      }
      const res = await fetchUserPointTrades(user.value.id, params)
      pointList.value = res?.data || []
      pointTotal.value = res?.meta?.total || 0
      pointLoaded.value = true
    } finally {
      pointLoading.value = false
    }
  }

  const handleCoinSearch = () => {
    coinPage.page = 1
    loadCoinTrades()
  }

  const loadCoinTrades = async () => {
    if (!user.value) return
    coinLoading.value = true
    try {
      const params: Api.Common.LaravelPaginationRequest & {
        keyword?: string
        start_date?: string
        end_date?: string
      } = {
        page: coinPage.page,
        per_page: coinPage.per_page
      }
      if (coinKeyword.value) params.keyword = coinKeyword.value
      if (coinDateRange.value?.length === 2) {
        params.start_date = coinDateRange.value[0]
        params.end_date = coinDateRange.value[1]
      }
      const res = await fetchUserCoinTrades(user.value.id, params)
      coinList.value = res?.data || []
      coinTotal.value = res?.meta?.total || 0
      coinLoaded.value = true
    } finally {
      coinLoading.value = false
    }
  }

  const loadInvites = async () => {
    if (!user.value) return
    inviteLoading.value = true
    try {
      const res = await fetchGetInviteRecordList({
        page: invitePage.page,
        per_page: invitePage.per_page,
        inviter_type: 'user',
        inviter_id: user.value.id
      })
      inviteList.value = res?.data || []
      inviteTotal.value = res?.meta?.total || 0
      inviteLoaded.value = true
    } finally {
      inviteLoading.value = false
    }
  }

  // ========== 钱包流水 ==========

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  function toNumber(v: number | string | null | undefined): number {
    if (v == null) return 0
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : 0
  }

  function formatMoney(v: number | string | null | undefined): string {
    return toNumber(v).toFixed(2)
  }

  const handleWalletSearch = () => {
    walletPage.page = 1
    loadWalletTrades()
  }

  const loadWalletTrades = async () => {
    if (!user.value) return
    walletLoading.value = true
    try {
      // 首次加载时获取钱包概览
      if (!walletOverview.value) {
        try {
          walletOverview.value = await fetchGetUserWallet(user.value.id)
        } catch {
          // 概览加载失败不阻塞流水列表
        }
      }

      const params: Api.Common.LaravelPaginationRequest & {
        type?: string
        status?: string
        keyword?: string
        start_date?: string
        end_date?: string
      } = {
        page: walletPage.page,
        per_page: walletPage.per_page
      }
      if (walletKeyword.value) params.keyword = walletKeyword.value
      if (walletType.value) params.type = walletType.value
      if (walletStatus.value) params.status = walletStatus.value
      if (walletDateRange.value?.length === 2) {
        params.start_date = walletDateRange.value[0]
        params.end_date = walletDateRange.value[1]
      }
      const res = await fetchUserWalletTrades(user.value.id, params)
      walletList.value = res?.data || []
      walletTotal.value = res?.meta?.total || 0
      walletLoaded.value = true
    } finally {
      walletLoading.value = false
    }
  }

  // ========== 收款账户 ==========

  const loadWithdrawAccounts = async () => {
    if (!user.value) return
    withdrawAccountLoading.value = true
    try {
      const res = await fetchUserWithdrawAccounts(user.value.id, {
        page: withdrawAccountPage.page,
        per_page: withdrawAccountPage.per_page
      })
      withdrawAccountList.value = res?.data || []
      withdrawAccountTotal.value = res?.meta?.total || 0
      withdrawAccountLoaded.value = true
    } finally {
      withdrawAccountLoading.value = false
    }
  }

  // ========== 实名认证 ==========

  const loadIdentityVerifications = async () => {
    if (!user.value) return
    identityLoading.value = true
    try {
      const res = await fetchGetIdentityVerificationList({
        verifiable_id: user.value.id,
        page: 1,
        per_page: 20
      })
      identityList.value = res?.data || []
      identityLoaded.value = true
    } finally {
      identityLoading.value = false
    }
  }

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .mt-4 {
    margin-top: 12px;
  }

  .tab-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .tab-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .amount-plus {
    font-weight: 500;
    color: var(--el-color-success);
  }

  .amount-minus {
    font-weight: 500;
    color: var(--el-color-danger);
  }
</style>
