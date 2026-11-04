# Account 页面规划 · 2026-11-04

## 实施状态 · 2026-11-05

`/account/plans` 与 `/account/billing` 实现完成。Account 菜单指向两个页面；服务端会话校验、余额与窗口查询、交易记录、历史分页、登录返回与门户操作纳入实现。验收记录见 [页面实施报告](account-pages-2026-11-05/review.md)。

## 规划时交付 · 2026-11-04

- Account 下拉框：Google 头像、姓名首字母回退、姓名与邮箱、操作行、焦点与错误状态。
- 本文：Manage billing 与 Plans and credits 的页面结构、数据来源、状态与实施顺序。
- 规划时菜单的 Plans and credits 链接指向 `/pricing`；Manage billing 调用 `/api/billing/portal`，进入 Creem 客户门户。

## 页面职责与导航

| 页面 | 解决的问题 | 建议路由 | 主操作 |
| --- | --- | --- | --- |
| Plans and credits | 账户有多少可用额度？额度何时到期？套餐包含什么？ | `/account/plans` | Buy Starter Pack / Explore plans |
| Manage billing | 订阅处于什么状态？付款记录在哪里？如何管理付款与取消？ | `/account/billing` | Open billing portal |
| Pricing | 产品套餐、价格与购买入口 | `/pricing` | 选择套餐 |

账户页共用网站导航与窄版内容框。标题下方放置 Plans and credits / Manage billing 两个文字标签导航；当前页使用底色与 `aria-current="page"`。页头右侧保留头像菜单，正文避免重复展示姓名与邮箱。

视觉沿用纸色 `--paper`、浅纸色 `--paper-soft`、墨色 `--reading-ink` 与绿色情境操作。标题 28px，正文 14–16px，辅助文字 12–14px，区块间距 32px。桌面内容宽度上限 1120px；手机外边距 20px，按钮触达高度 44px。金额与额度使用等宽数字。付款状态同时使用文字。

## Plans and credits

### 桌面结构

```text
Plans and credits                         Explore plans
[Plans and credits]  Manage billing

Available credits       Current access
实际余额 · 可描述图片数    Free / Pro Monthly / Pro Annual
                         订阅权益结束日期 / 额度窗口结束日期

Credit breakdown
来源             可用额度          有效期
Welcome          实际余额          No expiry
Starter Pack     实际余额          No expiry
Subscription     当前窗口余额       窗口结束时间

Recent credit activity                      View all
时间             事项              额度变化

Need more credits?
Starter Pack 购买入口 + Pro 套餐链接
```

### 内容与规则

- 可描述图片数 = `floor(remaining / CREDITS_PER_IMAGE)`，界面说明每次图片描述消耗 10 credits、包含四种文字格式。
- 账户欢迎额度为 20 credits，Starter Pack 为 $6.99 / 500 credits / 50 次图片描述，无到期日。
- Pro Monthly 为 $9.90 / 月，月度额度 2,000 credits；Pro Annual 为 $79.90 / 年，按月开放 3,000 credits。年费支付周期与额度窗口分列展示。
- Starter Pack 是额度包；购买额度包不会开启 Pro 的批处理与 CSV 权益。Free 账户可以持有购买额度。
- `remaining` 包含有效窗口内、未撤销的可用额度；未来窗口额度、过期额度与撤销额度排除。额度分类保留实际的历史订单授予数量。
- 订阅进度条的分母取当前有效授予额度，避免用现价套餐额度替代历史权益。混合来源的总余额使用数字与分类表。
- Recent credit activity 展示生成扣款、购买、欢迎额度、退回与撤销。订阅额度过期通过窗口推导，文案注明到期事件；数据库缺少独立 expiry ledger 事件。
- 额度不足时在余额区提供购买入口；购买确认状态来源于服务端订单与 webhook。
- 有效 Pro 账户展示 Manage billing；套餐切换入口走计费流程。禁止重复创建重叠订阅，禁止在前端承诺补差价或即时切换规则。

### 手机结构

标题 → 标签导航 → 可用额度与图片数 → 权益与有效期 → 分类列表 → 最近记录 → 购买入口。分类表转换成来源、余额和有效期的两行列表；记录保留时间与变化符号。

## Manage billing

### 桌面结构

```text
Manage billing                      Open billing portal ↗
Plans and credits  [Manage billing]

Subscription
套餐名称 · 状态
Billing interval       Paid access until
月付 / 年付             付费权益结束时间
Manage in Creem ↗

Payment details
Payment methods, billing address and receipts are managed in Creem.
Open billing portal ↗

Payment history
日期             产品 / 周期        状态          金额

Credits are under Plans and credits →
```

### 内容与规则

- 订阅区区分 active、scheduled_cancel、canceled、expired 与支付状态未知。取消续订但 `paid_through` 未到的账户保留付费权益，并显示 Access until。
- `paid_through` 表示权益截止时间；避免将其标为下一次扣款时间。展示 Next payment 需要付款提供方提供的续订信息。
- 付款方式、发票抬头、账单地址、取消订阅与续订管理委托给 Creem。站内页面提供摘要和门户按钮，避免模拟信用卡表单。
- 没有付费历史：显示 No billing account yet，提供 View plans；避免将正常空状态呈现为错误。
- 有 Starter 购买、无订阅：显示 No active subscription，保留购买记录与可用门户入口。
- 付款记录按支付交易展示，包含续费。`billing_orders` 是订单，不能代替完整付款流水。
- 现有 `billing_payments` 缺少每次交易金额、币种与收据 URL；首版记录可以展示付款日期、产品、周期和状态，缺失金额显示 “—”。补齐交易金额与收据来源后开放金额列与下载按钮。
- 收据链接取已验证的付款提供方数据，避免拼接未知 URL。旧订单金额可用于订单摘要，避免充当续费交易金额。
- 门户请求时禁用重复操作并显示 Opening billing…。失败提示位于操作区，保留重试入口；请求超时、未登录、无客户账户与服务不可用使用对应提示。

### 手机结构

标题 → 标签导航 → 订阅摘要 → 门户按钮 → 付款说明 → 付款记录列表。记录第一行展示产品与金额，第二行展示日期、周期与状态。门户按钮处于首屏。

## 数据与接口边界

以下为实施建议，接口尚未创建。

| 数据 | 现有来源 | 实施补充 |
| --- | --- | --- |
| 头像、姓名、邮箱 | Auth.js `session.user` | 使用 Google image；缺失或加载失败时使用首字母 |
| 总余额、免费/付费余额、Pro 权益 | `/api/usage`、`getUsageStatus` | 保留现有接口；付费分类需要按来源拆分 |
| 额度来源、当前窗口、到期日 | `credit_grants` | 账户服务返回有效 grants 与独立的未来窗口摘要 |
| 订阅套餐、状态、权益截止时间 | `billing_subscriptions` + `billing_orders` | 关联订单的 offer 与 environment；保留原始状态及展示状态 |
| 额度流水 | `credit_ledger` + `credit_grants` + `usage_reservations` | 将用户记录按 reservation 聚合，避免分摊扣款重复显示 |
| 支付历史 | `billing_payments` + `billing_orders` | 按交易分页；金额与收据需要数据扩展 |
| 门户 | `POST /api/billing/portal` | 复用同源校验、环境隔离和客户归属校验 |
| 套餐购买 | `POST /api/billing/checkout` | 复用服务端产品校验与订单确认 |

建议提供服务端账户查询模块，供 Server Components 和分页接口复用；初次摘要由服务端读取，客户端负责门户、结账与分页交互。分页建议接口为 `GET /api/account/credits?cursor=...` 和 `GET /api/account/payments?cursor=...`，每页 20 条，按时间与唯一 ID 排序。

账户页与接口在服务端读取身份，用户 ID 取会话。查询按 `user_id` / `owner_id` 限定，付款查询关联订单并按当前环境过滤。额度视图需明确现有 grants 没有 environment 字段的边界；上线测试与生产采用独立数据库或补充授予环境标识。账户响应使用 `Cache-Control: no-store`，页面设置 `noindex`；robots 加入 `/account/`，sitemap 排除账户路由。

## 状态与验收

| 场景 | 页面表现 |
| --- | --- |
| 未登录 | 服务端跳转登录页；登录返回地址限制为站内账户路由 |
| 首次登录 | 欢迎额度读取实际授予结果；无订单呈现空状态 |
| 零余额 | 显示 0 credits、0 descriptions，保留购买操作 |
| 头像缺失或损坏 | 首字母头像，避免破损图片图标 |
| 取消续订 | 状态与剩余权益截止日期分列 |
| 年度订阅 | 付费权益截止日期与下月额度窗口分列 |
| 付款确认中 | 展示同步状态，通过订单接口刷新；避免乐观增加额度 |
| 数据失败 | 区块错误与 Retry；避免将缺失数据替换成 0 |
| 门户无客户记录 | 解释尚无账单账户，提供套餐入口与收据帮助 |
| 键盘、手机 | Tab 访问操作，Escape 关闭菜单并恢复焦点；320px 无横向溢出 |

## 实施顺序

1. 账户查询模块与摘要契约；核对状态、交易金额和环境隔离。
2. `/account/plans`：余额、分类、权益与购买入口；复用现有产品常量。
3. `/account/billing`：订阅摘要、门户与付款历史。
4. 额度流水分页；交易金额、收据能力按数据支持情况开放。
5. 菜单链接切换到账户路由；添加登录返回、noindex、robots 与状态验收。

验证范围：余额与权益数据契约、用户隔离、取消后权益、年度月度窗口、历史 Starter 数量、退款撤销、分页一致性；浏览器检查桌面、平板、手机与键盘流程。
