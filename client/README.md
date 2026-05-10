# 🎓 LNCT Smart Campus Navigator

[![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)](package.json)
[![Tech](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Supabase-orange.svg)](package.json)
[![PWA](https://img.shields.io/badge/PWA-Production%20Ready-green.svg)](vite.config.js)

**LNCT Smart Campus Navigator** is a high-performance, Google Maps-grade Progressive Web Application (PWA) designed specifically for the Lakshmi Narain College of Technology (LNCT) campus. It provides precision indoor and outdoor navigation, real-time campus events, and a rich, interactive map experience.

---

## 🗺️ Table of Contents
- [Core Features](#-core-features)
- [Map Systems](#-map-systems)
- [Navigation Engine](#-navigation-engine)
- [Technology Stack](#-technology-stack)
- [PWA Capabilities](#-pwa-capabilities)
- [Data Architecture](#-data-architecture)
- [Installation & Development](#-installation--development)
- [Team](#-team)

---

## ✨ Core Features

### 1. Precision Map Interface
- **Vibrant View**: High-fidelity custom road network with asphalt styling and dashed lane markings.
- **Multi-Layer Support**: Switch between Street, Satellite, Vibrant, and Dark mode views.
- **Smart Clustering**: Efficient rendering of hundreds of campus landmarks using MarkerClusterGroup.
- **Building Details**: Interactive polygons and custom icons for departments, auditoriums, hostels, and sports grounds.

### 2. Advanced Navigation
- **Dual Routing Engine**: 
  - **Online**: Integrated Leaflet Routing Machine for real-world road access.
  - **Offline (A*)**: Custom graph-based A-Star navigation for pedestrian-only campus shortcuts.
- **GPS & Compass**: Real-time location tracking with hardware-accelerated auto-rotation and heading synchronization.
- **Smart Search**: Categorized search for Academic blocks, Hostels, Canteens, and nearby amenities.

### 3. Campus Ecosystem
- **Live Events**: Real-time synchronization with Supabase for campus workshops, hackathons, and seminars.
- **Weather Integration**: Live campus weather updates using the Open-Meteo API.
- **Bookmarks**: Save frequently visited locations for one-tap navigation.

---

## 🎨 Map Systems

The PWA features 4 distinct map styles tailored for different conditions:
- **Vibrant**: Optimized for visibility with custom road surfaces (CyclOSM base).
- **Street**: Clean, minimalist Voyager tiles for quick orientation.
- **Satellite**: High-resolution Esri World Imagery for real-world visual reference.
- **Dark Matter**: Sophisticated dark mode tiles for comfortable nighttime navigation.

---

## ⚙️ Navigation Engine

The system uses a **Hybrid Graph Architecture**:
- **Graph Topology**: Over 1,000+ nodes and edges defining the pedestrian network.
- **Dynamic Snapping**: Automatically bridges local production data with remote database updates at runtime.
- **Instruction Generator**: Converts mathematical coordinates into human-readable directions (e.g., "Turn left near the Bus Stand").

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite |
| **State Management** | Zustand (with Persist Middleware) |
| **Maps** | Leaflet, React-Leaflet, Leaflet-Rotate |
| **Animations** | Framer Motion |
| **Styling** | Tailwind CSS (V4) |
| **Backend/DB** | Supabase (PostgreSQL, Realtime) |
| **Icons** | Lucide React |

---

## 📱 PWA Capabilities

Designed as a mobile-first application:
- **Offline Ready**: Full service worker implementation (Workbox) for offline map access.
- **Native Experience**: Standalone display mode with custom splash screens and theme-color integration.
- **Installable**: Full manifest support for "Add to Home Screen" functionality on iOS and Android.
- **Performance**: Edge-cached assets and lazy-loaded map components for sub-second load times.

---

## 🏗️ Data Architecture

- **`campusProductionData.js`**: High-fidelity geo-coordinates for all buildings, paths, and boundaries.
- **`campusGraph.js`**: Structural graph nodes and edges for the navigation algorithm.
- **Supabase Sync**: Dynamic fetching and merging of new features to ensure the map stays up-to-date without app updates.

---

## 🚀 Installation & Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Deo-Mohan/LNCT-NAV.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```
4. Run Development Server:
   ```bash
   npm run dev
   ```

---

## 👥 Team

- **Krishna Mohan** - Lead Developer
- **Ramendra Singh** - Backend Architect
- **Ravi Singh** - UI/UX Engineer
- **Navneet Raj** - Frontend Specialist

---

© 2026 LNCT Smart Campus. Built with ❤️ for the students of LNCT.
