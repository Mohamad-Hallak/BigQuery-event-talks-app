# 🚀 BigQuery Release Notes Portal

A modern, highly responsive web application dashboard that fetches, parses, structures, and visualizes the official Google Cloud BigQuery RSS/Atom release notes feed. Built using **Python Flask** for the backend parser/server, and **vanilla HTML, CSS, and JavaScript** for the client-side experience.

---

## ✨ Features

### 📡 Server-Side Parsing & Caching
- **Automated Atom parsing**: Downloads and parses the live Atom XML feed into structured JSON groupings sorted by release dates.
- **Micro-Categorization**: Employs `BeautifulSoup4` to dissect inline HTML blocks, splitting complex updates into separate categories: **Features**, **Announcements**, **Issues**, and **Deprecations**.
- **Smart In-Memory Caching**: Implements a 5-minute (300 seconds) cache TTL to reduce external network calls and enhance loading performance.
- **Graceful Error Recovery**: Automatically falls back to serving cached releases if the official Google feed is temporarily unreachable.
- **URL Sanitization**: Automatically converts relative URLs in release notes to absolute paths pointing to Google Cloud documentation and enforces `target="_blank"` for safe, external browsing.

### 🎨 Client-Side Dashboard
- **Instant Live Search**: Search titles, specific release details, categories, or release dates in real-time.
- **Interactive Filtering Badges**: Toggle updates by specific categories with live count badges displaying the current total of items.
- **Timeframe presets**: Select and limit releases to the Last 30 Days, Last 90 Days, or view All Time releases.
- **Dual Presentation Layouts**:
  - **Timeline View**: Chronological vertical flow with customized gradient connectors.
  - **Grid Cards View**: Dashboard-style cards arranged side-by-side.
- **Premium Styling & Micro-animations**: Glassmorphism cards, blurred background glow blobs, responsive page designs, and smooth list entrance animations.

---

## 📂 Directory Structure

```text
bq-releases-notes/
├── .venv/                 # Python Virtual Environment
├── static/
│   ├── app.js             # Client application logic (state, filter, search, rendering)
│   └── style.css          # Design system tokens, timeline/card layouts, and CSS animations
├── templates/
│   └── index.html         # Dashboard template structure
├── app.py                 # Flask web server, XML/HTML parsing, and cache system
├── requirements.txt       # Dependencies (Flask, beautifulsoup4)
└── README.md              # Project documentation
```

---

## 🛠️ Setup & Execution

Follow these steps to run the application locally:

### 1. Prerequisites
- Python 3.10 or higher.
- Git client (optional).

### 2. Installation and Virtual Environment Setup
Open your terminal (PowerShell on Windows recommended) and navigate to the project directory:

```powershell
# Navigate to project directory
cd "D:\Kaggle\Intensive Vibe Coding\Day_2\agy-cli-projects\bq-releases-notes"

# Create a virtual environment (if not already present)
python -m venv .venv

# Activate the virtual environment
.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
```

### 3. Run the Development Server
Run the Flask application:

```powershell
python app.py
```

The server runs locally by default at:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## ⚡ Keyboard Shortcuts

To make navigation faster:
* Press `/` to focus the search box.
* Press `ESC` to clear your selection or search field.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, Flask 3.0.3, BeautifulSoup 4.12.3
- **Frontend**: Plain HTML5, CSS3 Custom Properties (Variables), Vanilla JavaScript (ES6)
- **Data Source**: [Google Cloud BigQuery Release Notes RSS Feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml)
