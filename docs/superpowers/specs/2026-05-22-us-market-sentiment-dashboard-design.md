# 美股市场情绪仪表盘设计

## 目标

构建一个低成本、云端部署、每小时刷新的美股市场情绪仪表盘。第一版聚焦新闻驱动的市场情绪监控，帮助用户理解当天美股整体风险偏好、热门个股情绪变化、新闻热度和主要叙事主题。

系统第一阶段不是自动交易系统，也不输出买卖建议。它输出可观察、可追踪、可回测的市场情绪指标，为后续加入社交数据、告警和交易辅助信号打基础。

## 第一版范围

第一版监控以下标的：

- 指数和 ETF：`SPY`、`QQQ`、`DIA`、`IWM`
- 热门个股：`NVDA`、`TSLA`、`AAPL`、`MSFT`、`AMD`、`META`、`GOOGL`、`AMZN`、`NFLX`、`AVGO`

第一版功能：

- 每小时采集一次行情快照。
- 每小时采集相关新闻。
- 将新闻归因到相关 ticker。
- 对新闻标题和摘要做情绪评分。
- 聚合小时级 ticker 情绪指标。
- 生成整体市场情绪状态：`risk_on`、`neutral`、`risk_off`。
- 在仪表盘展示市场总览、ticker 表格、情绪趋势、热门主题和异常提醒。

第一版不做：

- 不做秒级实时行情。
- 不做自动下单。
- 不做投资建议。
- 不接入付费高频数据。
- 不把社交媒体作为第一阶段依赖。

## 推荐技术栈

- 前端和 API：Next.js 部署在 Vercel。
- 定时任务：优先使用 Supabase Cron 每小时触发 Vercel 内部接口。
- 数据库：Supabase Postgres。
- 数据读取：Next.js Server Components 或 API routes 从 Supabase 查询。
- 认证：第一版可以先不做用户登录；如果公开访问，前端只读取聚合后的公开数据。
- 密钥管理：所有第三方 API key 放在 Vercel 环境变量中，不能暴露到浏览器。

## 调度器选择

低成本版本不把 Vercel 内置 Cron 作为小时级任务的默认方案，因为 Vercel Hobby 计划的 Cron 最小频率是每天一次；小时级或分钟级 Cron 需要 Vercel Pro。

第一版推荐：

- 使用 Supabase Cron 每小时触发一次。
- Supabase Cron 通过 `pg_net` 向 Vercel 的 `/api/cron/hourly-ingest` 发起 HTTP 请求。
- Vercel API route 执行采集、评分和聚合逻辑。
- Cron 请求必须携带 `CRON_SECRET`，Vercel 接口校验通过后才执行。

备选方案：

- 如果已经使用 Vercel Pro，可以直接使用 Vercel Cron。
- 如果希望完全绕开 Vercel 函数时长限制，可以把采集逻辑放进 Supabase Edge Function，再由 Supabase Cron 调用。
- 如果只是开发测试，可以手动访问本地 cron API 或使用一次性脚本触发。

## 数据源策略

成本优先版本采用新闻优先的数据策略。

行情源：

- 第一候选：Finnhub 免费或低成本 quote API。
- 备选：Alpha Vantage 或其他免费/低价行情源。
- 采集频率：每小时一次，不做高频轮询。

新闻源：

- 第一候选：Marketaux 免费层或低成本层。
- 备选：Alpha Vantage `NEWS_SENTIMENT`。
- NewsAPI 免费开发计划不作为生产依赖，只能用于本地开发或测试。

公告源：

- SEC EDGAR 后续加入，用于 8-K、10-Q、10-K 等事件确认。
- 第一版可以预留表结构和任务接口，但不强制实现。

## 系统架构

```text
Supabase Cron
  -> /api/cron/hourly-ingest
  -> fetch market quotes
  -> fetch ticker news
  -> normalize articles
  -> score sentiment
  -> aggregate hourly metrics
  -> write Supabase
  -> dashboard reads aggregated data
```

核心模块：

- `ticker registry`：维护监控标的、名称、类型、板块和启用状态。
- `market ingest`：按小时采集价格、涨跌幅、成交量等快照。
- `news ingest`：按小时采集新闻，去重并保存。
- `sentiment scoring`：基于标题、摘要、来源和关键词计算情绪分。
- `hourly aggregation`：生成每个 ticker 的小时级指标。
- `market mood`：聚合 ETF 和热门个股，生成整体风险偏好。
- `dashboard`：展示最新状态和历史趋势。

## Supabase 数据模型

### `tickers`

监控标的主表。

字段：

- `symbol text primary key`
- `name text not null`
- `asset_type text not null`，例如 `etf`、`stock`
- `sector text`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`

### `market_snapshots`

每小时行情快照。

字段：

- `id uuid primary key default gen_random_uuid()`
- `symbol text not null references tickers(symbol)`
- `captured_at timestamptz not null`
- `price numeric`
- `change_percent numeric`
- `volume numeric`
- `source text not null`
- `raw jsonb`
- `created_at timestamptz not null default now()`

唯一约束：

- `(symbol, captured_at, source)`

### `news_articles`

标准化新闻文章。

字段：

- `id uuid primary key default gen_random_uuid()`
- `external_id text`
- `source text not null`
- `url text not null`
- `title text not null`
- `summary text`
- `published_at timestamptz`
- `raw jsonb`
- `created_at timestamptz not null default now()`

唯一约束：

- `(source, url)`

### `article_tickers`

新闻和 ticker 的多对多关系。

字段：

- `article_id uuid not null references news_articles(id) on delete cascade`
- `symbol text not null references tickers(symbol)`
- `relevance_score numeric not null default 1`
- `sentiment_score numeric`
- `sentiment_label text`
- `created_at timestamptz not null default now()`

主键：

- `(article_id, symbol)`

### `ticker_hourly_sentiment`

每个 ticker 的小时级聚合指标。

字段：

- `id uuid primary key default gen_random_uuid()`
- `symbol text not null references tickers(symbol)`
- `window_start timestamptz not null`
- `news_count integer not null default 0`
- `avg_sentiment numeric`
- `positive_count integer not null default 0`
- `negative_count integer not null default 0`
- `neutral_count integer not null default 0`
- `mention_heat numeric`
- `sentiment_velocity numeric`
- `price_change_percent numeric`
- `created_at timestamptz not null default now()`

唯一约束：

- `(symbol, window_start)`

### `market_hourly_mood`

整体市场情绪聚合。

字段：

- `id uuid primary key default gen_random_uuid()`
- `window_start timestamptz not null unique`
- `mood_label text not null`，取值为 `risk_on`、`neutral`、`risk_off`
- `mood_score numeric`
- `etf_sentiment numeric`
- `mega_cap_sentiment numeric`
- `negative_breadth numeric`
- `positive_breadth numeric`
- `top_positive jsonb`
- `top_negative jsonb`
- `created_at timestamptz not null default now()`

### `topic_clusters`

每日或小时级主题聚类结果。

字段：

- `id uuid primary key default gen_random_uuid()`
- `window_start timestamptz not null`
- `label text not null`
- `summary text`
- `symbols text[]`
- `article_ids uuid[]`
- `score numeric`
- `created_at timestamptz not null default now()`

### `alert_events`

异常提醒记录。

字段：

- `id uuid primary key default gen_random_uuid()`
- `symbol text references tickers(symbol)`
- `window_start timestamptz not null`
- `alert_type text not null`
- `severity text not null`
- `message text not null`
- `metrics jsonb`
- `created_at timestamptz not null default now()`

## 情绪评分规则

第一版采用简单、可解释、可替换的评分方式，避免一开始依赖昂贵模型。

输入：

- 新闻标题。
- 新闻摘要。
- 新闻来源。
- 关联 ticker。

输出：

- `sentiment_score`：范围 `-1` 到 `1`。
- `sentiment_label`：`positive`、`neutral`、`negative`。

初始规则：

- 标题权重大于摘要。
- 明确利好词提高分数，例如 `beats expectations`、`raises guidance`、`upgrade`、`record revenue`。
- 明确利空词降低分数，例如 `misses estimates`、`cuts guidance`、`downgrade`、`investigation`、`layoffs`。
- 宏观利空会影响 ETF 和大型科技股，例如 `higher yields`、`rate hike`、`inflation hotter than expected`。
- 来源权重先保留字段，不在第一版复杂化。

后续可替换为：

- FinBERT。
- OpenAI 或其他 LLM 做分类和摘要。
- 第三方新闻源自带情绪分。

## 聚合指标

每小时为每个 ticker 计算：

- 新闻数量：当前小时相关新闻数。
- 平均情绪：相关新闻情绪分均值。
- 正负面新闻数。
- 热度：当前新闻数相对过去 24 小时均值的倍数。
- 情绪速度：当前小时情绪分减去过去 4 小时移动平均。
- 价格变化：当前行情快照中的涨跌幅。

整体市场情绪：

- ETF 情绪权重更高，尤其是 `SPY` 和 `QQQ`。
- 热门个股情绪作为风险偏好补充。
- 如果 ETF 和 mega-cap 同时转弱，市场更可能进入 `risk_off`。
- 如果 `SPY`、`QQQ`、`NVDA`、`MSFT`、`AAPL` 情绪同步转强，市场更可能进入 `risk_on`。

## 异常提醒

第一版记录提醒，但不一定推送到外部渠道。

提醒类型：

- `sentiment_drop`：情绪快速恶化。
- `sentiment_spike`：情绪快速升温。
- `news_volume_spike`：新闻数量显著高于过去 24 小时均值。
- `market_risk_off`：ETF 和 mega-cap 情绪同步转弱。
- `price_sentiment_divergence`：价格和情绪方向明显背离。

## 仪表盘设计

第一版一个页面即可。

顶部区域：

- 当前市场情绪：`Risk-on`、`Neutral`、`Risk-off`
- 总情绪分。
- 最近更新时间。
- 最近 1 小时、4 小时、1 天变化。

主体区域：

- Ticker 表格：symbol、价格变化、情绪分、新闻数、热度、情绪变化。
- 情绪趋势图：选择 ticker 后展示过去 24 小时或 7 天趋势。
- Top Positive 和 Top Negative：情绪最强和最弱标的。
- Topic Clusters：今日主要市场主题。
- Alert Events：异常提醒列表。

视觉风格：

- 偏交易工具风格，信息密度高、少装饰。
- 使用红绿或正负色表达方向，但同时保留文字标签，避免只依赖颜色。
- 默认按情绪热度排序，允许按新闻数、价格变化、情绪分排序。

## API 与任务设计

### `GET /api/dashboard/latest`

返回仪表盘最新数据：

- 最新 market mood。
- 最新 ticker hourly sentiment。
- 最新 alerts。
- 最新 topic clusters。

### `GET /api/tickers/[symbol]/history`

返回单个 ticker 的历史情绪数据。

查询参数：

- `range=24h|7d|30d`

### `POST /api/cron/hourly-ingest`

Supabase Cron 或 Vercel Cron 调用的内部接口。

流程：

1. 校验 `CRON_SECRET`。
2. 读取 active tickers。
3. 采集行情。
4. 采集新闻。
5. 去重写入文章。
6. 建立 article-ticker 关联。
7. 计算情绪。
8. 写入小时级聚合。
9. 生成整体市场情绪和异常提醒。

## 安全和权限

- `service_role` 只能在 Vercel 服务端环境变量中使用，不能暴露给前端。
- 浏览器端只使用 Supabase publishable key 或通过 Next.js API 读取聚合数据。
- 对公开 schema 中的表启用 RLS。
- 原始新闻和行情数据可以只允许服务端写入。
- 聚合指标可以通过只读策略开放给匿名用户，前提是没有用户私有数据。
- Cron 接口必须校验 secret，避免被外部滥用触发 API 配额消耗。

## 错误处理

- 第三方 API 失败时记录错误，不中断整个批次。
- 单个 ticker 失败不能影响其他 ticker。
- 写入使用 upsert，避免重复采集造成重复数据。
- 每次任务保存运行摘要，包括成功数量、失败数量、耗时和错误列表。
- 如果行情源失败但新闻源成功，仍然计算新闻情绪；价格变化字段允许为空。

## 测试策略

单元测试：

- ticker 归因。
- 新闻去重。
- 情绪词典评分。
- 小时级聚合。
- market mood 计算。
- alert 规则。

集成测试：

- 使用 mock 数据跑完整 ingest pipeline。
- 验证重复执行不会重复插入文章和聚合记录。
- 验证缺失行情或缺失新闻时系统仍返回可展示数据。

端到端验证：

- 部署后手动触发一次 cron。
- 检查 Supabase 表中是否有行情、新闻、小时级聚合和 market mood。
- 打开仪表盘确认数据、排序、趋势图和更新时间正常。

## 里程碑

### M1：项目骨架和数据库

- 创建 Next.js 项目。
- 配置 Supabase 客户端。
- 建立数据库 migration。
- 写入初始 ticker 列表。

### M2：数据采集和聚合

- 接入行情源。
- 接入新闻源。
- 实现新闻去重和 ticker 归因。
- 实现情绪评分和小时级聚合。

### M3：仪表盘

- 实现 latest dashboard API。
- 实现总览卡片、ticker 表格、趋势图和 alerts 列表。
- 增加 loading、empty 和 error 状态。

### M4：云端运行

- 配置 Vercel 环境变量。
- 配置 Supabase Cron。
- 验证每小时任务运行。
- 检查 Supabase 数据增长和 API 配额消耗。

### M5：增强

- 加入 SEC EDGAR 事件。
- 加入社交源。
- 引入更强的金融情绪模型。
- 增加 Telegram 或邮件告警。
- 增加历史回测和告警效果评估。

## 成功标准

第一版完成后应满足：

- 仪表盘可以部署在 Vercel 并稳定打开。
- Supabase 中有至少 24 小时的小时级情绪数据。
- 每个监控 ticker 都有最新状态，即使某小时没有新闻也能显示空状态。
- Cron 任务可重复运行且不会写入重复新闻。
- 用户可以在 30 秒内理解当前市场是偏 risk-on、neutral 还是 risk-off。
- 用户可以看到哪些 ticker 情绪升温、哪些转弱，以及主要由哪些新闻驱动。
