# CLAUDE.md

Guidance for Claude / any developer working on this repository.

## What This Is

Operations portal for **Dianmood** — a robotic coffee bar with C1 Pro machines at Vancouver locations (Davies, ITC, and Infinity8). Staff open these pages on their phones for daily/weekly/monthly maintenance checklists, step-by-step SOPs, and knowledge-base articles.

## Tech Stack

- **Plain HTML + CSS + Vanilla JS** — no frameworks, no build step, no npm
- **Single-page app** — one shared shell (`app.js`) hash-routes every view
- **GitHub Pages** (`readeasy790826/c1-checklist`) — push to `main`, live in ~1 min
- **Google Apps Script** — backend that writes submissions to Google Sheets and serves status
- **No auth** — pages are public, staff access by URL

## Local Development

```bash
python3 -m http.server 8080
# HQ:        http://localhost:8080/
# Davies:    http://localhost:8080/davies/
# ITC:       http://localhost:8080/itc/
# Infinity8: http://localhost:8080/infinity8/
```

`fetch()` calls to the Apps Script backend work from localhost (CORS is open).

## Deploying

```bash
git add <files>
git commit -m "describe what changed"
git push origin main
```

## Architecture

The whole app is one SPA shell rendered by `app.js` into four entry points. Each entry sets `window.DIANMOOD_PRESET` before loading the shared scripts, then everything is hash-routed and deep-linkable.

### Entry points

| File | Preset | Shows |
|---|---|---|
| `index.html` | `{ mode: 'hq', base: '' }` | HQ dashboard — all locations |
| `davies/index.html` | `{ mode: 'location', slug: 'davies', base: '../' }` | Davies only |
| `itc/index.html` | `{ mode: 'location', slug: 'itc', base: '../' }` | ITC only |
| `infinity8/index.html` | `{ mode: 'location', slug: 'infinity8', base: '../' }` | Infinity8 only |

Location entries live in a subfolder, so they reach the root-level content and scripts via `base: '../'`.

### Routes (hash)

- `#/` — dashboard (HQ shows every location; a location entry shows only itself)
- `#/c/<slug>/<freq>` — checklist; `freq` = `daily` \| `weekly` \| `monthly`
- `#/sop/<CODE>` — full SOP page (e.g. `#/sop/D1`)
- `#/kb/<id>` — knowledge-base article (per-article EN / 中文 switch)

### Core files

| File | Role |
|---|---|
| `data.js` | Single source of truth: `SCRIPT_URL`, `LOCATIONS`, `MUST_READ`, `LIMITS`/`WARN_BEFORE`, `TASKS`, `KB`, `getLocation()` |
| `strings.js` | English UI copy + `t()` interpolation helper + `FREQ_LABEL` |
| `md.js` | Dependency-free Markdown renderer + content loaders (`loadSop`, `loadKb`) |
| `app.js` | SPA shell: routing, all views, status polling, submit-and-confirm, image lightbox |
| `app.css` | The entire design system |
| `content/sops/<CODE>.en.md` | SOP bodies (English) |
| `content/kb/<id>.{en,zh}.md` | KB articles (bilingual) |
| `assets/` | Images referenced by content |

### Status / submission flow

- **Submit**: the checklist POSTs (`no-cors`) to `SCRIPT_URL`, then re-reads `?action=status` to confirm the row actually landed before showing success (a `no-cors` POST response is opaque, so we verify by read-back). In-progress drafts are saved to `sessionStorage` and cleared on confirmed submit.
- **Status poll**: `app.js` fetches `SCRIPT_URL + '?action=status'`, computes elapsed time per `location|frequency`, and colours each card. Refreshes every 60s. Dashboard cards render immediately in a neutral "loading" state and stay navigable even if the fetch fails.

Status levels (see `statusInfo` in `app.js`): **gray** = no record yet · **green** = within window · **amber** = due soon · **red** = overdue · **loading** = transient.

### Overdue thresholds

Defined in `data.js` as `LIMITS` (hours until overdue) and `WARN_BEFORE` (hours-left that turns a card amber).

| Frequency | Overdue after | Warning starts |
|---|---|---|
| Daily | 36h | 6h remaining |
| Weekly | 240h (10 days) | 24h remaining |
| Monthly | 1080h (45 days) | 72h (3 days) remaining |

### Apps Script endpoint

```
POST → append a submission row to the "Submissions" sheet
GET ?action=status → { status: "success", data: { "Davies|daily": { datetime, ... }, ... } }
```

POST payload: `date`, `time`, `datetime` (absolute UTC ISO string, so the sheet timezone can't skew it), `location`, `machine_id`, `frequency`, and `tasks` (object keyed by task code → `{ checked, notes }`). The endpoint also accepts `staff_name`, `supervisor`, `abnormal_issues` (currently sent empty).

## Adding Things (no markup edits needed)

- **A location** — add `{ slug, name, machineId }` to `D.LOCATIONS` in `data.js`, then create `<slug>/index.html` (copy `davies/index.html`, change the `slug`).
- **A task** — add `{ code, title }` to the right frequency in `D.TASKS`, then drop `content/sops/<CODE>.en.md`.
- **A KB article** — add an entry to `D.KB`, then drop `content/kb/<id>.en.md` (and `.zh.md` for Chinese).
- **A Must Read rule** — add `{ title, text?, points: [...] }` to `D.MUST_READ` in `data.js` (`text` is an optional lead line). Shown under the page title with a chevron; the first rule starts open, later ones start collapsed. `DO NOT` in points is auto-emphasized.

## Content Authoring

The SOP/KB Markdown file format — frontmatter, section headings (`## Materials Needed`, `## SOP Steps`), and callout syntax — is documented in **`content/README.md`**, which lives beside the files it describes. Don't duplicate that spec here.

## Design System

Light, warm "coffee" theme, mobile-first. All tokens live in `:root` in `app.css`:

```css
--bg: #FBF7F2;          /* page background */
--surface: #FFFFFF;     /* cards, header */
--surface-2: #F5EDE3;   /* insets, chips */
--text: #2A1A12;
--text-2: #6F5645;
--muted: #9C8676;
--accent: #8A5A3B;      /* roasted coffee — primary */
--accent-strong: #6F4427;
--green: #2F7A4F; --amber: #B07818; --red: #BB3B36;   /* status */
--radius: 14px;
```

Font: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`. Status is shown as a conic-gradient ring with a glyph (`✓` / `!` / `–` / `·`), not stoplight emoji.
