<div align="center">

<img src="docs/class-d-logo.png" alt="Class D Hackathon Logo" width="220"/>

# 🎯 CLASS D HACKATHON

## Smart Check-In / Check-Out Attendance System

### 🚀 QR-Based • Real-Time • Secure • Scalable

<br>

<a href="https://check-in-check-out-nhav.onrender.com">
<img src="https://img.shields.io/badge/🚀_LIVE_DEMO-OPEN_APPLICATION-00C853?style=for-the-badge"/>
</a>

<a href="https://check-in-check-out-nhav.onrender.com/check-in">
<img src="https://img.shields.io/badge/📥_CHECK--IN-OPEN-00C853?style=for-the-badge"/>
</a>

<a href="https://check-in-check-out-nhav.onrender.com/check-out">
<img src="https://img.shields.io/badge/📤_CHECK--OUT-OPEN-2196F3?style=for-the-badge"/>
</a>

<a href="https://check-in-check-out-nhav.onrender.com/admin">
<img src="https://img.shields.io/badge/🛠️_ADMIN_PANEL-OPEN-FF9800?style=for-the-badge"/>
</a>

<br><br>

<a href="https://github.com/yogabalan07/check-in-check-out">
<img src="https://img.shields.io/badge/💻_SOURCE_CODE-GITHUB-181717?style=for-the-badge&logo=github"/>
</a>

<a href="https://check-in-out-s0r8.onrender.com/api/health">
<img src="https://img.shields.io/badge/⚙️_BACKEND-ONLINE-00C853?style=for-the-badge"/>
</a>

</div>

---

# 📑 Table of Contents

- [Project Overview](#-project-overview)
- [About The Project](#-about-the-project)
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Main Access Points](#-main-access-points)
- [System Flowchart](#-system-flowchart)
- [Participant Flowchart](#-participant-flowchart)
- [Check-In Flowchart](#-check-in-flowchart)
- [Check-Out Flowchart](#-check-out-flowchart)
- [Admin Flowchart](#-admin-flowchart)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Admin Features](#-admin-panel-features)
- [Participant Workflow](#-participant-workflow)
- [Attendance Management](#-attendance-management)
- [QR System](#-dynamic-qr-system)
- [Security](#-security)
- [Concurrency](#-concurrency-and-safety)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Live Links](#-live-links--repository)
- [Developer](#-developer-information)

---

# 📸 Project Overview

<div align="center">

<img src="docs/class-d-logo.png" alt="Class D Hackathon Logo" width="650"/>

</div>

---

# 🧠 About The Project

The **Class D Hackathon Smart Check-In / Check-Out Attendance System** is a complete web-based attendance management platform designed to replace traditional manual attendance methods during hackathons, technical events, workshops, seminars, and other large-scale events.

The system uses **QR-based attendance**, allowing participants to quickly check in and check out using their mobile devices.

The platform also provides administrators with a centralized dashboard to monitor attendance, manage participants, configure QR stations, and generate reports.

---

# ❗ Problem Statement

Traditional attendance methods create several problems during large events:

- Long queues at entrance gates
- Manual register maintenance
- Duplicate attendance entries
- Incorrect timestamps
- Difficulty tracking participants
- Difficulty identifying late arrivals
- Difficulty identifying early departures
- Manual calculation of attendance
- Time-consuming report generation
- Difficulty handling hundreds of participants simultaneously

---

# 💡 Solution

The proposed system provides a **QR-based digital attendance platform**.

Instead of manually writing attendance:

```text
Participant
     │
     ▼
Scan QR Code
     │
     ▼
Enter Registration Number
     │
     ▼
System Validates Participant
     │
     ▼
Attendance Recorded
     │
     ▼
Real-Time Admin Dashboard
