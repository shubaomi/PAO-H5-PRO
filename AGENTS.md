# PAO-H5

Vue 3 memory training app using PAO method. Base path: `/braintranning/`

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Routes | `src/router/index.js` |
| Store | `src/store/index.js` |
| Main entry | `src/main.js` |
| Root component | `src/App.vue` |
| Global styles | `src/style.css` |

## KEY FILES

- `vite.config.js` - Vite with path alias `@`, base path `/braintranning/`, console preserved
- `package.json` - No external test configs, no TypeScript
- `src/store/index.js` - Poker store with actions + state
- `src/router/index.js` - 4 routes per training type (Settings, Memory, Reconstruct, Result)

## COMMANDS

```bash
npm run dev          # dev server at /braintranning/
npm run build        # production build to dist/
npm run preview      # preview production build
```

## ANTI-PATTERNS

- **Never suppress type errors** (no TS)
- **Never commit without explicit request**
- **No test files** (not configured)
- **Console logs preserved** in production (drop_console: false)

## STYLE

- **Mobile-first H5 app**
- **Chinese UI text**
- **No linting tools configured**
- **Scoped CSS only**
- **Composition API (script setup)**
