# AreaSorted — Version History

> 本地版本控制清單。每次重大變更都會記錄版本號、日期、Git commit hash 同功能描述。
> 如需回退，用 `git checkout <commit-hash>` 或 `git reset --hard <commit-hash>`。

---

## v0.6.0 — 2026-03-21
**Git**: `4609e3b`
**Features**:

### Admin Portal 重構
- Sidebar 簡化為 4 個 section：Providers / Orders / Payouts / Settings
- Orders 頁面（由 /admin/bookings 遷移至 /admin/orders）— 完整訂單管理 + CSV export
- Payouts 頁面 — daily reconciliation view
- Settings 頁面 — 整合 platform fee config（booking fee + commission %）
- Providers 列表 — inline 顯示 phone / coverage areas / service categories
- Provider detail — pricing rules section 合併入詳情頁

### MVP Customer Features
- **Forgot password / Reset password** — CustomerAuthToken model、auth-tokens utility、forgot-password 頁面、reset-password/[token] 頁面
- **Booking confirmation email** — payment_intent.succeeded webhook 觸發確認郵件
- **Customer self-service cancel** — 取消 booking（PAID/PENDING_ASSIGNMENT/ASSIGNED 狀態）+ 確認 dialog + reason field
- **Status update emails** — ASSIGNED / IN_PROGRESS / COMPLETED / CANCELLED 狀態變更自動發郵件
- **Account profile editing** — inline edit firstName / lastName / phone
- **Global 404 + error pages** — branded not-found.tsx + global-error.tsx
- **Customer loading states** — skeleton loading 畫面 for /account、/account/bookings、/account/bookings/[reference]
- **Cron jobs** — /api/cron route（abandoned checkout cleanup、counter-offer expiry、auth token cleanup）+ vercel.json hourly schedule

### Housekeeping
- Provider Invoices list page (`/provider/invoices`)
- CHANGELOG.md 版本清單建立
- `.next-dev/` 從 git tracking 移除 + 加入 .gitignore

---

## v0.5.0 — 2026-03-21
**Git**: `f73d79a`
**Features**:
- Pricing page 簡化 — 兩欄佈局，compact pricing cards + calculator
- 隱藏 hourly rates（客戶只見一口價 + 模糊工時估算）
- Counter Offer 流程重構 — 由 Admin 中介改為 Provider ↔ Customer 直接溝通
- Shared pricing engine (`src/lib/pricing/shared-pricing.ts`) — provider calculator 同 customer quote 用同一邏輯
- `adminNotes` 重命名為 `responseNotes`（schema migration）
- Customer booking detail 顯示 Counter Offer banner（接受/拒絕）
- Admin 變為 read-only counter offer view
- Booking settings 從 Availability page 移除

---

## v0.4.0 — 2026-03-21
**Git**: `f4980de`
**Features**:
- Provider Portal UX 大改版 — 全部 12 個 phase 完成
- Homepage postcode 修復 + logo 更換
- Notification 系統（`ProviderNotification` model + bell icon + real-time polling）
- Counter Offer 系統初版（Admin-mediated）
- Confirmation dialogs（orders accept/decline）
- Guided setup wizard（新 provider 引導流程）
- Human-friendly labels（status、service names 等）
- Orders access 擴展（PRICING_PENDING 可 view-only）
- Session loss bug fix
- Seed data fix（4 個 test providers）
- `--color-accent` 全部重命名為 `--color-brand`
- CSS layering fix（`a { color: inherit }` 放入 `@layer base`）

---

## v0.3.0 — 2026-03-17
**Git**: `a621e29`
**Features**:
- 項目從 WashHub 重命名為 AreaSorted
- Next.js 15 + Tailwind v4 + shadcn/base-ui 架構確立
- Prisma schema 完整建立（Provider lifecycle、Booking、Invoice 等）
- Provider onboarding 4-step wizard
- Admin portal（providers list、booking management）
- Customer quote flow + Stripe checkout
- Email verification + password setup flow

---

## v0.2.0 — 2026-03-15
**Git**: `5460c3d`
**Features**:
- Provider onboarding + Prisma pricing backend
- Homepage 精修 + pricing controls
- Postcode-first multi-service booking flow
- Legacy file pricing store 移除

---

## v0.1.0 — 2026-03-13
**Git**: `3a41c39`
**Features**:
- Cleaner application review workflow
- Cleaner availability step polish
- Step-by-step onboarding wizard
- Protected admin and cleaner operations views
- Multiple visit times + admin booking list

---

## v0.0.1 — 2026-03-12
**Git**: `927d8f4`
**Features**:
- Initial commit — WashHub project foundation
- Quote-to-payment booking flow
- Multi-date quote version history
- Homepage address lookup + postcode search

---

## 回退指南

```bash
# 查看所有版本
git log --oneline

# 回退到指定版本（保留修改為 unstaged）
git reset --soft <commit-hash>

# 回退到指定版本（丟棄所有修改）
git reset --hard <commit-hash>

# 用 tag 回退
git checkout v0.5.0

# 建立新 branch 從舊版本開始
git checkout -b hotfix/rollback v0.4.0
```
