# Content

All staff-facing instructional text lives here as **Markdown files** — one file
per document. This is the only place content is edited; the app (`app.js` +
`md.js`) fetches these files and renders them in the shared design. No HTML, no
JavaScript, no build step.

## SOPs — `content/sops/`

One file per maintenance task, named by its task code and language:

```
content/sops/D1.en.md      ← English (required)
content/sops/D1.zh.md      ← 中文 (optional; add later)
```

The task code (`D1`, `W3`, `M5`, …) comes from `data.js`. The app shows the
English file by default and automatically uses the `.zh.md` version when the
language toggle is set to 中文 (falling back to English if it doesn't exist yet).

### File format

A short **frontmatter** block (between the `---` lines) holds the metadata, then
the body is plain Markdown:

```markdown
---
title: Coffee System Tablet Cleaning
freq: daily            # daily | weekly | monthly
time: 10–15 min
updated: 2026-05-25
version: 2.4
video: https://drive.google.com/drive/folders/…   # optional reference video
video_label: What to Avoid                          # optional chip label
---

## Materials Needed

- **Urnex Cafiza Tablets (E31)**

## Procedure

### Step 1: …

1. Do the thing.
   - A sub-point.

> A line starting with "> " becomes a yellow warning/safety callout.
```

Supported Markdown: headings (`##`, `###`), **bold**, *italic*, `code`, lists
(with one level of nesting), links, images, and `> ` warning callouts. Images
use repo-root-relative paths, e.g. `![alt](images/foo.jpg)`.

To add a Chinese version, copy the file to `D1.zh.md` and translate `title:` +
the body. To add a brand-new task, add it to `data.js` and drop a matching
`<code>.en.md` here.

## Knowledge base — `content/kb/`

Same idea for KB articles (coming next): `refill.en.md`, `refill.zh.md`, etc.
