# AI Product Radar

一个用于追踪国内外 AI 产品动态的轻量 MVP。它把公开信息源中的 AI 产品、模型、Agent、视频、语音、搜索、企业工作流等动态整理成可筛选的信息看板，并输出可用于商业分析的趋势判断。

## 如何查看 demo

直接用浏览器打开：

```bash
open index.html
```

如果希望通过本地服务查看，也可以运行：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 主要功能

- 动态情报流：展示近期 AI 产品动态、公司、地区、类型、标签、来源和影响分。
- 筛选与搜索：支持按地区、类型、关键词和趋势标签筛选。
- 趋势热词：自动统计 Agent、Video、Voice、Enterprise、Search 等高频标签。
- 重点判断：每条动态都有“为什么重要”和“商业判断”。
- 简报复制：可一键复制当前筛选结果的简短简报。
- CSV 导出：可导出当前结果，方便继续分析。
- 持续追踪脚本：可读取公开源配置，抓取页面快照和候选动态。

## 文件结构

```text
.
├── index.html
├── styles.css
├── app.js
├── data
│   ├── ai-radar-data.js
│   └── sources.json
├── scripts
│   └── update_sources.py
├── docs
│   ├── project_explanation_cn.md
│   └── trend_analysis_cn.md
├── README_CN.md
└── README_EN.md
```

## 数据来源

本 demo 优先使用官方源和开发者源，例如：

- Anthropic News
- ChatGPT Release Notes
- Google Keyword AI updates
- Perplexity Hub
- Runway Changelog
- Cursor Blog
- xAI News
- ElevenLabs Changelog
- Alibaba Cloud Press Room
- ByteDance Seed Blog
- Baidu Investor Relations
- Hugging Face Blog

种子数据的公开信息核对时间为 2026-04-20。页面中的链接均指向原始来源，便于继续追溯。

## 更新数据

先验证源配置：

```bash
python3 scripts/update_sources.py --validate-only
```

抓取公开源并生成候选动态：

```bash
python3 scripts/update_sources.py
```

脚本会输出：

```text
data/source-snapshots.json
data/latest-candidates.json
```

建议流程是：每天运行脚本，查看候选动态，再用 AI 辅助完成摘要、标签、去重和影响评分，最后更新 `data/ai-radar-data.js`。

## 评分逻辑

影响分不是模型生成的绝对评价，而是一个便于排序的分析指标，主要考虑：

- 来源是否为官方或一手资料
- 发布时间的新鲜度
- 是否代表产品形态变化
- 是否影响商业化、分发或企业采购
- 是否体现 Agent、多模态、搜索、语音、视频等关键趋势

## 笔试材料位置

- 第 1 部分“小工具 demo”：打开 `index.html` 查看。
- 第 2 部分“简要分析”：见 `docs/trend_analysis_cn.md`。
- 第 3 部分“说明文档”：见 `docs/project_explanation_cn.md`。

`README_CN.md` 和 `README_EN.md` 负责说明如何运行 demo 与更新数据。
