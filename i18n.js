// ============================================================================
// i18n.js — UI string tables (EN / 中文) + tiny translation helper.
// One source for all chrome strings so the language toggle flips everything.
// Content (SOP/KB bodies) carries its own per-language text separately.
// ============================================================================
window.DIANMOOD = window.DIANMOOD || {};

(function (D) {
  'use strict';

  var STRINGS = {
    en: {
      app_sub:        'Operations Portal',
      hq_title:       'All Locations',
      hq_sub:         'HQ dashboard',
      pick_location:  'Choose a location',
      switch_location:'Switch location',
      locations:      'Locations',

      daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
      knowledge_base: 'Knowledge Base',
      open: 'Open',

      last_done:      'Last done {x}',
      overdue_by:     'Overdue by {x}',
      due_in:         'Due in {x}',
      never_completed:'Never completed',
      no_record:      'No record yet',
      due_soon:       'Due soon',
      overdue:        'Overdue',
      all_clear:      'All maintenance up to date',

      loading:        'Loading…',
      failed_load:    'Could not load status — check connection.',
      last_refresh:   'Last refreshed {x}',

      maintenance:    '{x} Maintenance',
      tasks_to_do:    '{n} tasks to complete',
      n_complete:     '{done} / {total} complete',
      select_all:     'Select all',
      clear_all:      'Clear all',
      date: 'Date', time: 'Time',
      sop_steps:      'SOP steps',
      videos:         'Videos',
      notes_label:    'Notes / abnormal issue (optional)',
      notes_ph:       'Leave blank if no issues',

      submit:         'Submit checklist',
      submitting:     'Submitting…',
      submitted:      'Submitted',
      need_date:      'Please fill in date and time.',
      need_all:       'Complete all tasks first. Missing: {x}',
      submit_failed:  'Submit failed — please retry.',

      coming_soon:    'Coming soon',
      updated_on:     'Updated {x}',
      sop_missing:    'This SOP has not been added yet.'
    },
    zh: {
      app_sub:        '运营门户',
      hq_title:       '所有门店',
      hq_sub:         '总部看板',
      pick_location:  '选择门店',
      switch_location:'切换门店',
      locations:      '门店',

      daily: '每日', weekly: '每周', monthly: '每月',
      knowledge_base: '知识库',
      open: '打开',

      last_done:      '上次完成于 {x}',
      overdue_by:     '已逾期 {x}',
      due_in:         '{x} 后到期',
      never_completed:'从未完成',
      no_record:      '暂无记录',
      due_soon:       '即将到期',
      overdue:        '已逾期',
      all_clear:      '所有维护均已完成',

      loading:        '加载中…',
      failed_load:    '无法加载状态 — 请检查网络。',
      last_refresh:   '上次刷新 {x}',

      maintenance:    '{x}维护',
      tasks_to_do:    '需完成 {n} 项任务',
      n_complete:     '{done} / {total} 已完成',
      select_all:     '全选',
      clear_all:      '清除',
      date: '日期', time: '时间',
      sop_steps:      '操作步骤',
      videos:         '视频',
      notes_label:    '备注 / 异常问题（可选）',
      notes_ph:       '无异常请留空',

      submit:         '提交清单',
      submitting:     '提交中…',
      submitted:      '已提交',
      need_date:      '请填写日期和时间。',
      need_all:       '请先完成所有任务。缺少：{x}',
      submit_failed:  '提交失败 — 请重试。',

      coming_soon:    '即将推出',
      updated_on:     '更新于 {x}',
      sop_missing:    '此 SOP 尚未添加。'
    }
  };

  // Frequency labels are content-ish; keep them here too for the dashboard.
  D.FREQ_LABEL = {
    en: { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' },
    zh: { daily: '每日',  weekly: '每周',   monthly: '每月' }
  };

  D.LANGS = ['en', 'zh'];

  // Current language: ?lang= override, else saved, else en.
  D.getLang = function () {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && STRINGS[q]) { localStorage.setItem('dm_lang', q); return q; }
    var saved = localStorage.getItem('dm_lang');
    return STRINGS[saved] ? saved : 'en';
  };
  D.setLang = function (lang) {
    if (STRINGS[lang]) localStorage.setItem('dm_lang', lang);
  };

  // t('due_in', {x:'3h'}) — interpolates {token} placeholders.
  D.t = function (key, vars) {
    var lang = D.getLang();
    var s = (STRINGS[lang] && STRINGS[lang][key]) || (STRINGS.en[key]) || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  };

  // Pick a localized field from a {en,zh} object, falling back to en.
  D.tx = function (obj) {
    if (!obj) return '';
    var lang = D.getLang();
    return obj[lang] || obj.en || '';
  };
})(window.DIANMOOD);
