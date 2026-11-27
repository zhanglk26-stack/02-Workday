// ─── Core State ───
const sysT = new Date();
const rawToday = (sysT.getFullYear() >= 2026 && sysT.getFullYear() <= 2027) ? sysT : new Date(2026, 10, 6);
// Normalize reference date to local midnight so date comparisons never suffer from UTC/time-of-day skew
const t = new Date(rawToday.getFullYear(), rawToday.getMonth(), rawToday.getDate());

let viewY = t.getFullYear();
let viewM = t.getMonth();
let viewMode = 'single'; // 'single' | 'dual' | 'year'
let selectedDate = new Date(t);

const WD_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const WD_NAMES_SHORT = ['一', '二', '三', '四', '五', '六', '日'];

// ─── Utilities ───
function parseLocalDate(str) {
  if (typeof str !== 'string') return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function dateLabel(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}年${m}月${day}日`;
}

function getDayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDaysInYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}

function getNextMonth(y, m) {
  return m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 };
}

function countWorkdaysInMonth(y, m) {
  let count = 0;
  const daysInM = new Date(y, m + 1, 0).getDate();
  for (let day = 1; day <= daysInM; day++) {
    if (isWork(new Date(y, m, day))) count++;
  }
  return count;
}

// ─── Theme Management ───
function toggleTheme() {
  const body = document.body;
  if (body.getAttribute('data-theme') === 'dark') {
    body.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    body.setAttribute('data-theme', 'dark');
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
    if (dashContainer) dashContainer.style.display = 'none';
    if (yearContainer) yearContainer.style.display = 'block';
    if (monthNav) monthNav.style.display = 'none';
    renderYearView();
  } else {
    if (dashContainer) dashContainer.style.display = 'grid';
    if (yearContainer) yearContainer.style.display = 'none';
    if (monthNav) monthNav.style.display = 'flex';
    renderCalendar();
  }
}

// ─── Smooth Perpetual Month Navigation ───
function changeMonth(delta) {
  viewM += delta;
  if (viewM > 11) {
    viewY += Math.floor(viewM / 12);
    viewM = ((viewM % 12) + 12) % 12;
  } else if (viewM < 0) {
    viewY += Math.floor(viewM / 12);
    viewM = ((viewM % 12) + 12) % 12;
  }
  renderCalendar();
}

function selectMonth(y, m) {
  viewY = y;
  viewM = m;
  renderCalendar();
}

function goToday() {
  viewY = t.getFullYear();
  viewM = t.getMonth();
  selectedDate = new Date(t);
  if (viewMode === 'year') {
    setViewMode('single');
  } else {
    renderCalendar();
  }
  renderDateDetail(selectedDate);
}

function updateTodayButtonState() {
  const btn = document.getElementById('btn-today-header');
  if (!btn) return;
  const isAtToday = viewY === t.getFullYear() && viewM === t.getMonth() && fmt(selectedDate) === fmt(t);
  if (isAtToday) {
    btn.classList.add('is-today-view');
    btn.textContent = '今日已选';
  } else {
    btn.classList.remove('is-today-view');
    btn.textContent = '回到今天';
  }
}

// ─── Main Calendar Render Function ───
function renderCalendar() {
  const wrapper = document.getElementById('cal-wrapper');
  if (!wrapper) return;

  wrapper.replaceChildren();
  wrapper.className = 'cal-wrapper mode-' + (viewMode === 'dual' ? 'dual' : 'single');

  const monthDisplayText = document.getElementById('month-display-text');
  if (viewMode === 'dual') {
    const next = getNextMonth(viewY, viewM);
    if (monthDisplayText) {
      if (viewY === next.y) {
        monthDisplayText.textContent = `${viewY}年 ${viewM + 1}月 - ${next.m + 1}月`;
      } else {
        monthDisplayText.textContent = `${viewY}年${viewM + 1}月 - ${next.y}年${next.m + 1}月`;
      }
    }
    renderMonthBlock(wrapper, viewY, viewM);
    renderMonthBlock(wrapper, next.y, next.m);
  } else {
    if (monthDisplayText) {
      monthDisplayText.textContent = `${viewY}年 ${viewM + 1}月`;
    }
    renderMonthBlock(wrapper, viewY, viewM);
  }

  renderQuickMonthGrid();
  calc();
  updateHolidays();
  renderDateDetail(selectedDate);
  updateTodayButtonState();
}

// ─── Render Single Month Block ───
function renderMonthBlock(container, y, m) {
  const monthBlock = document.createElement('div');
  monthBlock.className = 'month-block';

  const header = document.createElement('div');
  header.className = 'month-block-header';

  const daysInM = new Date(y, m + 1, 0).getDate();
  const workdaysInMonth = countWorkdaysInMonth(y, m);
  const restDaysInMonth = daysInM - workdaysInMonth;

  const monthTitle = document.createElement('span');
  monthTitle.className = 'month-title';
  monthTitle.textContent = `${y}年 ${m + 1}月`;

  const statsText = document.createElement('span');
  statsText.className = 'month-summary-text';
  statsText.textContent = `${workdaysInMonth} 个工作日 · ${restDaysInMonth} 天休息`;

  header.appendChild(monthTitle);
  header.appendChild(statsText);
  monthBlock.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'cal-grid';

  WD_NAMES_SHORT.forEach((txt, idx) => {
    const di = document.createElement('div');
    di.className = 'cal-weekday' + (idx >= 5 ? ' weekend' : '');
    di.textContent = txt;
    grid.appendChild(di);
  });

  const firstD = (new Date(y, m, 1).getDay() + 6) % 7;
  const prevMDays = new Date(y, m, 0).getDate();
  const todayStr = fmt(t);
  const selectedStr = fmt(selectedDate);

  // Leading muted days
  for (let i = firstD - 1; i >= 0; i--) {
    const di = createMutedDayCell(prevMDays - i);
    grid.appendChild(di);
  }

  // Days of current month
  let wCnt = 0;
  for (let day = 1; day <= daysInM; day++) {
    const date = new Date(y, m, day);
    const str = fmt(date);
    const work = isWork(date, str);
    const holidayName = DATA.h[str];
    const isMakeup = DATA.w.has(str);

    if (work) wCnt++;

    const di = document.createElement('div');
    di.className = 'cal-day';

    if (str === todayStr) di.classList.add('day-today');
    if (str === selectedStr) di.classList.add('day-selected');

    if (holidayName) {
      di.classList.add('day-holiday');
    } else if (isMakeup) {
      di.classList.add('day-makeup');
    } else if (!work) {
      di.classList.add('day-rest');
    }

    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';

    if (holidayName) {
      const tag = document.createElement('span');
      tag.className = 'day-status-tag tag-xiu';
      tag.textContent = '休';
      dayHeader.appendChild(tag);
    } else if (isMakeup) {
      const tag = document.createElement('span');
      tag.className = 'day-status-tag tag-ban';
      tag.textContent = '班';
      dayHeader.appendChild(tag);
    }
    di.appendChild(dayHeader);

    const dayBody = document.createElement('div');
    dayBody.className = 'day-body';
    const num = document.createElement('span');
    num.className = 'day-num';
    num.textContent = day;
    dayBody.appendChild(num);
    di.appendChild(dayBody);

    const dayFooter = document.createElement('div');
    dayFooter.className = 'day-footer';

    if (holidayName) {
      const hLbl = document.createElement('span');
      hLbl.className = 'holiday-label';
      hLbl.textContent = holidayName;
      dayFooter.appendChild(hLbl);
    } else if (work) {
      const badge = document.createElement('span');
      const isMilestone = (wCnt === 6 || wCnt === 15);
      badge.className = isMilestone ? 'workday-badge badge-milestone' : 'workday-badge';
      badge.textContent = `W${wCnt}`;
      dayFooter.appendChild(badge);
    }

    di.appendChild(dayFooter);

    di.onclick = () => {
      selectedDate = new Date(y, m, day);
      document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('day-selected'));
      di.classList.add('day-selected');
      renderDateDetail(selectedDate);
      updateTodayButtonState();
    };

    grid.appendChild(di);
  }

  // Trailing muted days
  const totalCells = firstD + daysInM;
  const extra = (7 - (totalCells % 7)) % 7;
  for (let day = 1; day <= extra; day++) {
    grid.appendChild(createMutedDayCell(day));
  }

  monthBlock.appendChild(grid);
  container.appendChild(monthBlock);
}

function createMutedDayCell(dayNum) {
  const di = document.createElement('div');
  di.className = 'cal-day muted';

  const dayHeader = document.createElement('div');
  dayHeader.className = 'day-header';

  const dayBody = document.createElement('div');
  dayBody.className = 'day-body';
  const num = document.createElement('span');
  num.className = 'day-num';
  num.textContent = dayNum;
  dayBody.appendChild(num);

  const dayFooter = document.createElement('div');
  dayFooter.className = 'day-footer';

  di.appendChild(dayHeader);
  di.appendChild(dayBody);
  di.appendChild(dayFooter);
  return di;
}

// ─── Quick Month Navigation Grid (Left Sidebar - 2 Years Continuous) ───
function renderQuickMonthGrid() {
  const container = document.getElementById('quick-month-grid');
  if (!container) return;
  container.replaceChildren();

  const years = [2026, 2027];
  const nextMonth = viewMode === 'dual' ? getNextMonth(viewY, viewM) : null;

  years.forEach(year => {
    const group = document.createElement('div');
    group.className = 'quick-year-group' + (year === 2027 ? ' group-year-2027' : '');

    const groupHeader = document.createElement('div');
    groupHeader.className = 'quick-year-header' + (year === viewY ? ' current-year' : '');
    groupHeader.textContent = `${year} 年`;
    group.appendChild(groupHeader);

    const monthGrid = document.createElement('div');
    monthGrid.className = 'quick-year-months';

    for (let m = 0; m < 12; m++) {
      const workdaysInMonth = countWorkdaysInMonth(year, m);
      const isCurrentViewing = (year === viewY && m === viewM);
      const isSecondaryViewing = nextMonth && (year === nextMonth.y && m === nextMonth.m);
      const isTodayMonth = (year === t.getFullYear() && m === t.getMonth());

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quick-month-btn'
        + (isCurrentViewing ? ' active' : '')
        + (!isCurrentViewing && isSecondaryViewing ? ' is-secondary-view' : '')
        + (isTodayMonth ? ' is-today-month' : '');
      btn.onclick = () => selectMonth(year, m);

      const name = document.createElement('div');
      name.className = 'quick-month-name';
      name.textContent = `${m + 1}月`;

      const sub = document.createElement('div');
      sub.className = 'quick-month-sub';
      sub.textContent = `${workdaysInMonth}天`;

      btn.appendChild(name);
      btn.appendChild(sub);
      monthGrid.appendChild(btn);
    }

    group.appendChild(monthGrid);
    container.appendChild(group);
  });
}

// ─── Date Detail Inspection Panel ───
function renderDateDetail(d) {
  if (!d) d = t;

  const dateStr = fmt(d);
  const isToday = dateStr === fmt(t);
  const work = isWork(d, dateStr);
  const holidayName = DATA.h[dateStr];
  const isMakeup = DATA.w.has(dateStr);

  const detailTag = document.getElementById('detail-tag');
  const workBadge = document.getElementById('detail-work-badge');
  const dayNum = document.getElementById('detail-day-num');
  const dateFull = document.getElementById('detail-date-full');
  const subMeta = document.getElementById('detail-sub-meta');
  const wIndexEl = document.getElementById('detail-w-index');
  const yearDayEl = document.getElementById('detail-year-day');
  const holidayInfoEl = document.getElementById('detail-holiday-info');

  if (detailTag) detailTag.textContent = isToday ? '今日详情' : '选中日期';
  if (dayNum) dayNum.textContent = d.getDate();
  if (dateFull) dateFull.textContent = `${d.getFullYear()}年 ${d.getMonth() + 1}月 ${d.getDate()}日 ${WD_NAMES[d.getDay()]}`;

  const totalMonthWorkdays = countWorkdaysInMonth(d.getFullYear(), d.getMonth());
  if (subMeta) {
    subMeta.textContent = `当月共 ${totalMonthWorkdays} 个工作日`;
  }

  if (workBadge) {
    if (holidayName) {
      workBadge.textContent = `休 · ${holidayName}`;
      workBadge.className = 'detail-status status-holiday';
    } else if (isMakeup) {
      workBadge.textContent = '调休上班';
      workBadge.className = 'detail-status status-makeup';
    } else if (work) {
      workBadge.textContent = '工作日';
      workBadge.className = 'detail-status';
    } else {
      workBadge.textContent = '休息日';
      workBadge.className = 'detail-status status-rest';
    }
  }

  if (work) {
    let wIndex = 0;
    for (let day = 1; day <= d.getDate(); day++) {
      if (isWork(new Date(d.getFullYear(), d.getMonth(), day))) wIndex++;
    }
    if (wIndexEl) wIndexEl.textContent = `第 ${wIndex} / ${totalMonthWorkdays} 个工作日`;
  } else {
    if (wIndexEl) wIndexEl.textContent = '非工作日';
  }

  if (yearDayEl) {
    yearDayEl.textContent = `第 ${getDayOfYear(d)} / ${getDaysInYear(d.getFullYear())} 天`;
  }

  if (holidayInfoEl) {
    holidayInfoEl.replaceChildren();
    if (holidayName) {
      holidayInfoEl.className = 'detail-holiday-info is-holiday-today';
      holidayInfoEl.textContent = `当天为「${holidayName}」法定假期`;
    } else {
      holidayInfoEl.className = 'detail-holiday-info';
      let nextHDate = null;
      let nextHName = '';
      const sortedH = Object.keys(DATA.h).sort();
      for (const hStr of sortedH) {
        const hObj = parseLocalDate(hStr);
        if (hObj && hObj > d) {
          nextHDate = hObj;
          nextHName = DATA.h[hStr];
          break;
        }
      }

      if (nextHDate) {
        let workdaysLeft = 0;
        const cur = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        while (cur < nextHDate) {
          if (isWork(cur)) workdaysLeft++;
          cur.setDate(cur.getDate() + 1);
        }
        holidayInfoEl.textContent = `距离「${nextHName}」还需工作 ${workdaysLeft} 天`;
      } else {
        holidayInfoEl.textContent = '2026-2027 年法定节假日已全部结束';
      }
    }
  }
}

// ─── Year Overview View (Continuous 2026 & 2027) ───
function renderYearView() {
  const container = document.getElementById('year-grid');
  if (!container) return;
  container.replaceChildren();

  const years = [2026, 2027];
  const todayStr = fmt(t);

  years.forEach(year => {
    const yearSection = document.createElement('div');
    yearSection.className = 'year-overview-section' + (year === 2027 ? ' section-2027' : '');

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'year-overview-title';
    sectionTitle.textContent = `${year} 年`;
    yearSection.appendChild(sectionTitle);

    const grid = document.createElement('div');
    grid.className = 'year-overview-grid';

    for (let m = 0; m < 12; m++) {
      const monthCard = document.createElement('div');
      const isCurrent = (year === viewY && m === viewM);
      monthCard.className = 'year-mini-month' + (isCurrent ? ' is-current-month' : '');

      const title = document.createElement('button');
      title.type = 'button';
      title.className = 'year-mini-title';
      title.textContent = `${m + 1}月`;
      title.onclick = () => {
        viewY = year;
        viewM = m;
        selectedDate = new Date(year, m, 1);
        setViewMode('single');
      };
      monthCard.appendChild(title);

      const miniGrid = document.createElement('div');
      miniGrid.className = 'year-mini-grid';

      WD_NAMES_SHORT.forEach((txt, idx) => {
        const lbl = document.createElement('div');
        lbl.className = 'mini-day-lbl' + (idx >= 5 ? ' weekend' : '');
        lbl.textContent = txt;
        miniGrid.appendChild(lbl);
      });

      const firstD = (new Date(year, m, 1).getDay() + 6) % 7;
      const daysInM = new Date(year, m + 1, 0).getDate();
      const prevMDays = new Date(year, m, 0).getDate();

      for (let i = firstD - 1; i >= 0; i--) {
        const box = document.createElement('div');
        box.className = 'mini-day-box muted';
        box.textContent = prevMDays - i;
        miniGrid.appendChild(box);
      }

      for (let day = 1; day <= daysInM; day++) {
        const date = new Date(year, m, day);
        const str = fmt(date);
        const isHoliday = DATA.h[str];
        const isMakeup = DATA.w.has(str);
        const dow = date.getDay();
        const isWeekend = (dow === 0 || dow === 6);

        const box = document.createElement('div');
        box.className = 'mini-day-box';
        box.textContent = day;

        if (isHoliday) box.classList.add('m-holiday');
        else if (isMakeup) box.classList.add('m-makeup');
        else if (isWeekend) box.classList.add('m-weekend');

        if (str === todayStr) box.classList.add('m-today');

        box.onclick = () => {
          viewY = year;
          viewM = m;
          selectedDate = date;
          setViewMode('single');
        };

        miniGrid.appendChild(box);
      }

      monthCard.appendChild(miniGrid);
      grid.appendChild(monthCard);
    }

    yearSection.appendChild(grid);
    container.appendChild(yearSection);
  });
}

// ─── Dashboard Progress Calculations ───
function calc() {
  let yp = 0, yt = 0, mp = 0, mt = 0, hp = 0, hr = 0;
  const currentCalcYear = viewY;
  const s = new Date(currentCalcYear, 0, 1);
  const e = new Date(currentCalcYear, 11, 31);

  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const w = isWork(d);
    if (w) {
      yt++;
      if (d <= t) yp++;
      if (d.getMonth() === viewM) {
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

  const yPct = yt > 0 ? ((yp / yt) * 100).toFixed(1) : '0.0';
  const mPct = mt > 0 ? ((mp / mt) * 100).toFixed(1) : '0.0';

  const mTxt = document.getElementById('m-prog-txt');
  const mBar = document.getElementById('m-prog-bar');
  const mSum = document.getElementById('m-summary');
  if (mTxt) mTxt.textContent = mPct + '%';
  if (mBar) mBar.style.width = mPct + '%';
  if (mSum) mSum.textContent = `${viewM + 1}月已工作 ${mp} 天，剩余 ${mt - mp} 天`;

  const yTxt = document.getElementById('y-prog-txt');
  const yBar = document.getElementById('y-prog-bar');
  const ySum = document.getElementById('y-summary');
  if (yTxt) yTxt.textContent = yPct + '%';
  if (yBar) yBar.style.width = yPct + '%';

  if (ySum) {
    if (t.getFullYear() === currentCalcYear) {
      ySum.textContent = `${currentCalcYear}年已工作 ${yp} / ${yt} 天`;
    } else if (t.getFullYear() > currentCalcYear) {
      ySum.textContent = `${currentCalcYear}年全年 ${yt} 个工作日已结束`;
    } else {
      ySum.textContent = `${currentCalcYear}年全年共 ${yt} 个工作日`;
    }
  }

  const hPass = document.getElementById('h-pass');
  const hRem = document.getElementById('h-rem');
  if (hPass) hPass.textContent = hp;
  if (hRem) hRem.textContent = hr;
}

// ─── Upcoming Holidays Counter Cards ───
function updateHolidays() {
  const list = document.getElementById('holiday-list');
  if (!list) return;
  list.replaceChildren();

  const holidays = [];
  const sortedDates = Object.keys(DATA.h).sort();
  let currentRange = null;

  for (const dateStr of sortedDates) {
    const date = parseLocalDate(dateStr);
    if (!date) continue;
    const name = DATA.h[dateStr];
    if (currentRange && currentRange.name === name && (date - currentRange.end) <= 86400000 * 1.5) {
      currentRange.end = date;
      currentRange.days += 1;
    } else {
      currentRange = { name, start: date, end: date, days: 1 };
      holidays.push(currentRange);
    }
  }

  holidays.forEach(h => {
    if (h.end < t) return;

    let workdaysUntil = 0;
    if (h.start > t) {
      const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
      while (d < h.start) {
        if (isWork(d)) workdaysUntil++;
        d.setDate(d.getDate() + 1);
      }
    }

    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'holiday-card-item';
    item.onclick = () => {
      viewY = h.start.getFullYear();
      viewM = h.start.getMonth();
      selectedDate = new Date(h.start);
      if (viewMode === 'year') {
        setViewMode('single');
      } else {
        renderCalendar();
      }
    };

    const left = document.createElement('div');
    left.className = 'holiday-card-left';

    const name = document.createElement('div');
    name.className = 'h-name';
    name.textContent = h.name;

    const dates = document.createElement('div');
    dates.className = 'h-dates';
    const startYearPrefix = h.start.getFullYear() !== t.getFullYear() ? `${h.start.getFullYear()}.` : '';
    const endYearPrefix = h.end.getFullYear() !== t.getFullYear() && h.end.getFullYear() !== h.start.getFullYear() ? `${h.end.getFullYear()}.` : '';
    const isSameDay = fmt(h.start) === fmt(h.end);
    const startStr = `${startYearPrefix}${h.start.getMonth() + 1}.${h.start.getDate()}`;
    const endStr = `${endYearPrefix}${h.end.getMonth() + 1}.${h.end.getDate()}`;
    const rangeText = isSameDay ? startStr : `${startStr} - ${endStr}`;
    dates.textContent = `${rangeText} · ${h.days}天`;

    left.appendChild(name);
    left.appendChild(dates);

    const right = document.createElement('div');
    right.className = 'holiday-card-right';

    const badge = document.createElement('span');
    if (h.start > t) {
      badge.className = workdaysUntil < 30 ? 'h-badge tag-urgent' : 'h-badge';
      badge.textContent = `剩 ${workdaysUntil} 工作日`;
    } else {
      badge.className = 'h-badge ongoing';
      badge.textContent = '假期中';
    }
    right.appendChild(badge);

    item.appendChild(left);
    item.appendChild(right);
    list.appendChild(item);
  });
}

// ─── Keyboard Shortcuts & Initialization ───
if (typeof window !== 'undefined') {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
  }

  if (typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowLeft' && viewMode !== 'year') {
        e.preventDefault();
        changeMonth(-1);
      } else if (e.key === 'ArrowRight' && viewMode !== 'year') {
        e.preventDefault();
        changeMonth(1);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        goToday();
      }
    });
  }

  renderCalendar();
}

// CommonJS Exports for testing / Node environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sysT,
    t,
    viewY: () => viewY,
    setViewY: (y) => { viewY = y; },
    viewM: () => viewM,
    setViewM: (v) => { viewM = v; },
    viewMode: () => viewMode,
    setViewMode,
    selectedDate: () => selectedDate,
    setSelectedDate: (d) => { selectedDate = d; },
    parseLocalDate,
    dateLabel,
    changeMonth,
    selectMonth,
    goToday,
    calc,
    updateHolidays,
    renderCalendar,
    renderYearView,
    renderQuickMonthGrid,
  };
}
