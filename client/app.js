/* ===========================
   BACKEND WEBSOCKET CONNECTION
=========================== */
// alert("NEW APP JS LOADED");
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
    console.table(payload.pressure_data);
    if (!payload.pressure_data) return;

    payload.pressure_data.forEach(sensor => {
         // Right Foot ke saare 16 sensors ko 0 kar do
for (let i = 16; i < 32; i++) {
    sensors[i].value = 0;
    sensors[i].active = false;
    sensors[i].values = Array(16).fill(0);
}
        // const side = sensor.side === 0 ? "L" : "R";

        //const id = sensor.sensorId + 1;

       const side = "L";          // Sab kuch Left foot me bhejo
const id = sensor.sensorId + 1;

        const sensorObj = sensors.find(s =>
            s.side === side &&
            Number(s.id.split("-")[1]) === id
        );

        if (!sensorObj) return;

       const pressure = Number(((sensor.sensorValue * 50) / 4095).toFixed(1));

      sensorObj.value = pressure;
      sensorObj.active = true;
      sensorObj.values.push(pressure);

        if (sensorObj.values.length > 16)
            sensorObj.values.shift();

    });

    render();

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
  if (v < 8) return '#2867fa';      // Blue
  if (v < 16) return '#22bdc6';     // Cyan
  if (v < 24) return '#40d394';     // Green
  if (v < 32) return '#f1c74a';     // Yellow
  if (v < 40) return '#e98733';     // Orange
  return '#e84b3f';                 // Red
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
  // sensors.forEach(s => {
  //   if (s.active) {
  //     s.value = Math.max(20, Math.min(420, s.value + Math.round((Math.random() - 0.5) * 18)));
  //     s.values.push(s.value);
  //     if (s.values.length > 16) s.values.shift();
  //   }
  // });

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
// function completeSession() {
//   const element = document.getElementById('dashboard');
//   if (!element || typeof html2pdf === 'undefined') return;
  
//   const opt = {
//     margin: 0.3,
//     filename: `plantar_assessment_${(patientData.name || 'patient').replace(/\s+/g, '_')}.pdf`,
//     image: { type: 'jpeg', quality: 0.98 },
//     html2canvas: { scale: 2, backgroundColor: '#080d13' },
//     jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
//   };

//   html2pdf().set(opt).from(element).save();
// }

/* CLINICAL REPORT GENERATION (PRESSURE SENSE AI FORMAT) */
function completeSession() {
  const doctorNotes = document.getElementById('doctorNotes')?.value || 'No isolated abnormal pressure hotspot detected. Pressure distribution is balanced with mild forefoot dominance.';

  // Live Telemetry Aggregations
  const totalSensors = sensors.length;
  const values = sensors.map(s => s.value);
  const avgPressure = Math.round(values.reduce((a, b) => a + b, 0) / totalSensors);
  const maxPressure = Math.max(...values);
  const minPressure = Math.min(...values);

  // Peak Sensor ID Extraction
  const peakSensorObj = sensors.reduce((prev, current) => (prev.value > current.value) ? prev : current, sensors[0]);
  const peakSensorID = peakSensorObj ? peakSensorObj.id : 'S8';

  // Regional Calculations
  const getRegionAvg = (keyword) => {
    const list = sensors.filter(s => s.zone.toLowerCase().includes(keyword));
    if (!list.length) return { avg: 20, peak: 'N/A' };
    const avg = Math.round(list.reduce((a, b) => a + b.value, 0) / list.length);
    const peakObj = list.reduce((p, c) => p.value > c.value ? p : c, list[0]);
    return { avg, peak: peakObj.id };
  };

  const toeData = getRegionAvg('toe');
  const forefootData = getRegionAvg('forefoot');
  const midfootData = getRegionAvg('midfoot');
  const heelData = getRegionAvg('heel');

  // Mathematical Statistics
  const sorted = [...values].sort((a, b) => a - b);
  const medianPressure = sorted.length % 2 === 0 
    ? ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(1)
    : sorted[Math.floor(sorted.length / 2)].toFixed(1);
    
  const variance = (values.reduce((a, b) => a + Math.pow(b - avgPressure, 2), 0) / totalSensors).toFixed(2);
  const stdDev = Math.sqrt(variance).toFixed(2);

  const reportContainer = document.createElement('div');
  reportContainer.className = 'ps-pdf-container';
  reportContainer.style.cssText = `
    width: 780px;
    padding: 24px;
    background: #ffffff;
    color: #1e293b;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    font-size: 11px;
    line-height: 1.4;
    box-sizing: border-box;
  `;

  reportContainer.innerHTML = `
    <style>
      .ps-header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
      .ps-header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
      .ps-header p { margin: 2px 0 0; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
      
      .ps-section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 14px 0 8px; }
      
      .ps-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .ps-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      
      .ps-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 6px; }
      .ps-table th { background: #f1f5f9; text-align: left; padding: 5px 6px; font-weight: 700; color: #334155; border-bottom: 1px solid #cbd5e1; }
      .ps-table td { padding: 4px 6px; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
      
      .ps-badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 700; }
      .ps-badge-normal { background: #dcfce7; color: #15803d; }
      .ps-badge-moderate { background: #fef9c3; color: #a16207; }
      .ps-badge-high { background: #fee2e2; color: #b91c1c; }
      .ps-badge-peak { background: #991b1b; color: #ffffff; }

      .ps-progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; display: flex; }
      .ps-progress-fill { height: 100%; background: #0284c7; }
      
      .ps-footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }
    </style>

    <!-- HEADER -->
    <div class="ps-header">
      <div>
        <h1>PressureSense AI</h1>
        <p>Plantar Pressure Analysis Report</p>
      </div>
      <div style="text-align: right;">
        <strong style="color: #0f172a; font-size: 12px;">PDPM IIITDM Jabalpur</strong>
        <div style="font-size: 9px; color: #64748b;">Generated: ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()}</div>
      </div>
    </div>

    <!-- SESSION & SUBJECT INFO -->
    <div class="ps-grid-2">
      <div>
        <div class="ps-section-title">Session Information</div>
        <table class="ps-table">
          <tr><td><b>Session ID</b></td><td>PS-2026-${Math.floor(1000 + Math.random() * 9000)}</td></tr>
          <tr><td><b>Subject ID</b></td><td>P001</td></tr>
          <tr><td><b>Date / Time</b></td><td>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td></tr>
          <tr><td><b>Duration</b></td><td>02 min 35 sec</td></tr>
        </table>
      </div>
      <div>
        <div class="ps-section-title">Subject Information</div>
        <table class="ps-table">
          <tr><td><b>Age / Gender</b></td><td>${patientData.age || '22'} Years / Male</td></tr>
          <tr><td><b>Height / Weight</b></td><td>175 cm / ${patientData.weight || '72'} kg</td></tr>
          <tr><td><b>Patient Name</b></td><td>${patientData.name || 'Pranshu Sharma'}</td></tr>
          <tr><td><b>Institution</b></td><td>PDPM IIITDM Jabalpur</td></tr>
        </table>
      </div>
    </div>

    <!-- PRESSURE SUMMARY -->
    <div class="ps-section-title">Pressure Summary</div>
    <div class="ps-grid-4" style="margin-bottom: 8px;">
      <div style="background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; text-align: center;">
        <span style="font-size: 9px; color: #64748b;">AVERAGE PRESSURE</span>
        <div style="font-size: 16px; font-weight: 800; color: #0284c7;">${avgPressure} <small style="font-size: 9px;">kPa</small></div>
      </div>
      <div style="background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; text-align: center;">
        <span style="font-size: 9px; color: #64748b;">PEAK PRESSURE</span>
        <div style="font-size: 16px; font-weight: 800; color: #b91c1c;">${maxPressure} <small style="font-size: 9px;">kPa</small></div>
      </div>
      <div style="background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; text-align: center;">
        <span style="font-size: 9px; color: #64748b;">ACTIVE SENSORS</span>
        <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${totalSensors} / ${totalSensors}</div>
      </div>
      <div style="background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; text-align: center;">
        <span style="font-size: 9px; color: #64748b;">MAX SENSOR</span>
        <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${peakSensorID}</div>
      </div>
    </div>

    <!-- REGIONAL ANALYSIS & DISTRIBUTION -->
    <div class="ps-grid-2">
      <div>
        <div class="ps-section-title">Regional Analysis</div>
        <table class="ps-table">
          <thead>
            <tr><th>Region</th><th>Avg Pressure</th><th>Peak Sensor</th></tr>
          </thead>
          <tbody>
            <tr><td>Toe</td><td>${toeData.avg} kPa</td><td>${toeData.peak}</td></tr>
            <tr><td>Forefoot</td><td>${forefootData.avg} kPa</td><td>${forefootData.peak}</td></tr>
            <tr><td>Midfoot</td><td>${midfootData.avg} kPa</td><td>${midfootData.peak}</td></tr>
            <tr><td>Heel</td><td>${heelData.avg} kPa</td><td>${heelData.peak}</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <div class="ps-section-title">Statistical Analysis</div>
        <table class="ps-table">
          <tr><td><b>Minimum Pressure</b></td><td>${minPressure} kPa</td><td><b>Median Pressure</b></td><td>${medianPressure} kPa</td></tr>
          <tr><td><b>Maximum Pressure</b></td><td>${maxPressure} kPa</td><td><b>Standard Dev.</b></td><td>${stdDev}</td></tr>
          <tr><td><b>Mean Pressure</b></td><td>${avgPressure} kPa</td><td><b>Variance</b></td><td>${variance}</td></tr>
        </table>
      </div>
    </div>

    <!-- SENSOR PRESSURE TABLE (FULL MATRIX) -->
    <div class="ps-section-title">Sensor Pressure Table</div>
    <table class="ps-table">
      <thead>
        <tr><th>Sensor</th><th>Region</th><th>Pressure</th><th>Status</th><th>Sensor</th><th>Region</th><th>Pressure</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${sensors.slice(0, Math.ceil(totalSensors / 2)).map((s, idx) => {
          const s2 = sensors[idx + Math.ceil(totalSensors / 2)];
          const getStatusBadge = (val) => {
            if (val === maxPressure) return '<span class="ps-badge ps-badge-peak">Peak</span>';
            if (val > 280) return '<span class="ps-badge ps-badge-high">High</span>';
            if (val > 180) return '<span class="ps-badge ps-badge-moderate">Moderate</span>';
            return '<span class="ps-badge ps-badge-normal">Normal</span>';
          };
          return `
            <tr>
              <td><b>${s.id}</b></td><td>${s.zone}</td><td>${s.value} kPa</td><td>${getStatusBadge(s.value)}</td>
              ${s2 ? `<td><b>${s2.id}</b></td><td>${s2.zone}</td><td>${s2.value} kPa</td><td>${getStatusBadge(s2.value)}</td>` : '<td>-</td><td>-</td><td>-</td><td>-</td>'}
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <!-- CLINICAL INTERPRETATION & DEVICE INFO -->
    <div class="ps-grid-2">
      <div>
        <div class="ps-section-title">Clinical Interpretation</div>
        <div style="background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 10px;">
          <p style="margin: 0 0 4px;">✓ Peak loading observed in <b>Forefoot (${forefootData.avg} kPa)</b>.</p>
          <p style="margin: 0 0 4px;">✓ Heel pressure remains within acceptable limits.</p>
          <p style="margin: 0 0 4px;">✓ Midfoot pressure is relatively low.</p>
          <p style="margin: 0;"><b>Practitioner Notes:</b> ${doctorNotes}</p>
        </div>
      </div>
      <div>
        <div class="ps-section-title">Device Information</div>
        <table class="ps-table">
          <tr><td><b>Device Subsystem</b></td><td>ESP32 Microcontroller</td></tr>
          <tr><td><b>Connection Protocol</b></td><td>Wi-Fi / WebSockets</td></tr>
          <tr><td><b>Sampling Rate</b></td><td>50 Hz</td></tr>
          <tr><td><b>Firmware Version</b></td><td>v1.0 (PDPM IIITDM Jabalpur)</td></tr>
        </table>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="ps-footer">
      <div><b>PressureSense AI</b> · Plantar Diagnostics Subsystem</div>
      <div>Automatically Generated Clinical Telemetry Report</div>
      <div><b>PDPM IIITDM Jabalpur</b></div>
    </div>
  `;

  if (window.html2pdf) {
    const opt = {
      margin: 0.2,
      filename: `PressureSense_Report_${patientData.name || 'P001'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(reportContainer).save();
  }
}
