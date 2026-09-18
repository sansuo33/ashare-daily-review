# A股每日主线与情绪复盘 · Skill

> 零代码股票研究员 · 每日 A 股「主线与情绪复盘」单页 HTML 报告生成工作流（V3 视觉语言）

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-WorkBuddy%20%2F%20SkillHub-green)
![Language](https://img.shields.io/badge/语言-中文-red)
![License](https://img.shields.io/badge/license-MIT-yellow)

从**真实收盘数据**出发，自动产出一份自包含的单页 HTML 复盘报告：4 大模块 · 12 节，浅色主题、涨红跌绿、信号语义配色、内联零外链。覆盖数据源分工、取数流程、数据完整性铁律与已验证经验。

---

## 📌 简介

本 Skill 封装了「每日收盘后生成 A 股主线与情绪复盘报告」的完整流程，核心资产包括：

- 固定的 **4 模块 12 节**报告模板（`templates/daily-review.html`，含占位符）
- 配色规范与数据约定速查（`references/conventions.md`）
- 韭圈儿恐贪指数取数经验（`references/funddb-cdp.md`）
- 两个取数脚本（`scripts/fetch_margin.js` / `scripts/fetch_fear.js`）

报告 **纯内联、零外部依赖**（禁 ECharts / CDN / 外链 `<script>`），可双击打开、可直接分享。

---

## ✨ 特性

- **真实数据优先**：凡不可得一律诚实留白或删节，绝不臆造（北向资金已永久剔除）
- **涨红跌绿**：符合中国 A 股惯例的数值涨跌配色
- **信号语义层配色**：偏多=红 / 风险=绿 / 中性=黄（与数值涨跌色同源但语义分离）
- **数值信号色（V3 核心）**&#8203;：Metric 卡数值自动继承父卡信号类，左侧竖条 / 数值 / 标签三者同色
- **量能独立规则**：放量=红 / 缩量=绿 / 持平=墨（缩量不填中性黄）
- **纯内联交互**：粘性导航 scrollspy、Hero 半弧仪表盘、竖温度计 SVG、Tab 切换、`details` 折叠、返回顶部，全部内联 JS
- **数据源交叉验证**：TDX 真实源 + 东方财富 / 公开聚合，融资余额以东财口径为准

---

## 📁 目录结构



```
ashare-daily-review/
├── SKILL.md                 # Skill 主体（触发词、铁律、流程、数据源分工）
├── README.md                # 本文件
├── references/
│   ├── conventions.md       # 配色规范 + 数据约定速查
│   └── funddb-cdp.md        # 韭圈儿恐贪指数取数完整经验
├── templates/
│   └── daily-review.html    # V3 视觉语言报告模板（含 {{...}} 占位符）
└── scripts/
    ├── fetch_margin.js      # 融资融券余额抓取（纯 Node，无依赖）
    └── fetch_fear.js        # 恐贪指数抓取（需 crypto-js）
```

---

## 🔧 安装

### 方式一：SkillHub 一键安装

按 https://skillhub.cn/install/skillhub.md 的说明，安装：

```
@user_b18dc546/ashare-daily-review
```

### 方式二：手动安装（Git Clone）

```bash
# 1. 克隆本仓库
git clone https://github.com/<你的用户名>/ashare-daily-review.git

# 2. 软链或复制到 WorkBuddy 用户级 skill 目录
#    Windows:
mklink /D "%USERPROFILE%\.workbuddy\skills\ashare-daily-review" "<仓库路径>\ashare-daily-review"
#    macOS / Linux:
ln -s "<仓库路径>/ashare-daily-review" ~/.workbuddy/skills/ashare-daily-review
```

> 用户级 Skill 必须放在 `~/.workbuddy/skills/` 下才能被 WorkBuddy 加载。

---

## 📋 环境依赖

| 依赖 | 用途 | 安装 |
|------|------|------|
| Node.js ≥ 18 | 运行取数脚本 | https://nodejs.org |
| `crypto-js` | `fetch_fear.js` 解密恐贪指数 | `npm install crypto-js`（在 `scripts/` 目录内执行） |
| WorkBuddy / SkillHub | 加载并运行 Skill | 已安装 |
| TDX 连接器（mcp__tdx-connector） | 指数 / 广度 / 涨停跌停等真实源 | 在 WorkBuddy 中注册 |

> `fetch_margin.js` 仅用 Node 内置模块，**无需** `npm install`。

---

## 🚀 使用方式

### 触发方式

对 WorkBuddy 说类似：

> 「完成今日 A 股主线与情绪复盘」

或包含以下意图的自然语言：生成 A 股复盘报告、每日情绪温度、主线与情绪复盘。

### 执行流程（每次「完成今日复盘」）

1. 确认交易日（当前日期 + 收盘后），新建 `A股主线与情绪复盘_YYYYMMDD.html`
2. **并行 TDX 取数**：指数（5~7 个）+ 涨停 / 跌停 / 炸板 / 连板 + 上涨 / 下跌 / 平盘
3. **东财 / 公开聚合**：融资余额用 `scripts/fetch_margin.js` 实抓（T+1）、外围用公开报道、行业主力定性
4. **恐贪指数**：运行 `scripts/fetch_fear.js` 取真实值；取不到则第 6 节标「待补」
5. 读取上一交易日模板作基底，替换 `{{...}}` 占位符并按真实方向设置信号类
6. **诚实修正闭环**：前日误判在对应节标注「误判 / 推翻重判」，不硬拗
7. 校验：无 `echarts|cdn|https?://|<script`、无北向净额字段、章节编号连续、配色规范

---

## 📊 报告结构（4 模块 · 12 节）

- **① 市场总览**：1.1 大盘画像 / 1.2 外围市场 / 1.3 量能与资金
- **② 情绪量化**：2.1 短线情绪 / 2.2 市场广度 / 2.3 定量化情绪温度（竖温度计）
- **③ 主线资金**：3.1 板块强弱 / 3.2 题材热度 / 3.3 主力资金方向 / 3.4 涨停梯队
- **④ 决策输出**：4.1 主线识别 / 4.2 隔夜判断

---

## 🎨 配色与数据铁律

### 两套配色（互不混淆）

| 体系 | 涨 / 偏多 | 跌 / 风险 | 中性 |
|------|-----------|-----------|------|
| 数值涨跌色 | 红 `#e03131` | 绿 `#0c9d6e` | — |
| 信号语义色 | 红（real/ok） | 绿（trap/warn） | 黄 `#e8a200`（mid） |

> ⚠️ 信号语义色（偏多红 / 风险绿）与数值涨跌色（涨红 / 跌绿）方向相反于直觉，二者同源但语义不同。改色时只动语义层（`real/ok/trap/warn/mid/tag.*`），**严禁动 `.up/.down` 数值色**。

### 数据完整性铁律

1. 真实数据优先，凡不可得一律诚实留白或删除，绝不臆造
2. 涨红跌绿（中国 A 股惯例）
3. 纯内联、零外部依赖（禁 ECharts / CDN / 外链）
4. 标题统一单色（无金色高亮）
5. 量能独立规则：缩量绝不可填中性黄
6. 北向资金净额 **永久剔除**（2024-08-19 官方取消日频披露）

---

## 🔌 取数脚本说明

### `scripts/fetch_margin.js`

东方财富「融资融券交易总量」实时抓取，纯 Node.js、无加密、无浏览器依赖。

```bash
cd scripts
node fetch_margin.js          # 输出最新一行（JSON）
node fetch_margin.js --last 5 # 输出最近 5 日
```

> 融资融券数据为 **T+1** 披露，报告收盘日 N 应用 N−1 交易日值。东财全市场口径为准，妙想聚合值系统性低估约 1150 亿，不可直接采用。

### `scripts/fetch_fear.js`

韭圈儿恐贪指数抓取（Node.js + crypto-js，直接调用 API + AES 解密）。

```bash
cd scripts
npm install crypto-js
node fetch_fear.js             # 输出 JSON：{num, status_str, current_time, ...}
```

> 分位（韭圈儿标尺）：0–20 极度恐惧 / 20–40 恐惧 / 40–70 中立 / 70–90 贪婪 / 90+ 极度贪婪。取不到真实值时第 6 节标「待补」，不编造。

---

## 🗂 数据源分工

| 字段 | 数据源 | 备注 |
|------|--------|------|
| 指数 / 广度 / 涨停跌停炸板连板 | 通达信 TDX 连接器 | 首选真实源 |
| 融资余额 | 东方财富 `fetch_margin.js` | T+1，以东财口径为准 |
| 外围（前日美股） | WebSearch / 公开报道 | 取道指 / 纳指 / 标普 |
| PCR 认沽认购比 | 上交所期权日报 | 可得，标注滞后 |
| 恐慌指数 | 韭圈儿 `fetch_fear.js` | API + AES 直解 |
| 北向资金净额 | — | 永久剔除 |

---

## ❓ 常见问题

<details>
<summary><b>报告打开是空白 / 样式错乱？</b></summary>

确认未被任何工具注入 ECharts / CDN / 外链 `<script>`。报告必须纯内联，双击 HTML 应直接渲染。

</details>

<details>
<summary><b>融资余额和别处对不上？</b></summary>

妙想（mx-finance-data）对全市场融资余额口径系统性低估约 1150 亿，一律以 `fetch_margin.js` 实抓的东财口径为准。数据为 T+1，比报告交易日晚 1 日属正常。

</details>

<details>
<summary><b>恐贪指数取不到？</b></summary>

`fetch_fear.js` 依赖第三方 API 与密钥材料，若接口变动导致解密失败，第 6 节标「待补」即可，切勿编造数值。

</details>

---

## ⚠️ 免责声明

本报告由数据驱动自动生成，仅供个人研究与学习参考，**不构成任何投资建议**。市场有风险，投资需谨慎。报告中的复盘与隔夜判断为基于公开数据的客观描述，不代表任何买卖建议。

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。
```


> 另外建议在 GitHub 网页端用 **Add file → Create new file → 命名为 `LICENSE`**，GitHub 会弹出许可证选择器，选 MIT 即可（README 末尾已链接 `LICENSE`）。若 `scripts/` 里执行了 `npm install`，记得加一个 `.gitignore` 忽略 `node_modules/`。

需要的话，我可以直接帮你在 skill 目录里生成 README.md、复制脚本并改好 SKILL.md 路径——你说一声即可。
