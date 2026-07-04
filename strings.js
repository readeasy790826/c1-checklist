// ============================================================================
// strings.js — central table of English UI copy (chrome labels, buttons,
// status + submit messages) plus a tiny interpolation helper. The app UI is
// English-only; page content (SOP/KB bodies) lives in Markdown files and
// carries its own language separately (KB has its own per-article switch).
// ============================================================================
window.DIANMOOD = window.DIANMOOD || {};

(function (D) {
  'use strict';

  var STRINGS = {
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
    not_started:    'Not started',

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
    submit_unconfirmed: "Couldn't confirm submission — check connection and retry.",

    coming_soon:    'Coming soon',
    updated_on:     'Updated {x}',
    sop_missing:    'This SOP has not been added yet.'
  };

  // Frequency labels for the dashboard/checklist headings.
  D.FREQ_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

  // t('due_in', {x:'3h'}) — looks up UI copy and fills {token} placeholders.
  D.t = function (key, vars) {
    var s = STRINGS[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  };
})(window.DIANMOOD);
