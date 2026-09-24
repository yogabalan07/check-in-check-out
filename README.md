<div align="center">

<img src="docs/class-d-logo.png" alt="Class D Hackathon Logo" width="220"/>

# 🎯 CLASS D HACKATHON

## Smart Check-In / Check-Out Attendance System

### 🚀 QR-Based • Real-Time • Secure • Scalable

<br>

<a href="https://check-in-check-out-nhav.onrender.com">
<img src="https://img.shields.io/badge/🚀_LIVE_APPLICATION-OPEN-00C853?style=for-the-badge"/>
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
<img src="https://img.shields.io/badge/⚙️_BACKEND_API-ONLINE-00C853?style=for-the-badge"/>
</a>

</div>

---

# 📑 Table of Contents

- [About the Project](#-about-the-project)
- [Problem Statement](#-problem-statement)
- [Project Objectives](#-project-objectives)
- [How the System Works](#-how-the-system-works)
- [Complete Project Workflow](#-complete-project-workflow)
- [Participant Workflow](#-participant-workflow)
- [Check-In Workflow](#-check-in-workflow)
- [Check-Out Workflow](#-check-out-workflow)
- [Admin Workflow](#-admin-workflow)
- [System Flowchart](#-system-flowchart)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Frontend](#-frontend)
- [Backend](#-backend)
- [Database](#-database)
- [Security](#-security)
- [Main Features](#-main-features)
- [Admin Panel](#-admin-panel)
- [QR Attendance](#-qr-attendance)
- [Attendance Tracking](#-attendance-tracking)
- [Reports](#-reports)
- [Concurrency and Reliability](#-concurrency-and-reliability)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Live Website Links](#-live-website-links)
- [API Links](#-api-links)
- [Source Code](#-source-code)
- [Developer](#-developer)

---

# 🧠 About the Project

The **Class D Hackathon Smart Check-In / Check-Out Attendance System** is a web-based attendance management platform developed for managing participant attendance during hackathons, technical events, workshops, seminars, and other large-scale events.

The system replaces traditional manual attendance registers with a **QR-based digital check-in and check-out system**.

Participants can scan a QR code using their mobile phone, enter their registration number, and record their attendance.

Administrators can use the Admin Panel to:

- Manage participants
- Monitor attendance
- Configure check-in/check-out stations
- Track late arrivals
- Track early departures
- View real-time attendance statistics
- Search attendance records
- Export attendance reports

The system is designed to handle multiple participants accessing the attendance system simultaneously while maintaining consistent attendance records.

---

# ❗ Problem Statement

Traditional attendance systems can create several difficulties during large-scale events.

### Existing Problems

- Manual attendance takes more time.
- Long queues may form at entry and exit points.
- Paper registers can contain duplicate or incorrect entries.
- Manually recording timestamps is difficult.
- Identifying late participants requires additional work.
- Identifying early departures requires additional work.
- Searching old attendance records is time-consuming.
- Preparing final attendance reports requires manual processing.
- Managing hundreds of participants simultaneously can become difficult.

---

# 💡 Proposed Solution

This project provides a centralized digital attendance system using QR codes.

Instead of maintaining a paper attendance register:

```text
                PARTICIPANT
                     │
                     ▼
              📱 SCAN QR CODE
                     │
                     ▼
            🌐 OPEN WEB PAGE
                     │
                     ▼
       📝 ENTER REGISTRATION NUMBER
                     │
                     ▼
            🔍 VALIDATE PARTICIPANT
                     │
                     ▼
              💾 SAVE ATTENDANCE
                     │
                     ▼
             📊 ADMIN DASHBOARD
