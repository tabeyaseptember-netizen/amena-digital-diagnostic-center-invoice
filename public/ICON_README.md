Place your PWA icons here

Files to add:
- `logo-192.png` — 192x192 PNG (maskable recommended)
- `logo-512.png` — 512x512 PNG (maskable recommended)

Steps:
1. Replace the placeholder files `logo-192.png` and `logo-512.png` in `public/` by dragging your PNG files into that folder (overwrite the placeholders).
2. Run the dev server:

```powershell
npm run dev
```

3. Open your app in Chrome/Edge at the dev URL (e.g., `http://localhost:5173`).
4. Open DevTools → Application → Manifest and ensure icons are listed.
5. DevTools → Application → Service Workers should show a registered worker.
6. If the install option still doesn't appear, Clear storage (Application → Clear storage) and reload.

Notes:
- For best results use PNGs with transparent background and a maskable-safe area (follow Google's maskable icon guidelines).
- Production builds require HTTPS for full installability (localhost is exempt).
