# BigQuery Release Notes Portal

A modern, highly responsive web application built with **Python Flask** and **plain vanilla HTML, CSS, and JavaScript** that fetches, parses, and visualizes the official Google BigQuery RSS release notes feed.

## 🚀 Features

- **Automated Atom parsing**: Parses the Atom XML feed into structured JSON groupings.
- **Categorization & Splitting**: Splitting release items into clear categories like **Features**, **Issues**, **Announcements**, and **Deprecations** (rather than lump-sum formatting).
- **Client-Side Analytics Summary**: Sidebar displays instant counts of features, issues, and announcements.
- **High-Performance caching**: Memory cache with a 5-minute TTL reduces loading times and Google Cloud server fetch rates, falling back gracefully to cache if the network fails.
- **Advanced UI Filtering**:
  - **Live search**: Instantly filters releases by titles, details, categories, and dates.
  - **Category tags**: Toggle display for specific note types with count badges on each filter button.
  - **Timeframe presets**: Quickly filter releases from the Last 30 Days, Last 90 Days, or All Time.
- **Interactive Layout Toggles**:
  - **Timeline view**: A gorgeous vertical gradient dotted line representing release chronology.
  - **Grid Cards**: A clean dashboard grid layout for side-by-side comparison of recent notes.
- **Premium Aesthetics**: Designed with glassmorphism panels, CSS blur gradient background blobs, custom animations, custom scrollbars, and full responsiveness.
- **External target link formatting**: Ensures all inline links open in a new tab safely with `rel="noopener noreferrer"`.

## 📁 Directory Structure

```text
bq-releases-notes/
├── .venv/                 # Python Virtual Environment
├── static/
│   ├── app.js             # Client application logic (state, filter, search, render)
│   └── style.css          # Design tokens, layouts (timeline, cards), and animation styles
├── templates/
│   └── index.html         # Main dashboard layout structure
├── app.py                 # Flask server, cache system, and XML BS4 parser
├── requirements.txt       # Python dependencies (Flask, requests, beautifulsoup4)
└── README.md              # Project documentation
```

## 🛠️ Setup & Running Instructions

1. **Prerequisites**: Ensure you have Python 3.10+ installed.
2. **Terminal setup**:
   - Navigate to the project folder:
     ```powershell
     cd "D:\Kaggle\Intensive Vibe Coding\Day_2\agy-cli-projects\bq-releases-notes"
     ```
   - If not already done, activate the virtual environment:
     ```powershell
     # Windows PowerShell
     .venv\Scripts\Activate.ps1
     ```
3. **Run the Server**:
   - Launch Flask:
     ```powershell
     python app.py
     ```
4. **Access the Portal**:
   - Open your browser and navigate to: [http://127.0.0.1:5000](http://127.0.0.1:5000)

## ⚡ Keyboard Shortcuts
- Press `/` to focus the search box instantly.
- Press `ESC` to blur the search box.
