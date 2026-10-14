# Bonsoir — Frontend

React + TypeScript + Vite + Bootstrap. Runs without the backend (temporary local data until the Laravel API is connected).

## Run locally (VS Code)

1. Open this folder in VS Code (File → Open Folder… → `bonsoir-frontend`).
2. Open the terminal (Terminal → New Terminal).
3. First time only:  `npm install`
4. Start:            `npm run dev`  → opens http://localhost:5173
5. Type check:       `npm run typecheck`

## Folder structure

```
src/
  app/          App shell and routing
  assets/brand/ Official Bonsoir logo
  assets/hero/  Welcome hero photos (mobile and wide sizes)
  components/   Reusable UI (brand/, menu/, admin/ …)
  config/       Routes and fixed site content
  hooks/        Reusable React hooks
  mocks/        Temporary menu data from the approved PDF
  pages/        public/ and admin/ screens
  services/     Data access — mock now, Laravel REST API later
  styles/       Design tokens (theme.css) and global styles
  types/        Shared TypeScript types
  utils/        Small helpers (e.g. formatPrice)
```

## Pending content
- Welcome message wording → `src/config/siteContent.ts` (`welcomeMessage`).
- Item descriptions marked `null` → `src/mocks/menuData.ts` (Lemonade, Delster, Tiramisu, Lemon & Mint Shisha).
