# 📡 IP RADAR // Precision Geolocation & Telemetry

> High-speed IP intelligence and geolocation tracker. Runs as a standalone terminal CLI (`iptrack`) in Windows Terminal / CMD / Linux, and as a dark-mode radar cartography web application deployed on Vercel.

[![Live Web App](https://img.shields.io/badge/Live%20Demo-ip--tracker--murex--six.vercel.app-00f0ff?style=flat-square&logo=vercel)](https://ip-tracker-murex-six.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-10b981?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=flat-square)](LICENSE)

---

## 🌐 Live Web Application

Experience the full interactive radar map and live telemetry dashboard:  
👉 **[https://ip-tracker-murex-six.vercel.app](https://ip-tracker-murex-six.vercel.app)**

Pass any IP directly into the browser URL:
- `https://ip-tracker-murex-six.vercel.app/8.8.8.8`
- `https://ip-tracker-murex-six.vercel.app/1.1.1.1`

---

## ⚡ Terminal CLI (`iptrack`)

Install once and query any IP or domain directly from **Windows Terminal**, **Command Prompt (CMD)**, **PowerShell**, or **macOS / Linux**:

```bash
# Clone and link globally
git clone https://github.com/youssef-110/ip-tracker.git
cd ip-tracker
npm install -g .
```

### Usage:

```bash
# 1. Track any IP or domain name
iptrack 8.8.8.8
iptrack 1.1.1.1
iptrack github.com

# 2. Track your own public connection IP
iptrack

# 3. Output machine-readable JSON
iptrack 8.8.8.8 --json
```

### Terminal Output Preview:

```text
┌──────────────────────────────────────────────────────────┐
│  IP RADAR // TELEMETRY REPORT                            │
├──────────────────────────────────────────────────────────┤
│  Target IP        8.8.8.8                                │
│  Location         Ashburn, Virginia, United States 🇺🇸    │
│  Postal Code      20149                                  │
│  Coordinates      39.03, -77.5                           │
│  Timezone         America/New_York (Nov 11, 6:34 AM)     │
│  ISP              Google LLC                             │
│  Organization     Google Public DNS                      │
│  ASN              AS15169 Google LLC                     │
│  Query Latency    6 ms                                   │
│  Maps Link        https://www.google.com/maps?q=39.03,-77.5
└──────────────────────────────────────────────────────────┘
  Live Web UI: https://ip-tracker-murex-six.vercel.app/?ip=8.8.8.8
  Curl query:  curl https://ip-tracker-murex-six.vercel.app/8.8.8.8
```

---

## 🚀 Zero-Install `curl` Endpoint

If you are on a remote server or don't have Node installed, query the live deployment directly via standard CLI tools:

```bash
# Formatted ANSI / ASCII report
curl https://ip-tracker-murex-six.vercel.app/8.8.8.8

# Your own public IP report
curl https://ip-tracker-murex-six.vercel.app/api/lookup

# Pure JSON response
curl -H "Accept: application/json" https://ip-tracker-murex-six.vercel.app/api/lookup?ip=8.8.8.8
```

PowerShell:
```powershell
irm https://ip-tracker-murex-six.vercel.app/8.8.8.8
```

---

## ✨ Features

- **Interactive Dark Cartography**: Precision Leaflet map embedded with CartoDB Dark Matter tiles and a customized pulsing radar pin.
- **Autonomous System (ASN) & ISP Intelligence**: Identifies ISP, AS number, organization, metro city, region, and postal code.
- **Live Local Clock**: Automatically calculates and renders a real-time ticking digital clock synchronized to the target's timezone.
- **Instant Client IP Auto-Detection**: One-click **"MY IP"** locator using serverless edge headers.
- **Search History Shelf**: Retains recent lookups in `localStorage` for quick 1-click recall chips.
- **Content-Negotiation Engine**: The same URL seamlessly serves rich interactive HTML to web browsers and formatted ASCII cards to `curl` / CLI clients.
- **Dual Geolocation Fallback**: Queries primary high-resolution endpoint with transparent failover to secondary providers.

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js 20+ (ES Modules, native `fetch`)
- **Backend / Edge**: Vercel Serverless Functions (`api/lookup.js`)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (zero heavy framework overhead)
- **Map Engine**: [Leaflet.js](https://leafletjs.com/) with CartoDB Dark Matter tiles
- **Deployment**: Vercel

---

## 📄 License

MIT © [Youssef](https://github.com/youssef-110)
