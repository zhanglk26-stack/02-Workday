// ─── Core Data ───
const sysT = new Date();
const t = sysT.getFullYear() === 2026 ? sysT : new Date(2026, 2, 23);
let viewM = t.getMonth();

// notes: {dateStr: text}
let notes = JSON.parse(localStorage.getItem('workday_notes') || '{}');
// todos: [{id, text, done}]
let todos = JSON.parse(localStorage.getItem('workday_todos') || '[]');

// Memo state
let memoDate = new Date(t);
let miniCalYear = 2026;
let miniCalMonth = memoDate.getMonth();
let memoSaveTimer = null;

// ─── Utilities ───
function dateLabel(d) {
  const m = d.getMonth() + 1, day = d.getDate();
  return `${d.getFullYear()}年${m}月${day}日`;
}

const WD_NAMES = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];

// ─── Sidebar ───
let sidebarCollapsed = false;
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
}

// ─── Page Switch ───
function switchPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'memo') {
    renderMemoDate();
    buildMiniCal();
    renderTodos();
  }
}

// ─── Theme ───
function toggleTheme() {
  const body = document.body;
  const icon = document.getElementById('theme-icon');
  if (body.getAttribute('data-theme') === 'dark') {
    body.removeAttribute('data-theme');
    icon.className = 'ph ph-sun';
    localStorage.setItem('theme', 'light');
  } else {
    body.setAttribute('data-theme', 'dark');
    icon.className = 'ph ph-moon';
    localStorage.setItem('theme', 'dark');
  }
}

// ─── Calendar Page ───
function calc() {
  let yp=0,yt=0,mp=0,mt=0,hp=0,hr=0;
  const s=new Date(2026,0,1), e=new Date(2026,11,31);
  for (let d=new Date(s); d<=e; d.setDate(d.getDate()+1)) {
    const w=isWork(d);
    if (w) {
      yt++;
      if (d<=t) yp++;
      if (d.getMonth()===t.getMonth()) { mt++; if (d<=t) mp++; }
    }
    const strD=fmt(d);
    if (DATA.h[strD] && d.getDay()!==0 && d.getDay()!==6) {
      if (d<=t) hp++; else hr++;
    }
  }
  const yPct=((yp/yt)*100).toFixed(1);
  const mPct=((mp/mt)*100).toFixed(1);
  document.getElementById('m-prog-txt').innerText=mPct+'%';
  document.getElementById('m-prog-bar').style.width=mPct+'%';
  document.getElementById('m-summary').innerText=`已工作 ${mp} 天，剩余 ${mt-mp} 天`;
  document.getElementById('y-prog-txt').innerText=yPct+'%';
  document.getElementById('y-prog-bar').style.width=yPct+'%';
  const yDaysPast=Math.floor((t-new Date(2026,0,1))/86400000)+1;
  document.getElementById('y-summary').innerText=`2026年已过去 ${yDaysPast} 天`;
  document.getElementById('h-pass').innerText=hp;
  document.getElementById('h-rem').innerText=hr;
}

function updateHolidays() {
  const list=document.getElementById('holiday-list');
  list.innerHTML='';
  const holidays=[];
  const sortedDates=Object.keys(DATA.h).sort();
  let currentRange=null;
  for (const dateStr of sortedDates) {
    const date=new Date(dateStr), name=DATA.h[dateStr];
    if (currentRange && currentRange.name===name && (date-currentRange.end)<=86400000*1.5) {
      currentRange.end=date;
    } else {
      currentRange={name,start:date,end:date};
      holidays.push(currentRange);
    }
  }
  holidays.forEach(h => {
    if (h.end<t && fmt(h.end)!==fmt(t)) return;
    let workdaysUntil=0;
    if (h.start>t) {
      let d=new Date(t); d.setDate(d.getDate()+1);
      while (d<h.start) { if (isWork(d)) workdaysUntil++; d.setDate(d.getDate()+1); }
    }
    const card=document.createElement('div'); card.className='tip-card';
    const title=document.createElement('div'); title.className='tip-title';
    const statusTxt=h.start>t?`待搬砖: ${workdaysUntil}天`:'进行中';
    title.innerHTML=`<span>${h.name}</span><span class="countdown-tag">${statusTxt}</span>`;
    const desc=document.createElement('div'); desc.className='tip-desc';
    const startStr=(h.start.getMonth()+1)+'月'+h.start.getDate()+'日';
    const endStr=(h.end.getMonth()+1)+'月'+h.end.getDate()+'日';
    desc.innerText=startStr===endStr?startStr:`${startStr} 至 ${endStr}`;
    card.appendChild(title); card.appendChild(desc); list.appendChild(card);
  });
}

function buildCal(y, m) {
  const grid=document.getElementById('cal-grid');
  grid.innerHTML='';
  document.getElementById('cal-lbl-text').innerText=`${y}年 ${m+1}月`;
  ['日','一','二','三','四','五','六'].forEach(txt => {
    const di=document.createElement('div'); di.className='cal-lbl'; di.innerText=txt; grid.appendChild(di);
  });
  const firstD=new Date(y,m,1).getDay(), daysInM=new Date(y,m+1,0).getDate();
  const prevMDays=new Date(y,m,0).getDate(), todayStr=fmt(t);
  for (let i=firstD-1; i>=0; i--) {
    const di=document.createElement('div'); di.className='cal-day day-muted';
    const sp=document.createElement('span'); sp.innerText=prevMDays-i; di.appendChild(sp); grid.appendChild(di);
  }
  let wCnt=0;
  for (let day=1; day<=daysInM; day++) {
    const date=new Date(y,m,day), str=fmt(date), work=isWork(date), holidayName=DATA.h[str];
    if (work) wCnt++;
    const di=document.createElement('div'); di.className='cal-day';
    if (work && (wCnt===6||wCnt===15)) di.classList.add(wCnt===6?'day-w6':'day-w15');
    if (str===todayStr) di.classList.add('day-today');
    if (holidayName) di.classList.add('day-holiday');
    else if (!work) di.classList.add('day-rest');
    const num=document.createElement('span'); num.className='day-num'; num.innerText=day; di.appendChild(num);
    if (work) { const badge=document.createElement('span'); badge.className='badge'; badge.innerText=`W${wCnt}`; di.appendChild(badge); }
    if (holidayName) { const hn=document.createElement('span'); hn.className='holiday-name'; hn.innerText=holidayName; di.appendChild(hn); }
    if (notes[str]) { const dot=document.createElement('div'); dot.className='note-dot'; di.appendChild(dot); }
    di.onclick = () => {
      memoDate = new Date(y, m, day);
      miniCalYear = y; miniCalMonth = m;
      switchPage('memo');
    };
    grid.appendChild(di);
  }
  const total=firstD+daysInM, extra=(7-(total%7))%7;
  for (let day=1; day<=extra; day++) {
    const di=document.createElement('div'); di.className='cal-day day-muted';
    const sp=document.createElement('span'); sp.innerText=day; di.appendChild(sp); grid.appendChild(di);
  }
}

function changeMonth(d) {
  viewM+=d;
  if (viewM>11) viewM=0; else if (viewM<0) viewM=11;
  buildCal(2026, viewM);
}

// ─── Memo Page ───
let dPrev = new Date(), dCurr = new Date(), dNext = new Date();
function renderMemoDate() {
  dCurr = new Date(memoDate);
  dPrev = new Date(memoDate); dPrev.setDate(dPrev.getDate() - 1);
  dNext = new Date(memoDate); dNext.setDate(dNext.getDate() + 1);

  const sPrev = fmt(dPrev), sCurr = fmt(dCurr), sNext = fmt(dNext);
  const yestT = new Date(t); yestT.setDate(yestT.getDate() - 1);
  const tomT = new Date(t); tomT.setDate(tomT.getDate() + 1);
  const aToday = fmt(t), aYest = fmt(yestT), aTom = fmt(tomT);

  function setCol(prefix, dObj, sStr) {
    let title = WD_NAMES[dObj.getDay()];
    if (sStr === aYest) title = "昨天";
    else if (sStr === aToday) title = "今天";
    else if (sStr === aTom) title = "明天";

    document.getElementById('memo-title-' + prefix).innerText = title;
    document.getElementById('memo-sub-' + prefix).innerText = dateLabel(dObj);
    document.getElementById('memo-textarea-' + prefix).value = notes[sStr] || '';
  }

  setCol('prev', dPrev, sPrev);
  setCol('curr', dCurr, sCurr);
  setCol('next', dNext, sNext);

  document.getElementById('memo-save-status').innerText = '';
}

function shiftMemoDate(delta) {
  saveMemoNow();
  memoDate.setDate(memoDate.getDate() + delta);
  miniCalYear = memoDate.getFullYear();
  miniCalMonth = memoDate.getMonth();
  renderMemoDate();
  buildMiniCal();
}

function goMemoToday() {
  saveMemoNow();
  memoDate = new Date(t);
  miniCalYear = memoDate.getFullYear();
  miniCalMonth = memoDate.getMonth();
  renderMemoDate();
  buildMiniCal();
}

function onMemoInput() {
  clearTimeout(memoSaveTimer);
  document.getElementById('memo-save-status').innerText = '编辑中...';
  memoSaveTimer = setTimeout(saveMemoNow, 800);
}

function saveMemoNow() {
  const sPrev = fmt(dPrev), sCurr = fmt(dCurr), sNext = fmt(dNext);
  const vPrev = document.getElementById('memo-textarea-prev').value;
  const vCurr = document.getElementById('memo-textarea-curr').value;
  const vNext = document.getElementById('memo-textarea-next').value;

  if (vPrev.trim()) notes[sPrev] = vPrev; else delete notes[sPrev];
  if (vCurr.trim()) notes[sCurr] = vCurr; else delete notes[sCurr];
  if (vNext.trim()) notes[sNext] = vNext; else delete notes[sNext];

  localStorage.setItem('workday_notes', JSON.stringify(notes));
  document.getElementById('memo-save-status').innerText = '已保存 ✓';
  buildMiniCal();
}

// ─── Mini Calendar ───
function buildMiniCal() {
  const grid = document.getElementById('mini-cal-grid');
  grid.innerHTML = '';
  document.getElementById('mini-cal-lbl').innerText = `${miniCalYear}年${miniCalMonth+1}月`;
  const todayStr = fmt(t);
  const selStr = fmt(memoDate);

  ['日','一','二','三','四','五','六'].forEach(txt => {
    const di = document.createElement('div'); di.className='mini-cal-day-lbl'; di.innerText=txt; grid.appendChild(di);
  });

  const firstD = new Date(miniCalYear, miniCalMonth, 1).getDay();
  const daysInM = new Date(miniCalYear, miniCalMonth+1, 0).getDate();
  const prevMDays = new Date(miniCalYear, miniCalMonth, 0).getDate();

  for (let i=firstD-1; i>=0; i--) {
    const di = document.createElement('div'); di.className='mini-cal-day muted'; di.innerText=prevMDays-i; grid.appendChild(di);
  }

  for (let day=1; day<=daysInM; day++) {
    const date=new Date(miniCalYear, miniCalMonth, day), str=fmt(date), work=isWork(date);
    const di = document.createElement('div'); di.className='mini-cal-day';
    if (!work) di.classList.add('rest');
    if (str===todayStr) di.classList.add('today');
    if (str===selStr && str!==todayStr) di.classList.add('selected');
    di.innerText = day;
    if (notes[str]) { const dot=document.createElement('div'); dot.className='mini-note-dot'; di.appendChild(dot); }
    di.onclick = () => {
      saveMemoNow();
      memoDate = new Date(miniCalYear, miniCalMonth, day);
      renderMemoDate();
      buildMiniCal();
    };
    grid.appendChild(di);
  }

  const total=firstD+daysInM, extra=(7-(total%7))%7;
  for (let day=1; day<=extra; day++) {
    const di=document.createElement('div'); di.className='mini-cal-day muted'; di.innerText=day; grid.appendChild(di);
  }
}

function changeMiniMonth(delta) {
  miniCalMonth += delta;
  if (miniCalMonth > 11) { miniCalMonth=0; miniCalYear++; }
  else if (miniCalMonth < 0) { miniCalMonth=11; miniCalYear--; }
  buildMiniCal();
}

// ─── TODO ───
function renderTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  const pending = todos.filter(t => !t.done);
  const done = todos.filter(t => t.done);
  [...pending, ...done].forEach(todo => {
    const item = document.createElement('div');
    item.className = 'todo-item' + (todo.done ? ' done' : '');

    const check = document.createElement('div');
    check.className = 'todo-check';
    if (todo.done) check.innerHTML = '<i class="ph ph-check"></i>';

    const text = document.createElement('div');
    text.className = 'todo-text';
    text.innerText = todo.text;

    const del = document.createElement('button');
    del.className = 'todo-del';
    del.innerHTML = '<i class="ph ph-x"></i>';
    del.onclick = (e) => { e.stopPropagation(); deleteTodo(todo.id); };

    item.onclick = () => toggleTodo(todo.id);
    item.appendChild(check);
    item.appendChild(text);
    item.appendChild(del);
    list.appendChild(item);
  });
}

function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (!text) return;
  todos.push({ id: Date.now(), text, done: false });
  input.value = '';
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) { todo.done = !todo.done; saveTodos(); renderTodos(); }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function saveTodos() {
  localStorage.setItem('workday_todos', JSON.stringify(todos));
}

// ─── Init ───
['prev','curr','next'].forEach(prefix => {
  document.getElementById('memo-textarea-'+prefix).addEventListener('input', onMemoInput);
});

if (localStorage.getItem('theme') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
  document.getElementById('theme-icon').className = 'ph ph-moon';
}

calc(); buildCal(2026, viewM); updateHolidays();
