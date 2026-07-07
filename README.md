# StadiumIQ — FIFA World Cup 2026 AI Command Hub

StadiumIQ is a real-time smart stadium command center built for the FIFA World Cup 2026. It features AI-guided operations, real-time crowd heatmaps, accessibility routing, and incident reporting.

## 🚀 Live Demo

The frontend is deployed and hosted on GitHub Pages:
👉 **[https://mdevendra01.github.io/Prompt_wars4/](https://mdevendra01.github.io/Prompt_wars4/)**

---

## 🛠️ Architecture & Setup

This repository contains two main parts:
1. **`frontend`**: A Next.js (React) application configured for static HTML export and deployed to GitHub Pages.
2. **`backend`**: A Node.js/Express server using WebSockets (Socket.io) for real-time events and SQLite for storage.

### 1. Local Development Setup

To run both the frontend and backend locally in development mode:

1. Install all dependencies from the root directory:
   ```bash
   npm run install:all
   ```

2. Start the development servers (runs frontend on port 3000 and backend on port 3001 concurrently):
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend APIs: [http://localhost:3001](http://localhost:3001)

---

## ☁️ Deployment

### Frontend (GitHub Pages)
The frontend is automatically built and deployed via GitHub Actions whenever changes are pushed to the `main` branch. 
- Configuration: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- Deployment Settings: Configured to use GitHub Actions in the repository Pages settings.