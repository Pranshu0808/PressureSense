/* ===========================
   BACKEND WEBSOCKET CONNECTION
=========================== */

const socket = new WebSocket("wss://pressure-sense-backend.onrender.com");

socket.onopen = () => {
    console.log("✅ Connected to Backend");
};

socket.onerror = (err) => {
    console.error("❌ WebSocket Error", err);
};

socket.onclose = () => {
    console.log("⚠️ WebSocket Closed");
};

socket.onmessage = (event) => {

    const payload = JSON.parse(event.data);

    console.log("📡 Live Data:", payload);

};

/* STATE */
let activeScreen = 'screen-welcome';
let patientData = { name: '', email: '', age: '', weight: '' };
let selected = 11;
let paused = false;

const zones = ['Big toe', 'Second toe', 'Third toe', 'Fourth toe', 'Fifth toe', 'Toe base', 'Forefoot outer', 'Forefoot inner', 'Midfoot outer', 'Midfoot inner', 'Heel outer', 'Heel centre', 'Heel inner', 'Arch outer', 'Arch inner', 'Centre foot'];
const coords = [[70, 17], [50, 7], [31, 16], [22, 25], [75, 26], [48, 29], [24, 41], [15, 53], [68, 46], [53, 58], [72, 66], [59, 80], [64, 91], [37, 91], [31, 79], [31, 64]];
const sensors = [];
const history = [178, 204, 188, 231, 218, 264, 241, 297, 226, 246, 270, 220, 254, 289, 272, 315, 256, 239, 283, 268];

/* NAVIGATION & SCREEN SWITCHING */
function switchScreen(screenId) {
  document.querySelectorAll('.flow-screen').forEach(s => s.classList.remove('active-screen'));
  document.getElementById(screenId)?.classList.add('active-screen');
  activeScreen = screenId;
}

function handleOnboardingSubmit(e) {
  e.preventDefault();
  patientData.name = document.getElementById('initName').value;
  patientData.email = document.getElementById('initEmail').value;
  patientData.age = document.getElementById('initAge').value;
  patientData.weight = document.getElementById('initWeight').value;

  switchScreen('screen-connect');
}

function connectAndLaunch() {
  const banner = document.getElementById('patientBanner');
  if (banner) {
    banner.textContent = `Patient: ${patientData.name || 'Active'} (${patientData.age || '--'}y, ${patientData.weight || '--'}kg)`;
  }
  switchScreen('app-shell');
  render();
}

/* SENSOR INITIALIZATION */
function makeSensors(side) {
  return zones.map((zone, i) => {
    let value = Math.round(62 + Math.random() * 292);
    return {
      id: `${side}-${String(i + 1).padStart(2, '0')}`,
      side,
      zone,
      value,
      values: Array.from({ length: 16 }, () => Math.max(32, value + Math.round((Math.random() - .5) * 70))),
      active: Math.random() > .08,
      x: coords[i][0],
      y: coords[i][1]
    };
  });
}
sensors.push(...makeSensors('L'), ...makeSensors('R'));

function tone(v) {
  return v < 95 ? '#2867fa' : v < 150 ? '#22bdc6' : v < 210 ? '#40d394' : v < 265 ? '#f1c74a' : v < 315 ? '#e98733' : '#e84b3f';
}

function stats(s) {
  return {
    avg: Math.round(s.values.reduce((a, b) => a + b, 0) / s.values.length),
    min: Math.min(...s.values),
    max: Math.max(...s.values)
  };
}

/* RENDERING LOGIC */
function renderFeet() {
  ['L', 'R'].forEach(side => {
    let box = document.getElementById(side === 'L' ? 'leftFoot' : 'rightFoot');
    if (!box) return;

    box.querySelectorAll('.sensor').forEach(e => e.remove());

    sensors.filter(s => s.side === side).forEach((s, i) => {
      let el = document.createElement('button');
      el.textContent = i + 1;
      el.className = `sensor ${sensors[selected] === s ? 'selected' : ''}`;
      el.style.cssText = `left:${s.x}%;top:${s.y}%;--sensor-color:${s.active ? tone(s.value) : '#45576a'}`;
      el.onclick = () => { selected = sensors.indexOf(s); render(); };
      box.append(el);
    });
  });
}

function renderGrid() {
  [['L', 'leftSensorGrid', 0], ['R', 'rightSensorGrid', 16]].forEach(([side, id, start]) => {
    let grid = document.getElementById(id);
    if (!grid) return;

    grid.innerHTML = sensors.filter(s => s.side === side).map((s, i) => {
      let z = stats(s);
      let index = start + i;
      return `<button class="sensor-tile ${index === selected ? 'selected' : ''}" data-i="${index}">
        <span class="sensor-id">Pad ${i + 1} · ${s.id}</span>
        <span class="sensor-zone">${s.zone}</span>
        <strong style="color:${tone(s.value)}">${s.value} kPa</strong>
        <div><span>AVG<b>${z.avg}</b></span><span>MIN<b>${z.min}</b></span><span>MAX<b>${z.max}</b></span></div>
      </button>`;
    }).join('');

    grid.querySelectorAll('button').forEach(b => {
      b.onclick = () => { selected = +b.dataset.i; render(); };
    });
  });
}

function renderHeader() {
  let live = sensors.filter(s => s.active);
  let l = sensors.filter(s => s.side === 'L' && s.active);
  let r = sensors.filter(s => s.side === 'R' && s.active);

  let mean = arr => arr.length ? (arr.reduce((sum, item) => sum + item.value, 0) / arr.length) : 0;
  let max = arr => arr.length ? Math.max(...arr.map(item => item.value)) : 0;

  // Active sensors update
  const activeSensorsEl = document.getElementById('activeSensors');
  if (activeSensorsEl) activeSensorsEl.textContent = `${live.length}/${sensors.length}`;

  // Left metrics update
  const leftAvgEl = document.getElementById('leftAverage');
  const leftPeakEl = document.getElementById('leftPeak');
  const leftContactEl = document.getElementById('leftContact');
  if (leftAvgEl) leftAvgEl.textContent = mean(l).toFixed(1);
  if (leftPeakEl) leftPeakEl.textContent = max(l).toFixed(1);
  if (leftContactEl) leftContactEl.textContent = (l.length * 9.6).toFixed(0);

  // Right metrics update
  const rightAvgEl = document.getElementById('rightAverage');
  const rightPeakEl = document.getElementById('rightPeak');
  const rightContactEl = document.getElementById('rightContact');
  if (rightAvgEl) rightAvgEl.textContent = mean(r).toFixed(1);
  if (rightPeakEl) rightPeakEl.textContent = max(r).toFixed(1);
  if (rightContactEl) rightContactEl.textContent = (r.length * 10.75).toFixed(0);

  // Selection readout update
  const current = sensors[selected];
  if (current) {
    const selText = document.getElementById('selectionText');
    const selName = document.getElementById('selectedName');
    const selVal = document.getElementById('selectedValue');
    if (selText) selText.textContent = `Selected: ${current.id} · ${current.zone}`;
    if (selName) selName.textContent = `${current.id} · ${current.zone}`;
    if (selVal) selVal.textContent = `${current.value} kPa`;
  }
}

/* CHART RENDERING */
function renderChart() {
  const chartFill = document.getElementById('chartFill');
  const chartPath = document.getElementById('chartPath');
  if (!chartPath || !chartFill) return;

  const width = 295;
  const height = 120;
  const maxVal = 400;

  const points = history.map((val, idx) => {
    const x = 28 + (idx / (history.length - 1)) * width;
    const y = 140 - (val / maxVal) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const fillD = `${pathD} L 323,140 L 28,140 Z`;

  chartPath.setAttribute('d', pathD);
  chartFill.setAttribute('d', fillD);
}

/* MAIN RENDER ENGINE */
function render() {
  renderFeet();
  renderGrid();
  renderHeader();
  renderChart();
}

/* LIVE STREAM TIMER LOOP */
setInterval(() => {
  // Agar stream paused hai ya dashboard screen active nahi hai toh update na karein
  if (paused || activeScreen !== 'app-shell') return;

  // Random sensor values updates (ESP32 data Simulation)
  sensors.forEach(s => {
    if (s.active) {
      s.value = Math.max(20, Math.min(420, s.value + Math.round((Math.random() - 0.5) * 18)));
      s.values.push(s.value);
      if (s.values.length > 16) s.values.shift();
    }
  });

  // Graph history update
  const activeSensorsList = sensors.filter(s => s.active);
  const activeAvg = Math.round(activeSensorsList.reduce((a, b) => a + b.value, 0) / (activeSensorsList.length || 1));
  history.push(activeAvg);
  if (history.length > 20) history.shift();

  // Clock update
  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = new Date().toLocaleTimeString();

  render();
}, 600);

/* PAUSE / RESUME STREAM FUNCTIONALITY */
function togglePause() {
  paused = !paused;
  const btn = document.getElementById('pauseBtn');
  if (btn) {
    btn.textContent = paused ? '▶ Resume stream' : 'Ⅱ Pause stream';
    btn.style.background = paused ? 'var(--green)' : 'var(--cyan)';
  }
}

// Event Listener Bind for Pause Button
document.addEventListener('DOMContentLoaded', () => {
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) {
    pauseBtn.onclick = togglePause;
  }
});

/* PDF REPORT GENERATION */
function completeSession() {
  const element = document.getElementById('dashboard');
  if (!element || typeof html2pdf === 'undefined') return;
  
  const opt = {
    margin: 0.3,
    filename: `plantar_assessment_${(patientData.name || 'patient').replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: '#080d13' },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
  };

  html2pdf().set(opt).from(element).save();
}
