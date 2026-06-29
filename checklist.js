// checklist.js — shared logic for all daily/weekly/monthly checklists
(function () {
  'use strict';

  var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeSoG86Dx17hLxma5pnx3DNgyqUFXtjukPGQljcCO4R2JBpf-_bQwKR0oFQL8AA4G5/exec';

  var TASK_DEFS = {
    daily: [
      { code: 'D0', title: 'Enter maintenance mode',                  sopUrl: 'D0_enter_maintenance_mode.html' },
      { code: 'D1', title: 'Coffee system tablet cleaning',            sopUrl: 'D1_coffee_system_tablet_cleaning.html',  videoUrl: 'https://drive.google.com/drive/folders/1QUJTRZZq9H95vjXKdMcvDKvWC5w2YUxT' },
      { code: 'D2', title: 'Liquid dispenser cleaning',                sopUrl: 'D2_liquid_dispenser_cleaning.html',       videoUrl: 'https://drive.google.com/drive/folders/1kWjNmZAKVA0vmNZWfmlynLeqehhfjr8m' },
      { code: 'D3', title: 'Milk system cleaning',                     sopUrl: 'D3_milk_system_cleaning.html',            videoUrl: 'https://drive.google.com/drive/folders/1-ABEVhrBSKxZ-Cy7juKHT1sbNv9in1BQ' },
      { code: 'D4', title: 'Waste water tank swap and cleaning',       sopUrl: 'D4_waste_water_tank_swap_cleaning.html',  videoUrl: 'https://drive.google.com/drive/folders/1Zs_Ps4Cd4f-ucI_LivjSsS6hz2AE-XM9' },
      { code: 'D5', title: 'Surface cleaning and waste bag replacement', sopUrl: 'D5_surface_cleaning_system_online.html', videoUrl: 'https://drive.google.com/drive/folders/1LwK6yS4H4wAGMQmwKd1oZ3s4l0blD3s1' },
      { code: 'D6', title: 'Set robot online and KDS full screen',     sopUrl: 'D6_set_online_kds_fullscreen.html' },
      { code: 'D7', title: 'Chocolate powder hopper inspection',       sopUrl: 'D7_chocolate_hopper_inspect.html',        videoUrl: 'https://drive.google.com/file/d/18dWltS0gTkbMUtEbsUxiKglpgwI5MaYl/view?usp=drive_link', videoLabel: '⚠️ What to Avoid' }
    ],
    weekly: [
      { code: 'W1', title: 'Restart Windows',              sopUrl: 'W1_weekly_restart.html' },
      { code: 'W2', title: 'Reboot kiosk',                 sopUrl: 'W2_kiosk_reboot.html' },
      { code: 'W3', title: 'Brewer deep cleaning (swap)',  sopUrl: 'W3_weekly_kiosk_reset.html' },
      { code: 'W4', title: 'Clean the fridges',            sopUrl: 'W4_weekly_fridge_cleaning.html' },
      { code: 'W5', title: 'Recalibrate the scales',       sopUrl: 'W5_weekly_calibration.html' }
    ],
    monthly: [
      { code: 'M1', title: 'Empty the ice maker',                          sopUrl: 'M1_monthly_spout_cleaning.html' },
      { code: 'M2', title: 'Powder system deep manual cleaning',            sopUrl: 'M2_monthly_powder_cleaning.html',      videoUrl: 'https://drive.google.com/file/d/1cHumUZ8qdpyWO_qYNSSUm6Ts0Hl38FNS/view?usp=drive_link' },
      { code: 'M3', title: 'Deep cleaning of beverage spout groups',        sopUrl: 'M3_monthly_spout_group_cleaning.html' },
      { code: 'M4', title: 'Clean coffee grinder with cleaning tablets',    sopUrl: 'M4_monthly_grinder_cleaning.html' },
      { code: 'M5', title: 'Syrup dispenser deep cleaning',                 sopUrl: 'M5_monthly_syrup_flushing.html' }
    ]
  };

  var cfg      = window.CHECKLIST_CONFIG;
  var tasks    = TASK_DEFS[cfg.frequency];
  var ALL_CODES = tasks.map(function (t) { return t.code; });
  var checkedSet = new Set();

  function init() {
    var freqLabel = cfg.frequency.charAt(0).toUpperCase() + cfg.frequency.slice(1);

    // Page metadata
    document.title = 'C1 Pro ' + freqLabel + ' Maintenance — ' + cfg.location;
    document.getElementById('page-title').textContent =
      '☕ C1 Pro ' + freqLabel + ' Maintenance — ' + cfg.location;
    document.getElementById('page-subtitle').textContent =
      'Complete all ' + tasks.length + ' tasks before ' +
      (cfg.frequency === 'daily' ? 'opening' : 'submitting');

    // Readonly form fields
    document.getElementById('location').value   = cfg.location;
    document.getElementById('machine_id').value = cfg.machineId;

    // Default date/time to now
    var now = new Date();
    document.getElementById('check_date').value = now.toISOString().split('T')[0];
    document.getElementById('check_time').value = now.toTimeString().slice(0, 5);

    // Generate task cards
    var list  = document.getElementById('task-list');
    var label = document.createElement('div');
    label.className   = 'section-label';
    label.textContent = freqLabel.toUpperCase() + ' TASKS — Click task to expand, checkbox to complete';
    list.appendChild(label);
    tasks.forEach(function (task) { list.appendChild(buildTaskCard(task)); });

    // Wire up buttons
    document.getElementById('btn-select-all').addEventListener('click', selectAll);
    document.getElementById('btn-clear-all').addEventListener('click', clearAll);
    document.getElementById('submit_btn').addEventListener('click', submitChecklist);

    updateProgress();
  }

  function buildTaskCard(task) {
    var card = document.createElement('div');
    card.className = 'task-card';
    card.id = 'task_' + task.code;

    var links = '<a class="sop-link" href="' + task.sopUrl + '" target="_blank">📄 SOP Steps</a>';
    if (task.videoUrl) {
      var label = task.videoLabel || '▶ Videos';
      links += '<a class="video-btn" href="' + task.videoUrl + '" target="_blank">' + label + '</a>';
    }

    card.innerHTML =
      '<div class="task-header">' +
        '<span class="task-code">' + task.code + '</span>' +
        '<span class="task-title">' + task.title + '</span>' +
        '<div class="task-checkbox"><input type="checkbox" id="check_' + task.code + '"></div>' +
      '</div>' +
      '<div class="task-body" id="body_' + task.code + '">' +
        links +
        '<div class="notes-label">Notes / Abnormal issue (optional):</div>' +
        '<textarea class="notes-input" id="notes_' + task.code + '" placeholder="Leave blank if no issues"></textarea>' +
      '</div>';

    var header   = card.querySelector('.task-header');
    var checkbox = card.querySelector('.task-checkbox');

    header.addEventListener('click', function (e) {
      if (!e.target.closest('.task-checkbox')) toggleTask(task.code);
    });
    checkbox.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleCheck(task.code);
    });

    return card;
  }

  function updateProgress() {
    var done  = ALL_CODES.filter(function (c) { return checkedSet.has(c); }).length;
    var total = ALL_CODES.length;
    document.getElementById('progress_fill').style.width = (done / total * 100) + '%';
    document.getElementById('progress_text').textContent = done + ' / ' + total + ' tasks completed';
    var btn = document.getElementById('submit_btn');
    btn.disabled     = done !== total;
    btn.style.opacity = done === total ? '1' : '0.4';
  }

  function toggleTask(code) {
    document.getElementById('body_' + code).classList.toggle('open');
  }

  function toggleCheck(code) {
    if (checkedSet.has(code)) {
      checkedSet.delete(code);
      document.getElementById('task_' + code).classList.remove('checked');
      document.getElementById('check_' + code).checked = false;
    } else {
      checkedSet.add(code);
      document.getElementById('task_' + code).classList.add('checked');
      document.getElementById('check_' + code).checked = true;
    }
    updateProgress();
  }

  function selectAll() {
    ALL_CODES.forEach(function (code) {
      checkedSet.add(code);
      document.getElementById('task_' + code).classList.add('checked');
      document.getElementById('check_' + code).checked = true;
    });
    updateProgress();
  }

  function clearAll() {
    ALL_CODES.forEach(function (code) {
      checkedSet.delete(code);
      document.getElementById('task_' + code).classList.remove('checked');
      document.getElementById('check_' + code).checked = false;
    });
    updateProgress();
  }

  function setStatus(type, msg) {
    var el = document.getElementById('submit_status');
    el.className   = 'submit-status' + (type ? ' ' + type : '');
    el.textContent = msg;
  }

  async function submitChecklist() {
    var location   = document.getElementById('location').value;
    var machine_id = document.getElementById('machine_id').value;
    var date       = document.getElementById('check_date').value;
    var time       = document.getElementById('check_time').value;

    if (!date || !time) {
      setStatus('err', '⚠️ Please fill in Date and Time first.');
      return;
    }

    var incomplete = ALL_CODES.filter(function (c) { return !checkedSet.has(c); });
    if (incomplete.length > 0) {
      setStatus('err', '⚠️ All tasks must be completed. Missing: ' + incomplete.join(', '));
      return;
    }

    var taskData = {};
    ALL_CODES.forEach(function (c) {
      var notesEl = document.getElementById('notes_' + c);
      taskData[c] = { checked: true, notes: notesEl ? notesEl.value.trim() : '' };
    });

    var payload = {
      date: date,
      time: time,
      datetime: date + ' ' + time,
      location: location,
      machine_id: machine_id,
      staff_name: '',
      supervisor: '',
      frequency: cfg.frequency,
      tasks: taskData,
      abnormal_issues: ''
    };

    var btn = document.getElementById('submit_btn');
    btn.disabled = true;
    setStatus('', 'Submitting…');

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });

      setStatus('ok', '✅ Submitted! (' + date + ' ' + time + ' — ' + location + ')');

      setTimeout(function () {
        checkedSet.clear();
        document.querySelectorAll('.task-card').forEach(function (c) { c.classList.remove('checked'); });
        document.querySelectorAll('input[type="checkbox"]').forEach(function (c) { c.checked = false; });
        document.querySelectorAll('.notes-input').forEach(function (n) { n.value = ''; });
        updateProgress();
        document.getElementById('check_time').value = new Date().toTimeString().slice(0, 5);
        btn.disabled = false;
        setStatus('', '');
      }, 3000);

    } catch (e) {
      setStatus('err', '❌ Submit failed: ' + e.message);
      btn.disabled = false;
    }
  }

  init();
})();
