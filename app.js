// ─── Core State ───
const sysT = new Date();
const t = sysT.getFullYear() === 2026 ? sysT : new Date(2026, 2, 23); // Default reference: March 23, 2026

let viewM = t.getMonth();
let viewMode = 'single'; // 'single' | 'dual' | 'year'
let selectedDate = new Date(t);

const WD_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const WD_NAMES_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

// ─── Utilities ───
function dateLabel(d) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}年${m}月${day}日`;
}

function getDayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ─── Theme Management ───
function toggleTheme() {
  const body = document.body;
  const icon = document.getElementById('theme-icon');
  if (body.getAttribute('data-theme') === 'dark') {
    body.removeAttribute('data-theme');
    if (icon) icon.className = 'ph ph-sun';
    localStorage.setItem('theme', 'light');
  } else {
    body.setAttribute('data-theme', 'dark');
    if (icon) icon.className = 'ph ph-moon';
    localStorage.setItem('theme', 'dark');
  }
}

// ─── View Mode Switcher ───
function setViewMode(mode) {
  viewMode = mode;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeTab = document.getElementById('tab-' + mode);
  if (activeTab) activeTab.classList.add('active');

  const dashContainer = document.getElementById('dashboard-container');
  const yearContainer = document.getElementById('year-view-container');
  const monthNav = document.getElementById('header-month-nav');

  if (mode === 'year') {
    dashContainer.style.display = 'none';
    yearContainer.style.display = 'block';
    if (monthNav) monthNav.style.display = 'none';
    renderYearView();
  } else {
    dashContainer.style.display = 'grid';
    yearContainer.style.display = 'none';
    if (monthNav) monthNav.style.display = 'flex';
    renderCalendar();
  }
}

// ─── Month Navigation ───
function changeMonth(delta) {
  viewM += delta;
  if (viewM > 11) viewM = 0;
  else if (viewM < 0) viewM = 11;
  renderCalendar();
}

function selectMonth(m) {
  viewM = m;
  renderCalendar();
}

function goToday() {
  viewM = t.getMonth();
  selectedDate = new Date(t);
  if (viewMode === 'year') {
    setViewMode('single');
  } else {
    renderCalendar();
  }
  renderDateDetail(selectedDate);
}

// ─── Main Calendar Render Function ───
function renderCalendar() {
  const wrapper = document.getElementById('cal-wrapper');
  if (!wrapper) return;

  wrapper.innerHTML = '';
  wrapper.className = 'cal-wrapper mode-' + (viewMode === 'dual' ? 'dual' : 'single');

  const monthDisplayText = document.getElementById('month-display-text');
  if (viewMode === 'dual') {
    const nextM = (viewM + 1) % 12;
    const year2 = viewM === 11 ? 2027 : 2026;
    if (monthDisplayText) {
      monthDisplayText.innerText = `${2026}年 ${viewM + 1}月 - ${nextM + 1}月`;
    }
    renderMonthBlock(wrapper, 2026, viewM);
    renderMonthBlock(wrapper, year2, nextM);
  } else {
    if (monthDisplayText) {
      monthDisplayText.innerText = `${2026}年 ${viewM + 1}月`;
    }
    renderMonthBlock(wrapper, 2026, viewM);
  }

  renderQuickMonthSelector();
  renderQuickMonthGrid();
  calc();
  updateHolidays();
  renderDateDetail(selectedDate);
}

// ─── Render Single Month Block ───
function renderMonthBlock(container, y, m) {
  const monthBlock = document.createElement('div');
  monthBlock.className = 'month-block';

  // Month Header
  const header = document.createElement('div');
  header.className = 'month-block-header';

  // Calculate total workdays in month
  let workdaysInMonth = 0;
  const daysInM = new Date(y, m + 1, 0).getDate();
  for (let day = 1; day <= daysInM; day++) {
    if (isWork(new Date(y, m, day))) workdaysInMonth++;
  }

  header.innerHTML = `
    <div class="month-title">${y}年 ${m + 1}月</div>
    <div class="month-stats-badge">共 ${workdaysInMonth} 个工作日</div>
  `;
  monthBlock.appendChild(header);

  // Calendar Grid
  const grid = document.createElement('div');
  grid.className = 'cal-grid';

  // Weekday Headers
  WD_NAMES_SHORT.forEach((txt, idx) => {
    const di = document.createElement('div');
    di.className = 'cal-weekday' + (idx === 0 || idx === 6 ? ' weekend' : '');
    di.innerText = txt;
    grid.appendChild(di);
  });

  const firstD = new Date(y, m, 1).getDay();
  const prevMDays = new Date(y, m, 0).getDate();
  const todayStr = fmt(t);
  const selectedStr = fmt(selectedDate);

  // Leading muted days
  for (let i = firstD - 1; i >= 0; i--) {
    const di = document.createElement('div');
    di.className = 'cal-day muted';
    const num = document.createElement('span');
    num.className = 'day-num';
    num.innerText = prevMDays - i;
    di.appendChild(num);
    grid.appendChild(di);
  }

  // Days of current month
  let wCnt = 0;
  for (let day = 1; day <= daysInM; day++) {
    const date = new Date(y, m, day);
    const str = fmt(date);
    const work = isWork(date);
    const holidayName = DATA.h[str];
    const isMakeup = DATA.w.has(str);

    if (work) wCnt++;

    const di = document.createElement('div');
    di.className = 'cal-day';

    // Option A: Highlight W6 and W15
    if (work && (wCnt === 6 || wCnt === 15)) {
      di.classList.add(wCnt === 6 ? 'day-w6' : 'day-w15');
    }
    if (str === todayStr) di.classList.add('day-today');
    if (str === selectedStr) di.classList.add('day-selected');

    if (holidayName) {
      di.classList.add('day-holiday');
    } else if (isMakeup) {
      di.classList.add('day-makeup');
    } else if (!work) {
      di.classList.add('day-rest');
    }

    // Top Row: Number & Status Tag
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';

    const num = document.createElement('span');
    num.className = 'day-num';
    num.innerText = day;
    dayHeader.appendChild(num);

    if (holidayName) {
      const tag = document.createElement('span');
      tag.className = 'day-status-tag tag-xiu';
      tag.innerText = '休';
      dayHeader.appendChild(tag);
    } else if (isMakeup) {
      const tag = document.createElement('span');
      tag.className = 'day-status-tag tag-ban';
      tag.innerText = '班';
      dayHeader.appendChild(tag);
    }
    di.appendChild(dayHeader);

    // Bottom Row: Workday Badge or Holiday Name Label
    const dayFooter = document.createElement('div');
    dayFooter.className = 'day-footer';

    if (holidayName) {
      const hLbl = document.createElement('span');
      hLbl.className = 'holiday-label';
      hLbl.innerText = holidayName;
      dayFooter.appendChild(hLbl);
    } else if (work) {
      const badge = document.createElement('span');
      badge.className = 'workday-badge';
      badge.innerText = `W${wCnt}`;
      dayFooter.appendChild(badge);
    }

    di.appendChild(dayFooter);

    di.onclick = () => {
      selectedDate = new Date(y, m, day);
      document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('day-selected'));
      di.classList.add('day-selected');
      renderDateDetail(selectedDate);
    };

    grid.appendChild(di);
  }

  // Trailing muted days
  const totalCells = firstD + daysInM;
  const extra = (7 - (totalCells % 7)) % 7;
  for (let day = 1; day <= extra; day++) {
    const di = document.createElement('div');
    di.className = 'cal-day muted';
    const num = document.createElement('span');
    num.className = 'day-num';
    num.innerText = day;
    di.appendChild(num);
    grid.appendChild(di);
  }

  monthBlock.appendChild(grid);
  container.appendChild(monthBlock);
}

// ─── Quick Month Selector Pills (Header) ───
function renderQuickMonthSelector() {
  const container = document.getElementById('quick-month-selector');
  if (!container) return;
  container.innerHTML = '';

  for (let m = 0; m < 12; m++) {
    const pill = document.createElement('button');
    pill.className = 'month-pill' + (m === viewM ? ' active' : '');
    pill.innerText = `${m + 1}月`;
    pill.onclick = () => selectMonth(m);
    container.appendChild(pill);
  }
}

// ─── Quick Month Navigation Grid (Left Sidebar) ───
function renderQuickMonthGrid() {
  const container = document.getElementById('quick-month-grid');
  if (!container) return;
  container.innerHTML = '';

  for (let m = 0; m < 12; m++) {
    let workdaysInMonth = 0;
    const daysInM = new Date(2026, m + 1, 0).getDate();
    for (let day = 1; day <= daysInM; day++) {
      if (isWork(new Date(2026, m, day))) workdaysInMonth++;
    }

    const btn = document.createElement('div');
    btn.className = 'quick-month-btn' + (m === viewM ? ' active' : '');
    btn.onclick = () => selectMonth(m);

    const name = document.createElement('div');
    name.className = 'quick-month-name';
    name.innerText = `${m + 1}月`;

    const sub = document.createElement('div');
    sub.className = 'quick-month-sub';
    sub.innerText = `${workdaysInMonth}天`;

    btn.appendChild(name);
    btn.appendChild(sub);
    container.appendChild(btn);
  }
}

// ─── Date Detail Inspection Panel ───
function renderDateDetail(d) {
  if (!d) d = t;

  const dateStr = fmt(d);
  const isToday = dateStr === fmt(t);
  const work = isWork(d);
  const holidayName = DATA.h[dateStr];
  const isMakeup = DATA.w.has(dateStr);

  const detailTag = document.getElementById('detail-tag');
  const workBadge = document.getElementById('detail-work-badge');
  const dayNum = document.getElementById('detail-day-num');
  const dateFull = document.getElementById('detail-date-full');
  const wIndexEl = document.getElementById('detail-w-index');
  const yearDayEl = document.getElementById('detail-year-day');
  const holidayInfoEl = document.getElementById('detail-holiday-info');

  if (detailTag) detailTag.innerText = isToday ? '今日详情' : '选中日期详情';
  if (dayNum) dayNum.innerText = d.getDate();
  if (dateFull) dateFull.innerText = `${d.getFullYear()}年 ${d.getMonth() + 1}月 ${d.getDate()}日 ${WD_NAMES[d.getDay()]}`;

  // Work badge status styling
  if (workBadge) {
    if (holidayName) {
      workBadge.innerText = `休 · ${holidayName}`;
      workBadge.className = 'detail-work-badge status-holiday';
    } else if (isMakeup) {
      workBadge.innerText = '班 · 调休上班';
      workBadge.className = 'detail-work-badge status-makeup';
    } else if (work) {
      workBadge.innerText = '工作日';
      workBadge.className = 'detail-work-badge';
    } else {
      workBadge.innerText = '休息日';
      workBadge.className = 'detail-work-badge status-rest';
    }
  }

  // Workday index calculation
  let wIndex = 0;
  if (work) {
    for (let day = 1; day <= d.getDate(); day++) {
      if (isWork(new Date(d.getFullYear(), d.getMonth(), day))) wIndex++;
    }
    if (wIndexEl) wIndexEl.innerText = `本月第 ${wIndex} 个工作日`;
  } else {
    if (wIndexEl) wIndexEl.innerText = '非工作日';
  }

  // Day of year calculation
  if (yearDayEl) yearDayEl.innerText = `当年第 ${getDayOfYear(d)} 天`;

  // Countdown to next statutory holiday
  if (holidayInfoEl) {
    if (holidayName) {
      holidayInfoEl.innerHTML = `<i class="ph-fill ph-confetti"></i> 今天是 ${holidayName} 假期！`;
    } else {
      let nextHDate = null;
      let nextHName = '';
      const sortedH = Object.keys(DATA.h).sort();
      for (const hStr of sortedH) {
        const hObj = new Date(hStr);
        if (hObj >= d && fmt(hObj) !== fmt(d)) {
          nextHDate = hObj;
          nextHName = DATA.h[hStr];
          break;
        }
      }

      if (nextHDate) {
        let workdaysLeft = 0;
        let cur = new Date(d);
        cur.setDate(cur.getDate() + 1);
        while (cur < nextHDate) {
          if (isWork(cur)) workdaysLeft++;
          cur.setDate(cur.getDate() + 1);
        }
        holidayInfoEl.innerHTML = `<i class="ph-fill ph-hourglass"></i> 距【${nextHName}】还需工作 ${workdaysLeft} 天`;
      } else {
        holidayInfoEl.innerHTML = `<i class="ph-fill ph-sparkle"></i> 2026年所有法定节假日已过完`;
      }
    }
  }
}

// ─── Year Overview View ───
function renderYearView() {
  const container = document.getElementById('year-grid');
  if (!container) return;
  container.innerHTML = '';

  for (let m = 0; m < 12; m++) {
    const monthCard = document.createElement('div');
    monthCard.className = 'year-mini-month';

    const title = document.createElement('div');
    title.className = 'year-mini-title';
    title.innerText = `${m + 1}月`;
    monthCard.appendChild(title);

    const miniGrid = document.createElement('div');
    miniGrid.className = 'year-mini-grid';

    WD_NAMES_SHORT.forEach(txt => {
      const lbl = document.createElement('div');
      lbl.className = 'mini-day-lbl';
      lbl.innerText = txt;
      miniGrid.appendChild(lbl);
    });

    const firstD = new Date(2026, m, 1).getDay();
    const daysInM = new Date(2026, m + 1, 0).getDate();
    const prevMDays = new Date(2026, m, 0).getDate();

    for (let i = firstD - 1; i >= 0; i--) {
      const box = document.createElement('div');
      box.className = 'mini-day-box muted';
      box.innerText = prevMDays - i;
      miniGrid.appendChild(box);
    }

    const todayStr = fmt(t);
    for (let day = 1; day <= daysInM; day++) {
      const date = new Date(2026, m, day);
      const str = fmt(date);
      const isHoliday = DATA.h[str];
      const isMakeup = DATA.w.has(str);

      const box = document.createElement('div');
      box.className = 'mini-day-box';
      box.innerText = day;

      if (isHoliday) box.classList.add('m-holiday');
      else if (isMakeup) box.classList.add('m-makeup');
      if (str === todayStr) box.classList.add('m-today');

      box.onclick = () => {
        viewM = m;
        selectedDate = date;
        setViewMode('single');
      };

      miniGrid.appendChild(box);
    }

    monthCard.appendChild(miniGrid);
    container.appendChild(monthCard);
  }
}

// ─── Dashboard Progress Calculations ───
function calc() {
  let yp = 0, yt = 0, mp = 0, mt = 0, hp = 0, hr = 0;
  const s = new Date(2026, 0, 1), e = new Date(2026, 11, 31);

  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const w = isWork(d);
    if (w) {
      yt++;
      if (d <= t) yp++;
      if (d.getMonth() === t.getMonth()) {
        mt++;
        if (d <= t) mp++;
      }
    }
    const strD = fmt(d);
    if (DATA.h[strD] && d.getDay() !== 0 && d.getDay() !== 6) {
      if (d <= t) hp++;
      else hr++;
    }
  }

  const yPct = ((yp / yt) * 100).toFixed(1);
  const mPct = mt > 0 ? ((mp / mt) * 100).toFixed(1) : 0;

  const mTxt = document.getElementById('m-prog-txt');
  const mBar = document.getElementById('m-prog-bar');
  const mSum = document.getElementById('m-summary');
  if (mTxt) mTxt.innerText = mPct + '%';
  if (mBar) mBar.style.width = mPct + '%';
  if (mSum) mSum.innerText = `已工作 ${mp} 天，剩余 ${mt - mp} 天`;

  const yTxt = document.getElementById('y-prog-txt');
  const yBar = document.getElementById('y-prog-bar');
  const ySum = document.getElementById('y-summary');
  if (yTxt) yTxt.innerText = yPct + '%';
  if (yBar) yBar.style.width = yPct + '%';
  const yDaysPast = Math.floor((t - new Date(2026, 0, 1)) / 86400000) + 1;
  if (ySum) ySum.innerText = `2026年已过去 ${yDaysPast} 天`;

  const hPass = document.getElementById('h-pass');
  const hRem = document.getElementById('h-rem');
  if (hPass) hPass.innerText = hp;
  if (hRem) hRem.innerText = hr;
}

// ─── Upcoming Holidays Counter Cards ───
function updateHolidays() {
  const list = document.getElementById('holiday-list');
  if (!list) return;
  list.innerHTML = '';

  const holidays = [];
  const sortedDates = Object.keys(DATA.h).sort();
  let currentRange = null;

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    const name = DATA.h[dateStr];
    if (currentRange && currentRange.name === name && (date - currentRange.end) <= 86400000 * 1.5) {
      currentRange.end = date;
    } else {
      currentRange = { name, start: date, end: date };
      holidays.push(currentRange);
    }
  }

  holidays.forEach(h => {
    if (h.end < t && fmt(h.end) !== fmt(t)) return;

    let workdaysUntil = 0;
    if (h.start > t) {
      let d = new Date(t);
      d.setDate(d.getDate() + 1);
      while (d < h.start) {
        if (isWork(d)) workdaysUntil++;
        d.setDate(d.getDate() + 1);
      }
    }

    const item = document.createElement('div');
    item.className = 'holiday-card-item';

    const left = document.createElement('div');
    left.className = 'holiday-card-left';

    const name = document.createElement('div');
    name.className = 'h-name';
    name.innerText = h.name;

    const dates = document.createElement('div');
    dates.className = 'h-dates';
    const startStr = `${h.start.getMonth() + 1}月${h.start.getDate()}日`;
    const endStr = `${h.end.getMonth() + 1}月${h.end.getDate()}日`;
    dates.innerText = startStr === endStr ? startStr : `${startStr} - ${endStr}`;

    left.appendChild(name);
    left.appendChild(dates);

    const right = document.createElement('div');
    right.className = 'holiday-card-right';

    const badge = document.createElement('span');
    if (h.start > t) {
      badge.className = 'h-badge';
      badge.innerText = `还剩 ${workdaysUntil} 个工作日`;
    } else {
      badge.className = 'h-badge ongoing';
      badge.innerText = '进行中';
    }
    right.appendChild(badge);

    item.appendChild(left);
    item.appendChild(right);
    list.appendChild(item);
  });
}

// ─── Initialization ───
if (typeof window !== 'undefined') {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = 'ph ph-moon';
  }
  renderCalendar();
}

// CommonJS Exports for testing / Node environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sysT,
    t,
    viewM: () => viewM,
    setViewM: (v) => { viewM = v; },
    viewMode: () => viewMode,
    setViewMode,
    selectedDate: () => selectedDate,
    setSelectedDate: (d) => { selectedDate = d; },
    dateLabel,
    changeMonth,
    goToday,
    calc,
    updateHolidays,
  };
}
