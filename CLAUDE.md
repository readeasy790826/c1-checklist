# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Operations portal for **Dianmood** — a robotic coffee bar with C1 Pro machines at two Vancouver locations (Davies and ITC). Staff use these pages on their phones for daily/weekly/monthly maintenance checklists, SOP references, and knowledge base articles.

## Tech Stack

- **Plain HTML + CSS + Vanilla JS** — no frameworks, no build step, no npm
- **GitHub Pages** (`readeasy790826/c1-checklist`) — push to `main`, live in ~1 min
- **Google Apps Script** — backend endpoint that writes submissions to Google Sheets
- **No auth** — pages are public, staff access by URL

## Local Development

```bash
python3 -m http.server 8080
# then open http://localhost:8080/davies_portal.html
```

`fetch()` calls to the Apps Script backend work from localhost (CORS is open).

## Deploying

```bash
git add <files>
git commit -m "describe what changed"
git push origin main
```

## File Naming Convention

| Prefix | Type | Example |
|---|---|---|
| `D0–D7` | Daily SOP pages | `D2_liquid_dispenser_cleaning.html` |
| `W1–W5` | Weekly SOP pages | `W4_weekly_brewer_swap.html` |
| `M1–M5` | Monthly SOP pages | `M4_monthly_grinder_cleaning.html` |
| `davies_` / `itc_` | Location-specific checklists & portals | `davies_checklist.html` |
| `hq_` | HQ dashboard (both locations) | `hq_portal.html` |
| `kb_` | Knowledge base articles | `kb_brewing.html` |

Some SOP pages have a matching `.md` source file (e.g. `D0_enter_maintenance_mode.md`) — these are the content source; the `.html` is the rendered version.

## Architecture

### Portal → Checklist → SOP chain
- `*_portal.html` — entry point; fetches live status from Apps Script and shows 🔴/🟡/✅ per frequency
- `*_checklist.html` — staff checks off tasks D0–D7; each task has a collapsible SOP link
- `D*/W*/M*_*.html` — step-by-step SOP pages staff follow while doing the task

### Status / submission flow
- **Submit**: checklist `fetch()` POSTs to Apps Script → writes a row to Google Sheets (`Submissions` tab)
- **Status poll**: portal `fetch(SCRIPT_URL + '?action=status')` → Apps Script returns latest submission per `location|frequency` → portal computes elapsed time and color status → auto-refreshes every 60s

### Overdue thresholds
| Frequency | Overdue after | Warning starts |
|---|---|---|
| Daily | 36h | 6h remaining |
| Weekly | 10 days | 24h remaining |
| Monthly | 45 days | 3 days remaining |

### Apps Script endpoint
```
POST  → submit checklist row
GET ?action=status → { status: "success", data: { "Davies|daily": { datetime, ... }, ... } }
```
URL (do not rotate unless broken):
```
https://script.google.com/macros/s/AKfycbyeSoG86Dx17hLxma5pnx3DNgyqUFXtjukPGQljcCO4R2JBpf-_bQwKR0oFQL8AA4G5/exec
```
After any Apps Script edit: **Deploy → Manage deployments → Edit → New version → Deploy** (changes don't take effect without a new deployment version).

## Design System

Dark theme, mobile-first. Keep all pages consistent with these CSS variables:

```css
--bg: #0f0f0f        /* page background */
--surface: #1a1a1a   /* header, sticky bars */
--card: #222          /* cards */
--border: #333        /* borders */
--accent: #f5a623    /* amber — badges, highlights */
--green: #4caf50
--red: #e53935
--blue: #42a5f5
--muted: #888        /* secondary text */
--radius: 12px
```

Font: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

## Division of Work

- **Dad (content owner)** — adds/refines text, photos, SOP steps. Don't restructure content files without discussing with him.
- **Developer** — UX, structure, tooling, making content easier to add and display.

Content source markdown files for KB pages live at (on Dad's machine):
```
/home/hui_chen/.hermes/user_data/coffee_ops/sops/knowledge_base/
```
When Dad updates content, the corresponding `kb_*.html` files get rebuilt.

## Known Issues / Backlog

- Task codes (D0–D7, W1–W5, M1–M5) are duplicated across davies and itc checklists — a shared JS config would prevent sync bugs
- Many SOP pages have thin step content — Dad fills in; developer ensures templates handle rich content
- `history.back()` navigation breaks if SOP pages are opened directly from a shared link
