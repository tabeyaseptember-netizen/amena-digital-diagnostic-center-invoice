import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initDB, initDefaultTests, recoverPendingWrites, startAutoBackup } from "./lib/db";
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('🔄 New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('✅ App ready to work offline');
  },
});

// Initialize database with strict persistence
initDB()
  .then(async () => {
    console.log("✅ Database connected - checking for recovery");
    
    // Recover any pending writes from WAL
    await recoverPendingWrites();
    console.log("✅ Pending writes recovered");
    
    // Initialize default tests if needed
    await initDefaultTests();
    console.log("✅ Default tests initialized");
    
    // Start auto-backup system
    startAutoBackup();
    console.log("✅ Auto-backup system started (24h interval)");
    
    // Display persistence warning
    console.log("%c⚠️ DATA PERSISTENCE ACTIVE", "color: green; font-weight: bold; font-size: 16px;");
    console.log("%cYour data is stored locally and NEVER deleted automatically.", "color: green;");
    console.log("%cData will only erase if YOU manually clear browser storage.", "color: green;");
  })
  .catch((error) => {
    console.error("❌ Failed to initialize database:", error);
    alert("Failed to initialize database. Please refresh the page.");
  });

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
