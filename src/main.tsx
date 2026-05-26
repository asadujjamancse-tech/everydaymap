/**
 * main.tsx — Application Entry Point
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the very first file that runs when the browser loads the app.
 * It finds the <div id="root"> in index.html and mounts the React app into it.
 *
 * React.StrictMode: renders components twice in development to catch side-effect
 * bugs early — has no effect in production builds.
 *
 * index.css is imported here so Tailwind utilities + Leaflet map styles +
 * custom animations are available globally across every component.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'   // Tailwind base + Leaflet overrides + global keyframes

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
