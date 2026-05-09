# 📍 LNCT Smart Campus Navigator

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

A high-fidelity, "Google-Maps-grade" Progressive Web App (PWA) specifically designed for the **Lakshmi Narain College of Technology (LNCT) Bhopal Campus**. This platform provides advanced real-time navigation, smart search, and a premium interactive experience for students and faculty.

---

## ✨ Key Features

- **🌐 Precision Map Experience**: Custom-styled Leaflet map with support for **Street**, **Satellite**, and **Dark Matter** views.
- **🛰️ Smart Geo-Fencing**: Automatic boundary-aware navigation logic that respects the 1.5km campus radius.
- **📡 Real-Time Tracking**: GPS-driven location tracking with hardware-accelerated device orientation (compass support).
- **🏢 Deep Search Engine**: Instant search across 75+ buildings, labs, and shortcuts using Supabase fuzzy matching.
- **📱 PWA Installation**: Native-like app experience with offline tile caching and high-performance rendering.
- **🎨 Modern Aesthetics**: Sophisticated glassmorphic UI, smooth motion transitions with Framer Motion, and dynamic theme switching.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19 + Vite |
| **Styling** | Tailwind CSS (v4) + Vanilla CSS |
| **State Management** | Zustand (with Persist Middleware) |
| **Database** | Supabase (PostgreSQL + PostGIS) |
| **Mapping** | Leaflet + React-Leaflet + Leaflet-Routing-Machine |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18.0 or higher)
- **Supabase Project** (URL and Anon Key)

### 2. Local Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd SmartLnctMap/client

# Install dependencies
npm install

# Configure Environment Variables
# Create a .env file in the client directory:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run in Development Mode
npm run dev
```

### 3. Database Initialization
To populate the map with the high-precision LNCT data:
1. Open your **Supabase SQL Editor**.
2. Run the query provided in [`sqlQuery.md`](./sqlQuery.md).
3. Follow the visual setup guide in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

---

## 🏗️ Architecture Overview

The application utilizes a **Modern Decoupled Architecture**:
- **Direct-to-Database**: The frontend communicates directly with Supabase via the official JS client, removing the need for an intermediate server.
- **Local Persistence**: User preferences (bookmarks, theme, last location) are persisted via Zustand's `localStorage` middleware.
- **Optimized Rendering**: Large map datasets are handled via `MarkerClusterGroup` and `preferCanvas: true` for 60FPS performance on mobile devices.

---

## 📦 Production & Deployment

To deploy for campus-wide testing:

1. **Build the project**:
   ```bash
   npm run build
   ```
2. **Deploy to Netlify/Vercel**:
   Upload the `client/dist` folder. Ensure **HTTPS** is enabled for GPS and PWA features.
3. **Configure Redirects**:
   A `_redirects` file is included in the `public` folder to ensure React Router works seamlessly on page refreshes.

---

## 📄 License & Credits

Built with ❤️ for **Lakshmi Narain College of Technology, Bhopal**.  
Designed for students, by Krishna Mohan Kumar Deo.

---
