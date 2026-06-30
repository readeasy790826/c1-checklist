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

  // Maintenance tasks per frequency. `code` links each task to its SOP file at
  // content/sops/<code>.<lang>.md (steps + reference video live in that file's
  // frontmatter). `sopUrl` is the legacy standalone page, used only as a fallback
  // if the Markdown file can't be loaded.
  D.TASKS = {
    daily: [
      { code: 'D0', title: 'Enter maintenance mode',                     sopUrl: 'D0_enter_maintenance_mode.html' },
      { code: 'D1', title: 'Coffee system tablet cleaning',              sopUrl: 'D1_coffee_system_tablet_cleaning.html' },
      { code: 'D2', title: 'Liquid dispenser cleaning',                  sopUrl: 'D2_liquid_dispenser_cleaning.html' },
      { code: 'D3', title: 'Milk system cleaning',                       sopUrl: 'D3_milk_system_cleaning.html' },
      { code: 'D4', title: 'Waste water tank swap and cleaning',         sopUrl: 'D4_waste_water_tank_swap_cleaning.html' },
      { code: 'D5', title: 'Surface cleaning and waste bag replacement', sopUrl: 'D5_surface_cleaning_system_online.html' },
      { code: 'D6', title: 'Set robot online and KDS full screen',       sopUrl: 'D6_set_online_kds_fullscreen.html' },
      { code: 'D7', title: 'Chocolate powder hopper inspection',         sopUrl: 'D7_chocolate_hopper_inspect.html' }
    ],
    weekly: [
      { code: 'W1', title: 'Restart Windows',             sopUrl: 'W1_weekly_restart.html' },
      { code: 'W2', title: 'Reboot kiosk',                sopUrl: 'W2_kiosk_reboot.html' },
      // W3 file is named _kiosk_reset but its content is the brewer swap SOP (verified).
      { code: 'W3', title: 'Brewer deep cleaning (swap)', sopUrl: 'W3_weekly_kiosk_reset.html' },
      { code: 'W4', title: 'Clean the fridges',           sopUrl: 'W4_weekly_fridge_cleaning.html' },
      { code: 'W5', title: 'Recalibrate the scales',      sopUrl: 'W5_weekly_calibration.html' }
    ],
    monthly: [
      { code: 'M1', title: 'Empty the ice maker',                       sopUrl: 'M1_monthly_spout_cleaning.html' },
      { code: 'M2', title: 'Powder system deep manual cleaning',        sopUrl: 'M2_monthly_powder_cleaning.html' },
      { code: 'M3', title: 'Deep cleaning of beverage spout groups',    sopUrl: 'M3_monthly_spout_group_cleaning.html' },
      { code: 'M4', title: 'Clean coffee grinder with cleaning tablets',sopUrl: 'M4_monthly_grinder_cleaning.html' },
      { code: 'M5', title: 'Syrup dispenser deep cleaning',             sopUrl: 'M5_monthly_syrup_flushing.html' }
    ]
  };

  // Knowledge base. scope 'all' shows everywhere; 'hq' only on the HQ dashboard.
  D.KB = [
    { id: 'refill',     file: 'kb_refill.html',     scope: 'all',
      title: { en: 'Ingredient Restocking SOP', zh: '添加物料 SOP' },
      desc:  { en: 'Fridge 1/2, coffee beans, chocolate powder, cups, syrups', zh: '冰箱 1/2、咖啡豆、巧克力粉、杯子、糖浆' } },
    { id: 'brewing',    file: 'kb_brewing.html',    scope: 'all',
      title: { en: 'Tea Brewing SOP', zh: '粹茶 SOP' },
      desc:  { en: 'Jasmine, black tea & matcha recipes and steps', zh: '茉莉、红茶与抹茶配方及步骤' } },
    { id: 'sanitation', file: 'kb_sanitation.html', scope: 'all',
      title: { en: 'Container Cleaning & Sanitising SOP', zh: '容器清洁消毒 SOP' },
      desc:  { en: 'Milk jug, tea urn & water bucket cover cleaning', zh: '奶缸、茶桶与水桶盖清洁流程' } },
    { id: 'setup',      file: 'kb_setup.html',      scope: 'hq', soon: true,
      title: { en: 'Machine Setup SOP', zh: '机器安装 SOP' },
      desc:  { en: 'Initial machine setup and installation', zh: '机器初始安装与设置流程' } },
    { id: 'moving',     file: 'kb_moving.html',     scope: 'hq',
      title: { en: 'Machine Moving SOP', zh: '机器搬运 SOP' },
      desc:  { en: 'Steps for safely relocating the machine', zh: '安全搬运咖啡机的步骤' } },
    { id: 'tuneup',     file: 'kb_tuneup.html',     scope: 'hq', soon: true,
      title: { en: 'Machine Tune-up SOP', zh: '机器调试 SOP' },
      desc:  { en: 'Calibration, adjustment and performance tuning', zh: '校准、调整与性能调试流程' } }
  ];

  // Helpers
  D.getLocation = function (slug) {
    return D.LOCATIONS.filter(function (l) { return l.slug === slug; })[0] || null;
  };
})(window.DIANMOOD);
