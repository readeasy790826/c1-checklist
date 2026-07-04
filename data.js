// ============================================================================
// data.js — single source of truth for config, locations, tasks, KB, backend.
// Everything that differs between locations or needs to scale lives here so
// adding a site or a task never means editing markup.
// ============================================================================
window.DIANMOOD = window.DIANMOOD || {};

(function (D) {
  'use strict';

  // Google Apps Script endpoint (POST submit / GET ?action=status).
  D.SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeSoG86Dx17hLxma5pnx3DNgyqUFXtjukPGQljcCO4R2JBpf-_bQwKR0oFQL8AA4G5/exec';

  // Locations — add a site by adding one entry (and a /<slug>/ folder shim).
  D.LOCATIONS = [
    { slug: 'davies', name: 'Davies', machineId: 'C1-DV-01' },
    { slug: 'itc',    name: 'ITC',    machineId: 'C1-ITC-01' }
  ];

  // Status windows (hours) and "warn when X hours left" — must match legacy logic.
  D.LIMITS      = { daily: 36,  weekly: 240, monthly: 1080 };
  D.WARN_BEFORE = { daily: 6,   weekly: 24,  monthly: 72   };

  // Maintenance tasks per frequency. `code` links each task to its SOP content
  // at content/sops/<code>.en.md (steps + reference video live in that file's
  // frontmatter). The checklist links out to the SOP page via #/sop/<code>.
  D.TASKS = {
    daily: [
      { code: 'D0', title: 'Enter maintenance mode' },
      { code: 'D1', title: 'Coffee system tablet cleaning' },
      { code: 'D2', title: 'Liquid dispenser cleaning' },
      { code: 'D3', title: 'Milk system cleaning' },
      { code: 'D4', title: 'Waste water tank swap and cleaning' },
      { code: 'D5', title: 'Surface cleaning and waste bag replacement' },
      { code: 'D6', title: 'Set robot online and KDS full screen' },
      { code: 'D7', title: 'Chocolate powder hopper inspection' }
    ],
    weekly: [
      { code: 'W1', title: 'Restart Windows' },
      { code: 'W2', title: 'Reboot kiosk' },
      // W3's content is the brewer deep-clean (swap) SOP, despite the legacy name.
      { code: 'W3', title: 'Brewer deep cleaning (swap)' },
      { code: 'W4', title: 'Clean the fridges' },
      { code: 'W5', title: 'Recalibrate the scales' }
    ],
    monthly: [
      { code: 'M1', title: 'Empty the ice maker' },
      { code: 'M2', title: 'Powder system deep manual cleaning' },
      { code: 'M3', title: 'Deep cleaning of beverage spout groups' },
      { code: 'M4', title: 'Clean coffee grinder with cleaning tablets' },
      { code: 'M5', title: 'Syrup dispenser deep cleaning' }
    ]
  };

  // Knowledge base. scope 'all' shows everywhere; 'hq' only on the HQ dashboard.
  // KB articles are the one bilingual surface — each has its own EN/中文 switch
  // and loads content/kb/<id>.<lang>.md via the #/kb/<id> route. `soon` = no
  // content yet (non-clickable card). Card title/desc below are English.
  D.KB = [
    { id: 'refill',     scope: 'all',
      title: 'Ingredient Restocking SOP',
      desc:  'Fridge 1/2, coffee beans, chocolate powder, cups, syrups' },
    { id: 'brewing',    scope: 'all',
      title: 'Tea Brewing SOP',
      desc:  'Jasmine, black tea & matcha recipes and steps' },
    { id: 'sanitation', scope: 'all',
      title: 'Container Cleaning & Sanitising SOP',
      desc:  'Milk jug, tea urn & water bucket cover cleaning' },
    { id: 'setup',      scope: 'hq', soon: true,
      title: 'Machine Setup SOP',
      desc:  'Initial machine setup and installation' },
    { id: 'moving',     scope: 'hq',
      title: 'Machine Moving SOP',
      desc:  'Steps for safely relocating the machine' },
    { id: 'tuneup',     scope: 'hq', soon: true,
      title: 'Machine Tune-up SOP',
      desc:  'Calibration, adjustment and performance tuning' }
  ];

  // Helpers
  D.getLocation = function (slug) {
    return D.LOCATIONS.filter(function (l) { return l.slug === slug; })[0] || null;
  };
})(window.DIANMOOD);
