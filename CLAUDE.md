# CLAUDE.md

Guidance for anyone working on this repository.

## What This Is

Operations portal for **Dianmood** — C1 Pro robotic coffee bars at Vancouver locations (Davies, ITC, Infinity8). Staff use these pages on their phones for maintenance checklists, SOPs, Abnormal Handling procedures, and knowledge-base articles.

## Tech Stack

- Plain HTML + CSS + vanilla JS — no frameworks, no build step, no npm
- One SPA shell (`app.js`) hash-routes every view
- GitHub Pages (`readeasy790826/c1-checklist`) — push to `main`, live in ~1 min
- Google Apps Script backend → Google Sheets (status + submissions)
- No auth — public URLs

## Local Development

```bash
python3 -m http.server 8080
# HQ:        http://localhost:8080/
# Davies:    http://localhost:8080/davies/
# ITC:       http://localhost:8080/itc/
# Infinity8: http://localhost:8080/infinity8/
```

Apps Script `fetch()` works from localhost (CORS open).

## Deploying

```bash
git add <files>
git commit -m "describe what changed"
git push origin main
```

## Architecture

Each entry HTML sets `window.DIANMOOD_PRESET`, then loads shared scripts. Location entries use `base: '../'` so root content/scripts resolve.

| File | Preset | Shows |
|---|---|---|
| `index.html` | `{ mode: 'hq', base: '' }` | All locations |
| `davies/index.html` | `{ mode: 'location', slug: 'davies', base: '../' }` | Davies |
| `itc/index.html` | `{ mode: 'location', slug: 'itc', base: '../' }` | ITC |
| `infinity8/index.html` | `{ mode: 'location', slug: 'infinity8', base: '../' }` | Infinity8 |

### Routes

- `#/` — dashboard
- `#/c/<slug>/<freq>` — checklist (`daily` \| `weekly` \| `monthly`)
- `#/abnormal` — Abnormal Handling procedures
- `#/sop/<CODE>` — SOP page
- `#/kb/<id>` — KB article (EN / 中文)

### Core files

| File | Role |
|---|---|
| `data.js` | `SCRIPT_URL`, `LOCATIONS`, `ABNORMAL_HANDLING`, `LIMITS`/`WARN_BEFORE`, `TASKS`, `KB`, `getLocation()` |
| `strings.js` | English UI copy + `t()` + `FREQ_LABEL` |
| `md.js` | Markdown renderer + `loadSop` / `loadKb` |
| `app.js` | Routing, views, status poll, submit-and-confirm, lightbox |
| `app.css` | Design system (tokens in `:root`) |
| `content/sops/<CODE>.en.md` | SOP bodies |
| `content/kb/<id>.{en,zh}.md` | KB articles |
| `assets/` | Images referenced by content |

### Status / submission

- **Submit**: `no-cors` POST to `SCRIPT_URL`, then GET `?action=status` until the row’s `datetime` appears for `location|frequency`. Drafts live in `sessionStorage` until confirmed.
- **Status poll**: every 60s; cards stay navigable while loading or if the fetch fails.

Levels: **gray** no record · **green** within window · **amber** due soon · **red** overdue · **loading** transient.

| Frequency | Overdue after | Amber starts |
|---|---|---|
| Daily | 36h | 6h remaining |
| Weekly | 240h (10 days) | 24h remaining |
| Monthly | 1080h (45 days) | 72h remaining |

### Apps Script

```
POST → append row to "Submissions"
GET ?action=status → { status: "success", data: { "Davies|daily": { datetime, ... }, ... } }
```

POST fields: `date`, `time`, `datetime` (UTC ISO), `location`, `machine_id`, `frequency`, `tasks` (`code` → `{ checked, notes }`), plus empty `staff_name`, `supervisor`, `abnormal_issues`.

## Adding Things

- **Location** — `{ slug, name, machineId }` in `D.LOCATIONS` + `<slug>/index.html` (copy `davies/`).
- **Task** — entry in `D.TASKS` + `content/sops/<CODE>.en.md`.
- **KB article** — entry in `D.KB` + `content/kb/<id>.en.md` (and `.zh.md`).
- **Abnormal Handling procedure** — `{ title, text?, points }` in `D.ABNORMAL_HANDLING` (`points` may nest as `{ text, points }`).

Markdown authoring rules: **`content/README.md`**.
