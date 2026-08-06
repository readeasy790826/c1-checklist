// ============================================================================
// strings.js — English UI chrome + t() interpolation. SOP/KB body language
// lives in the Markdown files (KB has its own EN/中文 switch).
// ============================================================================
window.DIANMOOD = window.DIANMOOD || {};

(function (D) {
  'use strict';

  var STRINGS = {
    app_sub:        'Operations Portal',
    hq_title:       'All Locations',
    hq_sub:         'HQ dashboard',

    knowledge_base: 'Knowledge Base',
    abnormal_handling: 'Abnormal Handling',
    abnormal_handling_desc: 'Must-read procedures for emergency situations',
    open: 'Open',

    last_done:      'Last done {x}',
    overdue_by:     'Overdue by {x}',
    due_in:         'Due in {x}',
    no_record:      'No record found',

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
    submit_unconfirmed: "Couldn't confirm submission — check connection and retry.",

    coming_soon:    'Coming soon',
    sop_missing:    'This SOP has not been added yet.'
  };

  D.FREQ_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

  // t('due_in', { x: '3h' }) — lookup + {token} replacement.
  D.t = function (key, vars) {
    var s = STRINGS[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  };
})(window.DIANMOOD);
