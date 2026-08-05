# 🦶 PressureSense

> Smart Insole for Real-Time Plantar Pressure Monitoring using ESP32 and the MERN Stack.

![GitHub](https://img.shields.io/badge/Project-PressureSense-blue)
![ESP32](https://img.shields.io/badge/ESP32-Hardware-red)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📖 Overview

PressureSense is an intelligent wearable healthcare system designed to continuously monitor plantar pressure using Force Sensitive Resistors (FSRs) embedded inside a smart insole.

The system collects pressure data through an ESP32 microcontroller, transmits it to a Node.js backend, processes the readings, and visualizes them on a web application as a real-time pressure heatmap.

The goal is to enable early detection of abnormal pressure distribution, improve gait analysis, and support preventive foot healthcare.

---

## ✨ Features

- 👣 Real-time plantar pressure monitoring
- 📡 Wireless ESP32 data transmission
- 🔥 Live pressure heatmap generation
- 📊 Pressure analytics
- 🌐 MERN Stack web application
- 📱 Responsive dashboard
- ⚡ Low latency communication
- 📈 Scalable architecture

---

# 🏗 System Architecture

```

Pressure Sensors
│
▼

ESP32

│

▼

Node.js Backend

│

▼

Data Processing

│

▼

React Dashboard

│

▼

Live Heatmap

```

---

# 🛠 Hardware

- ESP32 Development Board
- Force Sensitive Resistors (FSR)
- Analog Multiplexers
- Custom PCB
- Voltage Divider Network

---

# 💻 Software Stack

### Frontend

- React
- Vite
- HTML
- CSS
- JavaScript

### Backend

- Node.js
- Express.js

### Hardware

- ESP32
- Embedded C++

---

# 📂 Project Structure

```

PressureSense
│
├── client/
│ ├── src/
│ ├── public/
│ └── package.json
│
├── server/
│ ├── routes/
│ ├── controllers/
│ ├── package.json
│
└── README.md

```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/Pranshu0808/PressureSense.git
```

---

## Frontend

```bash
cd client
npm install
npm run dev
```

---

## Backend

```bash
cd server
npm install
npm start
```

---

# ⚙️ Working

1. Pressure sensors detect force applied on the foot.
2. ESP32 scans sensor values through multiplexers.
3. Data is transmitted to the backend.
4. Backend processes and calibrates readings.
5. React dashboard visualizes pressure as a live heatmap.

---

# 🎯 Applications

- Diabetic Foot Monitoring
- Gait Analysis
- Sports Performance
- Rehabilitation
- Orthotic Design
- Preventive Healthcare

---

# 🚀 Future Scope

- AI-based gait prediction
- Machine Learning analytics
- Mobile application
- Cloud storage
- BLE connectivity
- Personalized insole recommendations

---

# 👨‍💻 Contributors

- Kyada Nilkanth — Hardware & CAD Modeling
- Sakshi Bhatia — ESP32 Integration
- Pranshu Sharma — Backend & Simulation
- Ishika Shukla — Web UI/UX
- Wangchuk Gyatso — Data Analysis

---

# 📜 License

This project is developed for academic and research purposes.
