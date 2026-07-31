const state = {
  isLoggedIn: false,
  rooms: [],
  tenants: [],
  bills: [],
  dashboard: {},
  monthlyRevenue: [],
  lastUnpaidCount: 0,
  soundEnabled: true,
  themeMode: 'enterprise'
};

const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const logoutBtn = document.getElementById('logout-btn');

const roomForm = document.getElementById('room-form');
const roomIdInput = document.getElementById('room-id');
const roomNumberInput = document.getElementById('room-number');
const roomTypeInput = document.getElementById('room-type');
const roomStatusInput = document.getElementById('room-status');
const roomList = document.getElementById('room-list');
const roomSearchInput = document.getElementById('room-search');

const tenantForm = document.getElementById('tenant-form');
const tenantIdInput = document.getElementById('tenant-id');
const tenantNameInput = document.getElementById('tenant-name');
const tenantRoomInput = document.getElementById('tenant-room');
const tenantPhoneInput = document.getElementById('tenant-phone');
const tenantStatusInput = document.getElementById('tenant-status');
const tenantList = document.getElementById('tenant-list');
const tenantSearchInput = document.getElementById('tenant-search');

const billForm = document.getElementById('bill-form');
const billIdInput = document.getElementById('bill-id');
const billTenantSelect = document.getElementById('bill-tenant');
const billAmountInput = document.getElementById('bill-amount');
const billStatusInput = document.getElementById('bill-status');
const billList = document.getElementById('bill-list');
const billSearchInput = document.getElementById('bill-search');

const statRooms = document.getElementById('rooms');
const statOccupants = document.getElementById('occupants');
const statUnpaid = document.getElementById('unpaid');
const statRevenue = document.getElementById('revenue');
const recentBillsList = document.getElementById('recent-bills');
const occupancyProgressBar = document.getElementById('occupancy-progress');
const occupancyProgressText = document.getElementById('occupancy-progress-text');
const paymentProgressBar = document.getElementById('payment-progress');
const paymentProgressText = document.getElementById('payment-progress-text');
const activityList = document.getElementById('activity-list');
const liveClock = document.getElementById('live-clock');
const exportBtn = document.getElementById('export-btn');
const printBtn = document.getElementById('print-btn');
const themeBtn = document.getElementById('theme-btn');
const themeSelect = document.getElementById('theme-select');
const soundBtn = document.getElementById('sound-btn');
const emailBtn = document.getElementById('email-btn');
const overviewTab = document.getElementById('overview-tab');
const reportTab = document.getElementById('report-tab');
const mainContent = document.getElementById('main-content');
const reportView = document.getElementById('report-view');
const statsChart = document.getElementById('stats-chart');
const monthlyChart = document.getElementById('monthly-chart');
const historyList = document.getElementById('history-list');
const confirmBillSelect = document.getElementById('confirm-bill-select');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
const revenueChart = document.getElementById('revenue-chart');
const dailySummaryBody = document.getElementById('daily-summary-body');
const monthlySummaryBody = document.getElementById('monthly-summary-body');

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

function getRoomTypeLabel(type) {
  switch (type) {
    case 'single':
      return 'เดี่ยว';
    case 'double':
      return 'คู่';
    case 'suite':
      return 'สวีท';
    default:
      return type || 'ไม่ระบุ';
  }
}

function getRoomStatusLabel(status) {
  switch (status) {
    case 'available':
      return 'ว่าง';
    case 'occupied':
      return 'มีผู้เช่า';
    case 'maintenance':
      return 'ซ่อมบำรุง';
    default:
      return status || 'ไม่ระบุ';
  }
}

function getTenantStatusLabel(status) {
  switch (status) {
    case 'active':
      return 'ใช้งาน';
    case 'inactive':
      return 'ไม่ใช้งาน';
    default:
      return status || 'ไม่ระบุ';
  }
}

function getBillStatusLabel(status) {
  switch (status) {
    case 'paid':
      return 'ชำระแล้ว';
    case 'unpaid':
      return 'ค้างชำระ';
    default:
      return status || 'ไม่ระบุ';
  }
}

function getRoomStatusClass(status) {
  switch (status) {
    case 'available':
      return 'available';
    case 'occupied':
      return 'occupied';
    case 'maintenance':
      return 'maintenance';
    default:
      return '';
  }
}

function getTenantStatusClass(status) {
  switch (status) {
    case 'active':
      return 'active';
    case 'inactive':
      return 'inactive';
    default:
      return '';
  }
}

function getBillStatusClass(status) {
  switch (status) {
    case 'paid':
      return 'paid';
    case 'unpaid':
      return 'unpaid';
    default:
      return '';
  }
}

function renderChart() {
  const data = [
    { label: 'ห้อง', value: Number(state.dashboard.rooms || 0), color: 'var(--accent)' },
    { label: 'ผู้เช่า', value: Number(state.dashboard.occupants || 0), color: 'var(--success)' },
    { label: 'ค้างชำระ', value: Number(state.dashboard.unpaid || 0), color: 'var(--warning)' },
    { label: 'ชำระแล้ว', value: Number(state.dashboard.paid || 0), color: 'var(--info)' }
  ];
  const maxValue = Math.max(1, ...data.map((item) => item.value));

  statsChart.innerHTML = '';
  data.forEach((item) => {
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    const height = Math.max(12, Math.round((item.value / maxValue) * 100));
    bar.innerHTML = `
      <div class="bar-track">
        <div class="bar-fill" style="height:${height}%; background:${item.color};"></div>
      </div>
      <div class="bar-label">${item.label}</div>
      <div class="bar-value">${item.value}</div>
    `;
    statsChart.appendChild(bar);
  });
}

function renderMonthlyChart(monthlyRevenue) {
  monthlyChart.innerHTML = '';
  if (!monthlyRevenue.length) {
    monthlyChart.innerHTML = '<div class="empty-state">ไม่มีข้อมูลรายได้ในช่วงนี้</div>';
    return;
  }

  const maxValue = Math.max(1, ...monthlyRevenue.map((item) => Number(item.revenue || 0)));
  monthlyRevenue.forEach((item) => {
    const bar = document.createElement('div');
    bar.className = 'monthly-bar';
    const height = Math.max(10, Math.round((Number(item.revenue || 0) / maxValue) * 100));
    bar.innerHTML = `
      <div class="monthly-track">
        <div class="monthly-fill" style="height:${height}%"></div>
      </div>
      <div class="monthly-label">${item.month}</div>
      <div class="monthly-value">${Number(item.revenue || 0).toLocaleString()} บาท</div>
    `;
    monthlyChart.appendChild(bar);
  });
}

function renderRevenueChart(monthlyRevenue) {
  if (!revenueChart) return;
  revenueChart.innerHTML = '';
  if (!monthlyRevenue.length) {
    revenueChart.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#cbd5e1">ไม่มีข้อมูลรายได้</text>';
    return;
  }

  const values = monthlyRevenue.map((item) => Number(item.revenue || 0));
  const maxValue = Math.max(1, ...values);
  const width = 620;
  const height = 250;
  const padding = 34;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = chartWidth / Math.max(1, values.length - 1);
  const points = values.map((value, index) => {
    const x = padding + index * stepX;
    const y = padding + chartHeight - (value / maxValue) * chartHeight;
    return { x, y };
  });

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${points[0].x.toFixed(1)} ${height - padding} Z`;

  revenueChart.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" rx="16" fill="rgba(255,255,255,0.02)"></rect>
    <path d="${areaPath}" fill="rgba(34,197,94,0.16)"></path>
    <path d="${linePath}" fill="none" stroke="url(#revenueGradient)" stroke-width="4" stroke-linecap="round"></path>
    <defs>
      <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b"></stop>
        <stop offset="100%" stop-color="#22c55e"></stop>
      </linearGradient>
    </defs>
    ${points.map((point, index) => `
      <circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="5.5" fill="#f8fafc" stroke="#22c55e" stroke-width="3"></circle>
      <text x="${point.x.toFixed(1)}" y="${height - 10}" text-anchor="middle" fill="#cbd5e1" font-size="11">${monthlyRevenue[index].month}</text>
    `).join('')}
  `;
}

function renderSummaryTables() {
  const dailySummary = [];
  const monthlySummary = [];
  const dailyMap = new Map();
  const monthlyMap = new Map();

  state.bills.forEach((bill) => {
    const date = bill.created_at ? new Date(bill.created_at) : new Date();
    const normalizedDate = !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const monthKey = normalizedDate.slice(0, 7);

    if (!dailyMap.has(normalizedDate)) {
      dailyMap.set(normalizedDate, { date: normalizedDate, revenue: 0, paid: 0, unpaid: 0 });
    }
    const dailyEntry = dailyMap.get(normalizedDate);
    dailyEntry.revenue += Number(bill.amount || 0);
    if (bill.status === 'paid') dailyEntry.paid += 1;
    else dailyEntry.unpaid += 1;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { month: monthKey, revenue: 0, count: 0 });
    }
    const monthlyEntry = monthlyMap.get(monthKey);
    monthlyEntry.revenue += Number(bill.amount || 0);
    monthlyEntry.count += 1;
  });

  Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-7).forEach((item) => dailySummary.push(item));
  Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).forEach((item) => monthlySummary.push(item));

  dailySummaryBody.innerHTML = '';
  if (!dailySummary.length) {
    dailySummaryBody.innerHTML = '<tr><td colspan="4" class="empty-state">ยังไม่มีข้อมูลสรุป</td></tr>';
  } else {
    dailySummary.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.date}</td><td>${Number(item.revenue || 0).toLocaleString()} บาท</td><td>${item.paid}</td><td>${item.unpaid}</td>`;
      dailySummaryBody.appendChild(row);
    });
  }

  monthlySummaryBody.innerHTML = '';
  if (!monthlySummary.length) {
    monthlySummaryBody.innerHTML = '<tr><td colspan="3" class="empty-state">ยังไม่มีข้อมูลสรุป</td></tr>';
  } else {
    monthlySummary.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.month}</td><td>${Number(item.revenue || 0).toLocaleString()} บาท</td><td>${item.count}</td>`;
      monthlySummaryBody.appendChild(row);
    });
  }
}

function renderPaymentHistory(history) {
  historyList.innerHTML = '';
  if (!history.length) {
    historyList.innerHTML = '<tr><td colspan="3" class="empty-state">ยังไม่มีประวัติการชำระเงิน</td></tr>';
    return;
  }

  history.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.tenant_name || 'ไม่ทราบ'}</td>
      <td>${Number(item.amount || 0).toLocaleString()} บาท</td>
      <td>${item.created_at || '-'}</td>
    `;
    historyList.appendChild(row);
  });
}

function animateValue(element, endValue, formatter = (value) => value) {
  const startValue = Number(element.dataset.value || 0);
  const duration = 700;
  const startTime = performance.now();

  const step = (time) => {
    const progress = Math.min(1, (time - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startValue + (endValue - startValue) * eased);
    element.textContent = formatter(current);
    element.dataset.value = current;
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

function updateLiveClock() {
  if (!liveClock) return;
  const now = new Date();
  liveClock.textContent = now.toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });
}

function updateOperationsPanel() {
  const totalRooms = Number(state.dashboard.rooms || 0);
  const occupiedRooms = Number(state.dashboard.occupants || 0);
  const totalBills = Number(state.dashboard.paid || 0) + Number(state.dashboard.unpaid || 0);
  const paymentRate = totalBills > 0 ? Math.round((Number(state.dashboard.paid || 0) / totalBills) * 100) : 0;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  occupancyProgressBar.style.width = `${occupancyRate}%`;
  occupancyProgressText.textContent = `${occupancyRate}%`;
  paymentProgressBar.style.width = `${paymentRate}%`;
  paymentProgressText.textContent = `${paymentRate}%`;

  activityList.innerHTML = '';
  const items = [];
  if (Number(state.dashboard.unpaid || 0) > 0) {
    items.push(`<li><strong>${state.dashboard.unpaid} ฉบับ</strong> ค้างชำระต้องติดตาม</li>`);
  }
  if (occupiedRooms > 0) {
    items.push(`<li><strong>${occupiedRooms} คน</strong> มีสถานะผู้เช่าที่ใช้งานอยู่</li>`);
  }
  if (totalRooms - occupiedRooms > 0) {
    items.push(`<li><strong>${totalRooms - occupiedRooms} ห้อง</strong> ยังว่างสำหรับผู้เช่าใหม่</li>`);
  }
  if (!items.length) {
    items.push('<li>ระบบพร้อมใช้งาน และยังไม่มีรายการเร่งด่วนในตอนนี้</li>');
  }
  activityList.innerHTML = items.join('');
}

function applyTheme(mode) {
  document.body.classList.remove('theme-classic', 'theme-enterprise', 'theme-midnight', 'dark-theme');
  document.body.classList.add(`theme-${mode}`);
  state.themeMode = mode;
  if (themeSelect) themeSelect.value = mode;
  if (themeBtn) {
    themeBtn.textContent = mode === 'classic' ? '🌿 ธีมมาตรฐาน' : mode === 'enterprise' ? '🏢 ธีมองค์กร' : '🌙 ธีมกลางคืน';
  }
}

function toggleTheme() {
  const nextMode = state.themeMode === 'classic' ? 'enterprise' : state.themeMode === 'enterprise' ? 'midnight' : 'classic';
  applyTheme(nextMode);
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  if (soundBtn) {
    soundBtn.textContent = state.soundEnabled ? '🔊 เสียงเตือน: เปิด' : '🔈 เสียงเตือน: ปิด';
  }
}

function renderDashboard() {
  animateValue(statRooms, Number(state.dashboard.rooms || 0), (value) => `${value}`);
  animateValue(statOccupants, Number(state.dashboard.occupants || 0), (value) => `${value}`);
  animateValue(statUnpaid, Number(state.dashboard.unpaid || 0), (value) => `${value}`);
  animateValue(statRevenue, Number(state.dashboard.revenue || 0), (value) => `${value.toLocaleString()} บาท`);

  recentBillsList.innerHTML = '';
  (state.dashboard.recentBills || []).forEach((bill) => {
    const item = document.createElement('li');
    item.textContent = `${bill.tenant_name || 'ไม่ทราบ'} • ${bill.amount} บาท • ${getBillStatusLabel(bill.status)}`;
    recentBillsList.appendChild(item);
  });

  renderChart();
  updateReportSummary();
  updateOperationsPanel();

  if (state.soundEnabled && state.dashboard.unpaid > 0 && state.dashboard.unpaid !== state.lastUnpaidCount) {
    playAlertSound();
  }
  state.lastUnpaidCount = state.dashboard.unpaid || 0;
}

function renderRooms() {
  roomList.innerHTML = '';
  if (!state.rooms.length) {
    roomList.innerHTML = '<tr><td colspan="4" class="empty-state">ไม่มีข้อมูลห้องพักในตอนนี้</td></tr>';
    return;
  }

  state.rooms.forEach((room) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${room.room_number || room.roomNumber}</td>
      <td>${getRoomTypeLabel(room.type)}</td>
      <td><span class="status-pill ${getRoomStatusClass(room.status)}">${getRoomStatusLabel(room.status)}</span></td>
      <td class="actions">
        <button data-action="edit-room" data-id="${room.id}">แก้ไข</button>
        <button data-action="delete-room" data-id="${room.id}">ลบ</button>
      </td>`;
    roomList.appendChild(row);
  });
}

function renderTenants() {
  tenantList.innerHTML = '';
  if (!state.tenants.length) {
    tenantList.innerHTML = '<tr><td colspan="5" class="empty-state">ไม่มีข้อมูลผู้เช่าในตอนนี้</td></tr>';
    return;
  }

  state.tenants.forEach((tenant) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${tenant.name}</td>
      <td>${tenant.room_number || tenant.roomNumber}</td>
      <td>${tenant.phone}</td>
      <td><span class="status-pill ${getTenantStatusClass(tenant.status)}">${getTenantStatusLabel(tenant.status)}</span></td>
      <td class="actions">
        <button data-action="edit-tenant" data-id="${tenant.id}">แก้ไข</button>
        <button data-action="delete-tenant" data-id="${tenant.id}">ลบ</button>
      </td>`;
    tenantList.appendChild(row);
  });
}

function renderBills() {
  billList.innerHTML = '';
  if (!state.bills.length) {
    billList.innerHTML = '<tr><td colspan="4" class="empty-state">ไม่มีข้อมูลบิลในตอนนี้</td></tr>';
    return;
  }

  state.bills.forEach((bill) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${bill.tenantName || 'ไม่ทราบ'}</td>
      <td>${bill.amount}</td>
      <td><span class="status-pill ${getBillStatusClass(bill.status)}">${getBillStatusLabel(bill.status)}</span></td>
      <td class="actions">
        <button data-action="edit-bill" data-id="${bill.id}">แก้ไข</button>
        <button data-action="delete-bill" data-id="${bill.id}">ลบ</button>
        ${bill.status === 'unpaid' ? `<button data-action="pay-bill" data-id="${bill.id}">ชำระ</button>` : ''}
      </td>`;
    billList.appendChild(row);
  });
}

function renderPaymentSelectOptions() {
  confirmBillSelect.innerHTML = '<option value="">เลือกบิลเพื่อยืนยันชำระ</option>';
  state.bills.filter((bill) => bill.status === 'unpaid').forEach((bill) => {
    const option = document.createElement('option');
    option.value = bill.id;
    option.textContent = `${bill.tenantName || 'ไม่ทราบ'} • ${bill.amount} บาท`;
    confirmBillSelect.appendChild(option);
  });
}

function renderTenantOptions() {
  billTenantSelect.innerHTML = '';
  state.tenants.forEach((tenant) => {
    const option = document.createElement('option');
    option.value = tenant.id;
    option.textContent = tenant.name;
    billTenantSelect.appendChild(option);
  });
}

function resetRoomForm() {
  roomForm.reset();
  roomIdInput.value = '';
}

function resetTenantForm() {
  tenantForm.reset();
  tenantIdInput.value = '';
}

function resetBillForm() {
  billForm.reset();
  billIdInput.value = '';
}

let audioContext = null;

function playAlertSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.18);
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.25);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.25);
  } catch (error) {
    console.warn('Audio alert unavailable', error);
  }
}

function updateReportSummary() {
  const availableRooms = state.rooms.filter((room) => room.status === 'available').length;
  const unpaidBills = state.bills.filter((bill) => bill.status === 'unpaid');
  const tenantCount = state.tenants.length;

  document.getElementById('report-total-rooms').textContent = state.dashboard.rooms || 0;
  document.getElementById('report-available-rooms').textContent = availableRooms;
  document.getElementById('report-tenant-count').textContent = tenantCount;
  document.getElementById('report-unpaid-count').textContent = unpaidBills.length;

  const noteText = unpaidBills.length > 0
    ? `มีบิลค้างชำระ ${unpaidBills.length} ฉบับ ควรแจ้งเตือนผู้เช่าโดยด่วน`
    : 'สภาพหอพักอยู่ในสถานะปกติ ไม่มีบิลค้างชำระในขณะนี้';
  document.getElementById('report-note-text').textContent = noteText;
}

function exportToExcel() {
  const rows = [
    ['หมวดหมู่', 'รายละเอียด'],
    ['ห้องทั้งหมด', state.dashboard.rooms || 0],
    ['ผู้เช่าทั้งหมด', state.dashboard.occupants || 0],
    ['บิลค้างชำระ', state.dashboard.unpaid || 0],
    ['บิลชำระแล้ว', state.dashboard.paid || 0],
    ['รายได้รวม', `${state.dashboard.revenue || 0} บาท`]
  ];

  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'dorm-report.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function printReport() {
  window.print();
}

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  themeBtn.textContent = isDark ? '☀️ โหมดกลางวัน' : '🌙 โหมดกลางคืน';
}

function sendEmailReport() {
  const subject = encodeURIComponent('รายงานระบบจัดการหอพัก');
  const body = encodeURIComponent(`สรุประบบวันนี้\nห้องทั้งหมด: ${state.dashboard.rooms || 0}\nผู้เช่าทั้งหมด: ${state.dashboard.occupants || 0}\nบิลค้างชำระ: ${state.dashboard.unpaid || 0}\nรายได้รวม: ${(state.dashboard.revenue || 0).toLocaleString()} บาท`);
  window.location.href = `mailto:manager@example.com?subject=${subject}&body=${body}`;
}

async function loadDashboard() {
  try {
    const dashboard = await requestJson('/api/dashboard');
    state.dashboard = dashboard;
    renderDashboard();
  } catch (error) {
    console.error(error);
  }
}

async function loadData() {
  try {
    const [rooms, tenants, bills, monthlyRevenue, paymentHistory] = await Promise.all([
      requestJson(`/api/rooms?search=${encodeURIComponent(roomSearchInput.value)}`),
      requestJson(`/api/tenants?search=${encodeURIComponent(tenantSearchInput.value)}`),
      requestJson(`/api/bills?search=${encodeURIComponent(billSearchInput.value)}`),
      requestJson('/api/monthly-revenue'),
      requestJson('/api/payment-history')
    ]);
    state.rooms = rooms;
    state.tenants = tenants;
    state.bills = bills;
    state.monthlyRevenue = monthlyRevenue;
    renderRooms();
    renderTenants();
    renderBills();
    renderTenantOptions();
    renderPaymentSelectOptions();
    renderMonthlyChart(monthlyRevenue);
    renderRevenueChart(monthlyRevenue);
    renderSummaryTables();
    renderPaymentHistory(paymentHistory);
  } catch (error) {
    console.error(error);
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await requestJson('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
      })
    });
    state.isLoggedIn = true;
    loginScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    await loadDashboard();
    await loadData();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

logoutBtn.addEventListener('click', () => {
  state.isLoggedIn = false;
  loginScreen.classList.remove('hidden');
  appShell.classList.add('hidden');
  loginMessage.textContent = '';
});

exportBtn.addEventListener('click', exportToExcel);
printBtn.addEventListener('click', printReport);
themeBtn.addEventListener('click', toggleTheme);
themeSelect.addEventListener('change', (event) => applyTheme(event.target.value));
soundBtn.addEventListener('click', toggleSound);
emailBtn.addEventListener('click', sendEmailReport);

overviewTab.addEventListener('click', () => {
  overviewTab.classList.add('active');
  reportTab.classList.remove('active');
  mainContent.classList.remove('hidden');
  reportView.classList.add('hidden');
});

reportTab.addEventListener('click', () => {
  reportTab.classList.add('active');
  overviewTab.classList.remove('active');
  mainContent.classList.add('hidden');
  reportView.classList.remove('hidden');
});

confirmPaymentBtn.addEventListener('click', async () => {
  const billId = confirmBillSelect.value;
  if (!billId) return;
  try {
    await requestJson(`/api/bills/${billId}/pay`, { method: 'POST' });
    await loadDashboard();
    await loadData();
  } catch (error) {
    console.error(error);
  }
});

roomSearchInput.addEventListener('input', loadData);
roomForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    roomNumber: roomNumberInput.value,
    type: roomTypeInput.value,
    status: roomStatusInput.value
  };

  try {
    if (roomIdInput.value) {
      await requestJson(`/api/rooms/${roomIdInput.value}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      await requestJson('/api/rooms', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    resetRoomForm();
    await loadDashboard();
    await loadData();
  } catch (error) {
    console.error(error);
  }
});

roomList.addEventListener('click', async (event) => {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);
  if (!action || !id) return;

  if (action === 'edit-room') {
    const room = state.rooms.find((item) => item.id === id);
    if (room) {
      roomIdInput.value = room.id;
      roomNumberInput.value = room.room_number || room.roomNumber;
      roomTypeInput.value = room.type;
      roomStatusInput.value = room.status;
    }
    return;
  }

  if (action === 'delete-room') {
    await requestJson(`/api/rooms/${id}`, { method: 'DELETE' });
    await loadDashboard();
    await loadData();
  }
});

document.getElementById('room-reset-btn').addEventListener('click', resetRoomForm);

tenantSearchInput.addEventListener('input', loadData);
tenantForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    name: tenantNameInput.value,
    roomNumber: tenantRoomInput.value,
    phone: tenantPhoneInput.value,
    status: tenantStatusInput.value
  };

  try {
    if (tenantIdInput.value) {
      await requestJson(`/api/tenants/${tenantIdInput.value}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      await requestJson('/api/tenants', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    resetTenantForm();
    await loadDashboard();
    await loadData();
  } catch (error) {
    console.error(error);
  }
});

tenantList.addEventListener('click', async (event) => {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);
  if (!action || !id) return;

  if (action === 'edit-tenant') {
    const tenant = state.tenants.find((item) => item.id === id);
    if (tenant) {
      tenantIdInput.value = tenant.id;
      tenantNameInput.value = tenant.name;
      tenantRoomInput.value = tenant.room_number || tenant.roomNumber;
      tenantPhoneInput.value = tenant.phone;
      tenantStatusInput.value = tenant.status;
    }
    return;
  }

  if (action === 'delete-tenant') {
    await requestJson(`/api/tenants/${id}`, { method: 'DELETE' });
    await loadDashboard();
    await loadData();
  }
});

document.getElementById('tenant-reset-btn').addEventListener('click', resetTenantForm);

billSearchInput.addEventListener('input', loadData);
billForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    tenantId: Number(billTenantSelect.value),
    amount: Number(billAmountInput.value),
    status: billStatusInput.value
  };

  try {
    if (billIdInput.value) {
      await requestJson(`/api/bills/${billIdInput.value}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      await requestJson('/api/bills', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    resetBillForm();
    await loadDashboard();
    await loadData();
  } catch (error) {
    console.error(error);
  }
});

billList.addEventListener('click', async (event) => {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);
  if (!action || !id) return;

  if (action === 'edit-bill') {
    const bill = state.bills.find((item) => item.id === id);
    if (bill) {
      billIdInput.value = bill.id;
      billTenantSelect.value = bill.tenantId || bill.tenant_id;
      billAmountInput.value = bill.amount;
      billStatusInput.value = bill.status;
    }
    return;
  }

  if (action === 'delete-bill') {
    await requestJson(`/api/bills/${id}`, { method: 'DELETE' });
    await loadDashboard();
    await loadData();
  }

  if (action === 'pay-bill') {
    await requestJson(`/api/bills/${id}/pay`, { method: 'POST' });
    await loadDashboard();
    await loadData();
  }
});

document.getElementById('bill-reset-btn').addEventListener('click', resetBillForm);

applyTheme(state.themeMode);
updateLiveClock();
setInterval(updateLiveClock, 1000);
loadDashboard();
loadData();
