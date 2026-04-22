# AI Product Radar

AI Product Radar is a lightweight MVP for tracking AI product updates in China and overseas markets. It turns public product announcements, model releases, developer updates, and enterprise workflow signals into a searchable intelligence dashboard for business analysis.

## How to View the Demo

Open the static page directly in a browser:

```bash
open index.html
```

You can also serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Key Features

- Product update feed: company, region, category, tags, source link, and impact score.
- Filters and search: filter by region, category, keyword, and trend tag.
- Trend tags: automatic frequency view for themes such as Agent, Video, Voice, Enterprise, and Search.
- Business judgment: every update includes why it matters and the likely commercial implication.
- Brief copy: copy a short briefing from the current filtered view.
- CSV export: export the current results for follow-up analysis.
- Tracking script: collect snapshots and candidate updates from public source pages.

## Project Structure

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

## Data Sources

The demo prioritizes official and developer-facing sources, including:

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

The seed dataset was checked against public information on 2026-04-20. Each dashboard item links back to its original source.

## Updating the Data

Validate the source configuration:

```bash
python3 scripts/update_sources.py --validate-only
```

Collect public source snapshots and candidate updates:

```bash
python3 scripts/update_sources.py
```

The script writes:

```text
data/source-snapshots.json
data/latest-candidates.json
```

Recommended workflow: run the script daily, review candidate updates, use AI assistance for summarization, tagging, deduplication, and impact scoring, then update `data/ai-radar-data.js`.

## Impact Scoring

The impact score is not an absolute model judgment. It is a lightweight ranking metric based on:

- Whether the source is official or close to first-hand.
- Recency.
- Whether the update changes the product form.
- Commercialization, distribution, or enterprise procurement impact.
- Relevance to Agent, multimodal, search, voice, video, and developer platform trends.

## Written Test Materials

- Part 1, the tool demo: open `index.html`.
- Part 2, the short analysis: see `docs/trend_analysis_cn.md`.
- Part 3, the explanation document: see `docs/project_explanation_cn.md`.

`README_CN.md` and `README_EN.md` explain how to run the demo and update the data.
