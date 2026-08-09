// ============================================================================
// md.js — Markdown renderer + content loaders for SOP / Abnormal / KB.
// Supports: #–### headings (rendered as h2–h4), **bold**, *italic*, `code`,
// links, images, lists (one nest level), > callouts, ---, pipe tables.
// Relative paths get `base` so root-authored content works from /<slug>/ entries.
// ============================================================================
window.DIANMOOD = window.DIANMOOD || {};

(function (D) {
  'use strict';

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function isExternal(u) { return /^(https?:)?\/\//.test(u) || u.charAt(0) === '#'; }

  // > [!WARNING] → .callout--warn, etc. (see app.css).
  var CALLOUT_KIND = {
    WARNING: 'warn', CAUTION: 'warn',
    DANGER: 'danger', IMPORTANT: 'danger',
    TIP: 'ok', SUCCESS: 'ok',
    NOTE: 'info', INFO: 'info'
  };
  var CALLOUT_META = {
    warn:   { icon: '⚠️', label: 'Warning' },
    danger: { icon: '❗', label: 'Important' },
    ok:     { icon: '✅', label: 'Tip' },
    info:   { icon: '📌', label: 'Note' }
  };

  function tableCells(line) {
    return line.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
  }
  function isTableSep(line) {
    return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(line) && line.indexOf('-') >= 0;
  }

  function inline(text, base) {
    var s = escHtml(text);
    // images ![alt](src)
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_, alt, src) {
      return '<img src="' + (isExternal(src) ? src : base + src) + '" alt="' + alt + '">';
    });
    // links [text](href)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, txt, href) {
      var ext = isExternal(href) && href.charAt(0) !== '#';
      return '<a href="' + (isExternal(href) ? href : base + href) + '"' +
        (ext ? ' target="_blank" rel="noopener"' : '') + '>' + txt + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    return s;
  }

  function renderList(items, base) {
    var html = '', i = 0;
    function build(level) {
      var ordered = items[i].ordered;
      var tag = ordered ? 'ol' : 'ul';
      var out = '<' + tag + '>';
      while (i < items.length && items[i].indent >= level) {
        if (items[i].indent > level) { out += build(items[i].indent); continue; }
        var li = '<li>' + inline(items[i].text, base);
        i++;
        if (i < items.length && items[i].indent > level) li += build(items[i].indent);
        out += li + '</li>';
      }
      return out + '</' + tag + '>';
    }
    while (i < items.length) html += build(items[i].indent);
    return html;
  }

  // --- key: value --- frontmatter → { meta, body }.
  function parseFrontmatter(text) {
    text = text.replace(/^\uFEFF/, '');
    var meta = {}, body = text;
    var m = /^---\s*\n([\s\S]*?)\n---\s*\n?/.exec(text);
    if (m) {
      m[1].split('\n').forEach(function (line) {
        if (!line.trim()) return;
        var i = line.indexOf(':');
        if (i < 0) return;
        meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      });
      body = text.slice(m[0].length);
    }
    return { meta: meta, body: body };
  }

  // Cache by path; clear on failure so the next view can retry.
  var docCache = {};
  D.loadDoc = function (path) {
    if (!docCache[path]) {
      docCache[path] = fetch(path)
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(parseFrontmatter)
        .catch(function (e) { delete docCache[path]; throw e; });
    }
    return docCache[path];
  };

  // English-only docs: content/<folder>/<id>.en.md
  function loadEn(folder, id, base) {
    return D.loadDoc((base || '') + 'content/' + folder + '/' + id + '.en.md');
  }
  D.loadSop = function (code, base) { return loadEn('sops', code, base); };
  D.loadAbnormal = function (id, base) { return loadEn('abnormal', id, base); };

  // content/kb/<id>.<lang>.md, falling back to .en.md
  D.loadKb = function (id, lang, base) {
    base = base || '';
    var primary = base + 'content/kb/' + id + '.' + lang + '.md';
    var english = base + 'content/kb/' + id + '.en.md';
    var p = D.loadDoc(primary);
    return primary === english ? p : p.catch(function () { return D.loadDoc(english); });
  };

  D.md = function (src, base) {
    base = base || '';
    var lines = (src || '').replace(/\r/g, '').split('\n');
    var out = '', i = 0;

    function listMatch(l) {
      var m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(l);
      if (!m) return null;
      return { indent: Math.floor(m[1].length / 2), ordered: /\d/.test(m[2]), text: m[3] };
    }

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) { i++; continue; }

      // headings
      var h = /^(#{1,3})\s+(.*)$/.exec(line);
      if (h) { var lvl = h[1].length + 1; out += '<h' + lvl + '>' + inline(h[2], base) + '</h' + lvl + '>'; i++; continue; }

      // horizontal rule
      if (/^---+$/.test(line.trim())) { out += '<hr>'; i++; continue; }

      // Callout: consecutive > lines; optional [!WARNING] / DANGER / TIP / INFO.
      if (/^>\s?/.test(line)) {
        var buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
        var kind = 'warn', label = '';
        var mk = /^\[!(\w+)\]\s*(.*)$/.exec(buf[0]);
        if (mk) {
          kind = CALLOUT_KIND[mk[1].toUpperCase()] || 'warn';
          label = mk[1].charAt(0).toUpperCase() + mk[1].slice(1).toLowerCase();
          buf[0] = mk[2];
          if (!buf[0]) buf.shift();
        }
        var meta = CALLOUT_META[kind];
        out += '<div class="callout callout--' + kind + '">' +
          '<div class="callout__label">' + meta.icon + ' ' + (label || meta.label) + '</div>' +
          '<div class="callout__body">' +
          buf.map(function (b) { return inline(b, base); }).join('<br>') +
          '</div></div>';
        continue;
      }

      // standalone image -> figure
      var img = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line);
      if (img) {
        var src = isExternal(img[2]) ? img[2] : base + img[2];
        out += '<figure><img src="' + src + '" alt="' + img[1] + '">' +
          (img[1] ? '<figcaption>' + escHtml(img[1]) + '</figcaption>' : '') + '</figure>';
        i++; continue;
      }

      // GFM pipe table (header + separator row).
      if (line.indexOf('|') >= 0 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        var head = tableCells(line);
        var aligns = tableCells(lines[i + 1]).map(function (c) {
          var l = c.charAt(0) === ':', r = c.charAt(c.length - 1) === ':';
          return l && r ? 'center' : r ? 'right' : l ? 'left' : '';
        });
        i += 2;
        var rows = [];
        while (i < lines.length && lines[i].trim() && lines[i].indexOf('|') >= 0) { rows.push(tableCells(lines[i])); i++; }
        var cell = function (tag, txt, idx) {
          return '<' + tag + (aligns[idx] ? ' style="text-align:' + aligns[idx] + '"' : '') + '>' +
            inline(txt || '', base) + '</' + tag + '>';
        };
        out += '<table><thead><tr>' +
          head.map(function (c, idx) { return cell('th', c, idx); }).join('') +
          '</tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr>' + head.map(function (_, idx) { return cell('td', r[idx], idx); }).join('') + '</tr>';
          }).join('') +
          '</tbody></table>';
        continue;
      }

      if (listMatch(line)) {
        var items = [];
        while (i < lines.length && listMatch(lines[i])) { items.push(listMatch(lines[i])); i++; }
        out += renderList(items, base);
        continue;
      }

      var para = [];
      while (i < lines.length && lines[i].trim() &&
             !/^(#{1,3})\s/.test(lines[i]) && !/^>\s?/.test(lines[i]) &&
             !/^---+$/.test(lines[i].trim()) && !listMatch(lines[i])) {
        para.push(lines[i]); i++;
      }
      out += '<p>' + para.map(function (p) { return inline(p.replace(/\s+$/, ''), base); }).join('<br>') + '</p>';
    }
    return out;
  };
})(window.DIANMOOD);
