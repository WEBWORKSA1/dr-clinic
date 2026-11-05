/* dr.clinic — site behaviour. No dependencies. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var params = new URLSearchParams(location.search);

  /* ---------- Private inbox routing (the address is never written in the page) ---------- */
  var _k = [102, 100, 104, 37, 103, 98, 106, 102, 108, 75, 58, 106, 120, 96, 121, 100, 124, 105, 110, 124];
  function inbox() { return String.fromCharCode.apply(null, _k.map(function (c) { return c ^ 11; })).split('').reverse().join(''); }
  function endpoint() { return 'https://formsubmit.co/ajax/' + inbox(); }
  function mailto(subject, body) { return 'mailto:' + inbox() + '?subject=' + encodeURIComponent(subject || 'Inquiry from dr.clinic') + (body ? '&body=' + encodeURIComponent(body.slice(0, 1800)) : ''); }
  $$('[data-mail]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); window.location.href = mailto(a.getAttribute('data-mail')); });
  });

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next); store('drc-theme', next);
    });
  });

  /* ---------- Navigation ---------- */
  var nav = $('#site-nav'), tog = $('[data-nav-toggle]');
  function closeNav() { if (!nav) return; nav.classList.remove('open'); if (tog) tog.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  if (nav && tog) {
    tog.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
    document.addEventListener('click', function (e) { if (nav.classList.contains('open') && !nav.contains(e.target) && !tog.contains(e.target)) closeNav(); });
  }
  $$('[data-menu-btn]').forEach(function (b) {
    var m = b.nextElementSibling;
    b.addEventListener('click', function (e) { e.stopPropagation(); var o = m.classList.toggle('open'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    document.addEventListener('click', function (e) { if (!b.parentNode.contains(e.target)) { m.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } });
  });

  /* ---------- Forms → private inbox via FormSubmit (AJAX) ---------- */
  function serialize(form) {
    var d = {};
    new FormData(form).forEach(function (v, k) {
      if (k === '_honey' || v === '') return;
      if (d[k] !== undefined) d[k] = [].concat(d[k], v); else d[k] = v;
    });
    Object.keys(d).forEach(function (k) { if (Array.isArray(d[k])) d[k] = d[k].join(', '); });
    return d;
  }
  function validate(scope) {
    var ok = true;
    $$('input,select,textarea', scope).forEach(function (el) {
      if (el.type === 'hidden' || el.classList.contains('hp')) return;
      var f = el.closest('.field') || el.closest('fieldset');
      var good = el.checkValidity();
      if (!good) ok = false;
      if (f) f.classList.toggle('invalid', !good);
    });
    return ok;
  }
  function asText(data) { return Object.keys(data).filter(function (k) { return k.charAt(0) !== '_'; }).map(function (k) { return k + ': ' + data[k]; }).join('\n'); }
  function showSuccess(form) {
    var targetId = form.getAttribute('data-success');
    var status = $('[data-status]', form);
    if (form.hasAttribute('data-inline-success')) {
      if (status) { status.classList.remove('err'); status.textContent = form.getAttribute('data-inline-success') || 'Thank you — received.'; }
      form.reset(); return;
    }
    var target = targetId ? document.getElementById(targetId) : null;
    if (target) { form.hidden = true; target.hidden = false; target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.focus && target.focus(); }
    else {
      form.innerHTML = '<div class="form-success" tabindex="-1"><div class="big-check"><svg class="ico" aria-hidden="true"><use href="/assets/img/icons.svg#check"></use></svg></div><h3>Thank you — we have received it.</h3><p>We usually reply within 1–2 business days.</p></div>';
    }
    document.dispatchEvent(new CustomEvent('drc:submitted', { detail: { form: form.getAttribute('data-form') } }));
  }
  function showFallback(form, data) {
    var status = $('[data-status]', form) || form.appendChild(document.createElement('p'));
    status.setAttribute('data-status', '');
    status.classList.add('form-status', 'err');
    status.innerHTML = 'We could not send this automatically. <a href="#" data-fallback>Send it with your email app instead</a> — your answers are already filled in.';
    var link = $('[data-fallback]', status);
    link.addEventListener('click', function (e) { e.preventDefault(); window.location.href = mailto(data._subject, asText(data)); });
  }
  $$('form[data-form]').forEach(function (form) {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hp = form.querySelector('[name="_honey"]');
      if (hp && hp.value) return;
      var status = $('[data-status]', form);
      if (!validate(form)) {
        var bad = $('.invalid input, .invalid select, .invalid textarea', form);
        if (bad) {
          var st = bad.closest('.step');
          if (st && !st.classList.contains('active') && form._goto) form._goto(st);
          bad.focus();
        }
        if (status) { status.textContent = 'Please complete the highlighted fields.'; status.classList.add('err'); }
        return;
      }
      var data = serialize(form);
      data._subject = form.getAttribute('data-subject') || 'New message from dr.clinic';
      data._template = 'table';
      data._captcha = 'false';
      data.page = location.href;
      data.submitted_at = new Date().toISOString();
      var btn = $('[type="submit"]', form), label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      fetch(endpoint(), { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (res) {
          if (res && (res.success === true || res.success === 'true')) showSuccess(form);
          else showFallback(form, data);
        })
        .catch(function () { showFallback(form, data); })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = label; } });
    });
  });

  /* ---------- Multi-step forms ---------- */
  $$('[data-steps]').forEach(function (form) {
    var steps = $$('.step', form), bar = $$('[data-stepper] span', form), idx = 0;
    var label = $('[data-step-label]', form);
    function go(i) {
      idx = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, k) { s.classList.toggle('active', k === idx); });
      bar.forEach(function (b, k) { b.className = k < idx ? 'done' : k === idx ? 'current' : ''; });
      if (label) label.textContent = 'Step ' + (idx + 1) + ' of ' + steps.length;
    }
    form._goto = function (st) { go(steps.indexOf(st)); };
    $$('[data-next]', form).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!validate(steps[idx])) { var bad = $('.invalid input, .invalid select, .invalid textarea', steps[idx]); if (bad) bad.focus(); return; }
        go(idx + 1); form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    $$('[data-prev]', form).forEach(function (b) { b.addEventListener('click', function () { go(idx - 1); }); });
    $$('[data-autonext] input[type="radio"]', form).forEach(function (r) {
      r.addEventListener('change', function () { setTimeout(function () { if (steps[idx].contains(r)) go(idx + 1); }, 220); });
    });
    // Prefill from the URL (?need=dental&city=Austin)
    var jumped = false;
    params.forEach(function (val, key) {
      var radios = $$('input[type="radio"][name="' + key + '"]', form);
      if (radios.length) { radios.forEach(function (r) { if (r.value === val) { r.checked = true; if (key === 'need') jumped = true; } }); return; }
      var el = form.querySelector('[name="' + key + '"]');
      if (el && el.tagName !== 'BUTTON' && el.type !== 'hidden') el.value = val;
    });
    go(jumped ? 1 : 0);
  });

  /* ---------- Care navigator (find-care) ---------- */
  var navForm = $('[data-navigator]');
  if (navForm) {
    var REC = {
      er: { t: 'Go to the emergency department or call your emergency number', cls: 'er', need: '', why: 'The signs you selected can be life-threatening. Do not drive yourself if you feel faint, have chest pain or stroke symptoms — call an ambulance.', bring: 'Photo ID, a list of medicines and allergies, and a phone charger. Someone to accompany you if possible.' },
      crisis: { t: 'Get crisis support now', cls: 'er', need: 'mental-health', why: 'If you might act on thoughts of harming yourself or someone else, call your emergency number. In the US and Canada, call or text 988. In the UK, call 111 (option 2) or Samaritans on 116 123. Elsewhere, visit findahelpline.com.', bring: 'Stay with someone you trust while you get help.' },
      urgent: { t: 'Urgent care or a walk-in clinic', cls: '', need: 'primary-care', why: 'Best for problems that need attention today but are not life-threatening: sprains, minor cuts, fevers, ear or urinary symptoms, rashes. Many offer X-rays and basic lab tests.', bring: 'ID, insurance card or payment method, medicine list, and a short timeline of symptoms.' },
      tele: { t: 'A telehealth (video) visit', cls: '', need: 'telehealth', why: 'Fast and convenient for many minor illnesses, medication questions, mental-health follow-ups and refills. The clinician will tell you if you need to be seen in person.', bring: 'A quiet, well-lit space, your medicine list, a thermometer or blood pressure readings if you have them.' },
      primary: { t: 'Your primary care (family) doctor', cls: '', need: 'primary-care', why: 'Your home base for ongoing conditions, checkups, screenings, referrals and anything that can wait a few days. Continuity with one clinician leads to better care.', bring: 'Your questions written down, medicine list, recent results and a symptom diary.' },
      dentist: { t: 'A dentist (emergency dental if severe)', cls: '', need: 'dental', why: 'Tooth pain, a broken tooth or swelling should be seen by a dentist. Facial swelling with fever, or swelling affecting breathing or swallowing, needs emergency care.', bring: 'Dental insurance details, medicine list, and when the pain started.' },
      eye: { t: 'An eye-care clinic (optometrist or ophthalmologist)', cls: '', need: 'eye-care', why: 'For vision changes, red or irritated eyes and routine exams. Sudden vision loss, a curtain over your vision, chemical splash or eye injury is an emergency.', bring: 'Glasses or contacts, list of eye drops and medicines.' },
      derm: { t: 'A dermatologist (or start with primary care)', cls: '', need: 'dermatology', why: 'For changing moles, persistent rashes, acne, hair or nail problems. Some regions require a referral from primary care first.', bring: 'Photos showing how the spot or rash has changed over time.' },
      women: { t: 'A women’s health clinic or OB-GYN', cls: '', need: 'womens-health', why: 'For pregnancy care, contraception, periods, menopause and pelvic health. In pregnancy, heavy bleeding, severe pain, fainting or reduced baby movements need urgent assessment.', bring: 'Dates of your last periods, pregnancy history, medicine list.' },
      peds: { t: 'A pediatrician or pediatric urgent care', cls: '', need: 'pediatrics', why: 'Children have different danger signs. Babies under 3 months with a temperature of 38°C (100.4°F) or higher need urgent medical advice the same day.', bring: 'Vaccination record, child’s weight if known, notes on feeding, wet diapers and temperature.' },
      mental: { t: 'A mental-health clinician or your primary care doctor', cls: '', need: 'mental-health', why: 'Therapists, psychologists and psychiatrists treat anxiety, depression and more. Primary care can start treatment and refer you. Telehealth works well for many people.', bring: 'Notes on mood, sleep and what you have tried; any medicines.' },
      pharm: { t: 'A pharmacist, then telehealth or primary care', cls: '', need: 'telehealth', why: 'Pharmacists can answer medicine questions and, in many places, provide short emergency supplies or treat minor ailments. For new prescriptions, use telehealth or your doctor.', bring: 'Your medicine bottle or prescription details.' }
    };
    navForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = (navForm.querySelector('[name="nv_emerg"]:checked') || {}).value;
      var when = (navForm.querySelector('[name="nv_when"]:checked') || {}).value;
      var issue = (navForm.querySelector('[name="nv_issue"]:checked') || {}).value;
      var out = $('[data-nav-result]');
      if (!em || !when || !issue) { out.hidden = false; out.innerHTML = '<p class="form-status err">Please answer all three questions.</p>'; return; }
      var key = 'primary';
      if (em === 'yes') key = 'er';
      else if (issue === 'mental' && when === 'today') key = 'crisis';
      else if (issue === 'mental') key = 'mental';
      else if (issue === 'dental') key = 'dentist';
      else if (issue === 'eye') key = 'eye';
      else if (issue === 'skin') key = when === 'today' ? 'urgent' : 'derm';
      else if (issue === 'women') key = when === 'today' ? 'urgent' : 'women';
      else if (issue === 'child') key = 'peds';
      else if (issue === 'refill') key = 'pharm';
      else if (issue === 'minor') key = when === 'today' ? 'urgent' : when === 'soon' ? 'tele' : 'primary';
      else if (issue === 'chronic') key = when === 'today' ? 'tele' : 'primary';
      else if (issue === 'checkup') key = 'primary';
      var r = REC[key];
      var cta = r.need ? '<a class="btn btn-accent" href="/get-matched/?need=' + r.need + '">Get matched free</a>' : '';
      out.hidden = false;
      out.innerHTML = '<div class="rec-card ' + r.cls + '"><p class="eyebrow">Our suggestion</p><h3>' + esc(r.t) + '</h3><p>' + esc(r.why) + '</p><p><strong>What to bring:</strong> ' + esc(r.bring) + '</p><div class="tool-actions">' + cta + '<a class="btn btn-ghost" href="/tools/visit-prep/">Prepare my questions</a><a class="btn btn-ghost" href="/health/urgent-care-vs-er/">Urgent care vs ER guide</a></div><p class="micro">This is general guidance, not a diagnosis. If symptoms get worse or you are unsure, seek care or call your local nurse or health line.</p></div>';
      out.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ---------- Filters (specialists, tools, library, clinics) ---------- */
  $$('[data-filter-scope]').forEach(function (scope) {
    var input = $('[data-filter-input]', scope), chips = $$('[data-filter-chip]', scope), items = $$('[data-filter-item]', scope), empty = $('[data-filter-empty]', scope);
    var activeChip = '';
    function apply() {
      var q = input ? input.value.trim().toLowerCase() : '', shown = 0;
      items.forEach(function (it) {
        var text = (it.getAttribute('data-text') || it.textContent).toLowerCase();
        var tags = (it.getAttribute('data-tags') || '').toLowerCase();
        var okQ = !q || q.split(/\s+/).every(function (w) { return text.indexOf(w) > -1 || tags.indexOf(w) > -1; });
        var okC = !activeChip || (' ' + tags + ' ').indexOf(' ' + activeChip + ' ') > -1;
        var vis = okQ && okC; it.hidden = !vis; if (vis) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    }
    if (input) { input.addEventListener('input', apply); if (params.get('q') && input.hasAttribute('data-filter-q')) { input.value = params.get('q'); } }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var val = c.getAttribute('data-filter-chip');
        activeChip = activeChip === val ? '' : val;
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-filter-chip') === activeChip ? 'true' : 'false'); });
        apply();
      });
    });
    apply();
  });

  /* ---------- Clinic choice checklist ---------- */
  var scoreBox = $('[data-score]');
  if (scoreBox) {
    var outS = $('[data-score-out]'), verdict = $('[data-score-verdict]');
    var calc = function () {
      var boxes = $$('input[type="checkbox"]', scoreBox), tot = 0, got = 0;
      boxes.forEach(function (b) { var w = +b.getAttribute('data-w') || 1; tot += w; if (b.checked) got += w; });
      var pct = tot ? Math.round(got / tot * 100) : 0;
      outS.textContent = pct + '%';
      verdict.textContent = pct >= 80 ? 'Strong choice — this clinic ticks the important boxes.' : pct >= 55 ? 'Promising — ask about the unticked items before booking.' : 'Keep looking or ask more questions — key safeguards are missing.';
    };
    scoreBox.addEventListener('change', calc); calc();
  }

  /* ---------- Site search ---------- */
  var sp = $('[data-search-page]');
  if (sp) {
    var qIn = $('input[name="q"]', sp), list = $('[data-search-results]', sp), info = $('[data-search-info]', sp), idx = null;
    var run = function () {
      var q = qIn.value.trim().toLowerCase();
      if (!idx) return;
      if (!q) { list.innerHTML = ''; info.textContent = 'Type a symptom, condition, tool or type of clinic.'; return; }
      var words = q.split(/\s+/).filter(Boolean);
      var res = idx.map(function (it) {
        var t = (it.t || '').toLowerCase(), d = (it.d || '').toLowerCase(), k = (it.k || '').toLowerCase(), s = 0;
        words.forEach(function (w) { if (t.indexOf(w) > -1) s += 5; if (k.indexOf(w) > -1) s += 3; if (d.indexOf(w) > -1) s += 1; });
        return { it: it, s: s };
      }).filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 30);
      info.textContent = res.length ? res.length + ' result' + (res.length > 1 ? 's' : '') + ' for “' + qIn.value + '”' : 'No results for “' + qIn.value + '”. Try a simpler word, or browse the health library.';
      list.innerHTML = res.map(function (r) { return '<a href="' + esc(r.it.u) + '"><small>' + esc(r.it.y) + '</small><strong>' + esc(r.it.t) + '</strong><p>' + esc(r.it.d) + '</p></a>'; }).join('');
    };
    if (params.get('q')) qIn.value = params.get('q');
    fetch('/search.json').then(function (r) { return r.json(); }).then(function (j) { idx = j; run(); }).catch(function () { info.textContent = 'Search is unavailable right now.'; });
    qIn.addEventListener('input', run);
    sp.addEventListener('submit', function (e) { e.preventDefault(); run(); history.replaceState(null, '', '?q=' + encodeURIComponent(qIn.value)); });
  }

  /* ---------- Click-to-load YouTube (privacy-enhanced) ---------- */
  $$('[data-yt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-yt');
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&modestbranding=1';
      f.title = b.getAttribute('data-title') || 'Video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      b.innerHTML = ''; b.appendChild(f); b.style.cursor = 'default';
    }, { once: true });
  });

  /* ---------- Article table of contents ---------- */
  var toc = $('[data-toc]');
  if (toc) {
    var hs = $$('.prose > h2');
    if (hs.length < 2) { toc.parentNode.hidden = true; }
    else {
      toc.innerHTML = '<p>On this page</p>' + hs.map(function (h, i) { if (!h.id) h.id = 'section-' + (i + 1); return '<a href="#' + h.id + '">' + esc(h.textContent) + '</a>'; }).join('');
      if ('IntersectionObserver' in window) {
        var links = $$('a', toc);
        var io = new IntersectionObserver(function (ents) {
          ents.forEach(function (en) { if (en.isIntersecting) { links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id); }); } });
        }, { rootMargin: '-20% 0px -70% 0px' });
        hs.forEach(function (h) { io.observe(h); });
      }
    }
  }

  /* ---------- Self-updating blocks: tip of the day, this month's observance, relative dates ---------- */
  function readJSON(id) { var el = document.getElementById(id); if (!el) return null; try { return JSON.parse(el.textContent); } catch (e) { return null; } }
  var now = new Date();
  var doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  var tips = readJSON('drc-tips'), tipEl = $('[data-tip]');
  if (tips && tips.length && tipEl) {
    var tip = tips[doy % tips.length];
    tipEl.innerHTML = '<strong>' + esc(tip.title) + '</strong> ' + esc(tip.text) + (tip.url ? ' <a href="' + esc(tip.url) + '">Learn more</a>' : '');
    var td = $('[data-tip-date]'); if (td) td.textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  var obs = readJSON('drc-observances'), obsEl = $('[data-observance]');
  if (obs && obsEl) {
    var m = obs[now.getMonth()];
    if (m) obsEl.innerHTML = '<p class="eyebrow">' + esc(m.month) + ' health focus</p><h3>' + esc(m.title) + '</h3><p>' + esc(m.text) + '</p>' + (m.url ? '<a class="link-arrow" href="' + esc(m.url) + '">' + esc(m.cta || 'Read more') + '</a>' : '');
  }
  $$('[data-ago]').forEach(function (el) {
    var d = new Date(el.getAttribute('data-ago')); if (isNaN(d)) return;
    var days = Math.round((now - d) / 864e5);
    el.textContent = days <= 0 ? 'today' : days === 1 ? 'yesterday' : days < 30 ? days + ' days ago' : d.toLocaleDateString();
  });

  /* ---------- Share ---------- */
  $$('[data-share-native]').forEach(function (b) {
    if (!navigator.share) { b.hidden = true; return; }
    b.addEventListener('click', function () { navigator.share({ title: document.title, url: location.href }).catch(function () {}); });
  });
  $$('[data-copy-link]').forEach(function (b) {
    b.addEventListener('click', function () {
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy link'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
    });
  });

  /* ---------- Cookie notice + Google privacy choices ---------- */
  var note = $('[data-cookie-note]');
  if (note && !store('drc-cookie-ok')) note.hidden = false;
  $$('[data-cookie-ok]').forEach(function (b) { b.addEventListener('click', function () { store('drc-cookie-ok', '1'); if (note) note.hidden = true; }); });
  $$('[data-privacy-choices]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (window.googlefc && typeof window.googlefc.showRevocationMessage === 'function') { window.googlefc.showRevocationMessage(); }
      else { location.href = '/cookies/#manage'; }
    });
  });

  /* ---------- Support page amount picker ---------- */
  $$('[data-amounts]').forEach(function (g) {
    var target = document.querySelector(g.getAttribute('data-amounts'));
    $$('button', g).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', g).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        if (target) { target.value = b.getAttribute('data-value'); target.dispatchEvent(new Event('change')); }
      });
    });
  });
  $$('[data-pick]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.querySelector(a.getAttribute('data-pick-target'));
      if (sel) { sel.value = a.getAttribute('data-pick'); sel.dispatchEvent(new Event('change')); }
    });
  });
})();
