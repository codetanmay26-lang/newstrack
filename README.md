# NewsTrack

> AI-driven media intelligence platform for extracting, analyzing, and visualizing journalist and outlet data in real-time  

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styled%20with-Tailwind-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Puppeteer](https://img.shields.io/badge/Web%20Scraping-Puppeteer-40B5A4?style=flat-square&logo=google-chrome)](https://pptr.dev/)
[![Cheerio](https://img.shields.io/badge/DOM%20Parser-Cheerio-FCA121?style=flat-square&logo=javascript)](https://cheerio.js.org/)

---

## ▸ Overview

**NewsTrack** is a self-contained, dual-mode web intelligence platform that extracts journalists, newsroom metadata, and editorial insights from any online publication — small or large — without relying on paid APIs or third-party services.

The platform combines **Puppeteer (for dynamic rendering)** and **Cheerio (for static HTML parsing)** to identify verified journalist profiles, publication hierarchies, and outlet authenticity in real time.

---

### ▸ Problem Statement

- Journalistic credibility is hard to verify at scale  
- Manual scraping of authorship and article lineage is inefficient  
- News bias and media transparency lack data analytics support  
- APIs from news aggregators are either paid or restricted

---

## ▸ Key Features

🔹 **Smart Journalist Detection** — Auto-identifies authors and bylines from any outlet  
🔹 **Self-contained Dual-engine Scraper** — Combines Puppeteer + Cheerio (no APIs)  
🔹 **Fake Website Filter** — Stops on mock data or fake domains  
🔹 **Real-time Data Visualization** — Interactive dashboard with sections and stats  
🔹 **No External APIs** — 100 % local scraper following project PS rules  
🔹 **Adaptive Crawl** — Detects dynamic SPAs like NDTV or Aaj Tak automatically  
🔹 **Multi‑Stage Analysis** — Journalist statistics, clustering, topic intelligence  
🔹 **Error‑aware Workflow** — Displays live status feed and progress per stage  

---

## ▸ Tech Stack

| Layer | Tools / Libraries |
|-------|-------------------|
| **Frontend** | React 18 + Vite + TailwindCSS |
| **Backend** | Node.js, Express, Puppeteer, Cheerio, Axios |
| **Analysis** | Local algorithms (JS) for journalist statistics / topic segmentation |
| **Visualization** | D3.js, Recharts (for graph & relationship mapping) |
| **Styling** | TailwindCSS + Custom Gradients |
| **Routing** | React Router v6 |
| **Icons** | Lucide‑React (+ dynamic visual status icons) |
| **Other** | ESLint, PostCSS, Autoprefixer, Axios, date‑fns |
| **Scraper Engine** | Puppeteer (Chromium) + Cheerio DOM Parser (static HTML) |

---

## ▸ Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Chromium auto‑downloaded by Puppeteer (≈ 100 MB)

---

## ▸ Installation Steps

1. **Install dependencies**
```sh
npm install
npm install react react-dom react-router-dom lucide-react
npm install --save-dev @types/react @types/react-dom @types/react-router-dom
npm install express puppeteer cors concurrently
npm install sqlite3
npm install puppeteer
npm install puppeteer cheerio axios
```
2. **Run the backend**
```sh
node backend/server.js 
```
3. **Run the frontend**
```sh
npm run dev
```

---

## ▸ Usage Workflow

1. **Enter an outlet name** (e.g., NDTV, Aaj Tak, The Hindu)  
2. The system **detects its official URL** automatically  
3. If website is valid → starts staged scraping:  
- Detect website  
- Extract journalist metadata  
- Analyze data  
- Build network graph  
- Visualize & export results  
4. If no authors found → shows "No Live Data" on same Processing page  

---

## ▸ Demo / Data Policies

**Scraping mode:** demonstration only — no internal caching, no data sharing.  
- **Persistence**: Session‑based using `sessionStorage` in browser  
- **Privacy:** No data stored server‑side, fully ephemeral  
- **Mock Data Rule:** If mock dataset is used → process stops, no display of fake entries  
- **For Testing:** Use outlets like `NDTV`, `News18`, `The Hindu`, `Aaj Tak`

---

## ▸ Folder Structure

```
newstrack-main
├─ backend
│  ├─ advancedScraper.js
│  ├─ database.js
│  ├─ newstrack.db
│  ├─ nlp.js
│  └─ server.js
├─ bun.lockb
├─ components.json
├─ eslint.config.js
├─ index.html
├─ journalists.db
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ favicon.ico
│  ├─ placeholder.svg
│  └─ robots.txt
├─ README.md
├─ src
│  ├─ App.css
│  ├─ App.tsx
│  ├─ assets
│  │  └─ hero-network.jpg
│  ├─ components
│  │  ├─ AnalyticsTab.tsx
│  │  ├─ ComparisonTab.tsx
│  │  ├─ DataTable.tsx
│  │  ├─ JournalistCard.tsx
│  │  ├─ NetworkGraph.tsx
│  │  ├─ StatsCard.tsx
│  │  └─ ui
│  │     ├─ accordion.tsx
│  │     ├─ alert-dialog.tsx
│  │     ├─ alert.tsx
│  │     ├─ aspect-ratio.tsx
│  │     ├─ avatar.tsx
│  │     ├─ badge.tsx
│  │     ├─ breadcrumb.tsx
│  │     ├─ button.tsx
│  │     ├─ calendar.tsx
│  │     ├─ card.tsx
│  │     ├─ carousel.tsx
│  │     ├─ chart.tsx
│  │     ├─ checkbox.tsx
│  │     ├─ collapsible.tsx
│  │     ├─ command.tsx
│  │     ├─ context-menu.tsx
│  │     ├─ dialog.tsx
│  │     ├─ drawer.tsx
│  │     ├─ dropdown-menu.tsx
│  │     ├─ form.tsx
│  │     ├─ hover-card.tsx
│  │     ├─ input-otp.tsx
│  │     ├─ input.tsx
│  │     ├─ label.tsx
│  │     ├─ menubar.tsx
│  │     ├─ navigation-menu.tsx
│  │     ├─ pagination.tsx
│  │     ├─ popover.tsx
│  │     ├─ progress.tsx
│  │     ├─ radio-group.tsx
│  │     ├─ resizable.tsx
│  │     ├─ scroll-area.tsx
│  │     ├─ select.tsx
│  │     ├─ separator.tsx
│  │     ├─ sheet.tsx
│  │     ├─ sidebar.tsx
│  │     ├─ skeleton.tsx
│  │     ├─ slider.tsx
│  │     ├─ sonner.tsx
│  │     ├─ switch.tsx
│  │     ├─ table.tsx
│  │     ├─ tabs.tsx
│  │     ├─ textarea.tsx
│  │     ├─ toast.tsx
│  │     ├─ toaster.tsx
│  │     ├─ toggle-group.tsx
│  │     ├─ toggle.tsx
│  │     ├─ tooltip.tsx
│  │     └─ use-toast.ts
│  ├─ hooks
│  │  ├─ use-mobile.tsx
│  │  └─ use-toast.ts
│  ├─ index.css
│  ├─ lib
│  │  ├─ mockData.ts
│  │  └─ utils.ts
│  ├─ main.tsx
│  ├─ pages
│  │  ├─ About.tsx
│  │  ├─ Dashboard.tsx
│  │  ├─ Documentation.tsx
│  │  ├─ Index.tsx
│  │  ├─ Landing.tsx
│  │  ├─ NotFound.tsx
│  │  └─ Processing.tsx
│  ├─ services
│  │  ├─ analysis.ts
│  │  └─ scraper.ts
│  └─ vite-env.d.ts
├─ tailwind.config.ts
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
└─ vite.config.ts
```

---

## ▸ Achievements

- Implements **self-contained web intelligence** under PS restrictions  
- Handles *any* media outlet — large or regional — uniformly  
- Built fully modular (front / back) with real time progress stages  
- Enables **AI‑driven journalist & outlet analytics** roadmap  

---

## ▸ Acknowledgments

- React and Vite communities  
- Puppeteer & Cheerio maintainers  
- Open‑source media intelligence contributors  
- Project PS innovation jury & examiner community  

---

<div align="center">

**NewsTrack — Transforming Media Transparency with AI**  
<br>
Made with ❤️ by CivicMinds

</div>

