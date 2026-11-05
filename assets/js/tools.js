/* dr.clinic — health calculators and personal tools. Everything runs in the browser; nothing is uploaded. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function store(k, v) { try { if (v === undefined) { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(p, name) { var el = p.querySelector('[name="' + name + '"]'); if (!el || el.value === '') return NaN; return parseFloat(String(el.value).replace(',', '.')); }
  function val(p, name) { var el = p.querySelector('[name="' + name + '"]:checked') || p.querySelector('[name="' + name + '"]:not([type="radio"])'); return el ? el.value : ''; }
  function r1(x) { return Math.round(x * 10) / 10; }
  function unit(p) { return p.getAttribute('data-unit') || 'metric'; }
  function mode(p) { return p.getAttribute('data-mode') || ''; }
  function heightCm(p) { if (unit(p) === 'metric') return num(p, 'h_cm'); var ft = num(p, 'h_ft') || 0, inch = num(p, 'h_in') || 0; return (ft * 12 + inch) * 2.54; }
  function weightKg(p) { return unit(p) === 'metric' ? num(p, 'w_kg') : num(p, 'w_lb') * 0.45359237; }
  function lenCm(p, name) { return unit(p) === 'metric' ? num(p, name + '_cm') : num(p, name + '_in') * 2.54; }
  function kgOut(p, kg) { return unit(p) === 'imperial' ? Math.round(kg / 0.45359237) + ' lb' : r1(kg) + ' kg'; }
  function out(p, html) { var r = $('[data-result]', p); r.innerHTML = html; r.hidden = false; var b = r.getBoundingClientRect(); if (b.top > window.innerHeight - 80) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function err(p, msg) { out(p, '<p class="form-status err">' + esc(msg) + '</p>'); }
  function addDays(d, k) { var x = new Date(d.getTime()); x.setDate(x.getDate() + k); return x; }
  function fmt(d) { return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }); }
  function fmtS(d) { return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  function parseDate(s) { if (!s) return null; var d = new Date(s + 'T00:00:00'); return isNaN(d.getTime()) ? null : d; }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function days(a, b) { return Math.round((b - a) / 864e5); }
  function time(d) { return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  function download(name, text, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

  var T = {
    bmi: function (p) {
      var h = heightCm(p) / 100, w = weightKg(p);
      if (!(h > 0.9 && h < 2.5) || !(w > 20 && w < 350)) return err(p, 'Please enter a valid height and weight.');
      var b = w / (h * h), cat, cls;
      if (b < 18.5) { cat = 'Underweight'; cls = 'lvl-mid'; } else if (b < 25) { cat = 'Healthy weight'; cls = 'lvl-ok'; } else if (b < 30) { cat = 'Overweight'; cls = 'lvl-mid'; } else { cat = 'Obesity range'; cls = 'lvl-high'; }
      var pos = b < 18.5 ? Math.max(0, (b - 15) / 3.5 * 18) : b < 25 ? 18 + (b - 18.5) / 6.5 * 32 : b < 30 ? 50 + (b - 25) / 5 * 20 : Math.min(100, 70 + (b - 30) / 10 * 30);
      out(p, '<p class="result-big">' + r1(b) + '</p><span class="result-label ' + cls + '">' + cat + '</span>' +
        '<div class="gauge"><i style="left:' + pos.toFixed(1) + '%"></i></div><div class="gauge-labels"><span style="left:0">15</span><span style="left:18%">18.5</span><span style="left:50%">25</span><span style="left:70%">30</span><span style="left:100%">40</span></div>' +
        '<div class="kv"><div><b>' + kgOut(p, 18.5 * h * h) + ' – ' + kgOut(p, 24.9 * h * h) + '</b><span>Healthy-weight range for your height (BMI 18.5–24.9)</span></div><div><b>' + r1(b / 25) + '</b><span>BMI Prime (BMI ÷ 25)</span></div></div>' +
        '<p class="micro">BMI is a screening number, not a diagnosis. It does not measure body fat directly and can misclassify muscular people, older adults and some ethnic groups. Many guidelines use lower action points (23 and 27.5) for people of South Asian, Chinese and other Asian backgrounds. Not valid in pregnancy or for children.</p>');
    },
    calories: function (p) {
      var s = val(p, 'sex'), a = num(p, 'age'), h = heightCm(p), w = weightKg(p), act = parseFloat(val(p, 'activity')) || 1.2;
      if (!(a >= 15 && a <= 100) || !(h > 100 && h < 250) || !(w > 30 && w < 350)) return err(p, 'Please enter your age (15–100), height and weight.');
      var bmr = 10 * w + 6.25 * h - 5 * a + (s === 'male' ? 5 : -161);
      var lv = [[1.2, 'Sedentary (little or no exercise)'], [1.375, 'Lightly active (1–3 days a week)'], [1.55, 'Moderately active (3–5 days a week)'], [1.725, 'Very active (6–7 days a week)'], [1.9, 'Extra active (physical job plus training)']];
      var rows = lv.map(function (l) { return '<li><span>' + l[1] + '</span><b>' + Math.round(bmr * l[0]).toLocaleString() + ' kcal/day</b></li>'; }).join('');
      out(p, '<p class="result-big">' + Math.round(bmr * act).toLocaleString() + ' <small>kcal/day</small></p><span class="result-label lvl-info">Estimated maintenance calories</span>' +
        '<div class="kv"><div><b>' + Math.round(bmr).toLocaleString() + ' kcal</b><span>Basal metabolic rate (energy used at complete rest)</span></div><div><b>×' + act + '</b><span>Activity factor you selected</span></div></div>' +
        '<p class="label" style="margin-top:16px">Maintenance estimate by activity level</p><ul class="list-out">' + rows + '</ul>' +
        '<p class="micro">Mifflin–St Jeor estimates are reasonable for most adults but can be off for individuals. Before making big changes to how you eat — especially if you are pregnant, under 18, managing a medical condition or have a history of disordered eating — talk with a doctor or registered dietitian.</p>');
    },
    bodyfat: function (p) {
      var s = val(p, 'sex'), h = heightCm(p), neck = lenCm(p, 'neck'), waist = lenCm(p, 'waist'), hip = lenCm(p, 'hip'), w = weightKg(p), bf;
      if (!(h > 100) || !(neck > 15) || !(waist > 40)) return err(p, 'Please enter height, neck and waist measurements.');
      if (s === 'male') { if (waist <= neck) return err(p, 'Your waist measurement must be larger than your neck measurement.'); bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450; }
      else { if (!(hip > 40)) return err(p, 'Please enter your hip measurement.'); bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(h)) - 450; }
      if (!(bf > 2 && bf < 70)) return err(p, 'Those measurements look unusual — please re-measure and try again.');
      var c = s === 'male' ? [[6, 'Essential fat range'], [14, 'Athletic range'], [18, 'Fitness range'], [25, 'Average range'], [999, 'Above the average range']] : [[14, 'Essential fat range'], [21, 'Athletic range'], [25, 'Fitness range'], [32, 'Average range'], [999, 'Above the average range']];
      var cat = c.filter(function (x) { return bf < x[0]; })[0][1];
      var extra = w > 30 ? '<div class="kv"><div><b>' + kgOut(p, w * bf / 100) + '</b><span>Estimated fat mass</span></div><div><b>' + kgOut(p, w * (1 - bf / 100)) + '</b><span>Estimated lean mass</span></div></div>' : '';
      out(p, '<p class="result-big">' + r1(bf) + '%</p><span class="result-label ' + (cat.indexOf('Above') === 0 ? 'lvl-mid' : 'lvl-ok') + '">' + cat + '</span>' + extra +
        '<p class="micro">The US Navy tape method is usually within a few percentage points of lab methods when measurements are taken carefully, but it can be less accurate for very lean or very muscular people. Ranges follow the commonly used American Council on Exercise categories.</p>');
    },
    healthyweight: function (p) {
      var s = val(p, 'sex'), hcm = heightCm(p);
      if (!(hcm > 120 && hcm < 230)) return err(p, 'Please enter a height between 120 and 230 cm (about 4\'0" to 7\'6").');
      var h = hcm / 100, over = Math.max(0, hcm / 2.54 - 60), m = s === 'male';
      var dev = (m ? 50 : 45.5) + 2.3 * over, rob = (m ? 52 : 49) + (m ? 1.9 : 1.7) * over, mil = (m ? 56.2 : 53.1) + (m ? 1.41 : 1.36) * over;
      out(p, '<p class="result-big">' + kgOut(p, 18.5 * h * h) + ' – ' + kgOut(p, 24.9 * h * h) + '</p><span class="result-label lvl-ok">Healthy-weight range (BMI 18.5–24.9)</span>' +
        '<p class="label" style="margin-top:14px">Classic “ideal body weight” formulas (used for some drug dosing)</p><ul class="list-out"><li><span>Devine (1974)</span><b>' + kgOut(p, dev) + '</b></li><li><span>Robinson (1983)</span><b>' + kgOut(p, rob) + '</b></li><li><span>Miller (1983)</span><b>' + kgOut(p, mil) + '</b></li></ul>' +
        '<p class="micro">A range is more meaningful than a single number. Muscle, frame size, age and ethnicity all matter, and the classic formulas are least reliable for people under 5 ft (152 cm). Health is better judged with your clinician using several measures together.</p>');
    },
    water: function (p) {
      var s = val(p, 'sex'), mins = num(p, 'exercise') || 0, hot = $('[name="hot"]', p).checked, st = val(p, 'state');
      if (mins < 0 || mins > 600) return err(p, 'Please enter exercise minutes between 0 and 600.');
      var total = s === 'male' ? 3.7 : 2.7;
      if (s !== 'male' && st === 'pregnant') total = 3.0;
      if (s !== 'male' && st === 'breastfeeding') total = 3.8;
      var drinks = total * 0.8 + (mins / 30) * 0.35 + (hot ? 0.5 : 0);
      out(p, '<p class="result-big">' + r1(drinks) + ' <small>litres/day from drinks</small></p><span class="result-label lvl-info">About ' + Math.round(drinks / 0.24) + ' cups (240 ml) or ' + Math.round(drinks * 33.814) + ' fl oz</span>' +
        '<div class="kv"><div><b>' + r1(total) + ' L</b><span>Total daily water from all food and drink (reference intake)</span></div><div><b>+' + r1((mins / 30) * 0.35 + (hot ? 0.5 : 0)) + ' L</b><span>Extra for exercise and heat</span></div></div>' +
        '<p class="micro">Based on the US National Academies adequate intakes; about 20% of water usually comes from food. Pale-yellow urine is a simple daily check. People with kidney, heart or liver conditions may be told to limit fluids — follow your clinician’s advice.</p>');
    },
    duedate: function (p) {
      var start;
      if (mode(p) === 'conception') { var c = parseDate(val(p, 'conception')); if (!c) return err(p, 'Please choose your conception date.'); start = addDays(c, -14); }
      else { var l = parseDate(val(p, 'lmp')), cyc = num(p, 'cycle') || 28; if (!l) return err(p, 'Please choose the first day of your last period.'); if (cyc < 20 || cyc > 45) return err(p, 'Cycle length should be between 20 and 45 days.'); start = addDays(l, cyc - 28); }
      var edd = addDays(start, 280), ga = days(start, today());
      if (ga < 0) return err(p, 'That date is in the future. Please check it.');
      if (ga > 300) return err(p, 'That date is more than 42 weeks ago. Please check it.');
      var w = Math.floor(ga / 7), d = ga % 7, tri = w < 14 ? 'First trimester' : w < 28 ? 'Second trimester' : 'Third trimester';
      var ms = [[8, 'Typical first prenatal visit (around 8 weeks)'], [11, 'First-trimester screening window (11–14 weeks)'], [18, 'Anatomy ultrasound window (18–22 weeks)'], [24, 'Glucose screening window (24–28 weeks)'], [37, 'Early term begins (37 weeks)'], [39, 'Full term (39 weeks)']];
      var list = ms.map(function (x) { var dt = addDays(start, x[0] * 7); return '<li><span>' + x[1] + '</span><b>' + fmt(dt) + (dt < today() ? ' · passed' : '') + '</b></li>'; }).join('');
      var left = days(today(), edd);
      out(p, '<p class="result-big">' + fmt(edd) + '</p><span class="result-label lvl-ok">Estimated due date</span>' +
        '<div class="kv"><div><b>' + w + 'w ' + d + 'd</b><span>Estimated weeks pregnant today</span></div><div><b>' + tri + '</b><span>Current stage</span></div><div><b>' + (left >= 0 ? left + ' days' : 'Past due date') + '</b><span>Until the due date</span></div></div>' +
        '<p class="label" style="margin-top:16px">Key dates</p><ul class="list-out">' + list + '</ul>' +
        '<p class="micro">Most babies arrive within about two weeks either side of the due date. An early ultrasound gives the most accurate dating — your care team may adjust this date.</p>');
    },
    ovulation: function (p) {
      var l = parseDate(val(p, 'lmp')), cyc = num(p, 'cycle') || 28;
      if (!l) return err(p, 'Please choose the first day of your last period.');
      if (cyc < 21 || cyc > 45) return err(p, 'Cycle length should be between 21 and 45 days.');
      if (l > today()) return err(p, 'That date is in the future. Please check it.');
      var guard = 0; while (addDays(l, cyc) <= today() && guard++ < 40) l = addDays(l, cyc);
      var rows = '';
      for (var i = 0; i < 3; i++) {
        var ps = addDays(l, cyc * i), next = addDays(ps, cyc), ov = addDays(next, -14);
        rows += '<li><span><strong>Cycle from ' + fmtS(ps) + '</strong><br>Fertile window ' + fmtS(addDays(ov, -5)) + ' – ' + fmtS(addDays(ov, 1)) + '</span><b>Ovulation ≈ ' + fmtS(ov) + '<br><small>Next period ≈ ' + fmtS(next) + '</small></b></li>';
      }
      out(p, '<span class="result-label lvl-ok">Your next 3 cycles (estimates)</span><ul class="list-out">' + rows + '</ul><p class="micro">Ovulation usually happens about 14 days before the next period, but it varies from cycle to cycle. This tool is not a method of contraception. Irregular cycles, recent pregnancy, breastfeeding and hormonal medicines all change the timing.</p>');
    },
    heartrate: function (p) {
      var a = num(p, 'age'), rest = num(p, 'rest');
      if (!(a >= 10 && a <= 100)) return err(p, 'Please enter an age between 10 and 100.');
      var max = 220 - a, tan = Math.round(208 - 0.7 * a), k = rest >= 30 && rest <= 120;
      var z = [[1, 'Very light — warm-up and recovery', 0.5, 0.6], [2, 'Light — easy, conversational', 0.6, 0.7], [3, 'Moderate — aerobic fitness', 0.7, 0.8], [4, 'Hard — threshold work', 0.8, 0.9], [5, 'Maximum — short intervals only', 0.9, 1]];
      var f = function (pc) { return Math.round(k ? rest + (max - rest) * pc : max * pc); };
      var rows = z.map(function (x) { return '<li><span><strong>Zone ' + x[0] + '</strong> · ' + x[1] + '</span><b>' + f(x[2]) + '–' + f(x[3]) + ' bpm</b></li>'; }).join('');
      out(p, '<p class="result-big">' + max + ' <small>bpm estimated max</small></p><span class="result-label lvl-info">' + (k ? 'Karvonen (heart-rate reserve) zones' : 'Percent-of-maximum zones') + '</span>' +
        '<div class="kv"><div><b>' + Math.round(max * 0.64) + '–' + Math.round(max * 0.76) + ' bpm</b><span>Moderate intensity (64–76% of max, CDC)</span></div><div><b>' + Math.round(max * 0.77) + '–' + Math.round(max * 0.93) + ' bpm</b><span>Vigorous intensity (77–93% of max)</span></div><div><b>' + tan + ' bpm</b><span>Alternative max (Tanaka formula)</span></div></div>' +
        '<ul class="list-out">' + rows + '</ul><p class="micro">Age-based maximums can be off by 10–12 beats a minute for individuals. Some medicines (such as beta-blockers) lower heart rate. If you have a heart condition or new symptoms with exercise, check with your clinician first.</p>');
    },
    bp: function (p) {
      var s = num(p, 'sys'), d = num(p, 'dia'), pulse = num(p, 'pulse');
      if (!(s >= 60 && s <= 260) || !(d >= 30 && d <= 160) || s <= d) return err(p, 'Please enter a valid reading (the top number should be higher than the bottom number).');
      var cat, cls, msg;
      if (s >= 180 || d >= 120) { cat = 'Severe — very high'; cls = 'lvl-high'; msg = 'Wait five minutes and measure again. If it is still 180/120 or higher, contact a doctor right away. Call your local emergency number if you also have chest pain, shortness of breath, back pain, numbness or weakness, a change in vision, or difficulty speaking.'; }
      else if (s >= 140 || d >= 90) { cat = 'Stage 2 high blood pressure'; cls = 'lvl-high'; msg = 'Repeated readings in this range usually need treatment. Book an appointment with your doctor soon and keep a log of home readings.'; }
      else if (s >= 130 || d >= 80) { cat = 'Stage 1 high blood pressure'; cls = 'lvl-mid'; msg = 'Talk to your doctor about your readings. Lifestyle changes help, and some people also need medicine depending on their overall heart risk.'; }
      else if (s >= 120) { cat = 'Elevated'; cls = 'lvl-mid'; msg = 'Higher than ideal. Regular activity, less salt, limiting alcohol and keeping a healthy weight can bring it down.'; }
      else if (s < 90 || d < 60) { cat = 'Lower than typical'; cls = 'lvl-info'; msg = 'Low readings are often fine if you feel well. If you have dizziness, fainting, blurred vision or confusion, contact a clinician.'; }
      else { cat = 'Normal'; cls = 'lvl-ok'; msg = 'Keep up healthy habits and re-check at least once a year, or as your clinician advises.'; }
      var log = store('drc-bp') || [];
      log.unshift({ t: new Date().toISOString(), s: s, d: d, p: pulse > 0 ? pulse : '' });
      log = log.slice(0, 30); store('drc-bp', log);
      out(p, '<p class="result-big">' + s + '/' + d + ' <small>mmHg</small></p><span class="result-label ' + cls + '">' + cat + '</span><p>' + esc(msg) + '</p><p class="micro">Categories follow the American Heart Association / American College of Cardiology adult categories. One reading is not a diagnosis — blood pressure is judged on the average of several readings taken on different days. Other countries may use different thresholds.</p>');
      renderBp(p);
    },
    sleep: function (p) {
      var m = mode(p) || 'wake', t = val(p, 'time'), base = new Date();
      if (m !== 'now') { if (!t) return err(p, 'Please choose a time.'); var hm = t.split(':'); base.setHours(+hm[0], +hm[1], 0, 0); }
      var rows = '', head;
      if (m === 'wake') {
        head = 'To wake up at ' + time(base) + ', try falling asleep around:';
        [6, 5, 4].forEach(function (c) { var b = new Date(base.getTime() - (c * 90 + 15) * 6e4); rows += '<li><span>' + c + ' sleep cycles · ' + (c * 1.5) + ' hours of sleep</span><b>Bed by ' + time(b) + '</b></li>'; });
      } else {
        head = (m === 'now' ? 'Going to bed now' : 'Going to bed at ' + time(base)) + ', try waking at:';
        [4, 5, 6].forEach(function (c) { var w = new Date(base.getTime() + (c * 90 + 15) * 6e4); rows += '<li><span>' + c + ' sleep cycles · ' + (c * 1.5) + ' hours of sleep</span><b>Wake at ' + time(w) + '</b></li>'; });
      }
      out(p, '<span class="result-label lvl-info">' + esc(head) + '</span><ul class="list-out">' + rows + '</ul><p class="micro">Assumes about 15 minutes to fall asleep and roughly 90-minute cycles; real cycles vary between about 70 and 120 minutes. Most adults need at least 7 hours a night. Loud snoring, gasping or daytime sleepiness are worth discussing with a clinician.</p>');
    },
    whtr: function (p) {
      var h = heightCm(p), w = lenCm(p, 'waist');
      if (!(h > 100 && h < 250) || !(w > 40 && w < 250)) return err(p, 'Please enter your height and waist measurement.');
      var r = w / h, cat, cls;
      if (r < 0.4) { cat = 'Below 0.4 — talk to a clinician if you are concerned about low weight'; cls = 'lvl-info'; }
      else if (r < 0.5) { cat = 'Healthy central weight'; cls = 'lvl-ok'; }
      else if (r < 0.6) { cat = 'Increased health risk'; cls = 'lvl-mid'; }
      else { cat = 'High health risk'; cls = 'lvl-high'; }
      out(p, '<p class="result-big">' + r.toFixed(2) + '</p><span class="result-label ' + cls + '">' + cat + '</span><div class="kv"><div><b>' + (unit(p) === 'imperial' ? r1(h / 2 / 2.54) + ' in' : r1(h / 2) + ' cm') + '</b><span>Half your height — a simple waist target</span></div></div><p class="micro">The “keep your waist to less than half your height” rule is used in UK NICE guidance for adults. Measure around your middle, halfway between your lowest rib and the top of your hips, after breathing out normally.</p>');
    },
    temp: function (p) {
      var x = num(p, 'temp'), u = val(p, 'tunit');
      if (isNaN(x)) return err(p, 'Please enter a temperature.');
      var c = u === 'F' ? (x - 32) * 5 / 9 : x, f = u === 'F' ? x : x * 9 / 5 + 32;
      if (!(c >= 30 && c <= 45)) return err(p, 'That temperature is outside the normal measurable range. Please check the number and unit.');
      var cat, cls, msg;
      if (c < 35) { cat = 'Low body temperature'; cls = 'lvl-high'; msg = 'A temperature below 35°C (95°F) can mean hypothermia. Warm up and seek urgent medical help, especially if the person is confused, drowsy or shivering hard.'; }
      else if (c < 37.5) { cat = 'Typical range'; cls = 'lvl-ok'; msg = 'Normal body temperature varies by person, time of day and where it is measured.'; }
      else if (c < 38) { cat = 'Slightly raised'; cls = 'lvl-info'; msg = 'Rest, drink fluids and re-check. Recent exercise, hot weather or warm drinks can raise readings.'; }
      else if (c < 39.4) { cat = 'Fever'; cls = 'lvl-mid'; msg = 'Most fevers in adults are caused by infections and settle in a few days. Rest and fluids help. Contact a clinician if it lasts more than 3 days or you are worried.'; }
      else if (c < 40) { cat = 'High fever'; cls = 'lvl-high'; msg = 'For adults, a temperature of 39.4°C (103°F) or higher is a reason to call a doctor, especially with other symptoms.'; }
      else { cat = 'Very high fever'; cls = 'lvl-high'; msg = 'Seek urgent medical care. Call your emergency number for confusion, a stiff neck, a rash that does not fade when pressed, trouble breathing or a seizure.'; }
      out(p, '<p class="result-big">' + r1(c) + '°C <small>= ' + r1(f) + '°F</small></p><span class="result-label ' + cls + '">' + cat + ' (adults)</span><p>' + esc(msg) + '</p><p class="micro"><strong>Babies and children:</strong> a baby under 3 months with 38°C (100.4°F) or higher, or 3–6 months with 39°C (102.2°F) or higher, needs urgent medical advice. Trust your instincts with children of any age.</p>');
    }
  };

  /* ---------- Blood pressure log ---------- */
  function renderBp(p) {
    var box = $('[data-bp-log]', p); if (!box) return;
    var log = store('drc-bp') || [];
    if (!log.length) { box.innerHTML = '<p class="micro">Your readings will be saved on this device only.</p>'; return; }
    var n = Math.min(log.length, 7), ss = 0, dd = 0;
    for (var i = 0; i < n; i++) { ss += log[i].s; dd += log[i].d; }
    box.innerHTML = '<p class="label">Your recent readings (saved on this device)</p><div class="kv"><div><b>' + Math.round(ss / n) + '/' + Math.round(dd / n) + '</b><span>Average of your last ' + n + ' reading' + (n > 1 ? 's' : '') + '</span></div></div><div class="table-wrap"><table class="log-table"><thead><tr><th>Date and time</th><th>Reading</th><th>Pulse</th></tr></thead><tbody>' +
      log.slice(0, 10).map(function (r) { return '<tr><td>' + new Date(r.t).toLocaleString() + '</td><td>' + r.s + '/' + r.d + '</td><td>' + (r.p || '–') + '</td></tr>'; }).join('') + '</tbody></table></div><div class="tool-actions"><button type="button" class="btn btn-ghost btn-sm" data-bp-csv>Download CSV</button><button type="button" class="btn btn-ghost btn-sm" data-bp-clear>Clear readings</button></div>';
    $('[data-bp-csv]', box).onclick = function () { download('blood-pressure-log.csv', 'date,systolic,diastolic,pulse\n' + log.map(function (r) { return r.t + ',' + r.s + ',' + r.d + ',' + (r.p || ''); }).join('\n'), 'text/csv'); };
    $('[data-bp-clear]', box).onclick = function () { if (confirmSafe('Clear all saved readings on this device?')) { store('drc-bp', []); renderBp(p); } };
  }
  function confirmSafe(msg) { try { return window.confirm(msg); } catch (e) { return true; } }

  /* ---------- Visit prep builder ---------- */
  var QB = {
    new: ['What could be causing this?', 'Which tests do I need, and what will they show?', 'What are my treatment options, including their risks and side effects?', 'What should I do if it gets worse, and when should I come back?'],
    followup: ['Is my treatment working as expected?', 'Should any of my doses change?', 'Which numbers or symptoms should I track at home?', 'What are my goals before the next visit?'],
    checkup: ['Which screenings are due for my age, sex and family history?', 'Are my vaccinations up to date?', 'How are my blood pressure, weight and blood tests trending?', 'What one change would most improve my health this year?'],
    specialist: ['What is your diagnosis or working diagnosis, and how sure are you?', 'What else could it be?', 'What are the options, including watching and waiting?', 'Who coordinates my care between you and my primary doctor?'],
    telehealth: ['Can this be managed by video, or do I need an in-person exam?', 'Where do I go for any tests?', 'How will prescriptions and follow-up work?'],
    always: ['Could you write down the plan for me?', 'Is this covered by my plan, and roughly what will it cost?']
  };
  function initVisitPrep(p) {
    var saved = store('drc-visitprep');
    if (saved) Object.keys(saved).forEach(function (k) { var el = p.querySelector('[name="' + k + '"]'); if (el && el.type !== 'checkbox') el.value = saved[k]; });
    p.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = {}; ['vtype', 'concern', 'since', 'pattern', 'helps', 'meds', 'allergies', 'history', 'custom'].forEach(function (k) { f[k] = val(p, k); });
      if (!f.concern) return err(p, 'Please describe your main reason for the visit.');
      store('drc-visitprep', f);
      var qs = (QB[f.vtype] || QB.new).concat(QB.always);
      $$('[name="q_extra"]:checked', p).forEach(function (c) { qs.push(c.value); });
      if (f.custom) f.custom.split('\n').forEach(function (q) { if (q.trim()) qs.push(q.trim()); });
      var label = { new: 'New problem', followup: 'Follow-up', checkup: 'Annual checkup', specialist: 'Specialist visit', telehealth: 'Telehealth (video) visit' }[f.vtype] || 'Visit';
      var sec = function (t, v) { return v ? '<h3>' + t + '</h3><p>' + esc(v).replace(/\n/g, '<br>') + '</p>' : ''; };
      var html = '<div class="visit-sheet"><p class="eyebrow">My visit sheet · ' + esc(label) + ' · ' + fmt(new Date()) + '</p>' + sec('Main reason for my visit', f.concern) + sec('When it started', f.since) + sec('How often / how it has changed', f.pattern) + sec('What makes it better or worse', f.helps) + sec('Medicines and supplements I take', f.meds) + sec('Allergies', f.allergies) + sec('Relevant history', f.history) + '<h3>My questions</h3><ol>' + qs.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol></div><div class="tool-actions no-print"><button type="button" class="btn btn-brand btn-sm" data-print>Print</button><button type="button" class="btn btn-ghost btn-sm" data-copy>Copy text</button><button type="button" class="btn btn-ghost btn-sm" data-dl>Download .txt</button></div>';
      out(p, html);
      var text = function () { return $('.visit-sheet', p).innerText; };
      $('[data-print]', p).onclick = function () { window.print(); };
      $('[data-copy]', p).onclick = function (ev) { if (navigator.clipboard) navigator.clipboard.writeText(text()); ev.target.textContent = 'Copied'; };
      $('[data-dl]', p).onclick = function () { download('my-visit-sheet.txt', text()); };
    });
  }

  /* ---------- Symptom journal ---------- */
  function initJournal(p) {
    var key = 'drc-journal', table = $('[data-journal]', p), when = $('[name="when"]', p), sev = $('[name="severity"]', p), sevOut = $('[data-sev-out]', p);
    function nowLocal() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
    if (when && !when.value) when.value = nowLocal();
    if (sev && sevOut) { var u = function () { sevOut.textContent = sev.value + '/10'; }; sev.addEventListener('input', u); u(); }
    function render() {
      var rows = store(key) || [];
      if (!rows.length) { table.innerHTML = '<p class="empty">No entries yet. Your journal stays on this device.</p>'; return; }
      table.innerHTML = '<div class="table-wrap"><table class="log-table"><thead><tr><th>When</th><th>Symptom</th><th>Severity</th><th>Notes</th><th><span class="sr-only">Delete</span></th></tr></thead><tbody>' + rows.map(function (r, i) { return '<tr><td>' + esc(new Date(r.when).toLocaleString()) + '</td><td>' + esc(r.symptom) + '</td><td>' + esc(r.severity) + '/10</td><td>' + esc(r.notes) + '</td><td><button type="button" class="btn btn-ghost btn-sm" data-del="' + i + '">Delete</button></td></tr>'; }).join('') + '</tbody></table></div><div class="tool-actions no-print"><button type="button" class="btn btn-ghost btn-sm" data-csv>Download CSV</button><button type="button" class="btn btn-ghost btn-sm" data-print>Print</button><button type="button" class="btn btn-ghost btn-sm" data-clear>Clear all</button></div>';
      $$('[data-del]', table).forEach(function (b) { b.onclick = function () { var r = store(key) || []; r.splice(+b.getAttribute('data-del'), 1); store(key, r); render(); }; });
      $('[data-csv]', table).onclick = function () { var r = store(key) || []; download('symptom-journal.csv', 'when,symptom,severity,notes\n' + r.map(function (x) { return [x.when, x.symptom, x.severity, x.notes].map(function (c) { return '"' + String(c || '').replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), 'text/csv'); };
      $('[data-print]', table).onclick = function () { window.print(); };
      $('[data-clear]', table).onclick = function () { if (confirmSafe('Delete every journal entry on this device?')) { store(key, []); render(); } };
    }
    p.addEventListener('submit', function (e) {
      e.preventDefault();
      var entry = { when: val(p, 'when') || nowLocal(), symptom: val(p, 'symptom').trim(), severity: val(p, 'severity'), notes: val(p, 'notes').trim() };
      if (!entry.symptom) { var s = $('[data-status]', p); if (s) { s.textContent = 'Please name the symptom.'; s.classList.add('err'); } return; }
      var rows = store(key) || []; rows.unshift(entry); rows.sort(function (a, b) { return a.when < b.when ? 1 : -1; }); store(key, rows.slice(0, 500));
      $('[name="symptom"]', p).value = ''; $('[name="notes"]', p).value = ''; when.value = nowLocal();
      var st = $('[data-status]', p); if (st) { st.classList.remove('err'); st.textContent = 'Saved.'; }
      render();
    });
    render();
  }

  /* ---------- Medication schedule ---------- */
  function initMeds(p) {
    var key = 'drc-meds', box = $('[data-meds]', p), SLOTS = [['morning', 'Morning'], ['midday', 'Midday'], ['evening', 'Evening'], ['bedtime', 'Bedtime']];
    function render() {
      var meds = store(key) || [];
      if (!meds.length) { box.innerHTML = '<p class="empty">Add your first medicine above. Your schedule stays on this device.</p>'; return; }
      var grid = SLOTS.map(function (s) {
        var items = meds.filter(function (m) { return m.slots.indexOf(s[0]) > -1; });
        return '<tr><th scope="row">' + s[1] + '</th><td>' + (items.length ? items.map(function (m) { return '<strong>' + esc(m.name) + '</strong> ' + esc(m.dose) + (m.food && m.food !== 'either' ? ' · ' + esc(m.food) : '') + (m.notes ? ' · <em>' + esc(m.notes) + '</em>' : ''); }).join('<br>') : '–') + '</td><td class="tick-col"></td></tr>';
      }).join('');
      box.innerHTML = '<p class="label">My daily medicine schedule</p><div class="table-wrap"><table><thead><tr><th>Time</th><th>Medicine and dose</th><th>Taken ✓</th></tr></thead><tbody>' + grid + '</tbody></table></div><ul class="list-out no-print">' + meds.map(function (m, i) { return '<li><span><strong>' + esc(m.name) + '</strong> ' + esc(m.dose) + '</span><button type="button" class="btn btn-ghost btn-sm" data-rm="' + i + '">Remove</button></li>'; }).join('') + '</ul><div class="tool-actions no-print"><button type="button" class="btn btn-brand btn-sm" data-print>Print schedule</button><button type="button" class="btn btn-ghost btn-sm" data-clear>Clear all</button></div>';
      $$('[data-rm]', box).forEach(function (b) { b.onclick = function () { var m = store(key) || []; m.splice(+b.getAttribute('data-rm'), 1); store(key, m); render(); }; });
      $('[data-print]', box).onclick = function () { window.print(); };
      $('[data-clear]', box).onclick = function () { if (confirmSafe('Remove every medicine from this schedule?')) { store(key, []); render(); } };
    }
    p.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = val(p, 'med').trim(), slots = $$('[name="slot"]:checked', p).map(function (c) { return c.value; }), st = $('[data-status]', p);
      if (!name || !slots.length) { if (st) { st.textContent = 'Add a medicine name and at least one time of day.'; st.classList.add('err'); } return; }
      var meds = store(key) || []; meds.push({ name: name, dose: val(p, 'dose').trim(), slots: slots, food: val(p, 'food'), notes: val(p, 'mnotes').trim() }); store(key, meds);
      ['med', 'dose', 'mnotes'].forEach(function (k) { $('[name="' + k + '"]', p).value = ''; });
      $$('[name="slot"]', p).forEach(function (c) { c.checked = false; });
      if (st) { st.classList.remove('err'); st.textContent = 'Added to your schedule.'; }
      render();
    });
    render();
  }

  /* ---------- Wire up every tool panel ---------- */
  $$('[data-tool]').forEach(function (p) {
    var tool = p.getAttribute('data-tool');
    var useg = $('[data-unit-toggle]', p);
    if (useg) {
      var applyU = function (u) { p.setAttribute('data-unit', u); $$('[data-units]', p).forEach(function (g) { g.hidden = g.getAttribute('data-units') !== u; }); $$('button', useg).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-unit') === u ? 'true' : 'false'); }); };
      $$('button', useg).forEach(function (b) { b.addEventListener('click', function () { applyU(b.getAttribute('data-unit')); store('drc-unit', b.getAttribute('data-unit')); }); });
      applyU(store('drc-unit') || ((navigator.language || '').toLowerCase() === 'en-us' ? 'imperial' : 'metric'));
    }
    var mseg = $('[data-mode-toggle]', p);
    if (mseg) {
      var applyM = function (m) { p.setAttribute('data-mode', m); $$('[data-modes]', p).forEach(function (g) { g.hidden = (' ' + g.getAttribute('data-modes') + ' ').indexOf(' ' + m + ' ') < 0; }); $$('button', mseg).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === m ? 'true' : 'false'); }); };
      $$('button', mseg).forEach(function (b) { b.addEventListener('click', function () { applyM(b.getAttribute('data-mode')); }); });
      applyM($('button', mseg).getAttribute('data-mode'));
    }
    $$('[data-sex-only]', p).forEach(function (g) {
      var upd = function () { g.hidden = val(p, 'sex') !== g.getAttribute('data-sex-only'); };
      $$('[name="sex"]', p).forEach(function (r) { r.addEventListener('change', upd); }); upd();
    });
    if (tool === 'visitprep') return initVisitPrep(p);
    if (tool === 'journal') return initJournal(p);
    if (tool === 'meds') return initMeds(p);
    if (tool === 'bp') renderBp(p);
    p.addEventListener('submit', function (e) { e.preventDefault(); if (T[tool]) T[tool](p); });
  });
})();
