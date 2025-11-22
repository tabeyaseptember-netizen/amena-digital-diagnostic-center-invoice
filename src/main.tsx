import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initDB, initDefaultTests, recoverPendingWrites, startAutoBackup } from "./lib/db";

// Get root element
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

// Create root
const root = createRoot(rootElement);

// Initialize database and render app
(async () => {
  try {
    console.log("🔄 Initializing application...");
    
    // Initialize database with strict persistence
    await initDB();
    console.log("✅ Database connected");
    
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
    
    // Now render the app
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log("✅ Application rendered successfully");
  } catch (error) {
    console.error("❌ Failed to initialize application:", error);
    
    // Render error message
    root.render(
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem'
      }}>
        <h1 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Failed to Initialize Application
        </h1>
        <p style={{ color: '#6b7280' }}>
          Please refresh the page to try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '0.5rem 1rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }
})();
