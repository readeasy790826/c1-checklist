# Content

All staff-facing instructional text lives here as **Markdown files** — one file
per document. This is the only place content is edited; the app (`app.js` +
`md.js`) fetches these files and renders them in the shared design. No HTML, no
JavaScript, no build step.

## SOPs — `content/sops/`

The app UI is **English-only**, so SOPs need just one file per maintenance task,
named by its task code:

```
content/sops/D1.en.md
```

The task code (`D1`, `W3`, `M5`, …) comes from `data.js`.

### File format

A short **frontmatter** block (between the `---` lines) holds the metadata, then
the body is plain Markdown:

```markdown
---
title: Coffee System Tablet Cleaning
freq: daily            # daily | weekly | monthly
time: 10–15 min        # optional chip
video: https://drive.google.com/drive/folders/…   # optional reference video
video_label: What to Avoid                          # optional chip label
---

## Materials Needed

- **Urnex Cafiza Tablets (E31)**

## Procedure

### Step 1: …

1. Do the thing.
   - A sub-point.

> A line starting with "> " becomes a warning callout.
```

To add a brand-new task, add it to `data.js` and drop a matching `<code>.en.md`
here.

## Knowledge base — `content/kb/`

KB is the **one bilingual surface**. Each article has two files — English and
中文 — and the KB page shows an EN/中文 switch that loads the matching one
(falling back to English if the 中文 file is missing):

```
content/kb/refill.en.md
content/kb/refill.zh.md
```

The article `id` (`refill`, `brewing`, …) comes from `D.KB` in `data.js`. Each
file's frontmatter carries its own `title:` (in that language) and a short
`summary:`. To add an article, add an entry to `D.KB` and drop the two files here.

## Supported Markdown (`md.js`)

Headings (`#`, `##`, `###`), **bold**, *italic*, `code`, ordered/unordered lists
(one level of nesting), links, images, `---` dividers, **pipe tables**, and
callouts. Images use repo-root-relative paths, e.g. `![alt](assets/foo.jpg)`.

Callouts use an optional GitHub-style marker to pick the colour (a plain `> …`
defaults to a warning):

```markdown
> [!WARNING] amber — cautions
> [!DANGER] red — hard safety warnings
> [!TIP] green — helpful confirmations
> [!INFO] neutral — reference notes
```

Heading sizes: `#` is a large section title, `##` is a small uppercase
sub-label, `###` is an accent-coloured step heading.
