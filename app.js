// ============================================================================
// app.js — SPA shell for every Dianmood entry point. Hash-routed views:
// dashboard, checklist, Abnormal Handling, SOP, KB.
//
// Entry pages set window.DIANMOOD_PRESET before loading this file:
//   { mode: 'location', slug: 'davies', base: '../' }  -> one store
//   { mode: 'hq', base: '' }                            -> all locations
// ============================================================================
(function () {
  'use strict';
  var D = window.DIANMOOD;
  var t = D.t;
  var PRESET = window.DIANMOOD_PRESET || { mode: 'hq' };
  // Location entries live in /<slug>/, so BASE reaches root content/scripts.
  var BASE = PRESET.base || '';
  var IS_HQ = PRESET.mode === 'hq';

  function dashSlugs() {
    return IS_HQ ? D.LOCATIONS.map(function (l) { return l.slug; }) : [PRESET.slug];
  }

  // ── Shared status cache (one poll feeds every view) ─────────────────────
  var statusData = {};
  var statusLoaded = false;
  var statusError = false;
  var lastRefresh = '';

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

  // { level, pct, sub, subClass } for a location|frequency status entry.
  function statusInfo(freq, entry) {
    var limit = D.LIMITS[freq], warn = D.WARN_BEFORE[freq];
    // No submission yet → gray (neutral). Red only after a logged run goes past LIMITS.
    if (!entry || !entry.datetime) {
      return { level: 'gray', pct: 0, sub: t('no_record'), subClass: 'gray' };
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

  function el(html) {
    var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Reference-video chip for SOP / KB pages (frontmatter `video` / `video_label`).
  function videoChip(url, label) {
    if (!url) return '';
    return '<a class="chip-link" href="' + esc(url) +
      '" target="_blank" rel="noopener">▶ ' + esc(label || t('videos')) + '</a>';
  }
  function videoBlock(meta) {
    return meta && meta.video
      ? '<div class="sop-links">' + videoChip(meta.video, meta.video_label) + '</div>'
      : '';
  }

  // ── Header ──────────────────────────────────────────────────────────────
  function renderHeader() {
    var loc = !IS_HQ ? D.getLocation(PRESET.slug) : null;
    var sub = IS_HQ ? t('hq_sub')
      : (loc ? loc.machineId + ' · ' + t('app_sub') : t('app_sub'));
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

  // ── Abnormal Handling ───────────────────────────────────────────────────
  // Emphasize DO NOT after escaping (used in procedure points).
  function formatAbnormalPoint(p) {
    return esc(p).replace(/\bDO NOT\b/g, '<strong class="abnormal-rules__emph">DO NOT</strong>');
  }

  // Points: strings, or { text, points } for nested bullets under a step.
  function abnormalPointsHtml(points, nested) {
    if (!points || !points.length) return '';
    var tag = nested ? 'ul' : 'ol';
    return '<' + tag + ' class="abnormal-rules__points">' +
      points.map(function (p) {
        if (typeof p === 'string') {
          return '<li>' + formatAbnormalPoint(p) + '</li>';
        }
        return '<li>' + formatAbnormalPoint(p.text || '') +
          abnormalPointsHtml(p.points, true) + '</li>';
      }).join('') + '</' + tag + '>';
  }

  function abnormalRulesHtml() {
    var rules = D.ABNORMAL_HANDLING || [];
    if (!rules.length) return '';
    return '<div class="abnormal-rules">' +
      rules.map(function (rule) {
        var body =
          (rule.text ? '<p class="abnormal-rules__lead">' + esc(rule.text) + '</p>' : '') +
          abnormalPointsHtml(rule.points);
        return '<details class="abnormal-rules__item">' +
          '<summary class="abnormal-rules__title">' +
            '<span class="abnormal-rules__i" aria-hidden="true">i</span>' +
            '<span class="abnormal-rules__title-text">' + esc(rule.title) + '</span>' +
            '<span class="abnormal-rules__chev" aria-hidden="true"></span>' +
          '</summary>' +
          '<div class="abnormal-rules__body">' + body + '</div>' +
          '</details>';
      }).join('') +
      '</div>';
  }

  function abnormalEntry() {
    return '<a class="abnormal-entry" href="#/abnormal">' +
      '<span class="abnormal-entry__icon" aria-hidden="true">i</span>' +
      '<span class="abnormal-entry__body">' +
        '<span class="abnormal-entry__title">' + t('abnormal_handling') + '</span>' +
        '<span class="abnormal-entry__desc">' + t('abnormal_handling_desc') + '</span>' +
      '</span>' +
      '<span class="abnormal-entry__caret">›</span></a>';
  }

  // ── Dashboard ───────────────────────────────────────────────────────────
  function statusCard(slug, freq) {
    // Always navigable; ring is neutral until status loads (or stays neutral on error).
    var ready = statusLoaded && !statusError;
    var info = ready
      ? statusInfo(freq, statusData[D.getLocation(slug).name + '|' + freq])
      : { level: 'loading', pct: 0, sub: statusError ? '—' : t('loading'), subClass: '' };
    var label = D.FREQ_LABEL[freq];
    return el(
      '<a class="status-card" href="#/c/' + slug + '/' + freq + '">' +
        '<span class="ring" style="--pct:' + info.pct + ';--ring:' + RING_COLOR[info.level] + '">' +
          '<span class="ring__glyph">' + RING_GLYPH[info.level] + '</span></span>' +
        '<span class="status-card__body">' +
          '<span class="status-card__title">' + esc(label) + '</span>' +
          '<span class="status-card__sub ' + info.subClass + '">' + esc(info.sub) + '</span>' +
        '</span>' +
        '<span class="status-card__cta">' + t('open') + ' ›</span>' +
      '</a>');
  }

  function kbList(includeHq) {
    var items = D.KB.filter(function (k) { return k.scope === 'all' || includeHq; });
    return '<div class="section-label">' + t('knowledge_base') + '</div>' +
      '<div class="card-stack">' + items.map(function (k) {
        var body = '<span class="kb-card__body"><span class="kb-card__title">' + esc(k.title) + '</span>' +
          '<span class="kb-card__desc">' + esc(k.desc) + '</span></span>';
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
    var html = '<div class="wrap">';
    if (IS_HQ) {
      html += '<div class="page-head"><h1>' + t('hq_title') + '</h1><p>' + t('hq_sub') + '</p></div>';
    } else {
      var loc = D.getLocation(PRESET.slug);
      html += '<div class="page-head"><h1>' + esc(loc.name) + '</h1><p>' + esc(loc.machineId) + ' · ' + t('app_sub') + '</p></div>';
    }
    html += abnormalEntry();
    html += '<div id="dash-dynamic"></div>';
    html += kbList(IS_HQ);
    html += '<div class="last-refresh" id="dash-refresh"></div>';
    html += '</div>';
    root.appendChild(el(html));
    paintDashboard();
  }

  // Rebuild frequency cards + refresh line (safe to call when dashboard is off-screen).
  function paintDashboard() {
    var host = document.getElementById('dash-dynamic');
    if (!host) return;
    host.innerHTML = '';
    dashSlugs().forEach(function (slug) {
      var loc = D.getLocation(slug);
      var group = el('<div class="loc-group"></div>');
      if (IS_HQ) group.appendChild(el('<div class="loc-group__title">' + esc(loc.name) +
        '<span class="loc-group__id">' + esc(loc.machineId) + '</span></div>'));
      var stack = el('<div class="card-stack"></div>');
      ['daily', 'weekly', 'monthly'].forEach(function (freq) { stack.appendChild(statusCard(slug, freq)); });
      group.appendChild(stack);
      host.appendChild(group);
    });
    var r = document.getElementById('dash-refresh');
    if (r) {
      r.textContent = statusError ? t('failed_load')
        : (lastRefresh ? t('last_refresh', { x: lastRefresh }) : '');
      r.classList.toggle('err', statusError);
    }
  }

  // ── Checklist ───────────────────────────────────────────────────────────
  function viewChecklist(root, slug, freq) {
    // Location entries ignore a foreign slug in the hash (e.g. /davies/#/c/itc/…).
    if (!IS_HQ) slug = PRESET.slug;
    var loc = D.getLocation(slug);
    if (!loc || !D.TASKS[freq]) { location.hash = '#/'; return; }
    setBackVisible(true);
    var tasks = D.TASKS[freq];
    var checked = {};
    var notes = {};
    // sessionStorage draft — survives SOP navigation / refresh; cleared on confirmed submit.
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

    // el() returns only the first root — append the fixed bar separately.
    var barHtml = '<div class="submit-bar"><div class="submit-bar__inner">' +
        '<button class="btn btn--primary btn--block" id="b-submit" disabled>' + t('submit') + '</button>' +
        '<div class="submit-status" id="submit-status"></div>' +
      '</div></div>';
    root.appendChild(el(html));
    root.appendChild(el(barHtml));

    // Default to now; max=today allows delayed logging but not future dates.
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
      // Head toggles notes; SOP link and checkbox handle their own clicks.
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

    function saveProgress() {
      try {
        sessionStorage.setItem(progressKey, JSON.stringify({
          checked: checked, notes: notes,
          date: root.querySelector('#f-date').value,
          time: root.querySelector('#f-time').value
        }));
      } catch (e) { /* ignore quota / private mode */ }
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
      // Absolute UTC ISO — avoids sheet-timezone skew on naive local strings.
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
          clearProgress();
          status.className = 'submit-status ok';
          status.textContent = t('submitted') + ' — ' + date + ' ' + time;
          setTimeout(function () { location.hash = '#/'; }, 1400);
        } else {
          status.className = 'submit-status err';
          status.textContent = t('submit_unconfirmed');
          btn.disabled = false;
        }
      });
    }

    updateProgress();
  }

  // ── SOP page ────────────────────────────────────────────────────────────
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
      wrap.innerHTML =
        '<div class="page-head"><h1>' + esc(title) + '</h1></div>' + metaRow +
        videoBlock(meta) +
        '<div class="sop-content">' + D.md(doc.body, BASE) + '</div>';
    }).catch(function () {
      wrap.innerHTML = '<div class="empty">' + t('sop_missing') + '</div>';
    });
  }

  // ── KB article (EN / 中文 via localStorage `dm_kb_lang`) ─────────────────
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
        var meta = doc.meta || {};
        wrap.innerHTML =
          '<div class="page-head kb-head"><h1>' + esc(doc.meta.title || entry.title) + '</h1>' +
            '<div class="lang-switch">' +
              '<button data-l="en"' + (lang === 'en' ? ' class="active"' : '') + '>EN</button>' +
              '<button data-l="zh"' + (lang === 'zh' ? ' class="active"' : '') + '>中文</button>' +
            '</div></div>' +
          videoBlock(meta) +
          '<div class="sop-content">' + D.md(doc.body, BASE) + '</div>';
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

  // ── Abnormal Handling page ──────────────────────────────────────────────
  function viewAbnormal(root) {
    setBackVisible(true);
    root.appendChild(el(
      '<div class="wrap">' +
        '<div class="page-head"><h1>' + t('abnormal_handling') + '</h1>' +
          '<p>' + t('abnormal_handling_desc') + '</p></div>' +
        abnormalRulesHtml() +
      '</div>'));
  }

  // ── Router ──────────────────────────────────────────────────────────────
  function route() {
    var root = document.getElementById('app');
    root.innerHTML = '';
    document.body.classList.remove('has-submit-bar');
    window.scrollTo(0, 0);

    var hash = location.hash.replace(/^#/, '');
    var parts = hash.split('/').filter(Boolean);

    if (parts[0] === 'c' && parts[1] && parts[2]) {
      viewChecklist(root, parts[1], parts[2]);
    } else if (parts[0] === 'sop' && parts[1]) {
      viewSop(root, parts[1]);
    } else if (parts[0] === 'kb' && parts[1]) {
      viewKb(root, parts[1]);
    } else if (parts[0] === 'abnormal') {
      viewAbnormal(root);
    } else {
      viewDashboard(root);
    }
  }

  // ── Submit + confirm ────────────────────────────────────────────────────
  // no-cors POST responses are opaque, so we POST then re-read ?action=status
  // and require our datetime on location|frequency before showing success.
  function submitAndConfirm(payload) {
    var key = payload.location + '|' + payload.frequency;
    var verify = function () { return confirmLanded(key, payload.datetime, 3); };
    return fetch(D.SCRIPT_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), mode: 'no-cors'
    }).then(verify, verify);
  }

  // Poll status up to `tries` times (800ms apart); refreshes shared status cache.
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

  // ── Status polling (every 60s) ──────────────────────────────────────────
  function loadStatus() {
    fetch(D.SCRIPT_URL + '?action=status')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        statusData = json.data || {}; statusLoaded = true; statusError = false;
        lastRefresh = new Date().toLocaleTimeString();
      })
      .catch(function () { statusError = true; })
      .then(paintDashboard);
  }

  // ── Image lightbox (delegated clicks on .sop-content img) ───────────────
  function initLightbox() {
    var box = el('<div class="lightbox"><img alt=""></div>');
    document.body.appendChild(box);
    var full = box.querySelector('img');
    function close() { box.classList.remove('open'); full.src = ''; }
    box.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('click', function (e) {
      var img = e.target;
      if (img.tagName === 'IMG' && img.closest('.sop-content')) {
        full.src = img.src; full.alt = img.alt || ''; box.classList.add('open');
      }
    });
  }

  // ── Boot ────────────────────────────────────────────────────────────────
  renderHeader();
  initLightbox();
  window.addEventListener('hashchange', route);
  route();
  loadStatus();
  setInterval(loadStatus, 60000);
})();
