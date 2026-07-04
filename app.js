// ============================================================================
// app.js — shared single-page app for every Dianmood entry point.
// Hash-routed (GitHub-Pages safe, real Back button, deep-linkable). One shell
// renders all views: dashboard, checklist, SOP page, KB article.
//
// Entry pages set window.DIANMOOD_PRESET before loading this file:
//   { mode: 'location', slug: 'davies' }  -> a single store
//   { mode: 'hq' }                         -> all locations (root)
// ============================================================================
(function () {
  'use strict';
  var D = window.DIANMOOD;
  var t = D.t;
  var PRESET = window.DIANMOOD_PRESET || { mode: 'hq' };
  // Content (SOP/KB) files live at the repo root. Location entries sit in a
  // subfolder (/davies/), so they reach root content via BASE = '../'.
  var BASE = PRESET.base || '';

  // ── Shared status cache so all views poll the backend only once ─────────
  var statusData = {};
  var statusLoaded = false;   // true once a status fetch has resolved OK
  var statusError = false;    // true if the last status fetch failed
  var lastRefresh = '';

  // ── Relative-time + duration formatting ─────────────────────────────────
  function formatAgo(h) {
    if (h < 1)  return Math.max(1, Math.round(h * 60)) + 'm ago';
    if (h < 24) return Math.round(h) + 'h ago';
    return Math.round(h / 24) + 'd ago';
  }
  function formatDuration(h) {
    if (h < 24) return h + 'h';
    var d = Math.floor(h / 24), rem = h % 24;
    return rem > 0 ? d + 'd ' + rem + 'h' : d + 'd';
  }

  // ── Status computation (preserves legacy thresholds exactly) ────────────
  // Returns { level, pct, sub, subClass } for a location|frequency entry.
  function statusInfo(freq, entry) {
    var limit = D.LIMITS[freq], warn = D.WARN_BEFORE[freq];
    // Never submitted → neutral "gray" (not started), not an alarm. Only a task
    // that WAS logged and has since passed its threshold counts as red overdue.
    if (!entry || !entry.datetime) {
      return { level: 'gray', pct: 0, sub: t('not_started'), subClass: 'gray' };
    }
    var elapsed = (Date.now() - new Date(entry.datetime).getTime()) / 3600000;
    var remaining = limit - elapsed;
    var ago = formatAgo(elapsed);
    if (remaining < 0) {
      return { level: 'red', pct: 0,
        sub: t('overdue_by', { x: formatDuration(Math.round(-remaining)) }), subClass: 'red' };
    }
    if (remaining < warn) {
      return { level: 'amber', pct: Math.round(remaining / limit * 100),
        sub: t('due_in', { x: formatDuration(Math.round(remaining)) }), subClass: 'amber' };
    }
    return { level: 'green', pct: Math.round(remaining / limit * 100),
      sub: t('last_done', { x: ago }), subClass: 'green' };
  }
  var RING_COLOR = { green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)', gray: 'var(--muted)', loading: 'var(--border-2)' };
  var RING_GLYPH = { green: '✓', amber: '!', red: '!', gray: '–', loading: '·' };

  // ── Tiny DOM helper ─────────────────────────────────────────────────────
  function el(html) {
    var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ── SOP content rendering ────────────────────────────────────────────────
  // SOP bodies live as Markdown files (content/sops/<code>.<lang>.md), fetched
  // + cached on demand by md.js and shown on the standalone SOP page (viewSop).
  function videoChip(url, label) {
    if (!url) return '';
    return '<a class="chip-link chip-link--video" href="' + esc(url) +
      '" target="_blank" rel="noopener">▶ ' + esc(label || t('videos')) + '</a>';
  }

  // ── Header (fixed; rendered once, updated per route) ─────────────────────
  function renderHeader() {
    var sub = PRESET.mode === 'hq' ? t('hq_sub')
      : (D.getLocation(PRESET.slug) ? D.getLocation(PRESET.slug).machineId + ' · ' + t('app_sub') : t('app_sub'));
    var header = document.getElementById('app-header');
    header.innerHTML =
      '<button class="app-header__back" id="nav-back" aria-label="Back">‹</button>' +
      '<a class="brand" href="#/">' +
        '<span class="brand__logo">D</span>' +
        '<span class="brand__text">' +
          '<span class="brand__title">Dianmood</span>' +
          '<span class="brand__sub">' + esc(sub) + '</span>' +
        '</span>' +
      '</a>';

    header.querySelector('#nav-back').addEventListener('click', function () { history.back(); });
  }
  function setBackVisible(v) {
    var b = document.getElementById('nav-back');
    if (b) b.classList.toggle('show', !!v);
  }

  // ── Location chip + bottom-sheet picker ─────────────────────────────────
  function locChip(loc) {
    return '<div class="loc-bar"><button class="loc-chip" id="loc-chip">' +
      '<span class="loc-chip__dot"></span>' +
      '<span class="loc-chip__name">' + esc(loc.name) + '</span>' +
      '<span class="loc-chip__id">' + esc(loc.machineId) + '</span>' +
      '<span class="loc-chip__caret">▾</span></button></div>';
  }
  function openLocationPicker(currentSlug, onPick) {
    var items = D.LOCATIONS.map(function (l) {
      return '<div class="sheet__item' + (l.slug === currentSlug ? ' active' : '') + '" data-slug="' + l.slug + '">' +
        '<span class="loc-chip__dot"></span>' +
        '<span class="sheet__item-name">' + esc(l.name) + '</span>' +
        '<span class="sheet__item-id">' + esc(l.machineId) + '</span></div>';
    }).join('');
    var back = el('<div class="sheet-backdrop"><div class="sheet">' +
      '<div class="sheet__grip"></div>' +
      '<div class="sheet__title">' + t('switch_location') + '</div>' + items +
      '</div></div>');
    function close() { if (back.parentNode) back.parentNode.removeChild(back); }
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    back.querySelectorAll('.sheet__item').forEach(function (it) {
      it.addEventListener('click', function () { close(); onPick(it.dataset.slug); });
    });
    document.body.appendChild(back);
  }

  // ── View: dashboard (one location or all) ───────────────────────────────
  function statusCard(slug, freq) {
    // Cards always render (they're the navigation into checklists); the ring is
    // only meaningful once status has loaded. Until then, show a neutral ring.
    var ready = statusLoaded && !statusError;
    var info = ready
      ? statusInfo(freq, statusData[D.getLocation(slug).name + '|' + freq])
      : { level: 'loading', pct: 0, sub: statusError ? '—' : t('loading'), subClass: '' };
    var label = D.FREQ_LABEL[freq];
    var card = el(
      '<a class="status-card" href="#/c/' + slug + '/' + freq + '">' +
        '<span class="ring" style="--pct:' + info.pct + ';--ring:' + RING_COLOR[info.level] + '">' +
          '<span class="ring__glyph">' + RING_GLYPH[info.level] + '</span></span>' +
        '<span class="status-card__body">' +
          '<span class="status-card__title">' + esc(label) + '</span>' +
          '<span class="status-card__sub ' + info.subClass + '">' + esc(info.sub) + '</span>' +
        '</span>' +
        '<span class="status-card__cta">' + t('open') + ' ›</span>' +
      '</a>');
    return card;
  }

  function bannerFor(slugs) {
    var red = [], amber = [];
    slugs.forEach(function (slug) {
      var loc = D.getLocation(slug);
      ['daily', 'weekly', 'monthly'].forEach(function (freq) {
        var info = statusInfo(freq, statusData[loc.name + '|' + freq]);
        var tag = (slugs.length > 1 ? loc.name + ' ' : '') + D.FREQ_LABEL[freq];
        if (info.level === 'red') red.push(tag);
        else if (info.level === 'amber') amber.push(tag);
      });
    });
    if (red.length)   return '<div class="banner banner--red"><span class="banner__icon"></span>' + t('overdue') + ': ' + esc(red.join(', ')) + '</div>';
    if (amber.length) return '<div class="banner banner--amber"><span class="banner__icon"></span>' + t('due_soon') + ': ' + esc(amber.join(', ')) + '</div>';
    return '<div class="banner banner--green"><span class="banner__icon"></span>' + t('all_clear') + '</div>';
  }

  function kbList(includeHq) {
    var items = D.KB.filter(function (k) { return k.scope === 'all' || includeHq; });
    return '<div class="section-label">' + t('knowledge_base') + '</div>' +
      '<div class="card-stack">' + items.map(function (k) {
        var body = '<span class="kb-card__body"><span class="kb-card__title">' + esc(k.title) + '</span>' +
          '<span class="kb-card__desc">' + esc(k.desc) + '</span></span>';
        // "Coming soon" articles have no content yet — render a non-clickable card.
        if (k.soon) {
          return '<div class="kb-card kb-card--soon">' + body +
            '<span class="kb-card__tag">' + t('coming_soon') + '</span></div>';
        }
        return '<a class="kb-card" href="#/kb/' + k.id + '">' + body +
          '<span class="kb-card__caret">›</span></a>';
      }).join('') + '</div>';
  }

  function viewDashboard(root) {
    setBackVisible(false);
    var multi = PRESET.mode === 'hq';
    var slugs = multi ? D.LOCATIONS.map(function (l) { return l.slug; }) : [PRESET.slug];

    var html = '<div class="wrap">';
    if (multi) {
      html += '<div class="page-head"><h1>' + t('hq_title') + '</h1><p>' + t('hq_sub') + '</p></div>';
    } else {
      var loc = D.getLocation(PRESET.slug);
      html += locChip(loc) +
        '<div class="page-head"><h1>' + esc(loc.name) + '</h1><p>' + esc(loc.machineId) + ' · ' + t('app_sub') + '</p></div>';
    }
    html += '<div id="dash-dynamic"></div>';
    html += kbList(multi);
    html += '<div class="last-refresh" id="dash-refresh"></div>';
    html += '</div>';
    root.appendChild(el(html));

    if (!multi) {
      root.querySelector('#loc-chip').addEventListener('click', function () {
        openLocationPicker(PRESET.slug, function (slug) { location.href = '../' + slug + '/'; });
      });
    }
    paintDashboard(slugs, multi);
  }

  // Fills the dynamic portion of the dashboard (re-run on every status poll).
  // The banner reflects backend state; the cards are ALWAYS drawn so checklist
  // links stay reachable while status is loading or if the fetch fails.
  function paintDashboard(slugs, multi) {
    var host = document.getElementById('dash-dynamic');
    if (!host) return;
    host.innerHTML = statusError
      ? '<div class="banner banner--amber"><span class="banner__icon"></span>' + t('failed_load') + '</div>'
      : statusLoaded ? bannerFor(slugs) : '';
    slugs.forEach(function (slug) {
      var loc = D.getLocation(slug);
      var group = el('<div class="loc-group"></div>');
      if (multi) group.appendChild(el('<div class="loc-group__title">' + esc(loc.name) +
        '<span class="loc-group__id">' + esc(loc.machineId) + '</span></div>'));
      var stack = el('<div class="card-stack"></div>');
      ['daily', 'weekly', 'monthly'].forEach(function (freq) { stack.appendChild(statusCard(slug, freq)); });
      group.appendChild(stack);
      host.appendChild(group);
    });
    var r = document.getElementById('dash-refresh');
    if (r && lastRefresh) r.textContent = t('last_refresh', { x: lastRefresh });
  }

  // ── View: checklist (+ submit) ──────────────────────────────────────────
  function viewChecklist(root, slug, freq) {
    // On a single-store entry (davies/ or itc/), ignore any slug in the URL and
    // pin to this store — prevents e.g. /davies/#/c/itc/daily rendering ITC.
    if (PRESET.mode === 'location') slug = PRESET.slug;
    var loc = D.getLocation(slug);
    if (!loc || !D.TASKS[freq]) { location.hash = '#/'; return; }
    setBackVisible(true);
    var tasks = D.TASKS[freq];
    var checked = {};       // code -> bool
    var notes = {};         // code -> string
    // Draft persistence: survive opening an SOP / accidental refresh mid-checklist
    // (per tab session; cleared on confirmed submit). See save/restore below.
    var progressKey = 'dianmood:progress:' + slug + ':' + freq;

    document.body.classList.add('has-submit-bar');

    var html = '<div class="wrap">' +
      '<div class="page-head"><h1>' + t('maintenance', { x: D.FREQ_LABEL[freq] }) + '</h1>' +
        '<p>' + esc(loc.name) + ' · ' + esc(loc.machineId) + ' · ' + t('tasks_to_do', { n: tasks.length }) + '</p></div>' +

      '<div class="meta-card">' +
        '<div class="field-row">' +
          '<div class="field"><label>' + t('date') + '</label><input type="date" id="f-date"></div>' +
          '<div class="field"><label>' + t('time') + '</label><input type="time" id="f-time"></div>' +
        '</div>' +
        '<div class="btn-row" style="margin-top:12px">' +
          '<button class="btn btn--ok" id="b-all">' + t('select_all') + '</button>' +
          '<button class="btn btn--warn" id="b-clear">' + t('clear_all') + '</button>' +
        '</div>' +
      '</div>' +

      '<div class="progress"><div class="progress__track"><div class="progress__fill" id="pfill"></div></div>' +
        '<div class="progress__text" id="ptext"></div></div>' +

      '<div id="tasklist"></div>' +
      '</div>';

    // Submit bar is a separate fixed-to-viewport node; append on its own because
    // el() only returns the first root element (the .wrap above).
    var barHtml = '<div class="submit-bar"><div class="submit-bar__inner">' +
        '<button class="btn btn--primary btn--block" id="b-submit" disabled>' + t('submit') + '</button>' +
        '<div class="submit-status" id="submit-status"></div>' +
      '</div></div>';
    root.appendChild(el(html));
    root.appendChild(el(barHtml));

    // default date/time = now; cap the date picker at today so staff can log a
    // past completion (delayed logging) but not a future date.
    var now = new Date();
    var today = now.toISOString().split('T')[0];
    var fDate = root.querySelector('#f-date');
    fDate.value = today;
    fDate.max = today;
    root.querySelector('#f-time').value = now.toTimeString().slice(0, 5);

    var list = root.querySelector('#tasklist');
    tasks.forEach(function (task) { list.appendChild(taskCard(task)); });

    function taskCard(task) {
      var card = el(
        '<div class="task" id="task-' + task.code + '">' +
          '<div class="task__head">' +
            '<span class="task__code">' + esc(task.code) + '</span>' +
            '<span class="task__title">' + esc(task.title) + '</span>' +
            '<a class="task__sop" href="#/sop/' + task.code + '">' + t('sop_steps') + ' ›</a>' +
            '<span class="checkbox" data-check="' + task.code + '"></span>' +
          '</div>' +
          '<div class="task__body">' +
            '<div class="field"><label>' + t('notes_label') + '</label>' +
              '<textarea data-note="' + task.code + '" placeholder="' + t('notes_ph') + '"></textarea></div>' +
          '</div>' +
        '</div>');
      // Header toggles the notes body; the SOP link and checkbox act on their own.
      card.querySelector('.task__head').addEventListener('click', function (e) {
        if (e.target.closest('.checkbox') || e.target.closest('.task__sop')) return;
        card.classList.toggle('open');
      });
      card.querySelector('.checkbox').addEventListener('click', function (e) {
        e.stopPropagation(); toggle(task.code);
      });
      card.querySelector('[data-note]').addEventListener('input', function (e) { notes[task.code] = e.target.value; saveProgress(); });
      return card;
    }

    function toggle(code) {
      checked[code] = !checked[code];
      document.getElementById('task-' + code).classList.toggle('done', checked[code]);
      updateProgress(); saveProgress();
    }
    function setAll(v) {
      tasks.forEach(function (tk) { checked[tk.code] = v;
        document.getElementById('task-' + tk.code).classList.toggle('done', v); });
      updateProgress(); saveProgress();
    }
    function doneCount() { return tasks.filter(function (tk) { return checked[tk.code]; }).length; }
    function updateProgress() {
      var done = doneCount(), total = tasks.length;
      root.querySelector('#pfill').style.width = (done / total * 100) + '%';
      root.querySelector('#ptext').textContent = t('n_complete', { done: done, total: total });
      root.querySelector('#b-submit').disabled = done !== total;
    }

    // ── Draft persistence (sessionStorage; best-effort, never fatal) ─────────
    function saveProgress() {
      try {
        sessionStorage.setItem(progressKey, JSON.stringify({
          checked: checked, notes: notes,
          date: root.querySelector('#f-date').value,
          time: root.querySelector('#f-time').value
        }));
      } catch (e) { /* storage full/blocked — ignore */ }
    }
    function clearProgress() { try { sessionStorage.removeItem(progressKey); } catch (e) {} }
    function restoreProgress() {
      var s;
      try { s = JSON.parse(sessionStorage.getItem(progressKey) || 'null'); } catch (e) { return; }
      if (!s) return;
      if (s.date) root.querySelector('#f-date').value = s.date;
      if (s.time) root.querySelector('#f-time').value = s.time;
      Object.keys(s.notes || {}).forEach(function (code) {
        notes[code] = s.notes[code];
        var ta = root.querySelector('[data-note="' + code + '"]');
        if (ta) ta.value = s.notes[code];
      });
      Object.keys(s.checked || {}).forEach(function (code) {
        if (!s.checked[code]) return;
        checked[code] = true;
        var card = document.getElementById('task-' + code);
        if (card) card.classList.add('done');
      });
      updateProgress();
    }

    root.querySelector('#b-all').addEventListener('click', function () { setAll(true); });
    root.querySelector('#b-clear').addEventListener('click', function () { setAll(false); });
    root.querySelector('#b-submit').addEventListener('click', submit);
    // Persist the date/time fields as they change, then restore any draft.
    ['#f-date', '#f-time'].forEach(function (sel) {
      root.querySelector(sel).addEventListener('input', saveProgress);
    });
    restoreProgress();

    function submit() {
      var date = root.querySelector('#f-date').value, time = root.querySelector('#f-time').value;
      var status = root.querySelector('#submit-status');
      if (!date || !time) { status.className = 'submit-status err'; status.textContent = t('need_date'); return; }
      var missing = tasks.filter(function (tk) { return !checked[tk.code]; }).map(function (tk) { return tk.code; });
      if (missing.length) { status.className = 'submit-status err'; status.textContent = t('need_all', { x: missing.join(', ') }); return; }

      var taskData = {};
      tasks.forEach(function (tk) { taskData[tk.code] = { checked: true, notes: (notes[tk.code] || '').trim() }; });
      // Send an absolute UTC instant, not a naive "YYYY-MM-DD HH:MM" string, so
      // the backend/sheet timezone can't skew the recorded time. The picked
      // date+time is read in the device's local zone, then serialised to ISO.
      var datetime = new Date(date + 'T' + time).toISOString();
      var payload = {
        date: date, time: time, datetime: datetime,
        location: loc.name, machine_id: loc.machineId,
        staff_name: '', supervisor: '', frequency: freq,
        tasks: taskData, abnormal_issues: ''
      };

      var btn = root.querySelector('#b-submit');
      btn.disabled = true; status.className = 'submit-status'; status.textContent = t('submitting');
      submitAndConfirm(payload).then(function (confirmed) {
        if (confirmed) {
          clearProgress();                 // done — drop the saved draft
          status.className = 'submit-status ok';
          status.textContent = t('submitted') + ' — ' + date + ' ' + time;
          setTimeout(function () { location.hash = '#/'; }, 1400);
        } else {
          // Couldn't verify the row landed — keep progress, let them retry.
          status.className = 'submit-status err';
          status.textContent = t('submit_unconfirmed');
          btn.disabled = false;
        }
      });
    }

    updateProgress();
  }

  // ── View: full-page SOP (deep-linkable, printable) ──────────────────────
  function viewSop(root, code) {
    setBackVisible(true);
    var wrap = el('<div class="wrap"><div class="loading">' + t('loading') + '</div></div>');
    root.appendChild(wrap);
    D.loadSop(code, BASE).then(function (doc) {
      var meta = doc.meta;
      var title = meta.title || code;
      var freqLabel = D.FREQ_LABEL[meta.freq] || '';
      var metaRow = '<div class="sop-meta">' +
        '<span class="meta-chip meta-chip--code">' + esc(code) + '</span>' +
        (freqLabel ? '<span class="meta-chip">' + esc(freqLabel) + '</span>' : '') +
        (meta.time ? '<span class="meta-chip">' + esc(meta.time) + '</span>' : '') + '</div>';
      var foot = meta.updated
        ? '<div class="last-refresh">' + t('updated_on', { x: meta.updated }) +
          (meta.version ? ' · v' + esc(meta.version) : '') + '</div>'
        : '';
      wrap.innerHTML =
        '<div class="page-head"><h1>' + esc(title) + '</h1></div>' + metaRow +
        (meta.video ? '<div class="sop-links">' + videoChip(meta.video, meta.video_label) + '</div>' : '') +
        '<div class="sop-content sop-content--page">' + D.md(doc.body, BASE) + '</div>' + foot;
    }).catch(function () {
      wrap.innerHTML = '<div class="empty">' + t('sop_missing') + '</div>';
    });
  }

  // ── View: KB article (bilingual, per-article EN/中文 switch) ─────────────
  // KB is the only bilingual surface. The reader's language choice is remembered
  // across articles in localStorage; content loads from content/kb/<id>.<lang>.md.
  function kbLang() { return localStorage.getItem('dm_kb_lang') === 'zh' ? 'zh' : 'en'; }

  function viewKb(root, id) {
    setBackVisible(true);
    var entry = D.KB.filter(function (k) { return k.id === id; })[0];
    if (!entry || entry.soon) { location.hash = '#/'; return; }
    var wrap = el('<div class="wrap"></div>');
    root.appendChild(wrap);

    function render() {
      var lang = kbLang();
      wrap.innerHTML = '<div class="loading">' + t('loading') + '</div>';
      D.loadKb(id, lang, BASE).then(function (doc) {
        wrap.innerHTML =
          '<div class="page-head kb-head"><h1>' + esc(doc.meta.title || entry.title) + '</h1>' +
            '<div class="lang-switch">' +
              '<button data-l="en"' + (lang === 'en' ? ' class="active"' : '') + '>EN</button>' +
              '<button data-l="zh"' + (lang === 'zh' ? ' class="active"' : '') + '>中文</button>' +
            '</div></div>' +
          '<div class="sop-content sop-content--page">' + D.md(doc.body, BASE) + '</div>';
        wrap.querySelectorAll('.lang-switch button').forEach(function (b) {
          b.addEventListener('click', function () {
            localStorage.setItem('dm_kb_lang', b.dataset.l); render();
          });
        });
      }).catch(function () {
        wrap.innerHTML = '<div class="empty">' + t('sop_missing') + '</div>';
      });
    }
    render();
  }

  // ── Router ───────────────────────────────────────────────────────────────
  function route() {
    var root = document.getElementById('app');
    root.innerHTML = '';
    document.body.classList.remove('has-submit-bar');
    window.scrollTo(0, 0);

    var hash = location.hash.replace(/^#/, '');         // e.g. /c/davies/daily
    var parts = hash.split('/').filter(Boolean);        // ['c','davies','daily']

    if (parts[0] === 'c' && parts[1] && parts[2]) {
      viewChecklist(root, parts[1], parts[2]);
    } else if (parts[0] === 'sop' && parts[1]) {
      viewSop(root, parts[1]);
    } else if (parts[0] === 'kb' && parts[1]) {
      viewKb(root, parts[1]);
    } else {
      viewDashboard(root);
    }
  }

  // Repaint the dashboard's dynamic area (only if a dashboard is on screen).
  function repaintDashboard() {
    if (!document.getElementById('dash-dynamic')) return;
    var multi = PRESET.mode === 'hq';
    paintDashboard(multi ? D.LOCATIONS.map(function (l) { return l.slug; }) : [PRESET.slug], multi);
  }

  // ── Submit + confirm ─────────────────────────────────────────────────────
  // A no-cors POST response is opaque (unreadable), so the POST alone can't tell
  // us if the write succeeded. We therefore POST, then re-read ?action=status and
  // check our exact datetime shows up for this location|frequency. Resolves true
  // only when confirmed — killing false "Submitted ✓" on silent failures.
  function submitAndConfirm(payload) {
    var key = payload.location + '|' + payload.frequency;
    var verify = function () { return confirmLanded(key, payload.datetime, 3); };
    return fetch(D.SCRIPT_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), mode: 'no-cors'
    }).then(verify, verify);   // verify whether the POST resolved or rejected
  }
  // Poll status up to `tries` times (800ms apart) for our row. As a side effect,
  // refresh the shared status cache so the dashboard is current after redirect.
  function confirmLanded(key, datetime, tries) {
    return new Promise(function (resolve) {
      (function attempt(n) {
        setTimeout(function () {
          fetch(D.SCRIPT_URL + '?action=status', { cache: 'no-store' })
            .then(function (r) { return r.json(); })
            .then(function (json) {
              if (json && json.data) {
                statusData = json.data; statusLoaded = true; statusError = false;
                lastRefresh = new Date().toLocaleTimeString();
              }
              var rec = statusData[key];
              if (rec && rec.datetime === datetime) return resolve(true);
              if (n > 1) return attempt(n - 1);
              resolve(false);
            })
            .catch(function () { n > 1 ? attempt(n - 1) : resolve(false); });
        }, 800);
      })(tries);
    });
  }

  // ── Backend status polling (shared, every 60s) ──────────────────────────
  function loadStatus() {
    fetch(D.SCRIPT_URL + '?action=status')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        statusData = json.data || {}; statusLoaded = true; statusError = false;
        lastRefresh = new Date().toLocaleTimeString();
      })
      .catch(function () { statusError = true; })
      .then(repaintDashboard);   // refresh card/banner state either way
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  renderHeader();
  window.addEventListener('hashchange', route);
  route();
  loadStatus();
  setInterval(loadStatus, 60000);
})();
