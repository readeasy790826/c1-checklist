# Content

Staff-facing instructional text lives here as Markdown. The app fetches and
renders these files — edit content here only.

## SOPs — `content/sops/`

One English file per task code (from `data.js`):

```
content/sops/D1.en.md
```

```markdown
---
title: Coffee System Tablet Cleaning
freq: daily            # daily | weekly | monthly
time: 10–15 min        # optional chip
video: https://…       # optional reference video
video_label: What to Avoid   # optional chip label
---

**Purpose:** Why this task matters. (optional)

## Materials Needed

- **Urnex Cafiza Tablets (E31)**

## SOP Steps

### Step 1: …

1. Do the thing.
   - A sub-point.

> [!WARNING] A safety note (labelled callout).
```

Section order: optional `**Purpose:**`, then `## Materials Needed` (omit if none),
then `## SOP Steps`. Long tasks may group steps under `### Step N: Title`.

To add a task: entry in `data.js` + matching `<code>.en.md` here.

## Knowledge base — `content/kb/`

Bilingual. Each article needs both files; the page EN/中文 switch loads the match
(falls back to English if 中文 is missing):

```
content/kb/refill.en.md
content/kb/refill.zh.md
```

`id` comes from `D.KB`. Frontmatter `title:` is the page heading for that language.
Optional `video:` / `video_label:` work like SOPs. Dashboard card title/desc come
from `D.KB`.

## Supported Markdown (`md.js`)

`#` `##` `###` (rendered as h2–h4), **bold**, *italic*, `code`, lists (one nest
level), links, images, `---`, pipe tables, callouts. Image paths are repo-root
relative: `![alt](assets/foo.jpg)`.

```markdown
> [!WARNING] amber — cautions
> [!DANGER] red — hard safety warnings
> [!TIP] green — helpful confirmations
> [!INFO] / [!NOTE] neutral — reference notes
```

Plain `> …` (no marker) renders as a warning. Heading sizes: `#` large section,
`##` small uppercase label, `###` accent step heading.
