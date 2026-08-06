// ============================================================================
// data.js — config, locations, tasks, Abnormal Handling, KB, backend URL.
// Scale by editing this file (plus a content/*.md and/or entry HTML as needed).
// ============================================================================
window.DIANMOOD = window.DIANMOOD || {};

(function (D) {
  'use strict';

  // Google Apps Script: POST submit, GET ?action=status.
  D.SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeSoG86Dx17hLxma5pnx3DNgyqUFXtjukPGQljcCO4R2JBpf-_bQwKR0oFQL8AA4G5/exec';

  // Add a site: one entry here + copy davies/index.html to <slug>/index.html.
  D.LOCATIONS = [
    { slug: 'davies',    name: 'Davies',    machineId: 'C1-DV-01' },
    { slug: 'itc',       name: 'ITC',       machineId: 'C1-ITC-01' },
    { slug: 'infinity8', name: 'Infinity8', machineId: 'C1-I8-01' }
  ];

  // Hours until overdue (LIMITS) and hours-left when the card turns amber (WARN_BEFORE).
  D.LIMITS      = { daily: 36,  weekly: 240, monthly: 1080 };
  D.WARN_BEFORE = { daily: 6,   weekly: 24,  monthly: 72   };

  // Checklist tasks. SOP body: content/sops/<code>.en.md → route #/sop/<code>.
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
      { code: 'W3', title: 'Brewer deep cleaning (swap)' },
      { code: 'W4', title: 'Clean the fridge' },
      { code: 'W5', title: 'Recalibrate the scales' }
    ],
    monthly: [
      { code: 'M1', title: 'Empty the ice maker' },
      { code: 'M2', title: 'Powder system deep manual cleaning' },
      { code: 'M3', title: 'Deep cleaning of beverage spout groups' },
      { code: 'M4', title: 'Clean coffee grinder' },
      { code: 'M5', title: 'Syrup dispenser deep cleaning' }
    ]
  };

  // Emergency procedures → home entry + #/abnormal.
  // Point = string, or { text, points } for nested bullets. DO NOT is emphasized in the UI.
  D.ABNORMAL_HANDLING = [
    {
      title: 'Power Outage Operation Steps',
      points: [
        'Press the restart button on the EcoFlow power unit’s socket to reboot the power supply.',
        'Long-press the power button of the robotic arm control host to power on the robotic arm.',
        'After the computer restarts, launch the app and run console-restart.',
        {
          text: 'If the power outage lasts more than two hours:',
          points: [
            'Discard all raw materials stored in the refrigerator and perform a deep cleaning.'
          ]
        },
        {
          text: 'If the power outage lasts less than two hours:',
          points: [
            'Inspect the raw materials for spoilage.',
            'If no spoilage is found — business operations may resume normally.',
            'If any spoilage is detected — follow the handling rules for outages exceeding two hours.'
          ]
        }
      ]
    },
    {
      title: 'Emergency Protocol for Robotic Arm Malfunction',
      text: 'If the robotic arm malfunctions for any reason:',
      points: [
        'DO NOT attempt any manual operations on the equipment by yourself',
        'DO NOT close the Console APP under any circumstances',
        'Immediately notify professional technical staff to come on-site for inspection and troubleshooting.'
      ]
    }
  ];

  // KB cards. scope 'all' | 'hq'. soon: true = non-clickable placeholder.
  // Bodies: content/kb/<id>.{en,zh}.md (EN/中文 switch on the article page).
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
    { id: 'pos-restart', scope: 'all',
      title: 'POS Restart SOP',
      desc:  'How to restart / turn on the POS machine' },
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

  D.getLocation = function (slug) {
    return D.LOCATIONS.filter(function (l) { return l.slug === slug; })[0] || null;
  };
})(window.DIANMOOD);
