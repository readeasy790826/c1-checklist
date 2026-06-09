# C1 Pro Checklist & Knowledge Base — Developer Onboarding

Welcome! This doc tells you everything you need to know to get productive quickly.

---

## Project Background

We operate **Dianmood**, a robotic coffee bar with C1 Pro coffee robots at two locations in Vancouver:
- **Davies** (Machine: C1-DV-01)
- **ITC** (Machine: C1-ITC-01)

Each robot requires daily, weekly, and monthly maintenance. This project is the operations portal staff use every day — checklists, SOP references, and knowledge base pages.

**Division of work going forward:**
- **Owner (Dad)** — adds and refines content: text, photos, videos, SOP details
- **Developer (You)** — improves the product: UX, structure, tooling, making content easier to add and update

---

## Tech Stack

| Layer | What |
|---|---|
| Frontend | Plain HTML + CSS + Vanilla JS (no frameworks) |
| Hosting | GitHub Pages (`readeasy790826/c1-checklist`) |
| Backend | Google Apps Script (submit checklist → Google Sheets) |
| Auth | None — public pages, staff access by URL |
| Media | Google Drive links for videos |

No build step. No npm. No bundler. Edit HTML → push → live in ~1 min.

---

## Repo Structure

```
c1-checklist/
│
│  ── PORTALS (entry points for each location)
├── davies_portal.html          # Davies location portal (status + KB links)
├── itc_portal.html             # ITC location portal
├── hq_portal.html              # HQ dashboard — both locations at once
│
│  ── CHECKLISTS (staff submits these daily/weekly/monthly)
├── davies_checklist.html       # Daily — D0–D7
├── davies_weekly_checklist.html
├── davies_monthly_checklist.html
├── itc_checklist.html          # Same structure for ITC
├── itc_weekly_checklist.html
├── itc_monthly_checklist.html
│
│  ── DAILY SOP PAGES (linked from daily checklist tasks)
├── D0_enter_maintenance_mode.html
├── D1_coffee_system_tablet_cleaning.html
├── D2_liquid_dispenser_cleaning.html
├── D3_milk_system_cleaning.html
├── D4_waste_water_tank_swap_cleaning.html
├── D5_surface_cleaning_system_online.html
├── D6_set_online_kds_fullscreen.html
├── D7_chocolate_hopper_inspect.html    ← newest, just added
│
│  ── WEEKLY SOP PAGES
├── W1_weekly_restart.html
├── W2_kiosk_reboot.html
├── W3_weekly_kiosk_reset.html
├── W4_weekly_brewer_swap.html
├── W5_weekly_calibration.html
│
│  ── MONTHLY SOP PAGES
├── M1_monthly_spout_cleaning.html
├── M2_monthly_powder_cleaning.html
├── M3_monthly_spout_group_cleaning.html
├── M4_monthly_grinder_cleaning.html
├── M5_monthly_syrup_flushing.html
│
│  ── DIANMOOD KNOWLEDGE BASE (new — reference docs, not checklists)
├── kb_refill.html              # 添加物料 SOP — how to restock ingredients
├── kb_brewing.html             # 粹茶 SOP — tea brewing recipes
├── kb_sanitation.html          # 容器清洁消毒 SOP — container cleaning
│
└── images/
```

---

## How the Checklist Works

### Submit flow
1. Staff opens `davies_checklist.html` on their phone
2. Checks off D0–D7 tasks (each has a collapsible SOP link)
3. Hits Submit → `fetch()` POST to Google Apps Script URL
4. Apps Script writes a row to Google Sheets (`Submissions` tab)

### Portal status flow
1. Portal loads → `fetch(SCRIPT_URL + '?action=status')` → Apps Script `doGet`
2. Apps Script scans Sheets, returns latest submission per `location|frequency`
3. Portal calculates time elapsed, determines 🔴/🟡/✅ status
4. Auto-refreshes every 60 seconds

### Overdue thresholds
| Frequency | Window | Warn when |
|---|---|---|
| Daily | 36h | 6h left |
| Weekly | 10 days | 24h left |
| Monthly | 45 days | 3 days left |

### Google Apps Script endpoint
```
POST  → submit checklist
GET ?action=status → { status: "success", data: { "Davies|daily": { datetime, ... }, ... } }
```
Deployment URL (do not rotate unless broken):
```
https://script.google.com/macros/s/AKfycbyeSoG86Dx17hLxma5pnx3DNgyqUFXtjukPGQljcCO4R2JBpf-_bQwKR0oFQL8AA4G5/exec
```
After any Apps Script edit: **Deploy → Manage deployments → Edit → New version → Deploy** (required or changes won't take effect).

---

## Design System (keep consistent)

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

All pages are dark theme, mobile-first. Staff use these on their phones.

---

## What's Working Well (don't break these)

- ✅ Submit → Sheets pipeline
- ✅ Portal real-time status (multi-device via Sheets, not localStorage)
- ✅ D0–D7 daily tasks with collapsible SOP links
- ✅ W1–W5, M1–M5 SOP pages
- ✅ Knowledge base pages (kb_refill, kb_brewing, kb_sanitation)
- ✅ KB section in all three portals
- ✅ HQ dashboard showing both locations

---

## What Needs to Be Built / Improved

This is your domain. Dad focuses on content — you focus on making content easy to display and maintain.

### Priority 1 — Content display improvements
- [ ] **Image support in SOP pages** — Dad will add step-by-step photos. Need a standard image component (lightbox on tap, lazy load, stored on Google Drive or GitHub `/images/`)
- [ ] **Video embed improvements** — Currently just a link to Google Drive. Consider embedded thumbnail preview or inline player if Drive allows
- [ ] **SOP pages missing content** — Many D0–D6 SOP pages have placeholder structure but thin step content. Dad will fill in text; you ensure the HTML template handles rich content gracefully

### Priority 2 — Content management (make it easier for Dad to update)
- [ ] **Templating / generator script** — Right now every SOP page is hand-written HTML. A Python or Node script that takes a JSON/Markdown config and outputs HTML would let Dad add new SOPs without touching code
- [ ] **Single source of truth for task list** — Task codes (D0–D7, W1–W5, M1–M5) are duplicated across davies + itc checklists. A shared JS config file or build step would prevent sync bugs

### Priority 3 — UX polish
- [ ] **Search / filter in Knowledge Base** — As content grows, staff need to find things fast
- [ ] **Breadcrumb / back navigation** — Some SOP pages use `history.back()` which breaks if opened directly from a link
- [ ] **Offline support (PWA)** — Staff are sometimes in areas with weak signal. Service worker cache would help
- [ ] **Print / PDF view** — Some SOPs may need to be printed and posted physically

### Priority 4 — Operations improvements
- [ ] **Submission history view** — Right now there's no way to see past submissions without opening Google Sheets. A simple `/history.html` page would help
- [ ] **Photo upload on submit** — Staff could attach a photo when they note an abnormal issue

---

## Local Development

No server needed. Just open HTML files directly in browser, or use:
```bash
cd /path/to/c1-checklist
python3 -m http.server 8080
# open http://localhost:8080/davies_portal.html
```

Note: `fetch()` calls to Google Apps Script will work from localhost (CORS is open on the Apps Script side).

## Deploying

```bash
git add .
git commit -m "describe what changed"
git push origin main
# GitHub Pages updates in ~1 minute
```

---

## Content Files (Dad's domain — don't restructure without discussing)

The source-of-truth markdown files for the three knowledge base SOPs are stored locally at:
```
/home/hui_chen/.hermes/user_data/coffee_ops/sops/knowledge_base/
├── 添加物料SOP.md
├── 粹茶SOP.md
└── 容器清洁消毒SOP.md
```
When Dad updates content, the corresponding `kb_*.html` files get rebuilt. Your job is to make those HTML pages better at displaying whatever content goes into them.

---

## Questions?

Ask Dad. He knows the operations inside out — if something in the SOP seems wrong or unclear, it's worth a 5-minute conversation before you code around it.
