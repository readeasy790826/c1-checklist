// portal.js — shared utilities for davies/itc/hq portals

var SCRIPT_URL  = 'https://script.google.com/macros/s/AKfycbyeSoG86Dx17hLxma5pnx3DNgyqUFXtjukPGQljcCO4R2JBpf-_bQwKR0oFQL8AA4G5/exec';
var LIMITS      = { daily: 36, weekly: 240, monthly: 1080 }; // hours
var WARN_BEFORE = { daily: 6, weekly: 24, monthly: 72 };     // warn when X hours left

function getStatusInfo(freq, entry) {
  var limitH = LIMITS[freq];
  var warnH  = WARN_BEFORE[freq];
  if (!entry || !entry.datetime) {
    return { level: 'red', label: 'Never completed', sub: '⚠️ No record found', subClass: 'red' };
  }
  var last      = new Date(entry.datetime);
  var now       = new Date();
  var diffH     = (now - last) / 3600000;
  var remaining = limitH - diffH;
  var doneStr   = formatAgo(diffH);

  if (remaining < 0) {
    return {
      level: 'red',
      label: freq.charAt(0).toUpperCase() + freq.slice(1),
      sub: '🔴 Overdue by ' + formatDuration(Math.round(-remaining)) + ' · Last: ' + doneStr,
      subClass: 'red'
    };
  } else if (remaining < warnH) {
    return {
      level: 'yellow',
      label: freq.charAt(0).toUpperCase() + freq.slice(1),
      sub: '🟡 Due in ' + formatDuration(Math.round(remaining)) + ' · Last: ' + doneStr,
      subClass: 'yellow'
    };
  } else {
    return {
      level: 'green',
      label: freq.charAt(0).toUpperCase() + freq.slice(1),
      sub: '✅ Last done ' + doneStr,
      subClass: 'green'
    };
  }
}

function formatAgo(h) {
  if (h < 1) return Math.round(h * 60) + 'm ago';
  if (h < 24) return Math.round(h) + 'h ago';
  return Math.round(h / 24) + 'd ago';
}

function formatDuration(h) {
  if (h < 24) return h + 'h';
  var d   = Math.floor(h / 24);
  var rem = h % 24;
  return rem > 0 ? d + 'd ' + rem + 'h' : d + 'd';
}

function buildCard(freq, info, url) {
  var card = document.createElement('div');
  card.className = 'freq-card status-' + info.level;
  card.innerHTML =
    '<a class="card-inner" href="' + url + '">' +
      '<div class="status-dot"></div>' +
      '<div class="card-text">' +
        '<div class="card-title">' + info.label + '</div>' +
        '<div class="card-sub ' + info.subClass + '">' + info.sub + '</div>' +
      '</div>' +
      '<div class="go-btn">Go →</div>' +
    '</a>';
  return card;
}

function updateBanner(statusData) {
  var banner      = document.getElementById('alert-banner');
  var redItems    = [];
  var yellowItems = [];
  Object.keys(statusData).forEach(function (key) {
    var parts = key.split('|');
    var freq  = parts[1];
    var info  = getStatusInfo(freq, statusData[key]);
    if (info.level === 'red')    redItems.push(parts[0] + ' ' + freq);
    else if (info.level === 'yellow') yellowItems.push(parts[0] + ' ' + freq);
  });
  if (redItems.length > 0) {
    banner.className   = 'alert-banner red';
    banner.textContent = '🔴 OVERDUE: ' + redItems.join(', ').toUpperCase();
  } else if (yellowItems.length > 0) {
    banner.className   = 'alert-banner yellow';
    banner.textContent = '🟡 DUE SOON: ' + yellowItems.join(', ');
  } else {
    banner.className   = 'alert-banner';
    banner.textContent = '';
  }
}

// Single-location portal initialiser.
// config: { location, urls: { daily, weekly, monthly } }
function initPortal(config) {
  function loadStatus() {
    fetch(SCRIPT_URL + '?action=status')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        document.getElementById('loading').style.display = 'none';
        var statusData = json.data || {};
        updateBanner(statusData);

        var cards = document.getElementById('cards');
        cards.innerHTML = ''; // clear before re-render (prevents duplicates on 60s refresh)
        ['daily', 'weekly', 'monthly'].forEach(function (freq) {
          var key  = config.location + '|' + freq;
          var info = getStatusInfo(freq, statusData[key]);
          cards.appendChild(buildCard(freq, info, config.urls[freq]));
        });

        document.getElementById('last-refresh').textContent =
          'Last refreshed: ' + new Date().toLocaleTimeString();
      })
      .catch(function () {
        document.getElementById('loading').textContent = '❌ Failed to load status. Check connection.';
      });
  }

  loadStatus();
  setInterval(loadStatus, 60000);
}
