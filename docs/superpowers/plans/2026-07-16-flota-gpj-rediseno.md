# Flota GPJ Rediseño — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar 1:1 el rediseño visual "Flota GPJ Rediseño" (mockup en claude.ai/design, proyecto `995d6e01-c11b-4739-a6c7-a67a0e61a63e`, archivo `Flota GPJ Rediseño.dc.html`) a las 18 pantallas reales de la app — nueva tipografía (Barlow/Barlow Condensed/IBM Plex Mono), nueva paleta ámbar cálida, layout de sidebar colapsable + header (reemplaza la barra superior actual), y el reskin de cada página. Donde un componente del proyecto original no tiene pantalla equivalente en el mockup, se adapta al nuevo lenguaje visual en vez de eliminarse.

**Architecture:** El 90% del reskin se logra cambiando los *valores* de las variables CSS (`--color-*`) y clases utilitarias globales (`.stat-card`, `.badge`, `.btn-primary`, `.btn-ghost`, `.input-field`, `.table-container`, `.modal-overlay/.modal-content`, `.glass-panel`) en `frontend/src/index.css` — los NOMBRES no cambian, así que cualquier página que ya los use se re-pinta sola. El resto son: (a) un cambio estructural único en `MainLayout.tsx` (top-navbar → sidebar+header), (b) reemplazo mecánico de literales de color azul/índigo hardcodeados (`#6384ff`, `rgba(99,132,255,...)`, etc.) por sus equivalentes ámbar, y (c) ajustes puntuales por pantalla donde el mockup difiere estructuralmente de lo ya implementado.

**Tech Stack:** React 19 + TypeScript + Tailwind + Vitest/RTL (frontend, único lado tocado por este plan — no hay cambios de backend).

## Global Constraints

- **No inventar campos ni endpoints de backend.** Si el mockup muestra una columna/dato que no existe en la entidad real (p. ej. "Folio" en Mantenimiento, "Tipo" en Vehículos, "Taller" en Combustible), se omite o se deriva 100% en cliente desde datos ya disponibles — nunca se agrega una migración nueva en este plan.
- **Preservar el 100% del comportamiento funcional existente**: queries/mutations (`useQuery`/`apiClient`), `ConfirmDialog`/`Modal`/`DataTable`/`useDataTable`, validaciones, permisos (`PermissionRoute`), toasts (`notifySuccess`/`notifyError`), calendarios reales (`react-big-calendar` vía `AllReservationsCalendar`/`VehicleAvailabilityCalendar`/`MobileCalendar`) y gráficas reales (`recharts`). Estos son pases de reskin/paridad estructural, no reescrituras de lógica de negocio.
- **Convención de tema ya vigente** (Sprint 2): variables CSS `var(--color-text)`, `var(--color-bg-soft)`, `var(--color-border)`, etc. — nunca clases Tailwind de color fijas (`bg-white`, `text-slate-900`).
- **Acento y sidebar fijos** (decisión de producto): un solo acento ámbar, sin selector de usuario; el sidebar siempre usa los tokens `--color-sidebar-*` (oscuros) sin importar el tema claro/oscuro general — no se implementa el selector "naranja/rojo" ni el modo "sidebar claro" del mockup.
- **Backend:** ninguno de los cambios de este plan toca `backend/`; no aplica rebuild de Docker. Frontend corre con `cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev` (Vite + HMR).
- **Verificación manual:** cada tarea incluye un paso de verificación en navegador en ambos temas (oscuro/claro vía el toggle existente).

---

### Task 1: Tipografía — swap de fuentes en `index.html`

**Files:**
- Modify: `frontend/index.html:7-13`

**Interfaces:** N/A.

- [ ] **Step 1: Reemplazar los enlaces de Google Fonts**

Cambiar (líneas 7-13):
```html
    <!-- Tipografía: DM Sans (UI) + JetBrains Mono (datos/placas) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <!-- Material Icons -->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
```
por:
```html
    <!-- Tipografía: Barlow (UI) + Barlow Condensed (títulos) + IBM Plex Mono (datos/placas) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
    <!-- Material Icons -->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
```
(`Material Symbols Outlined` de la línea siguiente no se toca — sigue en uso; el mockup solo usa `material-icons` clásico, que ya está cubierto.)

- [ ] **Step 2: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir cualquier página, inspeccionar con DevTools que el `<body>` carga `Barlow` (Network tab: petición a fonts.googleapis.com con `family=Barlow`). No debe haber cambio visual todavía (Task 2 es la que aplica `font-family: 'Barlow'` a los elementos).

- [ ] **Step 3: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/index.html
git commit -m "$(cat <<'EOF'
feat(redesign): load Barlow/Barlow Condensed/IBM Plex Mono fonts

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Paleta y tokens de diseño — reescritura de `index.css`

**Files:**
- Modify: `frontend/src/index.css:1-14` (bloque `@theme`)
- Modify: `frontend/src/index.css:16-42` (tema oscuro)
- Modify: `frontend/src/index.css:44-69` (tema claro)
- Modify: `frontend/src/index.css:80` (font-family del body)
- Modify: `frontend/src/index.css:133-137` (gradientes de `.stat-card::before`)
- Modify: `frontend/src/index.css:222-276` (`.btn-primary` y `.input-field:focus`)
- Modify: `frontend/src/index.css:296-332` (eliminar `.nav-btn`, ya no se usa tras Task 3)
- Modify: `frontend/src/index.css:397` (borde de celda de `.table-container`)
- Modify: `frontend/src/index.css:447-458,507-510` (overrides `.bg-indigo-*`/`.text-indigo-*`)
- Modify: `frontend/src/index.css:567-596` (hover/active de `.rbc-toolbar`, `.rbc-today`, `.rbc-show-more`)

**Interfaces:** Produces: todos los `var(--color-*)` y clases (`.stat-card`, `.badge`, `.btn-primary`, `.btn-ghost`, `.input-field`, `.table-container`, `.modal-overlay`/`.modal-content`, `.glass-panel`) con los MISMOS nombres pero nueva paleta — toda página que ya los consume (todas, tras Sprint 0-2) se re-pinta sin tocar su propio archivo. Nuevos tokens: `--color-sidebar-text`, `--color-sidebar-text-muted`, `--color-sidebar-border` (fijos, iguales en ambos temas — usados por Task 3).

- [ ] **Step 1: Bloque `@theme` — acento ámbar y fuentes**

Cambiar (líneas 1-14):
```css
@import "tailwindcss";

/* ─── Design tokens (Tailwind @theme — valores estáticos) ─────────────── */
@theme {
  --color-primary:      #6384ff;
  --color-primary-dark: #5a6fff;
  --color-accent:       #a78bfa;
  --font-display: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
  --font-sans:    'DM Sans', 'Segoe UI', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;
  --radius:    0.625rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
}
```
por:
```css
@import "tailwindcss";

/* ─── Design tokens (Tailwind @theme — valores estáticos) ─────────────── */
@theme {
  --color-primary:      #f5a524;
  --color-primary-dark: #e08700;
  --color-accent:       #c084fc;
  --font-display: 'Barlow Condensed', 'Segoe UI', system-ui, sans-serif;
  --font-sans:    'Barlow', 'Segoe UI', system-ui, sans-serif;
  --font-mono:    'IBM Plex Mono', 'Fira Code', monospace;
  --radius:    0.625rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
}
```

- [ ] **Step 2: Tema oscuro**

Cambiar (líneas 16-42):
```css
:root,
html[data-theme="dark"] {
  color-scheme: dark;
  --color-bg:              #0a0e17;
  --color-bg-soft:         #0f1423;
  --color-surface:         var(--color-bg-soft);
  --color-text:            #e2e8f0;
  --color-text-soft:       #c5cde0;
  --color-text-muted:      #8892a8;
  --color-border:          rgba(99, 132, 255, 0.12);
  --color-border-strong:   rgba(99, 132, 255, 0.20);
  --color-panel-bg:        linear-gradient(135deg, rgba(20,27,45,0.90), rgba(15,20,35,0.95));
  --color-header-bg:       rgba(10, 14, 23, 0.80);
  --color-sidebar-bg:      rgba(10, 14, 23, 0.40);
  --color-table-head-bg:   rgba(15, 20, 35, 0.98);
  --color-table-row-hover: rgba(99, 132, 255, 0.03);
  --color-input-bg:        rgba(10, 14, 23, 0.60);
  --color-modal-overlay:   rgba(0, 0, 0, 0.60);
  --color-modal-bg:        linear-gradient(145deg, #141b2d, #0f1423);
  --color-menu-bg:         rgba(10, 14, 23, 0.98);
  --color-link:            #8193ff;
  --color-text-on-primary: #ffffff;
  --scrollbar-track:       #131825;
  --scrollbar-thumb:       #2a3348;
  --scrollbar-thumb-hover: #3d4f6f;
}
```
por:
```css
:root,
html[data-theme="dark"] {
  color-scheme: dark;
  --color-bg:              #0e1013;
  --color-bg-soft:         #15181d;
  --color-surface:         var(--color-bg-soft);
  --color-text:            #edeae4;
  --color-text-soft:       #b9b5ac;
  --color-text-muted:      #807c73;
  --color-border:          #262b33;
  --color-border-strong:   #39404c;
  --color-panel-bg:        linear-gradient(135deg, rgba(27,32,40,0.90), rgba(21,24,29,0.95));
  --color-header-bg:       rgba(21, 24, 29, 0.92);
  --color-sidebar-bg:      #111318;
  --color-sidebar-text:       #c9c5bc;
  --color-sidebar-text-muted: #6f6c64;
  --color-sidebar-border:     #22262e;
  --color-table-head-bg:   rgba(27, 32, 40, 0.98);
  --color-table-row-hover: rgba(245, 165, 36, 0.05);
  --color-input-bg:        #1b2028;
  --color-modal-overlay:   rgba(0, 0, 0, 0.55);
  --color-modal-bg:        linear-gradient(145deg, #1b2028, #15181d);
  --color-menu-bg:         rgba(21, 24, 29, 0.98);
  --color-link:            #fbbf24;
  --color-text-on-primary: #1a1206;
  --scrollbar-track:       #1b2028;
  --scrollbar-thumb:       #39404c;
  --scrollbar-thumb-hover: #52596a;
}
```

- [ ] **Step 3: Tema claro (sidebar fijo, mismos valores que el oscuro por decisión de producto)**

Cambiar (líneas 44-69):
```css
html[data-theme="light"] {
  color-scheme: light;
  --color-bg:              #f4f7ff;
  --color-bg-soft:         #ffffff;
  --color-surface:         var(--color-bg-soft);
  --color-text:            #162033;
  --color-text-soft:       #2f3b52;
  --color-text-muted:      #5e6b85;
  --color-border:          rgba(70, 102, 192, 0.18);
  --color-border-strong:   rgba(70, 102, 192, 0.30);
  --color-panel-bg:        linear-gradient(135deg, rgba(255,255,255,0.96), rgba(244,248,255,0.98));
  --color-header-bg:       rgba(244, 247, 255, 0.92);
  --color-sidebar-bg:      rgba(255, 255, 255, 0.70);
  --color-table-head-bg:   rgba(248, 250, 255, 0.98);
  --color-table-row-hover: rgba(99, 132, 255, 0.06);
  --color-input-bg:        #ffffff;
  --color-modal-overlay:   rgba(15, 22, 38, 0.28);
  --color-modal-bg:        linear-gradient(145deg, #ffffff, #f4f8ff);
  --color-menu-bg:         rgba(255, 255, 255, 0.98);
  --color-link:            #365be8;
  --color-text-on-primary: #ffffff;
  --scrollbar-track:       #dce5f7;
  --scrollbar-thumb:       #a9b9de;
  --scrollbar-thumb-hover: #8da0cb;
}
```
por:
```css
html[data-theme="light"] {
  color-scheme: light;
  --color-bg:              #f2f1ed;
  --color-bg-soft:         #ffffff;
  --color-surface:         var(--color-bg-soft);
  --color-text:            #191b1f;
  --color-text-soft:       #4c4f56;
  --color-text-muted:      #8b8e94;
  --color-border:          #e4e2dc;
  --color-border-strong:   #cfccc4;
  --color-panel-bg:        linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,247,244,0.98));
  --color-header-bg:       rgba(248, 247, 244, 0.92);
  --color-sidebar-bg:      #111318;
  --color-sidebar-text:       #c9c5bc;
  --color-sidebar-text-muted: #6f6c64;
  --color-sidebar-border:     #22262e;
  --color-table-head-bg:   rgba(248, 247, 244, 0.98);
  --color-table-row-hover: rgba(217, 119, 6, 0.06);
  --color-input-bg:        #ffffff;
  --color-modal-overlay:   rgba(25, 27, 31, 0.28);
  --color-modal-bg:        linear-gradient(145deg, #ffffff, #f8f7f4);
  --color-menu-bg:         rgba(255, 255, 255, 0.98);
  --color-link:            #b45309;
  --color-text-on-primary: #1a1206;
  --scrollbar-track:       #ece9e2;
  --scrollbar-thumb:       #cfccc4;
  --scrollbar-thumb-hover: #b5b1a7;
}
```

- [ ] **Step 4: Fuente base del `<body>`**

Cambiar (línea 80):
```css
  font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
```
por:
```css
  font-family: 'Barlow', 'Segoe UI', system-ui, sans-serif;
```

- [ ] **Step 5: Barras de acento de `.stat-card` (variantes blue/amber/purple — green/red no cambian, ya no chocan con la marca)**

Cambiar (líneas 133-137):
```css
.stat-card.blue::before   { background: linear-gradient(90deg, #6384ff, #818cf8); }
.stat-card.green::before  { background: linear-gradient(90deg, #10b981, #34d399); }
.stat-card.amber::before  { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.stat-card.red::before    { background: linear-gradient(90deg, #ef4444, #f87171); }
.stat-card.purple::before { background: linear-gradient(90deg, #a855f7, #c084fc); }
```
por:
```css
.stat-card.blue::before   { background: linear-gradient(90deg, #60a5fa, #3b82f6); }
.stat-card.green::before  { background: linear-gradient(90deg, #10b981, #34d399); }
.stat-card.amber::before  { background: linear-gradient(90deg, #f5a524, #e08700); }
.stat-card.red::before    { background: linear-gradient(90deg, #ef4444, #f87171); }
.stat-card.purple::before { background: linear-gradient(90deg, #c084fc, #a855f7); }
```

- [ ] **Step 6: `.btn-primary` — gradiente, texto legible sobre ámbar, sombras**

Cambiar (líneas 223-252):
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6384ff, #5a6fff);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(99,132,255,0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
  line-height: 1;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(99,132,255,0.35);
  color: #ffffff;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 12px rgba(99,132,255,0.15);
}
```
por:
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: var(--color-text-on-primary);
  border: none;
  border-radius: 10px;
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(245,165,36,0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
  line-height: 1;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(245,165,36,0.35);
  color: var(--color-text-on-primary);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 12px rgba(245,165,36,0.15);
}
```

Cambiar (líneas 291-294, `.input-field:focus`):
```css
.input-field:focus {
  border-color: rgba(99,132,255,0.40);
  box-shadow: 0 0 0 3px rgba(99,132,255,0.10);
}
```
por:
```css
.input-field:focus {
  border-color: rgba(245,165,36,0.40);
  box-shadow: 0 0 0 3px rgba(245,165,36,0.10);
}
```

- [ ] **Step 7: Eliminar `.nav-btn` (queda sin uso tras Task 3 — la navegación pasa al sidebar)**

Borrar por completo el bloque (líneas 296-332):
```css
/* ─── Nav button ─────────────────────────────────────────────────────── */
.nav-btn {
  padding: 10px 16px;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255,255,255,0.90);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  white-space: nowrap;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.nav-btn:hover  { background: rgba(99,132,255,0.10); }
.nav-btn.active {
  background: rgba(99,132,255,0.12);
  box-shadow: 0 0 0 1px rgba(99,132,255,0.20);
}

/* En modo claro el nav tiene fondo semi-blanco → texto oscuro */
html[data-theme="light"] .nav-btn {
  color: var(--color-text-soft);
}
html[data-theme="light"] .nav-btn:hover {
  background: rgba(99,132,255,0.08);
  color: var(--color-text);
}
html[data-theme="light"] .nav-btn.active {
  background: rgba(99,132,255,0.10);
  color: #6384ff;
  box-shadow: 0 0 0 1px rgba(99,132,255,0.20);
}
```
(sin reemplazo — el bloque desaparece).

- [ ] **Step 8: Borde de celda de `.table-container`**

Cambiar (línea 397):
```css
.table-container td {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--color-text);
  border-bottom: 1px solid rgba(99,132,255,0.06);
}
```
por:
```css
.table-container td {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--color-text);
  border-bottom: 1px solid rgba(245,165,36,0.06);
}
```

- [ ] **Step 9: Overrides de `.bg-indigo-*`/`.text-indigo-*` (dark) — el "indigo" de Tailwind se usaba en este código como el acento de marca, ahora ámbar**

Cambiar (líneas 447 y 457, cada una en su propia línea del bloque de fondos):
```css
html[data-theme="dark"] .bg-indigo-50  { background-color: rgba(99,132,255,0.10)  !important; }
```
por:
```css
html[data-theme="dark"] .bg-indigo-50  { background-color: rgba(245,165,36,0.13)  !important; }
```
y:
```css
html[data-theme="dark"] .bg-indigo-100  { background-color: rgba(99,132,255,0.14)  !important; }
```
por:
```css
html[data-theme="dark"] .bg-indigo-100  { background-color: rgba(245,165,36,0.18)  !important; }
```

Cambiar (líneas 507-508):
```css
html[data-theme="dark"] .text-indigo-600  { color: #818cf8  !important; }
html[data-theme="dark"] .text-indigo-700  { color: #818cf8  !important; }
```
por:
```css
html[data-theme="dark"] .text-indigo-600  { color: #fbbf24  !important; }
html[data-theme="dark"] .text-indigo-700  { color: #fbbf24  !important; }
```
(`.text-violet-*`/`.bg-violet-*` no cambian — son un semántico morado distinto, ya coincide con `--vio` del mockup.)

- [ ] **Step 10: `react-big-calendar` — hover/activo de la barra de herramientas y "mostrar más"**

Cambiar (líneas 567-572):
```css
html[data-theme="dark"] .rbc-toolbar button:hover,
html[data-theme="dark"] .rbc-toolbar button.rbc-active {
  background: rgba(99,132,255,0.12) !important;
  color: #818cf8 !important;
  border-color: rgba(99,132,255,0.25) !important;
}
```
por:
```css
html[data-theme="dark"] .rbc-toolbar button:hover,
html[data-theme="dark"] .rbc-toolbar button.rbc-active {
  background: rgba(245,165,36,0.12) !important;
  color: #fbbf24 !important;
  border-color: rgba(245,165,36,0.25) !important;
}
```

Cambiar (línea 580):
```css
html[data-theme="dark"] .rbc-today { background-color: rgba(99,132,255,0.07) !important; }
```
por:
```css
html[data-theme="dark"] .rbc-today { background-color: rgba(245,165,36,0.07) !important; }
```

Cambiar (línea 596):
```css
html[data-theme="dark"] .rbc-show-more { color: #818cf8 !important; }
```
por:
```css
html[data-theme="dark"] .rbc-show-more { color: #fbbf24 !important; }
```

- [ ] **Step 11: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir cualquier página (p. ej. `/vehicles`): confirmar que fondo/tarjetas/badges/botones ya se ven en la paleta ámbar cálida en vez de azul, en ambos temas (toggle del header). Confirmar que `.nav-btn` ya no aparece en ningún lado (normal: `MainLayout.tsx` aún no se ha migrado — Task 3 lo hace; puede verse temporalmente roto el nav superior hasta esa tarea, es esperado).

- [ ] **Step 12: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/index.css
git commit -m "$(cat <<'EOF'
feat(redesign): rewrite color tokens and typography to new amber palette

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `MainLayout` — de barra de navegación superior a sidebar colapsable + header

**Files:**
- Modify: `frontend/src/components/layout/MainLayout.tsx:1-669`

**Interfaces:**
- Consumes: `ADMIN_MENU_CATEGORIES`, `ADMIN_ROUTE_ITEMS`, `canAccessDashboard`, `canAccessReservationRequests`, `isConductor` (todas de `frontend/src/config/routePermissions.ts`, sin cambios); `useAuth`, `usePermissions`, `useTheme` (sin cambios).
- Produces: mismo `<Outlet/>` para las rutas hijas — ninguna página necesita cambios por este task.

**Decisión de alcance:** se conserva TODA la lógica existente (permisos, notificaciones con `useQuery`/mutations, menú de usuario, detección de ruta activa, banner de error de sync) — solo cambia el JSX de shell. El buscador del header del mockup (`"Buscar placa, folio, conductor…"`) es puramente decorativo en el mockup (no dispara ninguna acción real): se añade como `<input>` sin `onChange` funcional, ya que no hay un endpoint de búsqueda global — inventar uno excede el alcance de un reskin visual. El drawer móvil existente se conserva prácticamente intacto (ya funciona) — el sidebar nuevo solo aplica en viewports `lg:` en adelante, igual que el nav de escritorio anterior.

- [ ] **Step 1: Agregar estado de colapso del sidebar**

Cambiar (línea 40, tras la declaración de `mobileMenuOpen`):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
```
por:
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('vehicles-sidebar-collapsed') === 'true');
  useEffect(() => {
    localStorage.setItem('vehicles-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);
```

- [ ] **Step 2: Construir la lista de grupos de navegación (Dashboard/Inicio/Solicitud + categorías de administración)**

Cambiar (línea 108, justo antes del bloque `useEffect` de diagnóstico):
```tsx
  const isAdminRoute = adminRoutes.some((r) => location.pathname === r.to || (r.to !== '/' && location.pathname.startsWith(r.to)));
```
por:
```tsx
  const isAdminRoute = adminRoutes.some((r) => location.pathname === r.to || (r.to !== '/' && location.pathname.startsWith(r.to)));

  const generalItems: { to: string; label: string; icon: string; end?: boolean }[] = [];
  if (showDashboard) generalItems.push({ to: '/', label: 'Dashboard', icon: 'dashboard', end: true });
  if (showConductorHome) generalItems.push({ to: '/', label: 'Inicio', icon: 'home', end: true });
  if (showReservationRequests) generalItems.push({ to: '/solicitud-vehiculos', label: 'Solicitud de vehículos', icon: 'directions_car' });
  generalItems.push({ to: '/mis-solicitudes', label: 'Mis solicitudes', icon: 'assignment' });

  const navGroups = [
    ...(generalItems.length > 0 ? [{ key: 'general', label: 'General', items: generalItems }] : []),
    ...adminRoutesByCategory.map((cat) => ({ key: cat.key, label: cat.label, items: cat.items })),
  ];
```

- [ ] **Step 3: Reemplazar el `return` completo por el shell de sidebar + header**

Cambiar (líneas 133-166, apertura del contenedor y banner de sync):
```tsx
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Banner de error de sincronización */}
      {showSyncBanner && (
        <div className="sticky top-0 z-[60] px-4 py-3 flex flex-wrap items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.3)' }}>
          <span className="material-icons shrink-0" style={{ color: '#f59e0b' }}>warning</span>
          <p className="flex-1 text-sm font-medium min-w-0" style={{ color: 'var(--color-text)' }}>{authSyncError}</p>
          <button
            type="button"
            onClick={handleRetrySync}
            disabled={retryingSync}
            className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-50"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
          >
            {retryingSync ? 'Conectando…' : 'Reintentar'}
          </button>
          <button
            type="button"
            onClick={() => setSyncBannerDismissed(true)}
            className="shrink-0 p-1 rounded"
            aria-label="Cerrar aviso"
            style={{ color: '#f59e0b' }}
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'var(--color-header-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 1px 20px rgba(99,102,241,0.15)',
        }}
      >
        <div className="w-full px-4 sm:px-6 py-3 flex items-center min-w-0 gap-2">

          {/* Logo */}
          <div className="shrink-0 min-w-0">
            <NavLink to="/" className="flex items-center gap-2.5 font-bold hover:opacity-90 transition-opacity" style={{ letterSpacing: '-0.3px', color: navText }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: logoIconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(99,132,255,0.25)',
              }}>
                <span className="material-icons" style={{ fontSize: 20, color: logoIconColor }}>local_shipping</span>
              </div>
              <span className="hidden sm:inline text-base leading-tight font-bold">Gestión de Vehículos Institucionales</span>
              <span className="sm:hidden text-sm leading-tight font-bold">Vehículos Inst.</span>
            </NavLink>
          </div>

          {/* Menú central (solo desktop) */}
          <div className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center gap-1">
              {showDashboard && (
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
                >
                  Dashboard
                </NavLink>
              )}
              {showConductorHome && (
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
                >
                  Inicio
                </NavLink>
              )}
              {showReservationRequests && (
                <NavLink
                  to="/solicitud-vehiculos"
                  className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
                >
                  Solicitud de vehículos
                </NavLink>
              )}
              {adminRoutes.length > 0 && (
                <div className="relative" ref={adminMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAdminMenuOpen((prev) => !prev)}
                    className={`nav-btn${isAdminRoute ? ' active' : ''}`}
                  >
                    Administración
                    <span className="material-icons text-lg">{adminMenuOpen ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {adminMenuOpen && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-xl py-2 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto"
                      style={dropdownStyle}
                    >
                      {adminRoutesByCategory.map(({ key: categoryKey, label: categoryLabel, items }, idx) => (
                        <div key={categoryKey} className={idx > 0 ? 'border-t pt-2 mt-2' : ''} style={{ borderColor: 'var(--color-border)' }}>
                          <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', letterSpacing: '1.2px' }}>{categoryLabel}</p>
                          {items.map(({ to, label, icon }) => (
                            <button
                              key={to}
                              type="button"
                              onClick={() => handleAdminLink(to)}
                              className={`${menuItemBase} rounded-lg mx-1`}
                              style={{
                                color: location.pathname === to ? '#6366f1' : 'var(--color-text-soft)',
                                background: location.pathname === to ? 'rgba(99,102,241,0.08)' : 'transparent',
                              }}
                            >
                              <span className="material-icons text-lg" style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
                              {label}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Derecha: toggle tema + notificaciones + perfil (desktop) */}
          <div className="hidden lg:flex shrink-0 items-center gap-1 ml-auto">

            {/* Toggle de tema */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: navMuted }}
              onMouseEnter={e => (e.currentTarget.style.background = navHoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              <span className="material-icons text-xl">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
```
por:
```tsx
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: "'Barlow', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Sidebar (desktop, lg+) ── */}
      <aside
        className="hidden lg:flex"
        style={{
          width: sidebarCollapsed ? 72 : 240,
          flexShrink: 0,
          background: 'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-sidebar-border)',
          flexDirection: 'column',
          transition: 'width .25s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '18px 16px', borderBottom: '1px solid var(--color-sidebar-border)', minHeight: 71 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-icons" style={{ fontSize: 21, color: 'var(--color-text-on-primary)' }}>local_shipping</span>
          </div>
          {!sidebarCollapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--color-sidebar-text)', lineHeight: 1, whiteSpace: 'nowrap' }}>
                Flota GPJ
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.7px', textTransform: 'uppercase', color: 'var(--color-sidebar-text-muted)', marginTop: 3, whiteSpace: 'nowrap' }}>
                Vehículos institucionales
              </div>
            </div>
          )}
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navGroups.map((g) => (
            <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!sidebarCollapsed && (
                <div style={{ padding: '14px 8px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--color-sidebar-text-muted)', whiteSpace: 'nowrap' }}>
                  {g.label}
                </div>
              )}
              {g.items.map((it) => {
                const isActive = it.end ? location.pathname === it.to : location.pathname.startsWith(it.to);
                return (
                  <NavLink
                    key={it.to + it.label}
                    to={it.to}
                    end={it.end}
                    title={it.label}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
                      background: isActive ? 'var(--color-primary)' : 'transparent',
                      color: isActive ? 'var(--color-text-on-primary)' : 'var(--color-sidebar-text)',
                      textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(245,165,36,0.10)'; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span className="material-icons" style={{ fontSize: 20, flexShrink: 0 }}>{it.icon}</span>
                    {!sidebarCollapsed && (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textAlign: 'left' }}>{it.label}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--color-sidebar-border)' }}>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px',
              border: 'none', borderRadius: 10, background: 'transparent', color: 'var(--color-sidebar-text-muted)',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,165,36,0.10)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-sidebar-text)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--color-sidebar-text-muted)'; }}
          >
            <span className="material-icons" style={{ fontSize: 20 }}>{sidebarCollapsed ? 'chevron_right' : 'chevron_left'}</span>
            {!sidebarCollapsed && <span>Colapsar</span>}
          </button>
        </div>
      </aside>

      {/* ── Columna derecha: header + banner + contenido ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {showSyncBanner && (
          <div className="px-4 py-3 flex flex-wrap items-center gap-3"
            style={{ background: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="material-icons shrink-0" style={{ color: '#f59e0b' }}>warning</span>
            <p className="flex-1 text-sm font-medium min-w-0" style={{ color: 'var(--color-text)' }}>{authSyncError}</p>
            <button
              type="button"
              onClick={handleRetrySync}
              disabled={retryingSync}
              className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-50"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
            >
              {retryingSync ? 'Conectando…' : 'Reintentar'}
            </button>
            <button
              type="button"
              onClick={() => setSyncBannerDismissed(true)}
              className="shrink-0 p-1 rounded"
              aria-label="Cerrar aviso"
              style={{ color: '#f59e0b' }}
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        )}

        {/* ── Header ── */}
        <header
          className="flex items-center gap-2 sm:gap-4"
          style={{ height: 64, flexShrink: 0, padding: '0 16px', background: 'var(--color-header-bg)', borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="hidden sm:block" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {navGroups.flatMap((g) => g.items).find((it) => (it.end ? location.pathname === it.to : location.pathname.startsWith(it.to)))?.label ?? 'Flota GPJ'}
          </div>
          <div className="hidden md:block" style={{ position: 'relative', width: 260, marginLeft: 8 }}>
            <span className="material-icons" style={{ position: 'absolute', left: 11, top: 8, fontSize: 18, color: 'var(--color-text-muted)' }}>search</span>
            <input
              placeholder="Buscar placa, folio, conductor…"
              className="input-field"
              style={{ paddingLeft: 38, fontSize: 13 }}
            />
          </div>
          <div className="flex-1" />

          {/* Toggle de tema */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-soft)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <span className="material-icons text-xl">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
```
(el resto del header — notificaciones y menú de usuario, líneas 280-349 del archivo original — se mueve tal cual dentro de este `<header>`, ver Step 4; el JSX del panel `hidden lg:flex` original deja de existir como bloque separado.)

- [ ] **Step 4: Migrar los bloques de notificaciones y menú de usuario dentro del nuevo `<header>` (mismo JSX interno, solo el contenedor exterior cambia)**

Cambiar (líneas 280-349, contenedor `hidden lg:flex` de notificaciones+usuario):
```tsx
            {/* Notificaciones */}
            {canReadNotifications && (
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative p-2 rounded-lg transition-colors"
                  style={{ color: navMuted }}
                  onMouseEnter={e => (e.currentTarget.style.background = navHoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  aria-label="Notificaciones"
                >
```
por:
```tsx
            {/* Notificaciones */}
            {canReadNotifications && (
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-soft)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  aria-label="Notificaciones"
                >
```
(cambia solo `color`/`onMouseEnter`/`onMouseLeave` de `navMuted`/`navHoverBg` — variables que dejan de existir — a los tokens directos; el resto del bloque de notificaciones, líneas siguientes hasta el cierre de su `div`, y el bloque completo del menú de usuario que le sigue, se copian **sin ningún otro cambio** dentro de este `<header>`, cerrando con `</header>` en vez de `</div></nav>`.)

Cambiar la etiqueta de cierre (antes en línea 409-410, `</div></nav>`) por:
```tsx
        </header>
```

Cambiar todas las apariciones restantes de `dropdownStyle`, `menuItemBase`, `navMuted`, `navHoverBg`, `navText`, `logoIconBg`, `logoIconColor` en el bloque de menú de usuario (líneas 352-408 del original) — estas 4 últimas variables (`navMuted`/`navHoverBg`/`navText`/`logoIconBg`/`logoIconColor`) ya no se usan en ningún otro lado tras este task; se eliminan sus declaraciones (Step 5).

- [ ] **Step 5: Eliminar variables de estilo que dependían del navbar viejo**

Cambiar (líneas 117-131):
```tsx
  /* ── estilos reutilizables ── */
  const dropdownStyle: React.CSSProperties = {
    background: 'var(--color-menu-bg)',
    border: '1px solid var(--color-border)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };
  const menuItemBase = 'w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm font-medium transition-colors';

  // En claro el header es blanco/azul hielo → texto oscuro; en oscuro → texto blanco
  const navText    = theme === 'dark' ? '#ffffff'              : 'var(--color-text)';
  const navMuted   = theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)';
  const navHoverBg = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(99,132,255,0.08)';
  const logoIconBg = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(99,132,255,0.10)';
  const logoIconColor = theme === 'dark' ? '#ffffff' : '#6384ff';
```
por:
```tsx
  /* ── estilos reutilizables ── */
  const dropdownStyle: React.CSSProperties = {
    background: 'var(--color-menu-bg)',
    border: '1px solid var(--color-border)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };
  const menuItemBase = 'w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm font-medium transition-colors';
```
(`dropdownStyle`/`menuItemBase` se conservan — siguen usados por los dropdowns de notificaciones/usuario; `navText`/`navMuted`/`navHoverBg`/`logoIconBg`/`logoIconColor` se eliminan.)

- [ ] **Step 6: Botón de hamburguesa móvil — abre el drawer existente; el drawer y `<main>`/`<footer>` se mueven dentro de la columna derecha**

Cambiar (línea 411, apertura del bloque móvil) — agregar el botón de hamburguesa como parte del header (visible solo `lg:hidden`) en vez de un bloque aparte:

Justo antes de `</header>` (el cierre añadido en el Step 4), insertar:
```tsx
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg transition-colors lg:hidden"
            style={{ color: 'var(--color-text)' }}
            aria-label="Abrir menú"
          >
            <span className="material-icons text-2xl">menu</span>
          </button>
        </header>
```
(el bloque `<div className="flex flex-1 justify-end items-center gap-1 lg:hidden">` original con su propio toggle de tema/notificaciones/hamburguesa duplicados para móvil, líneas 412-491, se elimina — el header unificado ya es responsivo y solo agrega este botón de hamburguesa en móvil; el toggle de tema y notificaciones ya declarados en el Step 3/4 quedan visibles en todos los tamaños al quitarles la clase `hidden lg:flex` que tenían en el contenedor original.)

Cambiar (línea 493, cierre del `</nav>` original — ya migrado — y apertura del drawer):
```tsx
      </nav>

      {/* ── Drawer móvil ── */}
```
por:
```tsx
      {/* ── Drawer móvil ── */}
```

Cambiar (línea 651, cierre del drawer y apertura de `<main>`):
```tsx
      {/* ── Contenido principal ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-6 sm:mt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex flex-col md:flex-row justify-between items-center" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          <p>© {new Date().getFullYear()} Gestión de Vehículos Institucionales. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a className="hover:opacity-80 transition-opacity" href="#">Privacidad</a>
            <a className="hover:opacity-80 transition-opacity" href="#">Términos</a>
            <a className="hover:opacity-80 transition-opacity" href="#">Ayuda</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
```
por:
```tsx
        {/* ── Contenido principal ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '26px 28px 48px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>

        {/* ── Footer ── */}
        <footer style={{ maxWidth: 1240, margin: '0 auto', width: '100%', padding: '20px 28px', borderTop: '1px solid var(--color-border)' }}>
          <div className="flex flex-col md:flex-row justify-between items-center" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            <p>© {new Date().getFullYear()} Gestión de Vehículos Institucionales. Todos los derechos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a className="hover:opacity-80 transition-opacity" href="#">Privacidad</a>
              <a className="hover:opacity-80 transition-opacity" href="#">Términos</a>
              <a className="hover:opacity-80 transition-opacity" href="#">Ayuda</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
```
(el drawer móvil que queda entre estos dos bloques — líneas 496-648 del original, con su propia navegación por `navGroups`-equivalente hardcodeada — se conserva tal cual, solo reemplazando las referencias directas a `showDashboard`/`showConductorHome`/`showReservationRequests`/`adminRoutesByCategory` que ya tenía por las mismas variables, sin cambios, ya que el drawer no usa `navGroups` — es una lista JSX manual preexistente que sigue funcionando igual.)

- [ ] **Step 7: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
En viewport de escritorio (≥1024px): confirmar sidebar izquierdo con logo, grupos "General"/"Flota"/"Usuarios y proveedores"/"Sistema", ítem activo resaltado en ámbar, botón "Colapsar" al fondo que reduce el sidebar a solo íconos y persiste tras recargar (localStorage). Confirmar header superior con título de la página actual, buscador decorativo, toggle de tema, campana de notificaciones (abrir/cerrar, marcar leídas) y menú de usuario (ir a perfil, mis solicitudes, cerrar sesión) — todo funcionando igual que antes. Reducir a <1024px: confirmar que el sidebar desaparece y el botón de hamburguesa abre el drawer existente con la misma navegación. Verificar en ambos temas.

- [ ] **Step 8: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/components/layout/MainLayout.tsx
git commit -m "$(cat <<'EOF'
feat(redesign): replace top navbar with collapsible sidebar + header shell

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Login — reskin de `Login.tsx`

**Files:**
- Modify: `frontend/src/pages/Auth/Login.tsx:52-220`

**Interfaces:** N/A.

**Decisión de alcance:** el mockup muestra dos botones de acceso ("Entrar · demo administrador" y "Continuar con Google"); el primero es un atajo del propio prototipo para saltar el login falso, no una funcionalidad real del sistema (que usa Firebase Auth real) — **no se agrega**. El panel derecho cambia de foto de fondo a un patrón diagonal + 3 cifras estáticas (12 vehículos/86%/248 reservas), igual que el mockup — estas 3 cifras son las mismas que ya haría reales el Dashboard, pero el mockup las muestra fijas en el panel de marketing del login (antes de autenticarse no hay datos de sesión disponibles); se mantienen como valores ilustrativos estáticos, igual que en el mockup, ya que no hay endpoint público (sin auth) que exponga esas métricas.

- [ ] **Step 1: Reemplazar el fondo y estructura de la columna izquierda (logo/tema, formulario, footer)**

Cambiar (línea 61):
```tsx
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)', fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
```
por:
```tsx
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)', fontFamily: "'Barlow', 'Segoe UI', system-ui, sans-serif" }}>
```

Cambiar (líneas 74-80, ícono del logo):
```tsx
            <div style={{
              width: 48, height: 48, borderRadius: 16, flexShrink: 0,
              background: 'rgba(99,132,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(99,132,255,0.2)',
            }}>
              <span className="material-icons" style={{ fontSize: 26, color: '#6384ff' }}>local_shipping</span>
            </div>
```
por:
```tsx
            <div style={{
              width: 48, height: 48, borderRadius: 16, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(245,165,36,0.3)',
            }}>
              <span className="material-icons" style={{ fontSize: 26, color: 'var(--color-text-on-primary)' }}>local_shipping</span>
            </div>
```

Cambiar (líneas 82-89, título + subtítulo "Poder Judicial"):
```tsx
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)', letterSpacing: '-0.3px' }}>
                Gestión de Vehículos Institucionales
              </h2>
              <p className="text-xs font-semibold uppercase mt-0.5" style={{ color: '#6384ff', letterSpacing: '0.8px' }}>
                Poder Judicial
              </p>
            </div>
```
por:
```tsx
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: 'var(--color-text)', letterSpacing: '1.5px', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}
              >
                Flota GPJ
              </h2>
              <p className="text-xs font-semibold uppercase mt-0.5" style={{ color: 'var(--color-link)', letterSpacing: '0.8px' }}>
                Gestión de Vehículos Institucionales
              </p>
            </div>
```

Cambiar (línea 105, título "Bienvenido"):
```tsx
            <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text)', letterSpacing: '-0.5px' }}>Bienvenido</h1>
```
por:
```tsx
            <h1
              className="font-bold"
              style={{ color: 'var(--color-text)', fontSize: 42, letterSpacing: '.5px', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', lineHeight: 1 }}
            >
              Bienvenido
            </h1>
```

Cambiar (línea 117, accentColor del checkbox):
```tsx
                style={{ accentColor: '#6384ff' }}
```
por:
```tsx
                style={{ accentColor: 'var(--color-primary)' }}
```

Cambiar (línea 173, punto pulsante del footer):
```tsx
          <span className="w-2 h-2 rounded-full pulse" style={{ background: '#6384ff' }} />
          Gestión de Vehículos Institucionales v3.1
```
por:
```tsx
          <span className="w-2 h-2 rounded-full pulse" style={{ background: 'var(--color-primary)' }} />
          Flota GPJ · Plan Juárez · v4.0
```

- [ ] **Step 2: Reemplazar el panel derecho (foto de fondo → patrón diagonal + cifras)**

Cambiar (líneas 178-217):
```tsx
      {/* Panel derecho — imagen decorativa (solo desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('/fleet-bg.jpg')", filter: 'blur(3px)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(99,132,255,0.78), rgba(90,111,255,0.88))' }} />
        <div className="relative z-10 h-full flex flex-col justify-center px-16 text-white max-w-2xl mx-auto">
          <div
            className="p-10"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-wider"
              style={{
                borderRadius: 20,
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span className="material-icons text-sm">security</span>
              Acceso seguro
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight" style={{ letterSpacing: '-0.5px' }}>
              Gestión de Vehículos Institucionales
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Plataforma centralizada para la gestión eficiente de vehículos y reservas. Supervise el estado de la flota y programe mantenimientos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```
por:
```tsx
      {/* Panel derecho — patrón decorativo + cifras (solo desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: '#101216' }}>
        <div
          className="absolute inset-0"
          style={{ background: 'repeating-linear-gradient(-55deg, transparent 0, transparent 46px, rgba(245,165,36,0.05) 46px, rgba(245,165,36,0.05) 50px)' }}
        />
        <div className="absolute top-0 left-0 right-0" style={{ height: 5, background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))' }} />
        <div className="relative z-10 h-full flex flex-col justify-center px-16" style={{ color: '#edeae4' }}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-wider"
            style={{ borderRadius: 20, background: 'rgba(245,165,36,0.14)', border: '1px solid rgba(245,165,36,0.3)', color: '#fbbf24' }}
          >
            <span className="material-icons text-sm">security</span>
            Acceso seguro
          </div>
          <h2
            className="mb-5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 64, fontWeight: 700, lineHeight: 0.98, letterSpacing: '1px', textTransform: 'uppercase' }}
          >
            Tu flota,<br />en control.
          </h2>
          <p className="mb-9" style={{ fontSize: 16, lineHeight: 1.6, color: '#b9b5ac', maxWidth: 420 }}>
            Solicitudes, reservas, mantenimiento y costos de los vehículos institucionales en una sola plataforma.
          </p>
          <div className="flex gap-3.5">
            {[
              { n: '12', label: 'Vehículos' },
              { n: '86%', label: 'Disponibilidad' },
              { n: '248', label: 'Reservas/año' },
            ].map((s) => (
              <div key={s.label} style={{ flex: 1, maxWidth: 150, padding: 16, border: '1px solid #2a2f38', borderRadius: 12, background: 'rgba(21,24,29,0.7)' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 600, color: '#fbbf24' }}>{s.n}</div>
                <div style={{ fontSize: 11, letterSpacing: '.8px', textTransform: 'uppercase', color: '#807c73', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Cerrar sesión y abrir `/login`: confirmar título "Flota GPJ" + subtítulo, "Bienvenido" en Barlow Condensed mayúsculas, checkbox y punto pulsante en ámbar, botón "Continuar con Google" sin cambios funcionales. Panel derecho (desktop): patrón diagonal ámbar sutil, franja superior de gradiente, badge "Acceso seguro", titular "Tu flota, en control.", y las 3 cifras (12/86%/248) en mono ámbar. Confirmar que iniciar sesión con Google sigue funcionando igual.

- [ ] **Step 4: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Auth/Login.tsx
git commit -m "$(cat <<'EOF'
feat(redesign): restyle Login page to match new mockup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Dashboard — gauge, desglose de flota por 4 categorías, próximos mantenimientos

**Files:**
- Modify: `frontend/src/pages/Dashboard/Dashboard.tsx:98-704`
- Modify: `frontend/src/pages/Dashboard/ConductorDashboard.tsx:1-161`

**Interfaces:** N/A. Todo se deriva de datos ya cargados por los `useQuery` existentes (`vehicles`, `reservations`, `maintenanceRecords`) — no hay queries nuevas.

**Decisión de alcance:** el mockup separa "Disponibilidad" (gauge de semicírculo) de "Estado de la flota" (donut con 4 categorías: disponibles/en uso/mantenimiento/inactivos). El dashboard actual solo tiene un donut de 2 segmentos (operativos vs total). Se agrega el gauge y se expande el donut a 4 categorías reales (mismo dato `vehicles`, ya cargado). Se conserva el `AreaChart` de `recharts` para tendencias y el calendario real `AllReservationsCalendar` (ambos ya funcionales) — el mockup los muestra como gráfica de barras/grid estático, pero reemplazarlos perdería funcionalidad real (tooltips, navegación de mes, datos reales), lo cual viola la restricción de preservar comportamiento. Se agrega la tarjeta "Próximos mantenimientos" (dato ya en `maintenanceAlerts`, no existía como tarjeta visual, solo como KPI numérico).

- [ ] **Step 1: Calcular el desglose de flota por las 4 categorías**

Cambiar (líneas 149-153):
```tsx
  const activeCount = vehicles.filter(
    (v: { status: string }) => v.status === 'available' || v.status === 'in_use',
  ).length;
  const totalFleet = vehicles.length;
  const utilization = totalFleet > 0 ? Math.round((activeCount / totalFleet) * 100) : 0;
```
por:
```tsx
  const activeCount = vehicles.filter(
    (v: { status: string }) => v.status === 'available' || v.status === 'in_use',
  ).length;
  const totalFleet = vehicles.length;
  const utilization = totalFleet > 0 ? Math.round((activeCount / totalFleet) * 100) : 0;

  const fleetByStatus = {
    available: vehicles.filter((v: { status: string }) => v.status === 'available').length,
    in_use: vehicles.filter((v: { status: string }) => v.status === 'in_use').length,
    maintenance: vehicles.filter((v: { status: string }) => v.status === 'maintenance').length,
    inactive: vehicles.filter((v: { status: string }) => v.status === 'inactive').length,
  };
  const fleetLegend = [
    { label: 'Disponibles', n: fleetByStatus.available, c: '#4ade80' },
    { label: 'En uso', n: fleetByStatus.in_use, c: '#60a5fa' },
    { label: 'Mantenimiento', n: fleetByStatus.maintenance, c: '#fbbf24' },
    { label: 'Inactivos', n: fleetByStatus.inactive, c: 'var(--color-border-strong)' },
  ];
  const donutTotal = Math.max(totalFleet, 1);
  let donutOffset = 0;
  const donutSegments = fleetLegend
    .filter((l) => l.n > 0)
    .map((l) => {
      const dash = (l.n / donutTotal) * 251.2;
      const seg = { c: l.c, dash: `${dash} 251.2`, offset: -donutOffset };
      donutOffset += dash;
      return seg;
    });
```

- [ ] **Step 2: Insertar el gauge de disponibilidad antes de la fila de KPIs (mismo dato `utilization`)**

Cambiar (línea 272, apertura de la fila de stat-cards):
```tsx
      {/* Stat cards KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
```
por:
```tsx
      {/* Gauge de disponibilidad */}
      <div className="glass-panel p-6 mb-8 flex flex-col items-center">
        <svg viewBox="0 0 200 116" style={{ width: 200 }}>
          <path d="M 20 106 A 80 80 0 0 1 180 106" fill="none" stroke="var(--color-border)" strokeWidth="13" strokeLinecap="round" />
          <path
            d="M 20 106 A 80 80 0 0 1 180 106"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={`${(utilization / 100) * 251.2} 251.2`}
            style={{ transition: 'stroke-dasharray .6s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <div style={{ marginTop: -58, textAlign: 'center' }}>
          <div className="font-mono-data font-bold" style={{ fontSize: 42, color: 'var(--color-text)', lineHeight: 1 }}>{utilization}%</div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: 2 }}>Disponibilidad</div>
        </div>
        <div className="flex gap-4 mt-5" style={{ fontSize: 12, color: 'var(--color-text-soft)' }}>
          <span className="flex items-center gap-1.5"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-primary)' }} />{activeCount} operativos</span>
          <span className="flex items-center gap-1.5"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-border-strong)' }} />{totalFleet} en flota</span>
        </div>
      </div>

      {/* Stat cards KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
```

- [ ] **Step 3: Expandir el donut a 4 categorías + agregar tarjeta "Próximos mantenimientos"**

Cambiar (líneas 475-582, el bloque completo "Donut estado de flota" hasta el cierre de la grid de gráficas):
```tsx
        {/* Donut estado de flota */}
        <div className="glass-panel p-6 flex flex-col">
          <h3
            className="text-base font-bold mb-6"
            style={{ color: 'var(--color-text)' }}
          >
            Estado de la flota
          </h3>
          <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
            <svg
              className="w-44 h-44 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="var(--color-border)"
                strokeWidth="12"
              />
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#6384ff"
                strokeDasharray={
                  totalFleet > 0
                    ? `${(utilization / 100) * 251.2} 251.2`
                    : '0 251.2'
                }
                strokeDashoffset="0"
                strokeLinecap="round"
                strokeWidth="12"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="font-mono-data font-bold"
                style={{ fontSize: 28, color: 'var(--color-text)' }}
              >
                {totalFleet > 0 ? utilization : 0}%
              </span>
              <span
                className="text-xs mt-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Operativos
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: '#6384ff' }}
                />
                <span
                  className="text-sm"
                  style={{ color: 'var(--color-text-soft)' }}
                >
                  Disponibles
                </span>
              </div>
              <span
                className="text-sm font-semibold font-mono-data"
                style={{ color: 'var(--color-text)' }}
              >
                {activeCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: 'var(--color-border-strong)' }}
                />
                <span
                  className="text-sm"
                  style={{ color: 'var(--color-text-soft)' }}
                >
                  Total
                </span>
              </div>
              <span
                className="text-sm font-semibold font-mono-data"
                style={{ color: 'var(--color-text)' }}
              >
                {totalFleet}
              </span>
            </div>
            {maintenanceAlerts.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-soft)' }}>
                    Mantenimiento próximo
                  </span>
                </div>
                <span className="text-sm font-semibold font-mono-data" style={{ color: '#f59e0b' }}>
                  {maintenanceAlerts.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
```
por:
```tsx
        {/* Donut estado de flota (4 categorías) */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-base font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            Estado de la flota
          </h3>
          <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
            <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
              {donutSegments.map((s, i) => (
                <circle
                  key={i}
                  cx="50" cy="50" r="40" fill="transparent"
                  stroke={s.c} strokeWidth="11"
                  strokeDasharray={s.dash} strokeDashoffset={s.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono-data font-bold" style={{ fontSize: 24, color: 'var(--color-text)' }}>{totalFleet}</span>
              <span className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>unidades</span>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {fleetLegend.map((l) => (
              <div key={l.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2" style={{ color: 'var(--color-text-soft)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.c }} />
                  {l.label}
                </span>
                <span className="font-semibold font-mono-data" style={{ color: 'var(--color-text)' }}>{l.n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Próximos mantenimientos */}
        <div className="lg:col-span-3 glass-panel p-6">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Próximos mantenimientos</h3>
            <Link to="/maintenance" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--color-link)' }}>Ver todos</Link>
          </div>
          {maintenanceAlerts.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Sin mantenimientos programados en los próximos 30 días.</p>
          ) : (
            <div className="space-y-3">
              {maintenanceAlerts.slice(0, 3).map((m) => {
                const d = new Date(m.scheduledDate);
                return (
                  <div key={m.id} className="flex gap-3 items-center p-3 rounded-[11px]" style={{ border: '1px solid var(--color-border)' }}>
                    <div className="text-center rounded-[9px]" style={{ minWidth: 44, padding: '6px 8px', background: 'var(--color-bg-soft)' }}>
                      <div className="font-mono-data font-semibold" style={{ fontSize: 16, lineHeight: 1 }}>{d.getDate()}</div>
                      <div style={{ fontSize: 9.5, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {d.toLocaleDateString('es-MX', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{m.vehicle?.plate ?? '—'}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Mantenimiento programado</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
```

- [ ] **Step 4: `ConductorDashboard` — fix del literal `rgba(99,132,255,...)` heredado en el badge de resumen (no tiene, revisar y confirmar), y unificar tipografía de headings**

`ConductorDashboard.tsx` no tiene literales azules hardcodeados (ya confirmado por grep en el inventario original) ni estructura que difiera del mockup más allá de lo ya cubierto por Task 2 (tokens) — no requiere cambios de código en este archivo; se deja documentado que fue revisado y no necesita edición.

- [ ] **Step 5: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Ir a `/` como admin: confirmar el gauge de disponibilidad arriba de los KPIs, el donut con 4 colores (verde/azul/ámbar/gris) y su leyenda de 4 líneas, y la nueva tarjeta "Próximos mantenimientos" con hasta 3 elementos (o el mensaje "Sin mantenimientos..." si no hay). Confirmar que la gráfica de tendencias (`recharts`) y el calendario real siguen funcionando igual. Repetir en modo claro.

- [ ] **Step 6: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Dashboard/Dashboard.tsx frontend/src/pages/Dashboard/ConductorDashboard.tsx
git commit -m "$(cat <<'EOF'
feat(redesign): add availability gauge, 4-category fleet donut, upcoming maintenance card

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Componentes compartidos restantes — fix de literales azules hardcodeados

**Files:**
- Modify: `frontend/src/components/ui/ImageCropModal.tsx:103,123,147`
- Modify: `frontend/src/components/ui/ViewToggle.tsx:38,41`
- Modify: `frontend/src/components/ui/SearchSelect.tsx:123,179,181,183`
- Modify: `frontend/src/components/ui/TableToolbar.tsx:134,146,158`

**Interfaces:** N/A — mismo fix mecánico que el resto de páginas, sin tocar lógica.

- [ ] **Step 1: `ImageCropModal.tsx`**

Cambiar (línea 103):
```tsx
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.08)')}
```
por:
```tsx
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,165,36,0.08)')}
```

Cambiar (línea 123):
```tsx
                border: '2px solid #6384ff',
```
por:
```tsx
                border: '2px solid #f5a524',
```

Cambiar (línea 147):
```tsx
            style={{ accentColor: '#6384ff' }}
```
por:
```tsx
            style={{ accentColor: 'var(--color-primary)' }}
```

- [ ] **Step 2: `ViewToggle.tsx`**

Cambiar (línea 38):
```tsx
              ? { background: 'linear-gradient(135deg,#6384ff,#5a6fff)', color: '#ffffff' }
```
por:
```tsx
              ? { background: 'linear-gradient(135deg,#f5a524,#e08700)', color: 'var(--color-text-on-primary)' }
```

Cambiar (línea 41):
```tsx
          onMouseEnter={e => { if (value !== mode) (e.currentTarget as HTMLElement).style.background = 'rgba(99,132,255,0.08)'; }}
```
por:
```tsx
          onMouseEnter={e => { if (value !== mode) (e.currentTarget as HTMLElement).style.background = 'rgba(245,165,36,0.08)'; }}
```

- [ ] **Step 3: `SearchSelect.tsx`**

Cambiar (línea 123):
```tsx
        onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,132,255,0.45)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,132,255,0.10)'; }}
```
por:
```tsx
        onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,165,36,0.45)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(245,165,36,0.10)'; }}
```

Cambiar (línea 179):
```tsx
                      color: opt.value === value ? '#818cf8' : 'var(--color-text-soft)',
```
por:
```tsx
                      color: opt.value === value ? '#fbbf24' : 'var(--color-text-soft)',
```

Cambiar (líneas 181 y 183):
```tsx
                        ? 'rgba(99,132,255,0.10)'
```
y
```tsx
                        ? 'rgba(99,132,255,0.07)'
```
por, respectivamente:
```tsx
                        ? 'rgba(245,165,36,0.10)'
```
```tsx
                        ? 'rgba(245,165,36,0.07)'
```

- [ ] **Step 4: `TableToolbar.tsx`**

Cambiar (las 3 ocurrencias idénticas, líneas 134, 146, 158 — aplicar `replace_all`):
```tsx
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.07)')}
```
por:
```tsx
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,165,36,0.07)')}
```

- [ ] **Step 5: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Probar: recortar una foto de perfil (`/profile`) y confirmar que el marco de recorte y el hover del botón cerrar son ámbar; alternar tarjetas/tabla en cualquier lista (`ViewToggle`) y confirmar que el botón activo es ámbar; abrir cualquier `SearchSelect` (p. ej. filtro de rol en `/users`) y confirmar hover/focus/selección en ámbar; pasar el mouse sobre los botones de exportar CSV/Excel/PDF de `TableToolbar` en cualquier lista y confirmar highlight ámbar.

- [ ] **Step 6: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/components/ui/ImageCropModal.tsx frontend/src/components/ui/ViewToggle.tsx frontend/src/components/ui/SearchSelect.tsx frontend/src/components/ui/TableToolbar.tsx
git commit -m "$(cat <<'EOF'
fix(redesign): replace remaining hardcoded blue literals in shared UI components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---
### Task 7: Vehicles list (`VehiclesList.tsx`) — reskin header/filters + restyle cards & table views

**Files:**
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx:40-43` (add helper)
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx:302` (color literal)
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx:379-381` (color literals)
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx:487-489` (add `statusChips`)
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx:533-580` (header + toolbar relocation)
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx:585-593` (status badge)
- Modify: `frontend/src/pages/Vehicles/VehiclesList.tsx:615-692` (cards view rewrite)

**Interfaces:** N/A — leaf page. No new API calls; reuses `vehicles`/`filteredVehicles`/`paginatedVehicles` already produced by the existing `useQuery` + `useDataTable` in this file.

**Design note / deviations:** The mockup's cards/table for this screen also show a `Tipo` column (Sedán/Pickup/Van/SUV) and a per-vehicle-type icon (`v.icon`), plus filter chips include a vehicle-type dimension. `Vehicle` (`backend/src/database/entities/vehicle.entity.ts`) has **no** `type`/`vehicleType` column — only `plate, brand, model, year, color, vin, photoUrls, status, currentOdometer`, plus service-computed `lastFuelLevel`/`lastUsedByUser`. Adding a type field would require a new migration + form field, which is out of scope for a visual reskin pass. **Decision: omit the `Tipo` column/chips and use a single generic `directions_car` icon everywhere** — do not invent this field. Likewise, `lastFuelLevel` is a free-text `VARCHAR(50)` (`reservation.checkoutFuelLevel`, e.g. could be "3/4" or "Lleno", not guaranteed numeric), so the mockup's colored fuel percentage bar is only rendered when the value happens to parse as a plain 0–100 integer (see `parseFuelPercent` below) — otherwise we fall back to the existing plain-text display, exactly as today.

- [ ] **Step 1: Add a best-effort fuel-percentage parser**

Cambiar (líneas 40-44):
```tsx
function getFirstPhotoUrl(photoUrls: string | null | undefined): string | null {
  const urls = parsePhotoUrls(photoUrls);
  return urls[0] ?? null;
}

const STATUS_OPTIONS = [
```
por:
```tsx
function getFirstPhotoUrl(photoUrls: string | null | undefined): string | null {
  const urls = parsePhotoUrls(photoUrls);
  return urls[0] ?? null;
}

// lastFuelLevel es texto libre (p. ej. "3/4", "Lleno"); solo se dibuja la barra
// de combustible del rediseño cuando el valor es un entero 0-100 plano.
function parseFuelPercent(level: string | null | undefined): number | null {
  if (!level) return null;
  const match = level.trim().match(/^(\d{1,3})\s*%?$/);
  if (!match) return null;
  const n = Number(match[1]);
  return n >= 0 && n <= 100 ? n : null;
}

const STATUS_OPTIONS = [
```

- [ ] **Step 2: Reemplazar los literales de azul heredado por el ámbar nuevo**

Cambiar (línea 302):
```tsx
                          style={{ background: 'rgba(99,132,255,0.85)', color: '#fff' }}
```
por:
```tsx
                          style={{ background: 'rgba(245,165,36,0.85)', color: '#fff' }}
```

Cambiar (líneas 379-381):
```tsx
                e.currentTarget.style.borderColor = '#6384ff';
                e.currentTarget.style.color = '#818cf8';
                e.currentTarget.style.background = 'rgba(99,132,255,0.05)';
```
por:
```tsx
                e.currentTarget.style.borderColor = '#f5a524';
                e.currentTarget.style.color = '#fbbf24';
                e.currentTarget.style.background = 'rgba(245,165,36,0.05)';
```

- [ ] **Step 3: Calcular los conteos por estado para los chips del rediseño**

Cambiar (líneas 487-490):
```tsx
  const filteredVehicles = filterStatus
    ? vehicles.filter((v: Vehicle) => v.status === filterStatus)
    : vehicles;

  const {
```
por:
```tsx
  const filteredVehicles = filterStatus
    ? vehicles.filter((v: Vehicle) => v.status === filterStatus)
    : vehicles;

  const statusChips = [
    { value: '', label: 'Todos', count: vehicles.length },
    ...STATUS_OPTIONS.map((o) => ({
      value: o.value,
      label: o.label,
      count: vehicles.filter((v: Vehicle) => v.status === o.value).length,
    })),
  ];

  const {
```

- [ ] **Step 4: Sustituir el encabezado (título+dropdown+botón) por título+contador, buscador único, chips de estado y el `TableToolbar` movido fuera del condicional de vista**

El mockup (`vehiculos.txt`) muestra un único cuadro de búsqueda ("Buscar placa o modelo…") y chips de estado (`vChips`) compartidos por ambas vistas — hoy el buscador vive solo dentro del bloque `view === 'table'` y la vista de tarjetas ni filtra por búsqueda ni por estado ni pagina (usa `vehicles` crudo). Este cambio también corrige ese bug de paridad: ambas vistas pasan a usar `paginatedVehicles`.

Cambiar (líneas 533-580):
```tsx
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Vehículos</h2>
        <div className="flex items-center gap-3">
          <SearchSelect
            options={[{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Todos los estados"
            className="w-48"
          />
          <ViewToggle value={view} onChange={setView} storageKey="vehiclesView" />
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
          >
            Nuevo vehículo
          </button>
        </div>
      </div>
      {view === 'table' && (
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 pt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por placa, marca o modelo..."
              className="input-field w-full max-w-sm"
            />
          </div>
          <TableToolbar
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            startIndex={startIndex}
            endIndex={endIndex}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onExportCSV={() => exportToCSV(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.csv')}
            onExportExcel={() => exportToExcel(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.xlsx', 'Vehículos')}
            onExportPDF={() => exportToPDF(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.pdf', 'Vehículos')}
          />
          <DataTable<Vehicle>
```
por:
```tsx
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Vehículos</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {vehicles.length} {vehicles.length === 1 ? 'unidad' : 'unidades'} en la flota
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 px-4 py-2.5"
        >
          <span className="material-icons text-lg">add</span>
          Nuevo vehículo
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <span
            className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-lg"
            style={{ color: 'var(--color-text-muted)' }}
          >
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar placa o modelo…"
            className="input-field w-full pl-10"
          />
        </div>
        {statusChips.map((chip) => (
          <button
            key={chip.value || 'all'}
            type="button"
            onClick={() => setFilterStatus(chip.value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={
              filterStatus === chip.value
                ? { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }
                : { background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-soft)' }
            }
          >
            {chip.label}
            <span className="font-mono-data" style={{ opacity: 0.75, fontSize: 11 }}>{chip.count}</span>
          </button>
        ))}
        <div className="flex-1" />
        <ViewToggle value={view} onChange={setView} storageKey="vehiclesView" />
      </div>
      <TableToolbar
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        startIndex={startIndex}
        endIndex={endIndex}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onExportCSV={() => exportToCSV(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.csv')}
        onExportExcel={() => exportToExcel(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.xlsx', 'Vehículos')}
        onExportPDF={() => exportToPDF(exportHeaders, getExportRows(filteredVehicles), 'vehiculos.pdf', 'Vehículos')}
      />
      {view === 'table' && (
        <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
          <DataTable<Vehicle>
```

Nota: la `SearchSelect` para "Todos los estados" queda eliminada del encabezado (reemplazada por los chips); el import de `SearchSelect` se conserva porque `VehicleFormModal` lo sigue usando para el campo "Estado" (línea ~408).

- [ ] **Step 5: Cambiar el badge de estado de la tabla a las clases temáticas `.badge-*`**

Cambiar (líneas 585-593):
```tsx
              {
                key: 'status',
                header: 'Estado',
                render: (v) => (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status}
                  </span>
                ),
              },
```
por:
```tsx
              {
                key: 'status',
                header: 'Estado',
                render: (v) => {
                  const badgeClass = v.status === 'available' ? 'badge-green' : v.status === 'in_use' ? 'badge-amber' : 'badge-slate';
                  return (
                    <span className={`badge ${badgeClass}`}>
                      {STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status}
                    </span>
                  );
                },
              },
```

- [ ] **Step 6: Reescribir la vista de tarjetas para usar `paginatedVehicles`, tokens de tema y el look del mockup (placa mono, avatar de icono acento, barra de combustible, fila de conductor)**

Cambiar (líneas 615-692):
```tsx
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.length === 0 ? (
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
              No hay vehículos registrados.
            </div>
          ) : (
            vehicles.map((v: Vehicle) => {
              const photoUrl = getFirstPhotoUrl(v.photoUrls);
              const statusLabel = STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status;
              const statusBadgeClass =
                v.status === 'available'
                  ? 'bg-green-100 text-green-800'
                  : v.status === 'in_use'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700';
              return (
                <div
                  key={v.id}
                  className="bg-slate-50 rounded-[16px] shadow-sm border border-slate-200 overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/3] bg-slate-200 relative">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={`${v.plate} ${v.brand} ${v.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <span className="material-icons text-6xl">directions_car</span>
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium ${statusBadgeClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="font-bold text-slate-900 text-xl">{v.plate}</div>
                    <div className="text-slate-600 text-sm mt-0.5">
                      {v.brand} {v.model}
                      {v.year != null && ` (${v.year})`}
                    </div>
                    {v.color && (
                      <div className="text-slate-600 text-sm">{v.color}</div>
                    )}
                    {v.currentOdometer != null && (
                      <div className="text-slate-600 text-sm">
                        Kilometraje: {v.currentOdometer.toLocaleString()} km
                      </div>
                    )}
                    <div className="text-slate-600 text-sm">Gasolina: {v.lastFuelLevel ?? '—'}</div>
                    <div className="text-slate-600 text-sm">Último uso: {v.lastUsedByUser ?? '—'}</div>
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(v)}
                        className="w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium text-sm"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(v)}
                        className="text-red-600 font-medium hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
```
por:
```tsx
      {view === 'cards' && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
          {paginatedVehicles.length === 0 ? (
            <div
              className="col-span-full rounded-[16px] px-6 py-12 text-center"
              style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              No hay vehículos registrados.
            </div>
          ) : (
            paginatedVehicles.map((v: Vehicle) => {
              const photoUrl = getFirstPhotoUrl(v.photoUrls);
              const statusLabel = STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status;
              const badgeClass = v.status === 'available' ? 'badge-green' : v.status === 'in_use' ? 'badge-amber' : 'badge-slate';
              const fuelPercent = parseFuelPercent(v.lastFuelLevel);
              return (
                <div
                  key={v.id}
                  className="rounded-[14px] overflow-hidden flex flex-col"
                  style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
                >
                  <div className="aspect-[4/3] relative" style={{ background: 'var(--color-table-head-bg)' }}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={`${v.plate} ${v.brand} ${v.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="material-icons text-6xl">directions_car</span>
                      </div>
                    )}
                    <span className={`badge ${badgeClass} absolute top-2 right-2 flex items-center gap-1.5`}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      {statusLabel}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="mb-3">
                      <span className="badge badge-slate font-mono-data">{v.plate}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(245,165,36,0.14)', color: 'var(--color-primary)' }}
                      >
                        <span className="material-icons">directions_car</span>
                      </span>
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                          {v.brand} {v.model}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {v.color ?? '—'}{v.year != null && ` · ${v.year}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--color-text-soft)' }}>
                      <span className="flex items-center gap-1.5">
                        <span className="material-icons" style={{ fontSize: 15, color: 'var(--color-text-muted)' }}>speed</span>
                        <span className="font-mono-data">{v.currentOdometer != null ? v.currentOdometer.toLocaleString() : '—'} km</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="material-icons" style={{ fontSize: 15, color: 'var(--color-text-muted)' }}>local_gas_station</span>
                        <span className="font-mono-data">{v.lastFuelLevel ?? '—'}{fuelPercent != null && '%'}</span>
                      </span>
                    </div>
                    {fuelPercent != null && (
                      <div className="h-[5px] rounded-full overflow-hidden mb-3" style={{ background: 'var(--color-table-head-bg)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${fuelPercent}%`,
                            background: fuelPercent > 50 ? '#34d399' : fuelPercent > 20 ? '#fbbf24' : '#f87171',
                          }}
                        />
                      </div>
                    )}
                    <div className="text-xs flex items-center gap-1.5 mb-4" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="material-icons" style={{ fontSize: 15 }}>person</span>
                      {v.lastUsedByUser ?? '—'}
                    </div>
                    <div className="mt-auto flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(v)}
                        className="btn-primary w-full py-2.5 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(v)}
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#f87171' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
```

- [ ] **Step 7: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/vehicles`: confirmar (a) el subtítulo "N unidades en la flota" bajo el título; (b) el buscador único filtra tanto en vista tarjetas como en vista tabla; (c) los chips de estado ("Todos"/"Disponible"/"En uso"/"Mantenimiento" con conteo en mono) filtran igual que antes; (d) alternar tarjetas/tabla conserva el filtro y la página actual; (e) en tarjetas, la placa aparece como chip mono, el badge de estado con punto de color, ícono de auto en acento ámbar, barra de combustible solo cuando `lastFuelLevel` es un número simple (probar editando un vehículo y poniendo "80" vs "3/4" en un registro de combustible si aplica); (f) alternar tema claro/oscuro y confirmar que ninguna tarjeta ni la tabla quedan con fondo blanco fijo en modo oscuro; (g) Editar/Eliminar siguen funcionando igual que antes en ambas vistas.

- [ ] **Step 8: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Vehicles/VehiclesList.tsx
git commit -m "$(cat <<'EOF'
feat(redesign): restyle Vehicles list to match new mockup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Vehicle request page (`VehicleRequestPage.tsx`) — minimal reskin

**Files:**
- Modify: `frontend/src/pages/VehicleRequest/VehicleRequestPage.tsx:150`
- Modify: `frontend/src/pages/VehicleRequest/VehicleRequestPage.tsx:307-309`
- Modify: `frontend/src/pages/VehicleRequest/VehicleRequestPage.tsx:328`

**Interfaces:** N/A — no functional changes.

**Design note:** This page's card grid (`solList` in `solicitud-vehiculos.txt`) already matches the current implementation almost 1:1 — same plate-mono chip, name+year, color/type/odometer/fuel/last-driver lines, and reserve button with disabled state for `maintenance`. The mockup adds an `availTypes` chip row grouping vehicles by type (Sedán/Pickup/Van/SUV) with counts — same as Task 7, this needs a `Vehicle.type` field that does not exist in the backend entity, so **it is intentionally omitted** rather than invented. `statusBadgeStyle` (lines 44-48) already uses green/amber/slate semantics, not old-blue-family colors, so it needs no change. As a result this page only needs the confirmed hardcoded-blue-literal fixes plus an optional one-line copy tweak to match the mockup's exact wording; no structural changes.

- [ ] **Step 1: Reemplazar los literales de azul heredado**

Cambiar (línea 150):
```tsx
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.08)')}
```
por:
```tsx
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,165,36,0.08)')}
```

Cambiar (línea 328):
```tsx
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,132,255,0.12)')}
```
por:
```tsx
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,165,36,0.12)')}
```

- [ ] **Step 2: Ajustar el subtítulo a la redacción exacta del mockup (cosmético)**

Cambiar (líneas 306-309):
```tsx
        <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Elige un vehículo y haz clic en Reservar para ver disponibilidad y enviar tu solicitud.
        </p>
```
por:
```tsx
        <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Elige un vehículo y haz clic en «Reservar» para ver su disponibilidad y enviar tu solicitud.
        </p>
```

- [ ] **Step 3: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/solicitud-vehiculos`: pasar el mouse sobre el botón × del modal de reserva y confirmar que el highlight ahora es ámbar (no azul); pasar el mouse sobre una tarjeta de vehículo y confirmar que la sombra elevada es ámbar; confirmar que el resto del flujo (elegir usuario si no es conductor, calendario de disponibilidad, validación de fechas, envío de solicitud, toast de éxito) sigue funcionando exactamente igual que antes.

- [ ] **Step 4: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/VehicleRequest/VehicleRequestPage.tsx
git commit -m "$(cat <<'EOF'
fix(redesign): swap remaining hardcoded blue literals for amber on request page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---
### Task 9: Reservas (admin) — `ReservationsList.tsx`

**Files:**
- Modify: `frontend/src/pages/Reservations/ReservationsList.tsx:36-42,416-658`
- Modify: `frontend/src/components/calendar/MobileCalendar.tsx:109,123,160,162,166`

**Interfaces:** N/A (leaf page). No new API endpoints — the new "Rechazar" action reuses the existing `PUT /reservations/:id` status-update endpoint already exercised by `approveMutation` and by the edit modal's `SearchSelect` status field.

**Scope note (read before executing):** the brief that spawned this task says `ReservationsList.tsx` "uses `AllReservationsCalendar.tsx` and `VehicleAvailabilityCalendar.tsx`." That's not accurate for the current codebase — `grep -rn "AllReservationsCalendar\|VehicleAvailabilityCalendar" frontend/src` shows both are only rendered from `Dashboard.tsx`, `ConductorDashboard.tsx` and `VehicleRequestPage.tsx`, never from `ReservationsList.tsx`. So this task does **not** touch any calendar rendering inside the Reservas admin screen — there isn't one. It does still fix the hardcoded old-blue literals in `MobileCalendar.tsx` (Step 7 below) since that file is shared by the two calendar components and was explicitly flagged; those fixes benefit Dashboard/VehicleRequestPage even though they're outside this page's own render tree. `AllReservationsCalendar.tsx` and `VehicleAvailabilityCalendar.tsx` themselves have zero matches for the old-blue grep pattern — no changes needed there.

The design mockup (`reservas.txt`) shows: a header with `h1` "Reservas" (Barlow Condensed, uppercase) + subtitle, and 3 right-aligned KPI numbers (`resStats`); a filter row (status select + search-with-icon + spacer + "Exportar"); a table with columns Folio / Vehículo / Solicitante / Destino / Salida (sortable) / Estado (sortable, colored dot + label) / Acciones (check/close icon buttons when pending, `more_horiz` otherwise). The current implementation already has a themed `SearchSelect`, `TableToolbar` (which already renders CSV/Excel/PDF export — the design's single "Exportar" button maps to that existing control; we do not duplicate it in the filter row per the Global Constraint of not touching shared components), and a generic `DataTable`. This task keeps `TableToolbar`/`DataTable` untouched and re-shapes only this page's own JSX + column config to match: adds a derived (frontend-only) Folio, a Destino column, colored status-dot badges, a "Rechazar" action, and drops the "Fin" column (not present in the design's table; the return date remains editable in the modal, no data is lost, only the list display is trimmed to match the mockup).

- [ ] **Step 1: Add `getFolio` helper and local `statusBadgeStyle`**

Cambiar (líneas 36-43):
```tsx
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Activa' },
  { value: 'completed', label: 'Completada' },
  { value: 'overdue', label: 'Vencida' },
  { value: 'cancelled', label: 'Cancelada' },
];
```
por:
```tsx
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Activa' },
  { value: 'completed', label: 'Completada' },
  { value: 'overdue', label: 'Vencida' },
  { value: 'cancelled', label: 'Cancelada' },
];

// Folio corto derivado del id — solo de despliegue, no existe como campo en backend.
function getFolio(r: { id: string }) {
  return `RES-${r.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function statusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'pending':   return { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' };
    case 'active':    return { background: 'rgba(34,197,94,0.15)',  color: '#4ade80' };
    case 'completed': return { background: 'rgba(148,163,184,0.15)', color: 'var(--color-text-muted)' };
    case 'overdue':   return { background: 'rgba(239,68,68,0.15)',  color: '#f87171' };
    case 'cancelled': return { background: 'rgba(148,163,184,0.12)', color: 'var(--color-text-muted)' };
    default:          return { background: 'rgba(148,163,184,0.12)', color: 'var(--color-text-muted)' };
  }
}
```
(Same status→color mapping already used in `MyRequestsPage.tsx` — kept consistent across both pages, defined locally in each file per the current no-shared-component convention for page-local styling helpers.)

- [ ] **Step 2: Add `rejectMutation` next to `approveMutation`**

Cambiar (líneas 456-459):
```tsx
  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/reservations/${id}`, { status: 'active' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });
```
por:
```tsx
  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/reservations/${id}`, { status: 'active' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/reservations/${id}`, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      notifySuccess('Reserva rechazada.');
    },
    onError: () => notifyError('No se pudo rechazar la reserva.'),
  });
```

- [ ] **Step 3: Include Folio/Destino in exports**

Cambiar (líneas 513-521):
```tsx
  const exportHeaders = ['Vehículo', 'Usuario', 'Inicio', 'Fin', 'Estado'];
  const getExportRows = (list: Reservation[]) =>
    list.map((r) => [
      getVehicleLabel(r),
      getUserLabel(r),
      new Date(r.startDatetime).toLocaleString(),
      new Date(r.endDatetime).toLocaleString(),
      STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status,
    ]);
```
por:
```tsx
  const exportHeaders = ['Folio', 'Vehículo', 'Solicitante', 'Destino', 'Salida', 'Estado'];
  const getExportRows = (list: Reservation[]) =>
    list.map((r) => [
      getFolio(r),
      getVehicleLabel(r),
      getUserLabel(r),
      r.destination ?? '',
      new Date(r.startDatetime).toLocaleString(),
      STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status,
    ]);
```

- [ ] **Step 4: Header — title/subtitle + 3 KPI stats**

Cambiar (líneas 536-540):
```tsx
  return (
    <div className="space-y-6">
      <OverduePanel />
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Gestión de reservas</h2>
        <div className="flex flex-wrap items-center gap-3">
```
por:
```tsx
  const reservationStats = [
    { n: reservations.filter((r: Reservation) => r.status === 'pending').length, label: 'Pendientes', c: 'var(--color-primary)' },
    { n: reservations.filter((r: Reservation) => r.status === 'active').length, label: 'Activas', c: '#4ade80' },
    { n: reservations.filter((r: Reservation) => r.status === 'overdue').length, label: 'Vencidas', c: '#f87171' },
  ];

  return (
    <div className="space-y-6">
      <OverduePanel />
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1
            className="text-[28px] font-semibold uppercase tracking-wide m-0"
            style={{ color: 'var(--color-text)', fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Reservas
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Aprueba o rechaza directamente desde la tabla.
          </p>
        </div>
        <div className="flex gap-4">
          {reservationStats.map((s) => (
            <div key={s.label} className="text-right">
              <div className="font-mono-data text-[22px] font-semibold" style={{ color: s.c }}>{s.n}</div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
```

- [ ] **Step 5: Filter row — move search up, drop the old create-button styling, close the header `<div>`**

Cambiar (líneas 541-567, el resto del bloque de filtros hasta la apertura del contenedor de tabla):
```tsx
            <SearchSelect
              options={[{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS]}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Todos los estados"
              className="w-48"
            />
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
            >
              Nueva reserva (admin)
            </button>
          </div>
      </div>
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 pt-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por vehículo, usuario, evento o destino..."
                className="input-field w-full max-w-sm"
              />
            </div>
```
por:
```tsx
        <SearchSelect
          options={[{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS]}
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Todos los estados"
          className="w-48"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Folio, placa o solicitante..."
          className="input-field w-60"
        />
        <div className="flex-1" />
        <button type="button" onClick={openCreate} className="btn-primary">
          Nueva reserva (admin)
        </button>
      </div>
      <div className="rounded-[16px] shadow-sm overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
```
(el `<TableToolbar>` que sigue justo después queda intacto — sigue siendo la fuente de la exportación y paginación, ahora dentro del wrapper themed.)

- [ ] **Step 6: Table columns — Folio, badge de vehículo, Solicitante, Destino, Salida, Estado con punto, Acciones con aprobar/rechazar**

Cambiar (líneas 581-617):
```tsx
            <DataTable<Reservation>
              columns={[
                { key: 'vehicle', header: 'Vehículo', sortAccessor: (r) => getVehicleLabel(r), cellClassName: 'font-medium', render: (r) => getVehicleLabel(r) },
                { key: 'user', header: 'Usuario', sortAccessor: (r) => getUserLabel(r), render: (r) => getUserLabel(r) },
                { key: 'start', header: 'Inicio', sortAccessor: (r) => r.startDatetime, render: (r) => new Date(r.startDatetime).toLocaleString() },
                { key: 'end', header: 'Fin', sortAccessor: (r) => r.endDatetime, render: (r) => new Date(r.endDatetime).toLocaleString() },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (r) => (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent">
                      {STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Acciones',
                  align: 'right',
                  render: (r) => (
                    <>
                      {r.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => approveMutation.mutate(r.id)}
                          disabled={approveMutation.isPending}
                          className="mr-3 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                      )}
                      <button type="button" onClick={() => openEdit(r)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                      <button type="button" onClick={() => handleDelete(r)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                    </>
                  ),
                },
              ]}
```
por:
```tsx
            <DataTable<Reservation>
              columns={[
                { key: 'folio', header: 'Folio', cellClassName: 'font-mono-data', cellStyle: { color: 'var(--color-primary)' }, render: (r) => getFolio(r) },
                {
                  key: 'vehicle',
                  header: 'Vehículo',
                  sortAccessor: (r) => getVehicleLabel(r),
                  render: (r) => (
                    <span
                      className="font-mono-data text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border-strong)' }}
                    >
                      {getVehicleLabel(r)}
                    </span>
                  ),
                },
                { key: 'user', header: 'Solicitante', sortAccessor: (r) => getUserLabel(r), cellClassName: 'font-medium', render: (r) => getUserLabel(r) },
                { key: 'destination', header: 'Destino', cellStyle: { color: 'var(--color-text-soft)' }, render: (r) => r.destination || '—' },
                {
                  key: 'start',
                  header: 'Salida',
                  sortAccessor: (r) => r.startDatetime,
                  cellClassName: 'font-mono-data whitespace-nowrap',
                  cellStyle: { color: 'var(--color-text-soft)' },
                  render: (r) => new Date(r.startDatetime).toLocaleString(),
                },
                {
                  key: 'status',
                  header: 'Estado',
                  sortAccessor: (r) => r.status,
                  render: (r) => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={statusBadgeStyle(r.status)}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                      {STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Acciones',
                  align: 'right',
                  render: (r) => (
                    <>
                      {r.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            title="Aprobar"
                            onClick={() => approveMutation.mutate(r.id)}
                            disabled={approveMutation.isPending}
                            className="mr-1.5 w-8 h-8 rounded-lg inline-flex items-center justify-center disabled:opacity-50"
                            style={{ border: '1px solid var(--color-border)', color: '#4ade80' }}
                          >
                            <span className="material-icons text-[17px]">check</span>
                          </button>
                          <button
                            type="button"
                            title="Rechazar"
                            onClick={() => rejectMutation.mutate(r.id)}
                            disabled={rejectMutation.isPending}
                            className="mr-3 w-8 h-8 rounded-lg inline-flex items-center justify-center disabled:opacity-50"
                            style={{ border: '1px solid var(--color-border)', color: '#f87171' }}
                          >
                            <span className="material-icons text-[17px]">close</span>
                          </button>
                        </>
                      )}
                      <button type="button" onClick={() => openEdit(r)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                      <button type="button" onClick={() => handleDelete(r)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                    </>
                  ),
                },
              ]}
```
(El resto de props del `<DataTable>` — `rows`, `getRowKey`, `emptyMessage`, `sortKey`, `sortDir`, `onSort`, líneas 618-624 — quedan sin cambios.)

- [ ] **Step 7: Fix hardcoded old-blue literals in `MobileCalendar.tsx`** (shared by the calendars used in Dashboard/ConductorDashboard/VehicleRequestPage, not by this page directly — see scope note above)

Cambiar (línea 109 y su gemela en línea 123):
```tsx
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.08)')}
```
por (en ambas ocurrencias):
```tsx
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,165,36,0.08)')}
```

Cambiar (líneas 158-166):
```tsx
              style={
                selected
                  ? { background: 'linear-gradient(135deg,#6384ff,#5a6fff)', color: '#fff' }
                  : today
                  ? { outline: '2px solid #6384ff', outlineOffset: '-2px' }
                  : {}
              }
              onMouseEnter={e => {
                if (!selected) (e.currentTarget as HTMLElement).style.background = 'rgba(99,132,255,0.08)';
              }}
```
por:
```tsx
              style={
                selected
                  ? { background: 'linear-gradient(135deg,#f5a524,#e08700)', color: '#fff' }
                  : today
                  ? { outline: '2px solid #f5a524', outlineOffset: '-2px' }
                  : {}
              }
              onMouseEnter={e => {
                if (!selected) (e.currentTarget as HTMLElement).style.background = 'rgba(245,165,36,0.08)';
              }}
```

- [ ] **Step 8: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/reservations`: confirmar el nuevo encabezado "RESERVAS" (Barlow Condensed, mayúsculas) con las 3 cifras KPI (Pendientes/Activas/Vencidas) a la derecha; la fila de filtros con selector + buscador + botón "Nueva reserva (admin)"; la tabla con columnas Folio/Vehículo/Solicitante/Destino/Salida/Estado/Acciones; el badge de Estado con punto de color; en una reserva `pending`, los botones de check/close aprueban y rechazan (rechazar debe dejarla en `cancelled` y desaparecer del filtro "Pendientes"); Editar/Eliminar siguen funcionando; exportar CSV/Excel/PDF desde `TableToolbar` incluye ahora Folio y Destino. Abrir `/dashboard` (admin) y `/conductor` para confirmar que el calendario móvil (achicar la ventana a <1024px) ya no muestra azul en el día seleccionado/hoy, sino ámbar.

- [ ] **Step 9: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Reservations/ReservationsList.tsx frontend/src/components/calendar/MobileCalendar.tsx
git commit -m "$(cat <<'EOF'
feat(redesign): restyle admin Reservations list to match new mockup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Mis solicitudes — `MyRequestsPage.tsx`

**Files:**
- Modify: `frontend/src/pages/MyRequests/MyRequestsPage.tsx:36-45,55-88,92-146,419-717`

**Interfaces:** N/A (leaf page). No new queries — all new elements (Folio, KPI stats) are derived from the already-fetched `reservations` array and its existing `pending`/`active`/`overdue`/`history` partitions.

**Important structural note:** the design mockup (`mis-solicitudes.txt`) shows a single flat table (`misList`: Folio/Evento/Destino/Salida/Estado/Acción, with a "Cancelar" button on pending rows). The real page is much richer than that: it has dedicated overdue-warning cards, pending cards, active-trip cards with photo-upload check-in/check-out flows, and a separate history table — all backed by real mutations (`/reservations/:id/check-in`, `/reservations/:id/check-out`, file uploads). Collapsing that into a flat table would delete working functionality, which the brief explicitly forbids ("preserve 100% of existing functional behavior"). So this task treats the mockup's table as describing the **Historial** section (which already is a flat table) and applies the same visual language (Folio, colored-dot badges, Barlow Condensed header, KPI stats) to the rest of the page without collapsing the card sections.

- [ ] **Step 1: Fix hardcoded old-blue literals**

Cambiar (línea 64):
```tsx
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,132,255,0.10)')}
```
por:
```tsx
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,165,36,0.10)')}
```

Cambiar (línea 298):
```tsx
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.08)')}
```
por:
```tsx
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,165,36,0.08)')}
```

Cambiar (línea 438, idéntica a la de línea 64 pero en `ActiveReservationCard`):
```tsx
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,132,255,0.10)')}
```
por:
```tsx
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,165,36,0.10)')}
```

- [ ] **Step 2: Add `getFolio` helper and a shared `<StatusBadge>` (adds the colored dot from the design, replaces 4 duplicated badge spans)**

Cambiar (líneas 44-45):
```tsx
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
```
por:
```tsx
// Folio corto derivado del id — solo de despliegue, no existe como campo en backend.
function getFolio(r: { id: string }) {
  return `RES-${r.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={statusBadgeStyle(status)}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
```

Ahora reemplazar los 4 usos existentes del patrón `<span ... style={statusBadgeStyle(...)}>...</span>`:

Cambiar (líneas 72-74, en `ReservationCard`):
```tsx
        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={statusBadgeStyle(r.status)}>
          {STATUS_LABELS[r.status] ?? r.status}
        </span>
```
por:
```tsx
        <StatusBadge status={r.status} />
```

Cambiar (líneas 112-114, en `OverdueCard`):
```tsx
        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={statusBadgeStyle('overdue')}>
          Vencida
        </span>
```
por:
```tsx
        <StatusBadge status="overdue" />
```

Cambiar (líneas 446-448, en `ActiveReservationCard`):
```tsx
        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={statusBadgeStyle(r.status)}>
          {STATUS_LABELS[r.status] ?? r.status}
        </span>
```
por:
```tsx
        <StatusBadge status={r.status} />
```

Cambiar (líneas 697-701, en la columna `status` de la tabla de Historial):
```tsx
                    render: (r) => (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={statusBadgeStyle(r.status)}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    ),
```
por:
```tsx
                    render: (r) => <StatusBadge status={r.status} />,
```

- [ ] **Step 3: Header — título uppercase + copy del mockup + 3 KPI stats junto al botón "Nueva solicitud"**

Cambiar (líneas 562-576):
```tsx
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Mis solicitudes</h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Tus reservas pendientes y el historial de solicitudes de vehículos.
          </p>
        </div>
        <Link
          to="/solicitud-vehiculos"
          className="btn-primary inline-flex items-center gap-2 px-4 py-2.5"
        >
          <span className="material-icons text-lg">add</span>
          Nueva solicitud
        </Link>
      </div>
```
por:
```tsx
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1
            className="text-[28px] font-semibold uppercase tracking-wide m-0"
            style={{ color: 'var(--color-text)', fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Mis solicitudes
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Historial y estado de tus solicitudes de vehículo.
          </p>
        </div>
        <div className="flex items-end gap-4">
          {[
            { n: pending.length, label: 'Pendientes', c: 'var(--color-primary)' },
            { n: active.length, label: 'En curso', c: '#4ade80' },
            { n: overdue.length, label: 'Vencidas', c: '#f87171' },
          ].map((s) => (
            <div key={s.label} className="text-right">
              <div className="font-mono-data text-[22px] font-semibold" style={{ color: s.c }}>{s.n}</div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
          <Link
            to="/solicitud-vehiculos"
            className="btn-primary inline-flex items-center gap-2 px-4 py-2.5"
          >
            <span className="material-icons text-lg">add</span>
            Nueva solicitud
          </Link>
        </div>
      </div>
```
(`pending`, `active`, `overdue` ya están calculados más arriba en el componente — líneas 503-505 — no se necesita ningún dato nuevo.)

- [ ] **Step 4: Añadir Folio a los encabezados de las tarjetas**

Cambiar (línea 69, en `ReservationCard`):
```tsx
          <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>{r.eventName || 'Reserva'}</h4>
```
por:
```tsx
          <p className="font-mono-data text-xs" style={{ color: 'var(--color-primary)' }}>{getFolio(r)}</p>
          <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>{r.eventName || 'Reserva'}</h4>
```

Cambiar (línea 109, en `OverdueCard`):
```tsx
          <h4 className="font-semibold" style={{ color: '#f87171' }}>{r.eventName || 'Reserva'}</h4>
```
por:
```tsx
          <p className="font-mono-data text-xs" style={{ color: '#f87171' }}>{getFolio(r)}</p>
          <h4 className="font-semibold" style={{ color: '#f87171' }}>{r.eventName || 'Reserva'}</h4>
```

Cambiar (línea 443, en `ActiveReservationCard`):
```tsx
          <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>{r.eventName || 'Reserva'}</h4>
```
por:
```tsx
          <p className="font-mono-data text-xs" style={{ color: 'var(--color-primary)' }}>{getFolio(r)}</p>
          <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>{r.eventName || 'Reserva'}</h4>
```

- [ ] **Step 5: Historial — añadir columna Folio, quitar columna Regreso (no está en el mockup; la fecha de regreso sigue disponible al editar/revisar la reserva, solo se retira de esta lista para igualar el diseño)**

Cambiar (líneas 655-693):
```tsx
            <DataTable<Reservation>
              columns={
                [
                  {
                    key: 'vehicle',
                    header: 'Vehículo',
                    sortAccessor: (r) => getHistoryVehicleLabel(r),
                    cellClassName: 'font-medium whitespace-nowrap',
                    cellStyle: { color: 'var(--color-text-soft)' },
                    render: (r) => getHistoryVehicleLabel(r),
                  },
                  {
                    key: 'event',
                    header: 'Evento',
                    cellClassName: 'max-w-[200px]',
                    cellStyle: { color: 'var(--color-text-soft)' },
                    render: (r) => (
                      <>
                        <div className="truncate">{r.eventName || '—'}</div>
                        {r.destination && <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{r.destination}</div>}
                      </>
                    ),
                  },
                  {
                    key: 'start',
                    header: 'Salida',
                    sortAccessor: (r) => r.startDatetime,
                    cellClassName: 'whitespace-nowrap',
                    cellStyle: { color: 'var(--color-text-muted)' },
                    render: (r) => formatDate(r.startDatetime),
                  },
                  {
                    key: 'end',
                    header: 'Regreso',
                    sortAccessor: (r) => r.endDatetime,
                    cellClassName: 'whitespace-nowrap',
                    cellStyle: { color: 'var(--color-text-muted)' },
                    render: (r) => formatDate(r.endDatetime),
                  },
```
por:
```tsx
            <DataTable<Reservation>
              columns={
                [
                  {
                    key: 'folio',
                    header: 'Folio',
                    cellClassName: 'font-mono-data whitespace-nowrap',
                    cellStyle: { color: 'var(--color-primary)' },
                    render: (r) => getFolio(r),
                  },
                  {
                    key: 'vehicle',
                    header: 'Vehículo',
                    sortAccessor: (r) => getHistoryVehicleLabel(r),
                    cellClassName: 'font-medium whitespace-nowrap',
                    cellStyle: { color: 'var(--color-text-soft)' },
                    render: (r) => getHistoryVehicleLabel(r),
                  },
                  {
                    key: 'event',
                    header: 'Evento',
                    cellClassName: 'max-w-[200px]',
                    cellStyle: { color: 'var(--color-text-soft)' },
                    render: (r) => (
                      <>
                        <div className="truncate">{r.eventName || '—'}</div>
                        {r.destination && <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{r.destination}</div>}
                      </>
                    ),
                  },
                  {
                    key: 'start',
                    header: 'Salida',
                    sortAccessor: (r) => r.startDatetime,
                    cellClassName: 'font-mono-data whitespace-nowrap',
                    cellStyle: { color: 'var(--color-text-muted)' },
                    render: (r) => formatDate(r.startDatetime),
                  },
```
(el resto del array de `columns` — la columna `status`, ya actualizada en el Step 2 — y el cierre del `<DataTable>` no cambian.)

- [ ] **Step 6: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Iniciar sesión como conductor y abrir `/mis-solicitudes` (o la ruta que monte `MyRequestsPage`): confirmar el encabezado "MIS SOLICITUDES" en mayúsculas con las 3 cifras (Pendientes/En curso/Vencidas) junto al botón "Nueva solicitud"; cada tarjeta (pendiente, vencida, en curso) muestra ahora un folio corto `RES-XXXXXX` sobre el nombre del evento; los badges de estado muestran el punto de color; la tabla de Historial tiene columnas Folio/Vehículo/Evento/Salida/Estado (sin "Regreso"). Verificar que check-in/check-out (con foto) en una reserva activa y el aviso de vencida con su botón de check-out pendiente siguen funcionando exactamente igual que antes — esto es lo crítico a no romper.

- [ ] **Step 7: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/MyRequests/MyRequestsPage.tsx
git commit -m "$(cat <<'EOF'
feat(redesign): restyle driver "Mis solicitudes" page to match new mockup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---
### Task 11: Maintenance list — dark-mode token fix, status badges, KPI row

**Files:**
- Modify: `frontend/src/pages/Maintenance/MaintenanceList.tsx:27-431`

**Interfaces:** N/A (leaf page, no exported interface changes).

**Context:** Grepped for old-blue-family hex literals (`#6384ff|#5a6fff|#818cf8|rgba(99,132,255|rgba(99,102,241|#6366f1`) — zero matches in this file, confirmed by:
```bash
grep -n "#6384ff\|#5a6fff\|#818cf8\|rgba(99, *132, *255\|rgba(99, *102, *241\|#6366f1" frontend/src/pages/Maintenance/MaintenanceList.tsx
# (no output)
```
However, this file was **not** included in the prior `fix(U1)` pass (commit `80500060`, which only touched `ReservationsList.tsx`, `UsersList.tsx`, `VehiclesList.tsx`). It still hardcodes light-mode-only Tailwind classes (`bg-white`, `border-slate-200`, `text-slate-700/900`, `bg-red-50/text-red-700`, `hover:bg-slate-50`) throughout the modal, header, table container and card view. Once the Foundation CSS-var rewrite ships, these elements will stay stuck in light colors in the new dark warm theme — this is the real, concrete gap for this page, not a color-literal swap. Fix follows the exact pattern already established by `fix(U1)` (`style={{ color: 'var(--color-text)' }}` etc.) plus the shared `.input-field`/`.btn-primary`/`.btn-ghost` utility classes that already exist in `frontend/src/index.css` (confirmed: `.input-field` line 278, `.btn-primary` line 223, `.btn-ghost` line 254, `.badge`/`.badge-*` line 195) and will keep working unchanged after the Foundation rewrite.

- [ ] **Step 1: Modal chrome — replace hardcoded light classes with themed equivalents**

Cambiar (líneas 87-100):
```tsx
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {maintenance ? 'Editar mantenimiento' : 'Nuevo mantenimiento'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
```
por:
```tsx
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="rounded-[16px] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {maintenance ? 'Editar mantenimiento' : 'Nuevo mantenimiento'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>{error}</div>
          )}
```

- [ ] **Step 2: Labels, inputs and Cancelar/Guardar buttons — swap to shared classes (mechanical, applies to every occurrence in the file)**

| Old `className` value (líneas donde aparece) | Nuevo |
|---|---|
| `"block text-sm font-medium text-slate-700 mb-1"` (102, 113, 124, 134, 145, 155 — 6 veces) | `"block text-sm font-medium mb-1"` + `style={{ color: 'var(--color-text-soft)' }}` |
| `"w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"` (119, 130, 151, 160 — 4 veces) | `"input-field"` |
| `"flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"` (167) | `"btn-ghost flex-1"` |
| `"flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"` (174) | `"btn-primary flex-1"` |

Since each string is byte-identical everywhere it appears in this file, apply each row as one `Edit` call with `replace_all: true` (e.g. old_string `className="block text-sm font-medium text-slate-700 mb-1"` → new_string `className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}`, and likewise for the other three rows).

- [ ] **Step 3: Main list — heading, "Nuevo mantenimiento" button (rename + icon to match mockup copy "Programar servicio"), and table/card containers**

Cambiar (línea 288):
```tsx
        <h2 className="text-2xl font-bold text-slate-900">Mantenimientos</h2>
```
por:
```tsx
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Mantenimientos</h2>
```

Cambiar (líneas 305-311):
```tsx
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
          >
            Nuevo mantenimiento
          </button>
```
por:
```tsx
          <button type="button" onClick={openCreate} className="btn-primary">
            <span className="material-icons" style={{ fontSize: 17 }}>add</span>
            Programar servicio
          </button>
```
(el mockup usa "Programar servicio" como copy del botón principal — se conserva la misma acción `openCreate`, solo cambia el texto/ícono).

Cambiar (línea 316):
```tsx
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
```
por:
```tsx
        <div className="rounded-[16px] shadow-sm overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
```

Cambiar (línea 379):
```tsx
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
```
por:
```tsx
            <div className="col-span-full rounded-[16px] shadow-sm px-6 py-12 text-center" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
```

Cambiar (línea 384):
```tsx
              <div key={m.id} className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col">
```
por:
```tsx
              <div key={m.id} className="rounded-[16px] shadow-sm p-5 flex flex-col" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
```

- [ ] **Step 4: Card-view text hierarchy — swap slate text classes to theme tokens**

| Old (línea) | Nuevo |
|---|---|
| `className="font-medium text-slate-900"` (385) | `className="font-medium" style={{ color: 'var(--color-text)' }}` |
| `className="text-slate-600 text-sm mt-1"` (388) | `className="text-sm mt-1" style={{ color: 'var(--color-text-soft)' }}` |
| `className="text-slate-500 text-sm mt-0.5"` (389) | `className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}` |
| `className="text-slate-500 text-xs mt-2 line-clamp-2"` (396) | `className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}` |
| `className="mt-4 pt-4 border-t border-slate-100 flex gap-3"` (398) | `className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}` |

Each string occurs exactly once in the file (verified via `grep -c`), apply as individual edits.

- [ ] **Step 5: Per-status colored badge (replaces the flat "always primary" pill with mockup-style per-status color)**

Añadir después de `STATUS_OPTIONS` (línea 32, antes de la función `MaintenanceFormModal`):
```ts
const STATUS_BADGE: Record<string, string> = {
  scheduled: 'badge-blue',
  in_progress: 'badge-amber',
  completed: 'badge-green',
  cancelled: 'badge-slate',
};
```

Cambiar (bloque idéntico, aparece 2 veces — línea 349-351 dentro de la columna `status` del `DataTable`, y línea 391-393 en la vista de tarjetas; ambas ocurrencias son byte-idénticas, usar `replace_all: true`):
```tsx
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {STATUS_OPTIONS.find((o) => o.value === m.status)?.label ?? m.status}
                  </span>
```
por:
```tsx
                  <span className={`badge ${STATUS_BADGE[m.status] ?? 'badge-slate'}`}>
                    {STATUS_OPTIONS.find((o) => o.value === m.status)?.label ?? m.status}
                  </span>
```

- [ ] **Step 6: KPI stat-card row (new element from the mockup's `mxStats` grid, built from data already loaded via `maintenanceList` — no new query/endpoint)**

Insertar entre línea 313 (`</div>` que cierra el header) y línea 315 (`{view === 'table' && (`), reutilizando las clases compartidas `.stat-card`/`.stat-card__value`/`.stat-card__label` (ya usadas en `Dashboard.tsx:275-336`, sobreviven sin cambios a la reescritura de Foundation):
```tsx
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card blue">
          <span className="stat-card__value">
            {maintenanceList.filter((m: Maintenance) => m.status === 'scheduled').length}
          </span>
          <div className="stat-card__label">Programados</div>
        </div>
        <div className="stat-card amber">
          <span className="stat-card__value">
            {maintenanceList.filter((m: Maintenance) => m.status === 'in_progress').length}
          </span>
          <div className="stat-card__label">En progreso</div>
        </div>
        <div className="stat-card green">
          <span className="stat-card__value">
            {maintenanceList.filter((m: Maintenance) => m.status === 'completed').length}
          </span>
          <div className="stat-card__label">Completados</div>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">
            {maintenanceList.filter((m: Maintenance) => m.status === 'cancelled').length}
          </span>
          <div className="stat-card__label">Cancelados</div>
        </div>
      </div>
```
Nota: los conteos reflejan la lista ya filtrada por `filterVehicleId`/`filterStatus` (mismo comportamiento que los KPIs de `Dashboard.tsx`, que también reflejan el filtro de rango activo) — comportamiento aceptado, no requiere una query separada sin filtrar.

- [ ] **Step 7: Elementos del mockup deliberadamente fuera de alcance (sin cambios de código)**

El mockup de "Mantenimiento" muestra columnas `Folio` y `Taller` que no existen en el modelo actual (`backend/src/database/entities/maintenance.entity.ts` solo tiene `id, vehicleId, scheduledDate, type, description, status, odometerAtService` — sin campo de taller/proveedor ni folio). Por instrucción explícita de no inventar endpoints/campos de backend nuevos, estas dos columnas **no** se agregan en este pase; la columna `Descripción` ya existente cubre ese contenido informativo. Si se requiere en el futuro, es tarea de un sprint de backend (nuevo campo `workshop`/`provider_id` + migración), no de este pase de reskin visual.

- [ ] **Step 8: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/maintenance`. Confirmar: en modo oscuro (tema amber por defecto tras Foundation) el modal, el contenedor de tabla y las tarjetas ya NO se ven blancos/con bordes claros — usan `var(--color-bg-soft)`/`var(--color-border)`. El botón principal dice "Programar servicio" con ícono `add`. Los 4 KPIs arriba de la tabla muestran conteos correctos por estado. La columna "Estado" muestra colores distintos por estado (azul/ámbar/verde/gris) en vez de un pill amarillo/ámbar uniforme. Cambiar a tema claro (toggle del header) y confirmar que todo sigue siendo legible.

- [ ] **Step 9: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Maintenance/MaintenanceList.tsx
git commit -m "$(cat <<'EOF'
fix(redesign): theme Maintenance page for dark mode, add status badges and KPI row

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Fuel records list — dark-mode token fix, KPI row

**Files:**
- Modify: `frontend/src/pages/FuelRecords/FuelRecordsList.tsx:1-368`

**Interfaces:** N/A.

**Context:** Same grep, same result — zero old-blue-family literals:
```bash
grep -n "#6384ff\|#5a6fff\|#818cf8\|rgba(99, *132, *255\|rgba(99, *102, *241\|#6366f1" frontend/src/pages/FuelRecords/FuelRecordsList.tsx
# (no output)
```
This file also predates `fix(U1)` and has the same hardcoded `bg-white`/`slate-*` issue as Maintenance (23 occurrences of `bg-white`/`slate`/`bg-red-50` classes). Same fix pattern applies.

- [ ] **Step 1: Modal chrome**

Cambiar (líneas 77-89):
```tsx
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {record ? 'Editar registro de combustible' : 'Nuevo registro de combustible'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
```
por:
```tsx
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="rounded-[16px] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {record ? 'Editar registro de combustible' : 'Nuevo registro de combustible'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>{error}</div>}
```

- [ ] **Step 2: Labels, inputs, Cancelar/Guardar — mismas reglas mecánicas que Task 11**

| Old `className` (líneas) | Nuevo |
|---|---|
| `"block text-sm font-medium text-slate-700 mb-1"` (90, 101, 112, 124, 136 — 5 veces) | `"block text-sm font-medium mb-1"` + `style={{ color: 'var(--color-text-soft)' }}` |
| `"w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"` (107, 120, 131, 142 — 4 veces) | `"input-field"` |
| `"flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"` (146, embebido en el botón Cancelar) | `"btn-ghost flex-1"` |
| `"flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"` (147) | `"btn-primary flex-1"` |

Aplicar con `Edit`/`replace_all: true` sobre el valor exacto de `className`.

- [ ] **Step 3: Encabezado, botón principal (copy "Registrar carga"), filtros de fecha, contenedores**

Cambiar (línea 252):
```tsx
        <h2 className="text-2xl font-bold text-slate-900">Registros de combustible</h2>
```
por:
```tsx
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Registros de combustible</h2>
```

Cambiar (línea 264):
```tsx
          <button type="button" onClick={openCreate} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium">Nuevo registro</button>
```
por:
```tsx
          <button type="button" onClick={openCreate} className="btn-primary">
            <span className="material-icons" style={{ fontSize: 17 }}>add</span>
            Registrar carga
          </button>
```

Cambiar (líneas 261-262, filtros de fecha — **no** usar `.input-field` aquí porque su `width: 100%` rompería el ancho fijo `w-40` en este flex row; fijar solo colores):
```tsx
          <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
```
por:
```tsx
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-40 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-40 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
```

Cambiar (línea 269):
```tsx
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
```
por:
```tsx
        <div className="rounded-[16px] shadow-sm overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
```

Cambiar (línea 325):
```tsx
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">No hay registros de combustible.</div>
```
por:
```tsx
            <div className="col-span-full rounded-[16px] shadow-sm px-6 py-12 text-center" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>No hay registros de combustible.</div>
```

Cambiar (línea 328):
```tsx
              <div key={r.id} className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col">
```
por:
```tsx
              <div key={r.id} className="rounded-[16px] shadow-sm p-5 flex flex-col" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
```

- [ ] **Step 4: Texto de la vista de tarjetas**

| Old (línea) | Nuevo |
|---|---|
| `className="font-medium text-slate-900"` (329) | `className="font-medium" style={{ color: 'var(--color-text)' }}` |
| `className="text-slate-600 text-sm mt-1"` (330) | `className="text-sm mt-1" style={{ color: 'var(--color-text-soft)' }}` |
| `className="text-slate-600 text-sm mt-0.5"` (331) | `className="text-sm mt-0.5" style={{ color: 'var(--color-text-soft)' }}` |
| `className="text-slate-500 text-sm"` (332 y 333, idénticas — `replace_all: true`) | `className="text-sm" style={{ color: 'var(--color-text-muted)' }}` |
| `className="mt-4 pt-4 border-t border-slate-100 flex gap-3"` (334) | `className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}` |

- [ ] **Step 5: KPI stat-card row (mockup muestra "Litros este mes", "Gasto este mes", "Rendimiento promedio" — computado en cliente desde `records`, ya cargado; sin nuevo endpoint)**

Añadir, antes del `return` del componente (justo después de `getVehicleLabel`, línea 211, y antes del bloque `useDataTable`):
```ts
  const now = new Date();
  const monthRecords = records.filter((r: FuelRecord) => {
    const d = new Date(r.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const totalLitersMonth = monthRecords.reduce((sum: number, r: FuelRecord) => sum + Number(r.liters || 0), 0);
  const totalCostMonth = monthRecords.reduce((sum: number, r: FuelRecord) => sum + Number(r.cost || 0), 0);
  const avgKmPerLiter = (() => {
    const byVehicle = new Map<string, FuelRecord[]>();
    monthRecords
      .filter((r: FuelRecord) => r.odometer != null)
      .forEach((r: FuelRecord) => {
        const list = byVehicle.get(r.vehicleId) ?? [];
        list.push(r);
        byVehicle.set(r.vehicleId, list);
      });
    let totalKm = 0;
    let totalLitersUsed = 0;
    byVehicle.forEach((list) => {
      const sorted = [...list].sort((a, b) => (a.odometer ?? 0) - (b.odometer ?? 0));
      for (let i = 1; i < sorted.length; i++) {
        const km = (sorted[i].odometer ?? 0) - (sorted[i - 1].odometer ?? 0);
        if (km > 0) {
          totalKm += km;
          totalLitersUsed += Number(sorted[i].liters || 0);
        }
      }
    });
    return totalLitersUsed > 0 ? totalKm / totalLitersUsed : null;
  })();
```
(cálculo defensivo: agrupa por vehículo, ordena por odómetro, suma solo saltos positivos de kilometraje entre cargas consecutivas — evita dividir entre cero y evita contar el primer registro de cada vehículo, que no tiene una carga previa de referencia).

Insertar entre línea 266 (`</div>` que cierra el header) y línea 268 (`{view === 'table' && (`):
```tsx
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card blue">
          <span className="stat-card__value">{formatNum(totalLitersMonth)} L</span>
          <div className="stat-card__label">Litros este mes</div>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">${formatNum(totalCostMonth)}</span>
          <div className="stat-card__label">Gasto este mes</div>
        </div>
        <div className="stat-card green">
          <span className="stat-card__value">
            {avgKmPerLiter == null ? '—' : `${avgKmPerLiter.toFixed(1)} km/L`}
          </span>
          <div className="stat-card__label">Rendimiento promedio</div>
        </div>
      </div>
```
(reutiliza `formatNum`, ya definido en el componente línea 207).

- [ ] **Step 6: Elemento del mockup fuera de alcance**

El mockup de "Combustible" incluye una columna `Conductor` (`f.driver`). El modelo actual (`backend/src/database/entities/fuel-record.entity.ts`) no tiene campo de conductor/usuario asociado a la carga (solo `vehicleId, date, liters, cost, odometer`) — a diferencia de `Incident`, que sí registra `userId`. Agregar esa columna requeriría un campo de backend nuevo, fuera del alcance de este pase de reskin visual; se documenta aquí y se deja para un sprint de backend si se decide capturar el conductor en cada carga.

- [ ] **Step 7: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/fuel-records`. Confirmar: modal/tabla/tarjetas usan colores de tema (no blanco fijo) en modo oscuro. Botón principal dice "Registrar carga" con ícono. Los 3 KPIs muestran litros/gasto del mes actual y rendimiento (o "—" si no hay suficientes cargas con odómetro para calcularlo). Los filtros de fecha siguen funcionando igual que antes.

- [ ] **Step 8: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/FuelRecords/FuelRecordsList.tsx
git commit -m "$(cat <<'EOF'
fix(redesign): theme Fuel records page for dark mode, add KPI row

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Incidents list — dark-mode token fix, status badges

**Files:**
- Modify: `frontend/src/pages/Incidents/IncidentList.tsx:30-456`

**Interfaces:** N/A.

**Context:** Same grep, same result:
```bash
grep -n "#6384ff\|#5a6fff\|#818cf8\|rgba(99, *132, *255\|rgba(99, *102, *241\|#6366f1" frontend/src/pages/Incidents/IncidentList.tsx
# (no output)
```
This file was in `fix(U1)`'s target table only for the `ConfirmDialog` migration (a *different*, already-completed sprint task — see `docs/superpowers/plans/2026-07-15-sprint2-componentes.md` Task 2 rollout table, line 410), **not** for the light-mode-class fix. It still has the same hardcoded `bg-white`/`slate-*` issue (22 occurrences). Unlike Maintenance/Fuel, the mockup for "Incidencias" (`incidencias.txt`) has **no** KPI stat-card row — table only — so no KPI addition is needed here; this task is a pure token/class fix + status badge.

- [ ] **Step 1: Modal chrome**

Cambiar (líneas 93-106):
```tsx
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {incident ? 'Editar incidente' : 'Nuevo incidente'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
```
por:
```tsx
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="rounded-[16px] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {incident ? 'Editar incidente' : 'Nuevo incidente'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>{error}</div>
          )}
```

- [ ] **Step 2: "Usuario actual" read-only chip (conductor) — único bloque de este archivo con clases distintas al resto**

Cambiar (líneas 119-124):
```tsx
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario (opcional)</label>
            {esConductor ? (
              <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium flex items-center gap-2">
                <span className="material-icons text-slate-400 text-base">person</span>
                {userData?.displayName || userData?.email || 'Usuario actual'}
              </div>
            ) : (
```
por:
```tsx
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Usuario (opcional)</label>
            {esConductor ? (
              <div
                className="w-full px-3 py-2 rounded-lg font-medium flex items-center gap-2"
                style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <span className="material-icons text-base" style={{ color: 'var(--color-text-muted)' }}>person</span>
                {userData?.displayName || userData?.email || 'Usuario actual'}
              </div>
            ) : (
```
(esta label ya no coincide con la clase repetida del Step 3 porque ya se editó individualmente aquí — al aplicar el Step 3 con `replace_all`, esta línea ya no tendrá el string viejo y no se verá afectada de nuevo).

- [ ] **Step 3: Resto de labels, inputs, Cancelar/Guardar — mismas reglas mecánicas (aplicar después del Step 2, para no chocar con la label ya editada ahí)**

| Old `className` (líneas restantes) | Nuevo |
|---|---|
| `"block text-sm font-medium text-slate-700 mb-1"` (108, 136, 146, 156 — 4 veces restantes tras el Step 2) | `"block text-sm font-medium mb-1"` + `style={{ color: 'var(--color-text-soft)' }}` |
| `"w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"` (142, 162 — 2 veces) | `"input-field"` |
| `"flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"` (167) | `"btn-ghost flex-1"` |
| `"flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"` (176) | `"btn-primary flex-1"` |

- [ ] **Step 4: Encabezado, botón principal (copy "Reportar incidencia"), contenedores**

Cambiar (línea 313):
```tsx
        <h2 className="text-2xl font-bold text-slate-900">Incidentes</h2>
```
por:
```tsx
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Incidentes</h2>
```

Cambiar (líneas 330-336):
```tsx
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
          >
            Nuevo incidente
          </button>
```
por:
```tsx
          <button type="button" onClick={openCreate} className="btn-primary">
            <span className="material-icons" style={{ fontSize: 17 }}>add</span>
            Reportar incidencia
          </button>
```

Cambiar (línea 341):
```tsx
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
```
por:
```tsx
        <div className="rounded-[16px] shadow-sm overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
```

Cambiar (línea 405):
```tsx
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
```
por:
```tsx
            <div className="col-span-full rounded-[16px] shadow-sm px-6 py-12 text-center" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
```

Cambiar (línea 410):
```tsx
              <div key={i.id} className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col">
```
por:
```tsx
              <div key={i.id} className="rounded-[16px] shadow-sm p-5 flex flex-col" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
```

- [ ] **Step 5: Texto de la vista de tarjetas**

| Old (línea) | Nuevo |
|---|---|
| `className="font-medium text-slate-900"` (411) | `className="font-medium" style={{ color: 'var(--color-text)' }}` |
| `className="text-slate-600 text-sm mt-1"` (414) | `className="text-sm mt-1" style={{ color: 'var(--color-text-soft)' }}` |
| `className="text-slate-500 text-sm mt-0.5"` (415) | `className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}` |
| `className="text-slate-500 text-sm mt-2 line-clamp-3"` (421) | `className="text-sm mt-2 line-clamp-3" style={{ color: 'var(--color-text-muted)' }}` |
| `className="mt-4 pt-4 border-t border-slate-100 flex gap-3"` (422) | `className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}` |

- [ ] **Step 6: Per-status colored badge**

Añadir después de `STATUS_OPTIONS` (línea 35, antes de `IncidentFormModal`):
```ts
const STATUS_BADGE: Record<string, string> = {
  open: 'badge-red',
  in_review: 'badge-amber',
  resolved: 'badge-green',
  closed: 'badge-slate',
};
```

Cambiar (bloque idéntico, aparece 2 veces — línea 374-376 en la columna `status` del `DataTable`, y línea 418-419 en la vista de tarjetas; usar `replace_all: true`):
```tsx
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {STATUS_OPTIONS.find((o) => o.value === i.status)?.label ?? i.status}
                  </span>
```
por:
```tsx
                  <span className={`badge ${STATUS_BADGE[i.status] ?? 'badge-slate'}`}>
                    {STATUS_OPTIONS.find((o) => o.value === i.status)?.label ?? i.status}
                  </span>
```

- [ ] **Step 7: Elementos del mockup fuera de alcance (sin cambios de código)**

El mockup de "Incidencias" agrega columnas `Tipo` y `Severidad` (con chip de color propio, `i.sevSt`/`i.sev`) que no existen en el modelo actual (`backend/src/database/entities/incident.entity.ts`: solo `id, vehicleId, userId, date, description, status`). No se agregan columnas ficticias — se conserva `Descripción` como única columna de contenido narrativo, consistente con la instrucción de no inventar campos de backend. El mockup tampoco muestra fila de KPIs para esta pantalla, así que no se agrega ninguna (a diferencia de Maintenance/Fuel).

- [ ] **Step 8: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/incidents`. Confirmar: modal/tabla/tarjetas usan colores de tema (no blanco fijo) en modo oscuro. El chip de "usuario actual" (rol conductor) usa colores de tema. Botón principal dice "Reportar incidencia" con ícono. La columna "Estado" muestra rojo/ámbar/verde/gris según `open/in_review/resolved/closed` en vez de un pill uniforme.

- [ ] **Step 9: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Incidents/IncidentList.tsx
git commit -m "$(cat <<'EOF'
fix(redesign): theme Incidents page for dark mode, add status badges

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---
### Task 14: Sanciones — reskin (`SanctionList.tsx`)

**Files:**
- Modify: `frontend/src/pages/Sanctions/SanctionList.tsx`

**Interfaces:** N/A (leaf page).

**Scope note:** `grep -n "#6384ff\|#5a6fff\|#818cf8\|rgba(99, *132, *255\|rgba(99, *102, *241\|#6366f1" frontend/src/pages/Sanctions/SanctionList.tsx` returns **zero matches** — no hardcoded blue-family literals here. However the page still uses raw Tailwind `text-slate-900`/`bg-white`/`border-slate-200` (not `var(--color-*)`) for its heading, table/cards containers, and its hand-rolled `SanctionFormModal` — these will stay visually stuck in light mode once the Foundation dark palette lands (the same class of bug fixed for Users/Vehicles/Reservations in commit `80500060`). The mockup's Sanciones screen also shows `Folio` and `Puntos` columns that **do not exist** on the `Sanction` entity (`id, userId, reason, effectiveDate, endDate, user` only) — per scope rules we do not invent those fields. It does show an `Estado` column, which **can** be derived client-side from the already-fetched `endDate` (no new endpoint/field), so we add that.

- [ ] **Step 1: Reskin page heading and both view containers**

Cambiar (línea 266):
```tsx
        <h2 className="text-2xl font-bold text-slate-900">Sanciones</h2>
```
por:
```tsx
        <h2
          className="text-2xl font-bold"
          style={{
            color: 'var(--color-text)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
          }}
        >
          Sanciones
        </h2>
```

Cambiar (línea 287):
```tsx
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
```
por:
```tsx
        <div
          className="rounded-[16px] shadow-sm overflow-hidden"
          style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
        >
```

Cambiar (línea 342):
```tsx
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
              No hay sanciones registradas.
            </div>
```
por:
```tsx
            <div
              className="col-span-full rounded-[16px] shadow-sm px-6 py-12 text-center"
              style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              No hay sanciones registradas.
            </div>
```

Cambiar (líneas 346-360):
```tsx
            sanctionList.map((s: Sanction) => (
              <div key={s.id} className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col">
                <div className="font-medium text-slate-900">
                  {getUserLabel(s)}
                </div>
                <p className="text-slate-600 text-sm mt-1 line-clamp-3">{s.reason}</p>
                <div className="text-slate-500 text-sm mt-2">
                  Efectiva: {formatDate(s.effectiveDate)}
                  {s.endDate && ` — Fin: ${formatDate(s.endDate)}`}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                  <button type="button" onClick={() => openEdit(s)} className="text-primary font-medium hover:underline text-sm">Editar</button>
                  <button type="button" onClick={() => handleDelete(s)} className="text-red-600 font-medium hover:underline text-sm">Eliminar</button>
                </div>
              </div>
            ))
```
por:
```tsx
            sanctionList.map((s: Sanction) => (
              <div
                key={s.id}
                className="rounded-[16px] shadow-sm p-5 flex flex-col"
                style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
              >
                <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {getUserLabel(s)}
                </div>
                <p className="text-sm mt-1 line-clamp-3" style={{ color: 'var(--color-text-soft)' }}>{s.reason}</p>
                <div className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Efectiva: {formatDate(s.effectiveDate)}
                  {s.endDate && ` — Fin: ${formatDate(s.endDate)}`}
                </div>
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => openEdit(s)} className="text-primary font-medium hover:underline text-sm">Editar</button>
                  <button type="button" onClick={() => handleDelete(s)} className="text-red-600 font-medium hover:underline text-sm">Eliminar</button>
                </div>
              </div>
            ))
```

- [ ] **Step 2: Add derived "Estado" column and mono date styling to the table view**

Cambiar (línea 316, inserting a new column right after `endDate` and before `actions`):
```tsx
              { key: 'endDate', header: 'Fecha fin', sortAccessor: (s) => s.endDate ?? '', render: (s) => (s.endDate ? formatDate(s.endDate) : '—') },
              {
                key: 'actions',
```
por:
```tsx
              { key: 'endDate', header: 'Fecha fin', sortAccessor: (s) => s.endDate ?? '', render: (s) => (s.endDate ? formatDate(s.endDate) : '—') },
              {
                key: 'estado',
                header: 'Estado',
                render: (s) => {
                  const vigente = !s.endDate || new Date(s.endDate) >= new Date();
                  return (
                    <span className={`badge ${vigente ? 'badge-red' : 'badge-slate'}`}>
                      {vigente ? 'Vigente' : 'Vencida'}
                    </span>
                  );
                },
              },
              {
                key: 'actions',
```

Cambiar (línea 315, add mono styling to date columns to match mockup's `IBM Plex Mono` date treatment):
```tsx
              { key: 'effectiveDate', header: 'Fecha efectiva', sortAccessor: (s) => s.effectiveDate, render: (s) => formatDate(s.effectiveDate) },
              { key: 'endDate', header: 'Fecha fin', sortAccessor: (s) => s.endDate ?? '', render: (s) => (s.endDate ? formatDate(s.endDate) : '—') },
```
por:
```tsx
              { key: 'effectiveDate', header: 'Fecha efectiva', sortAccessor: (s) => s.effectiveDate, cellClassName: 'font-mono-data text-sm', render: (s) => formatDate(s.effectiveDate) },
              { key: 'endDate', header: 'Fecha fin', sortAccessor: (s) => s.endDate ?? '', cellClassName: 'font-mono-data text-sm', render: (s) => (s.endDate ? formatDate(s.endDate) : '—') },
```

(No change to the "cards" view — `Estado` doesn't add value there; keep the card layout as reskinned in Step 1.)

- [ ] **Step 3: Migrate `SanctionFormModal` to the shared `<Modal>` component**

Cambiar (línea 14, add import):
```tsx
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
```
por:
```tsx
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
```

Cambiar (líneas 78-89):
```tsx
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {sanction ? 'Editar sanción' : 'Nueva sanción'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
```
por:
```tsx
  return (
    <Modal title={sanction ? 'Editar sanción' : 'Nueva sanción'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
```

Cambiar (líneas 156-159):
```tsx
        </form>
      </div>
    </div>
  );
}
```
por:
```tsx
      </form>
    </Modal>
  );
}
```

(Leave the inner form field labels/inputs — `text-slate-700`, `border-slate-300`, etc. — untouched; that's pre-existing, repo-wide form-field debt not introduced by this task, consistent with how Sprint 2's Task 1 migration left those alone too.)

- [ ] **Step 4: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Ir a `/sanctions`. Confirmar: (1) el título "Sanciones" usa Barlow Condensed en mayúsculas; (2) en modo oscuro el panel de tabla y las tarjetas ya no se ven blancos; (3) aparece la nueva columna "Estado" con un badge rojo ("Vigente") o gris ("Vencida") según `endDate`; (4) abrir "Nueva sanción"/"Editar" muestra el modal ya no blanco fijo, Escape lo cierra, el foco entra al primer campo.

- [ ] **Step 5: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Sanctions/SanctionList.tsx
git commit -m "$(cat <<'EOF'
fix(redesign): reskin Sanciones to theme tokens and add derived Estado column

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Costos — fix hardcoded blue literals and reskin (`CostsList.tsx`)

**Files:**
- Modify: `frontend/src/pages/Costs/CostsList.tsx`

**Interfaces:** N/A.

**Scope note:** Confirmed via grep exactly 2 occurrences of `#6384ff` (lines 331 and 490). The page's heading and summary KPI cards are already reskinned with `var(--color-*)`/`.glass-panel` (someone already did that pass) — only the table/filter panel wrapper, the cards view, and the two hex literals, plus the hand-rolled `CostFormModal`, remain. The mockup's "Por categoría" breakdown panel with progress bars is a genuinely new widget not requested for this page in scope (unlike Reportes, this page's brief only calls out the color-literal fix) — **not adding it**, to avoid inventing busywork; flagging it here as an explicit out-of-scope decision.

- [ ] **Step 1: Replace the two hardcoded blue literals with the amber primary token**

Cambiar (línea 331):
```tsx
          <p className="text-2xl font-bold mt-1" style={{ color: '#6384ff' }}>
            {fmtCurrency(totalAmount)}
          </p>
```
por:
```tsx
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-primary)' }}>
            {fmtCurrency(totalAmount)}
          </p>
```

Cambiar (línea 490):
```tsx
                  <p className="text-2xl font-bold font-mono-data" style={{ color: '#6384ff' }}>
                    {fmtCurrency(Number(c.amount))}
                  </p>
```
por:
```tsx
                  <p className="text-2xl font-bold font-mono-data" style={{ color: 'var(--color-primary)' }}>
                    {fmtCurrency(Number(c.amount))}
                  </p>
```

- [ ] **Step 2: Reskin the table/filter panel wrapper and search input**

Cambiar (línea 349):
```tsx
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
```
por:
```tsx
      <div
        className="rounded-[16px] shadow-sm overflow-hidden"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
      >
```

Cambiar (línea 351):
```tsx
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap gap-3 items-center">
```
por:
```tsx
        <div
          className="px-4 py-3 flex flex-wrap gap-3 items-center"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
```

Cambiar (líneas 352-358):
```tsx
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por vehículo, categoría..."
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary w-64"
          />
```
por:
```tsx
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por vehículo, categoría..."
            className="input-field w-64"
          />
```

(No change needed for the `<DataTable>` view at lines 405-457 — `DataTable.tsx` already renders every cell with an inline `style={{ color: 'var(--color-text)', ...cellStyle }}`, which **overrides** the `text-slate-900`/`text-slate-500` in `cellClassName` at lines 430/436 at the DOM level since inline `style` wins over class-based color regardless of specificity. Verified: those cells already render in the theme color despite the stale-looking class names.)

- [ ] **Step 3: Reskin the "cards" view**

Cambiar (línea 464):
```tsx
              <div className="col-span-full text-center text-slate-400 py-8">Cargando...</div>
```
por:
```tsx
              <div className="col-span-full text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
```

Cambiar (líneas 466-468):
```tsx
              <div className="col-span-full text-center text-slate-500 py-8">
                No hay gastos registrados.
              </div>
```
por:
```tsx
              <div className="col-span-full text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                No hay gastos registrados.
              </div>
```

Cambiar (líneas 471-474):
```tsx
                <div
                  key={c.id}
                  className="rounded-[14px] border border-slate-200 bg-white p-5 flex flex-col gap-2 shadow-sm"
                >
```
por:
```tsx
                <div
                  key={c.id}
                  className="rounded-[14px] p-5 flex flex-col gap-2 shadow-sm"
                  style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
                >
```

Cambiar (línea 477):
```tsx
                      <p className="font-medium text-slate-900">
```
por:
```tsx
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>
```

Cambiar (línea 482):
```tsx
                      <p className="text-xs text-slate-500 mt-0.5 font-mono-data">
```
por:
```tsx
                      <p className="text-xs mt-0.5 font-mono-data" style={{ color: 'var(--color-text-muted)' }}>
```

Cambiar (línea 494):
```tsx
                    <p className="text-sm text-slate-500 line-clamp-2">{c.description}</p>
```
por:
```tsx
                    <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{c.description}</p>
```

Cambiar (línea 496):
```tsx
                  <div className="flex gap-3 pt-2 border-t border-slate-100 mt-auto">
```
por:
```tsx
                  <div className="flex gap-3 pt-2 mt-auto" style={{ borderTop: '1px solid var(--color-border)' }}>
```

- [ ] **Step 4: Migrate `CostFormModal` to the shared `<Modal>` component**

Cambiar (línea 12, add import):
```tsx
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
```
por:
```tsx
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
```

Cambiar (líneas 92-106):
```tsx
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {cost ? 'Editar gasto' : 'Registrar gasto'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
```
por:
```tsx
  return (
    <Modal title={cost ? 'Editar gasto' : 'Registrar gasto'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
```

Cambiar (líneas 190-193):
```tsx
        </form>
      </div>
    </div>
  );
}
```
por:
```tsx
      </form>
    </Modal>
  );
}
```

- [ ] **Step 5: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Ir a `/costs`. Confirmar: (1) "Total gastos (filtrado)" y el monto en cada tarjeta ahora se ven en ámbar (`var(--color-primary)`), no azul; (2) en modo oscuro el panel de filtros/tabla y las tarjetas ya no son blancos; (3) abrir "Registrar gasto"/"Editar" usa el modal compartido (Escape cierra, foco inicial en el primer campo).

- [ ] **Step 6: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Costs/CostsList.tsx
git commit -m "$(cat <<'EOF'
fix(redesign): replace hardcoded blue literals in Costos with amber tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 16: Reportes — reskin to theme tokens (`ReportsPage.tsx`)

**Files:**
- Modify: `frontend/src/pages/Reports/ReportsPage.tsx`

**Interfaces:** N/A.

**Scope note:** `grep` for old-blue literals in this file returns zero matches, but unlike Sanctions/Costos, **none** of `ReportsPage.tsx`'s 5 tab tables use the shared `<DataTable>` component — they're hand-rolled `<table>` markup with ~90 occurrences of raw Tailwind `slate-*`/`white`/`amber-100`/`blue-100`/`green-100`/`red-100` classes (verified via `grep -oE 'className="[^"]*"' ReportsPage.tsx | sort | uniq -c | sort -rn`). None of these read `var(--color-*)`, so in dark mode this page would remain visually stuck in the old light theme end-to-end. This task does the full reskin pass; Task 17 adds the two new chart panels on top of it.

- [ ] **Step 1: Heading, date inputs, tab bar**

Cambiar (línea 175):
```tsx
      <h2 className="text-2xl font-bold text-slate-900">Reportes</h2>
```
por:
```tsx
      <h2
        className="text-2xl font-bold"
        style={{
          color: 'var(--color-text)',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 600,
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
        }}
      >
        Reportes y estadísticas
      </h2>
```

Cambiar (2 ocurrencias idénticas, líneas 180 y 189 — usar `replace_all`):
```tsx
          <span className="text-sm font-bold text-slate-700">Desde</span>
```
y
```tsx
          <span className="text-sm font-bold text-slate-700">Hasta</span>
```
por (mismo `className`, distinto texto, cambiar sólo la clase en ambas):
```tsx
          <span className="text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Desde</span>
```
```tsx
          <span className="text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Hasta</span>
```

Cambiar (2 ocurrencias idénticas, líneas 185 y 194 — `replace_all` sobre el string exacto de `className`):
```tsx
            className="rounded-[16px] border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
```
por (en ambos `<input type="date">`):
```tsx
            className="rounded-[16px] px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-input-bg)', color: 'var(--color-text)' }}
```

Cambiar (línea 200):
```tsx
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
```
por:
```tsx
      <div className="flex flex-wrap gap-1" style={{ borderBottom: '1px solid var(--color-border)' }}>
```

Cambiar (líneas 206-210):
```tsx
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.id
                ? 'bg-white border border-b-white border-slate-200 text-primary -mb-px'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
```
por:
```tsx
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px hover:opacity-80"
            style={
              activeTab === t.id
                ? {
                    background: 'var(--color-bg-soft)',
                    border: '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-bg-soft)',
                    color: 'var(--color-primary)',
                  }
                : { color: 'var(--color-text-muted)' }
            }
```

- [ ] **Step 2: Panel wrapper and the 5 per-tab header blocks**

Cambiar (línea 219):
```tsx
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
```
por:
```tsx
      <div
        className="rounded-[16px] shadow-sm overflow-hidden"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
      >
```

Cambiar (5 ocurrencias idénticas — `replace_all` — líneas 224, 332, 442, 582, 695):
```tsx
            <div className="px-6 py-4 border-b border-slate-200">
```
por:
```tsx
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
```

Cambiar (5 ocurrencias, misma clase, distinto texto — líneas 225, 333, 443, 583, 696 — `replace_all` sobre el fragmento de `className`):
```tsx
className="font-bold text-slate-900"
```
por:
```tsx
className="font-bold" style={{ color: 'var(--color-text)' }}
```

Cambiar (5 ocurrencias, misma clase, distinto texto — líneas 226, 334, 444, 584, 697 — `replace_all` sobre el fragmento de `className`):
```tsx
className="text-sm text-slate-500 mt-0.5"
```
por:
```tsx
className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}
```

(La clase `className="px-6 py-8 text-primary font-bold"` en las 5 líneas de "Cargando..." — 231, 339, 449, 589, 702 — **no cambia**: ya usa `text-primary`, que auto-reskinea a ámbar.)

- [ ] **Step 3: Tabla — `thead`, encabezados `<th>` y filas vacías**

Cambiar (5 ocurrencias idénticas — `replace_all` — líneas 287, 395, 514, 648, 767):
```tsx
                  <thead className="bg-slate-50 border-b border-slate-200">
```
por:
```tsx
                  <thead style={{ background: 'var(--color-table-head-bg)', borderBottom: '1px solid var(--color-border)' }}>
```

Cambiar (15 ocurrencias idénticas del string de `className` — `replace_all` — líneas 289, 290, 397, 398, 516, 517, 518, 519, 520, 650, 651, 769, 770, 775, 776):
```tsx
className="text-left px-6 py-4 text-sm font-bold text-slate-700"
```
por:
```tsx
className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}
```

Cambiar (13 ocurrencias idénticas del string de `className` — `replace_all` — líneas 291, 292, 293, 399, 400, 401, 521, 522, 652, 653, 654, 655, 771):
```tsx
className="text-right px-6 py-4 text-sm font-bold text-slate-700"
```
por:
```tsx
className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}
```

Cambiar (líneas 772-774, únicas — cabeceras semánticas de Mantenimiento):
```tsx
                        <th className="text-right px-6 py-4 text-sm font-bold text-green-700">Completados</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-amber-600">Programados</th>
                        <th className="text-right px-6 py-4 text-sm font-bold text-slate-500">Cancelados</th>
```
por:
```tsx
                        <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: '#34d399' }}>Completados</th>
                        <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: '#fbbf24' }}>Programados</th>
                        <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>Cancelados</th>
```

Cambiar (5 ocurrencias idénticas — `replace_all` — líneas 299, 407, 528, 661, 782, cada una en un `<td colSpan=...>`):
```tsx
className="px-6 py-8 text-center text-slate-500"
```
por:
```tsx
className="px-6 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}
```

- [ ] **Step 4: Filas y celdas de datos**

Cambiar (5 ocurrencias idénticas — `replace_all` — líneas 305, 413, 534, 667, 788):
```tsx
                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
```
por:
```tsx
                        <tr
                          key={row.id}
                          className="hover:bg-[var(--color-table-row-hover)]"
                          style={{ borderBottom: '1px solid var(--color-border)' }}
                        >
```

Cambiar (4 ocurrencias idénticas — `replace_all` — líneas 306, 414, 668, 789):
```tsx
className="px-6 py-4 font-medium text-slate-900"
```
por:
```tsx
className="px-6 py-4 font-medium" style={{ color: 'var(--color-text)' }}
```

Cambiar (línea 536, única — igual patrón pero como `<span>`, no `<td>`):
```tsx
                              <span className="font-medium text-slate-900">{row.plate}</span>{' '}
```
por:
```tsx
                              <span className="font-medium" style={{ color: 'var(--color-text)' }}>{row.plate}</span>{' '}
```

Cambiar (3 ocurrencias idénticas — `replace_all` — líneas 307, 669, 790):
```tsx
className="px-6 py-4 text-slate-600"
```
por:
```tsx
className="px-6 py-4" style={{ color: 'var(--color-text-soft)' }}
```

Cambiar (7 ocurrencias idénticas — `replace_all` — líneas 310, 313, 416, 419, 672, 673, 565):
```tsx
className="px-6 py-4 text-right text-slate-600"
```
por:
```tsx
className="px-6 py-4 text-right" style={{ color: 'var(--color-text-soft)' }}
```

Cambiar (2 ocurrencias idénticas — `replace_all` — líneas 676, 793):
```tsx
className="px-6 py-4 text-right font-bold text-slate-900"
```
por:
```tsx
className="px-6 py-4 text-right font-bold" style={{ color: 'var(--color-text)' }}
```

Cambiar (línea 415, única):
```tsx
                          <td className="px-6 py-4 text-slate-500 text-sm">{row.email}</td>
```
por:
```tsx
                          <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{row.email}</td>
```

Cambiar (línea 537, única):
```tsx
                              <span className="text-slate-500 text-sm">
```
por:
```tsx
                              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
```

Cambiar (línea 541, única):
```tsx
                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
```
por:
```tsx
                            <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--color-text-soft)' }}>
```

Cambiar (línea 545, única):
```tsx
                              <div className="truncate text-slate-700">{row.eventName || '—'}</div>
```
por:
```tsx
                              <div className="truncate" style={{ color: 'var(--color-text-soft)' }}>{row.eventName || '—'}</div>
```

Cambiar (línea 547, única):
```tsx
                                <div className="truncate text-xs text-slate-400">{row.destination}</div>
```
por:
```tsx
                                <div className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.destination}</div>
```

Cambiar (3 ocurrencias idénticas — `replace_all` — líneas 550, 553, 801):
```tsx
className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap"
```
por:
```tsx
className="px-6 py-4 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}
```

Cambiar (línea 679, única):
```tsx
                          <td className="px-6 py-4 text-right text-slate-500">
```
por:
```tsx
                          <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-muted)' }}>
```

Cambiar (línea 796, única — Completados):
```tsx
                            <td className="px-6 py-4 text-right text-green-700 font-medium">
```
por:
```tsx
                            <td className="px-6 py-4 text-right font-medium" style={{ color: '#34d399' }}>
```

Cambiar (línea 799, única — Programados):
```tsx
                            <td className="px-6 py-4 text-right text-amber-600">{row.scheduled}</td>
```
por:
```tsx
                            <td className="px-6 py-4 text-right" style={{ color: '#fbbf24' }}>{row.scheduled}</td>
```

Cambiar (línea 800, única — Cancelados):
```tsx
                            <td className="px-6 py-4 text-right text-slate-400">{row.cancelled}</td>
```
por:
```tsx
                            <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-muted)' }}>{row.cancelled}</td>
```

Cambiar (línea 804, única — Tipos):
```tsx
                            <td className="px-6 py-4 text-slate-500 text-sm max-w-[200px]">
```
por:
```tsx
                            <td className="px-6 py-4 text-sm max-w-[200px]" style={{ color: 'var(--color-text-muted)' }}>
```

(Sin cambio: `className="px-6 py-4 max-w-[180px]"` línea 544, `className="px-6 py-4 whitespace-nowrap"` línea 535, `className="px-6 py-4 text-right"` línea 556, y `className="px-6 py-4 text-right font-bold text-primary"` líneas 316-318 — ninguna contiene una clase de color rota; `text-primary` ya auto-reskinea.)

- [ ] **Step 5: Badges de estado de reserva — usar las clases `.badge` compartidas**

Cambiar (líneas 85-91):
```tsx
const RES_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-100 text-slate-600',
  rejected: 'bg-red-100 text-red-700',
};
```
por:
```tsx
const RES_STATUS_COLORS: Record<string, string> = {
  pending: 'badge badge-amber',
  active: 'badge badge-blue',
  completed: 'badge badge-green',
  cancelled: 'badge badge-slate',
  rejected: 'badge badge-red',
};
```

Cambiar (líneas 557-563):
```tsx
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  RES_STATUS_COLORS[row.status] ?? 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {RES_STATUS_LABELS[row.status] ?? row.status}
                              </span>
```
por:
```tsx
                              <span className={RES_STATUS_COLORS[row.status] ?? 'badge badge-slate'}>
                                {RES_STATUS_LABELS[row.status] ?? row.status}
                              </span>
```

(`.badge` en `index.css:195-205` ya define `padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;` — equivalente a las clases manuales que reemplaza.)

- [ ] **Step 6: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Ir a `/reports` y revisar las 5 pestañas en modo oscuro y modo claro: título en Barlow Condensed mayúsculas, panel/tabla ya no blancos fijos, encabezados de columna legibles en ambos temas, fila activa de pestaña resaltada en ámbar, hover de fila funciona, badges de estado de reserva (Historial de reservas) se ven con los colores semánticos `.badge-*`, columnas Completados/Programados/Cancelados de Mantenimiento mantienen verde/ámbar/gris.

- [ ] **Step 7: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Reports/ReportsPage.tsx
git commit -m "$(cat <<'EOF'
fix(redesign): reskin Reportes tables and tabs to theme tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 17: Reportes — nuevas visualizaciones recharts (`ReportsPage.tsx`)

**Files:**
- Modify: `frontend/src/pages/Reports/ReportsPage.tsx` (depends on Task 16 having landed first — line numbers below are anchored to unique surrounding text rather than absolute numbers, since Task 16 shifts many lines)

**Interfaces:** N/A.

**Scope note:** The mockup's Reportes screen is a single 6-month dashboard (line chart "Reservas por mes", 4 semester KPI tiles, "Top vehículos por kilometraje" bars) that doesn't map 1:1 onto this app's 5-tab report browser (each tab hits a distinct backend endpoint with its own date-range filter and export). Per scope rules we keep the 5 tabs and existing per-tab `useQuery`/export behavior untouched, and port only the two chart concepts that can be built from data **already fetched for their tab** (no new endpoints, no new fields):
- "Top vehículos por kilometraje" → built from `vehicleUsageQ.data` (already fetched in the `vehicle-usage` tab).
- "Reservas por mes" → built from `reservationsHistoryQ.data`, bucketed client-side by month (already fetched in the `reservations-history` tab).
The semester KPI tiles (`$256K gasto total`, `92% aprobación`, `7 incidencias`) are **not** added: they'd require running the `fuel`/`driver-activity` queries unconditionally regardless of `activeTab` (currently gated by `enabled: activeTab === ...`), which is a fetching-behavior change beyond a visual reskin — flagging as an explicit out-of-scope decision rather than silently expanding query behavior.

- [ ] **Step 1: Import recharts primitives**

Cambiar (líneas 1-6):
```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api.service';
import { usePagination } from '../../hooks/usePagination';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
```
por:
```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../../services/api.service';
import { usePagination } from '../../hooks/usePagination';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportTable';
```

- [ ] **Step 2: Derive the two chart datasets from already-fetched query data**

Cambiar (anchor: right after the 5 `usePagination` calls, originally lines 167-171):
```tsx
  const vuPag = usePagination<VehicleUsageRow>(vehicleUsageQ.data ?? []);
  const daPag = usePagination<DriverActivityRow>(driverActivityQ.data ?? []);
  const rhPag = usePagination<ReservationHistoryRow>(reservationsHistoryQ.data ?? []);
  const fuPag = usePagination<FuelRow>(fuelQ.data ?? []);
  const maPag = usePagination<MaintenanceRow>(maintenanceQ.data ?? []);
```
por:
```tsx
  const vuPag = usePagination<VehicleUsageRow>(vehicleUsageQ.data ?? []);
  const daPag = usePagination<DriverActivityRow>(driverActivityQ.data ?? []);
  const rhPag = usePagination<ReservationHistoryRow>(reservationsHistoryQ.data ?? []);
  const fuPag = usePagination<FuelRow>(fuelQ.data ?? []);
  const maPag = usePagination<MaintenanceRow>(maintenanceQ.data ?? []);

  // ---- Derived chart data (built from already-fetched tab data, no new endpoints) ----
  const topVehiclesByKm = [...(vehicleUsageQ.data ?? [])]
    .sort((a, b) => Number(b.totalKmDriven ?? 0) - Number(a.totalKmDriven ?? 0))
    .slice(0, 5)
    .map((r) => ({ label: r.plate, km: Number(r.totalKmDriven ?? 0) }));

  const monthlyReservations = (() => {
    const counts = new Map<string, number>();
    for (const r of reservationsHistoryQ.data ?? []) {
      if (!r.startDatetime) continue;
      const d = new Date(r.startDatetime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, reservas]) => {
        const [y, m] = key.split('-');
        const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-GT', {
          month: 'short',
          year: '2-digit',
        });
        return { label, reservas };
      });
  })();
```

- [ ] **Step 3: Add the "Top 5 vehículos por kilometraje" chart to the `vehicle-usage` tab**

Cambiar (anchor: the loaded branch of the `vehicle-usage` tab, right after `<>` opens and before `<TableToolbar`, originally lines 233-234):
```tsx
              <>
                <TableToolbar
                  page={vuPag.page}
```
por:
```tsx
              <>
                {topVehiclesByKm.length > 0 && (
                  <div className="px-6 pt-4 pb-2">
                    <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                      Top 5 vehículos por kilometraje
                    </h4>
                    <div style={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topVehiclesByKm}
                          layout="vertical"
                          margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                        >
                          <defs>
                            <linearGradient id="topVehKmGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.85} />
                              <stop offset="100%" stopColor="var(--color-primary-dark)" stopOpacity={0.85} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="label"
                            width={90}
                            tick={{ fontSize: 12, fill: 'var(--color-text-soft)' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 8,
                              fontSize: 12,
                              color: 'var(--color-text)',
                            }}
                            formatter={(value: number) => [`${value.toLocaleString()} km`, 'Kilometraje']}
                          />
                          <Bar dataKey="km" fill="url(#topVehKmGradient)" radius={[0, 6, 6, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                <TableToolbar
                  page={vuPag.page}
```

- [ ] **Step 4: Add the "Reservas por mes" chart to the `reservations-history` tab**

Cambiar (anchor: the loaded branch of the `reservations-history` tab, right after `<>` opens and before `<TableToolbar`, originally lines 451-452):
```tsx
              <>
                <TableToolbar
                  page={rhPag.page}
```
por:
```tsx
              <>
                {monthlyReservations.length > 0 && (
                  <div className="px-6 pt-4 pb-2">
                    <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                      Reservas por mes
                    </h4>
                    <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                      Conteo de reservas por mes en el período seleccionado.
                    </p>
                    <div style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyReservations} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="reservasPorMesGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 8,
                              fontSize: 12,
                              color: 'var(--color-text)',
                            }}
                            formatter={(value: number) => [value, 'Reservas']}
                          />
                          <Area
                            type="monotone"
                            dataKey="reservas"
                            stroke="var(--color-primary)"
                            strokeWidth={2}
                            fill="url(#reservasPorMesGradient)"
                            dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: 'var(--color-primary)' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                <TableToolbar
                  page={rhPag.page}
```

- [ ] **Step 5: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Ir a `/reports` → pestaña "Uso de vehículos": debe aparecer una barra horizontal ámbar con los 5 vehículos de mayor kilometraje del rango de fechas seleccionado, con tooltip al pasar el mouse. Cambiar el rango de fechas y confirmar que el gráfico se actualiza junto con la tabla. Ir a la pestaña "Historial de reservas": debe aparecer un área/línea ámbar "Reservas por mes" agrupando las reservas del rango seleccionado por mes calendario; con un rango de menos de un mes debe mostrar un solo punto sin romper el layout. Confirmar que ambas pestañas siguen exportando CSV/Excel/PDF igual que antes (los gráficos no tocan esa lógica).

- [ ] **Step 6: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Reports/ReportsPage.tsx
git commit -m "$(cat <<'EOF'
feat(redesign): add top-vehicles and monthly-reservations charts to Reportes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---
### Task 18: UsersList — reskin to match "Usuarios y roles" mockup

**Files:**
- Modify: `frontend/src/pages/Users/UsersList.tsx:241-386`

**Interfaces:** N/A (leaf page; no exported interface changes — `UserFormModal` already migrated to shared `<Modal>` in Sprint 2, no changes needed there).

- [ ] **Step 1: Add role-count KPI cards + rename heading to match the mockup**

The mockup (`usuarios-roles.txt`) shows a title block `"Usuarios y roles"` / subtitle `"Cuentas activas y permisos por rol."` and a 4-card row (`roleCards`: icon + count `r.n` + `r.label` + `r.desc`) above the table. The app's `roles` list is dynamic (seed data currently has `admin`/`manager_flotilla`/`conductor`, see `backend/src/database/seeds/index.ts:105-127`), so build the cards from `roles`/`users` already in memory — no new API calls.

Add helper functions right after `STATUS_OPTIONS` (line 31):
```tsx
const ROLE_ICONS: Record<string, string> = {
  admin: 'admin_panel_settings',
  manager_flotilla: 'supervisor_account',
  conductor: 'directions_car',
  solicitante: 'assignment_ind',
};
const ROLE_VARIANTS = ['blue', 'green', 'amber', 'purple', 'red'];
const getRoleIcon = (roleName: string) => ROLE_ICONS[roleName] ?? 'group';
const getInitials = (nameOrEmail: string) => {
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : trimmed.slice(0, 2).toUpperCase();
};
```

Cambiar (líneas 241-263):
```tsx
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Usuarios</h2>
        <div className="flex flex-wrap items-center gap-3">
          <SearchSelect
            options={[{ value: '', label: 'Todos los roles' }, ...roles.map((r: Role) => ({ value: r.id, label: r.name }))]}
            value={filterRoleId}
            onChange={setFilterRoleId}
            placeholder="Todos los roles"
            className="w-48"
          />
          <SearchSelect
            options={[{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Todos los estados"
            className="w-48"
          />
          <ViewToggle value={view} onChange={setView} storageKey="usersView" />
        </div>
      </div>
      {view === 'table' && (
```
por:
```tsx
  const getRoleUserCount = (roleId: string) => users.filter((u: User) => u.roleId === roleId).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>Usuarios y roles</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Cuentas activas y permisos por rol.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchSelect
            options={[{ value: '', label: 'Todos los roles' }, ...roles.map((r: Role) => ({ value: r.id, label: r.name }))]}
            value={filterRoleId}
            onChange={setFilterRoleId}
            placeholder="Todos los roles"
            className="w-48"
          />
          <SearchSelect
            options={[{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Todos los estados"
            className="w-48"
          />
          <ViewToggle value={view} onChange={setView} storageKey="usersView" />
        </div>
      </div>
      {roles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {roles.map((r: Role, i: number) => (
            <div key={r.id} className={`stat-card ${ROLE_VARIANTS[i % ROLE_VARIANTS.length]}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="stat-card__icon">
                  <span className="material-icons" style={{ fontSize: 18 }}>{getRoleIcon(r.name)}</span>
                </div>
                <span className="stat-card__value" style={{ fontSize: 20 }}>{getRoleUserCount(r.id)}</span>
              </div>
              <div className="stat-card__label" style={{ textTransform: 'none' }}>{r.name}</div>
              {r.description && <div className="stat-card__sub">{r.description}</div>}
            </div>
          ))}
        </div>
      )}
      {view === 'table' && (
```

**Nota:** el mockup incluye un botón `"Invitar usuario"` (icono `person_add`) junto al título. Se omite deliberadamente: `grep -rn "invit" -i frontend/src backend/src` no arroja ningún endpoint ni flujo de invitación existente — los usuarios se crean/sincronizan al iniciar sesión (mensaje ya presente en el estado de error de esta misma página, línea 235). Añadir ese botón implicaría inventar un endpoint nuevo, lo cual viola la restricción de esta tarea. Se deja fuera del scope de este reskin.

**Nota 2:** el mockup no muestra la columna "Departamento" que sí existe hoy en la tabla (dato real del backend). Se conserva esa columna para no perder información visible ya existente — el resto de columnas/orden se ajusta al mockup (`Usuario` con avatar, `Correo`, `Departamento`, `Rol`, `Último acceso`, `Estado`).

- [ ] **Step 2: Reskin las columnas de la tabla — avatar + nombre, badge de rol, badge de estado con color diferenciado**

Cambiar (líneas 291-330):
```tsx
          <DataTable<User>
            columns={[
              { key: 'email', header: 'Email', sortAccessor: (u) => u.email, cellClassName: 'font-medium', render: (u) => u.email },
              { key: 'displayName', header: 'Nombre', sortAccessor: (u) => u.displayName ?? '', render: (u) => u.displayName ?? '—' },
              { key: 'department', header: 'Departamento', render: (u) => u.department ?? '—' },
              { key: 'role', header: 'Rol', render: (u) => getRoleName(u) },
              {
                key: 'status',
                header: 'Estado',
                render: (u) => (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {STATUS_OPTIONS.find((o) => o.value === u.status)?.label ?? u.status}
                  </span>
                ),
              },
              {
                key: 'lastLoginAt',
                header: 'Último acceso',
                sortAccessor: (u) => u.lastLoginAt ?? '',
                cellClassName: 'text-sm font-mono-data',
                cellStyle: { whiteSpace: 'nowrap', color: 'var(--color-text-muted)' },
                render: (u) =>
                  u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString('es-MX', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })
                    : '—',
              },
              {
                key: 'actions',
                header: 'Acciones',
                align: 'right',
                render: (u) => (
                  <>
                    <button type="button" onClick={() => openEdit(u)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                    <button type="button" onClick={() => handleDelete(u)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                  </>
                ),
              },
            ]}
            rows={paginatedUsers}
            getRowKey={(u) => u.id}
            emptyMessage="No hay usuarios registrados."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
```
por:
```tsx
          <DataTable<User>
            columns={[
              {
                key: 'email',
                header: 'Usuario',
                sortAccessor: (u) => u.displayName || u.email,
                render: (u) => (
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', color: 'var(--color-text-on-primary)' }}
                    >
                      {getInitials(u.displayName || u.email)}
                    </span>
                    <span className="font-medium">{u.displayName || u.email}</span>
                  </div>
                ),
              },
              { key: 'emailAddr', header: 'Correo', sortAccessor: (u) => u.email, render: (u) => u.email },
              { key: 'department', header: 'Departamento', render: (u) => u.department ?? '—' },
              {
                key: 'role',
                header: 'Rol',
                render: (u) => <span className="badge badge-amber">{getRoleName(u)}</span>,
              },
              {
                key: 'lastLoginAt',
                header: 'Último acceso',
                sortAccessor: (u) => u.lastLoginAt ?? '',
                cellClassName: 'text-sm font-mono-data',
                cellStyle: { whiteSpace: 'nowrap', color: 'var(--color-text-muted)' },
                render: (u) =>
                  u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString('es-MX', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })
                    : '—',
              },
              {
                key: 'status',
                header: 'Estado',
                render: (u) => {
                  const variant = u.status === 'active' ? 'green' : u.status === 'suspended' ? 'red' : 'slate';
                  return (
                    <span className={`badge badge-${variant} gap-1.5`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                      {STATUS_OPTIONS.find((o) => o.value === u.status)?.label ?? u.status}
                    </span>
                  );
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                align: 'right',
                render: (u) => (
                  <>
                    <button type="button" onClick={() => openEdit(u)} className="text-primary font-medium hover:underline mr-3">Editar</button>
                    <button type="button" onClick={() => handleDelete(u)} className="text-red-600 font-medium hover:underline">Eliminar</button>
                  </>
                ),
              },
            ]}
            rows={paginatedUsers}
            getRowKey={(u) => u.id}
            emptyMessage="No hay usuarios registrados."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
```

- [ ] **Step 3: Fix hardcoded `bg-white`/`border-slate-*`/`text-slate-*` in the card view (`view === 'cards'`)**

Cambiar (líneas 340-386):
```tsx
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.length === 0 ? (
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
              No hay usuarios registrados.
            </div>
          ) : (
            users.map((u: User) => {
              const roleName = u.role?.name ?? (u.roleId && roles.find((r: Role) => r.id === u.roleId)?.name) ?? 'Sin rol';
              return (
              <div
                key={u.id}
                className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col"
              >
                <div className="font-medium text-slate-900">{u.displayName || u.email}</div>
                <div className="text-slate-600 text-sm mt-0.5">{u.email}</div>
                <div className="text-slate-500 text-sm mt-1">{u.department ?? '—'}</div>
                <div className="mt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {roleName}
                  </span>
                  <span className="ml-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    {STATUS_OPTIONS.find((o) => o.value === u.status)?.label ?? u.status}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="text-primary font-medium hover:underline text-sm"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    className="text-red-600 font-medium hover:underline text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>
      )}
```
por:
```tsx
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.length === 0 ? (
            <div
              className="col-span-full rounded-[16px] px-6 py-12 text-center"
              style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              No hay usuarios registrados.
            </div>
          ) : (
            users.map((u: User) => {
              const roleName = u.role?.name ?? (u.roleId && roles.find((r: Role) => r.id === u.roleId)?.name) ?? 'Sin rol';
              const statusVariant = u.status === 'active' ? 'green' : u.status === 'suspended' ? 'red' : 'slate';
              return (
              <div
                key={u.id}
                className="rounded-[16px] p-5 flex flex-col"
                style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', color: 'var(--color-text-on-primary)' }}
                  >
                    {getInitials(u.displayName || u.email)}
                  </span>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--color-text)' }}>{u.displayName || u.email}</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{u.email}</div>
                  </div>
                </div>
                <div className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{u.department ?? '—'}</div>
                <div className="mt-2 flex gap-2">
                  <span className="badge badge-amber">{roleName}</span>
                  <span className={`badge badge-${statusVariant} gap-1.5`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                    {STATUS_OPTIONS.find((o) => o.value === u.status)?.label ?? u.status}
                  </span>
                </div>
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => openEdit(u)} className="text-primary font-medium hover:underline text-sm">Editar</button>
                  <button type="button" onClick={() => handleDelete(u)} className="text-red-600 font-medium hover:underline text-sm">Eliminar</button>
                </div>
              </div>
              );
            })
          )}
        </div>
      )}
```

- [ ] **Step 4: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/users`: confirmar que aparece el título "Usuarios y roles" con subtítulo, las tarjetas KPI de roles (una por rol, con ícono, conteo y descripción) arriba de la tabla, que la columna "Usuario" muestra avatar con iniciales, que "Rol" es una píldora ámbar y "Estado" es una píldora verde/roja/gris con punto según el estado. Cambiar a modo oscuro y claro (toggle del header) y confirmar que ninguna tarjeta ni celda se queda en blanco/gris fijo. Repetir en vista de tarjetas (`ViewToggle`).

- [ ] **Step 5: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Users/UsersList.tsx
git commit -m "$(cat <<'EOF'
feat(redesign): restyle Users list to match "Usuarios y roles" mockup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 19: RolePermissionsPage — reskin to match "Permisos por rol" mockup

**Files:**
- Modify: `frontend/src/pages/RolePermissions/RolePermissionsPage.tsx:1-295`

**Interfaces:** N/A. Consumes existing `<Modal>` (`frontend/src/components/ui/Modal.tsx`, already built in Sprint 2) — not currently used by `CreateRoleModal` in this file; migrated in Step 1 below.

**Decisión de diseño explícita:** el mockup (`permisos-rol.txt`) muestra una **matriz de solo lectura**: filas = recursos, columnas = 4 roles fijos ("Admin", "Manager flotilla", "Conductor", "Solicitante"), cada celda un solo ícono check/x por rol-recurso (sin edición, sin acciones por permiso individual). El modelo real de datos (`backend/src/database/entities/permission.entity.ts` + `role.entity.ts`) es más granular: cada `Permission` tiene `resource` + `action` (create/read/update/delete/etc.), y un rol tiene un `Set` arbitrario de permisos — no un simple booleano "tiene acceso al recurso sí/no", y el número de roles es dinámico (hoy 3: `admin`/`manager_flotilla`/`conductor`, ver `backend/src/database/seeds/index.ts:103-127`, no 4 fijos). Adoptar la matriz 1:1 requeriría o bien colapsar acciones en un solo booleano por recurso (pérdida de granularidad = invención de un modelo de negocio nuevo) o construir una matriz N-roles × M-acciones editable en una sola vista (cambio de interacción no solicitado). Por la restricción explícita de "no inventar nueva lógica de negocio" y "preservar el 100% del comportamiento funcional", **se mantiene la interacción actual** (seleccionar un rol de una lista, marcar/desmarcar permisos agrupados por recurso, guardar) y se adopta únicamente el **lenguaje visual** del mockup: encabezados en mayúsculas con tracking, tarjetas con `var(--color-bg-soft)`/`var(--color-border)`, píldoras para cada acción, ícono de "check" en vez de checkbox nativo donde sea puramente decorativo.

- [ ] **Step 1: Migrar `CreateRoleModal` al `<Modal>` compartido (mismo patrón que `UserFormModal` en Sprint 2) y a las clases `.input-field`/`.btn-ghost`/`.btn-primary`**

Import: `import { Modal } from '../../components/ui/Modal';`

Cambiar (líneas 47-101):
```tsx
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Nuevo rol</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: supervisor"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del rol"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Creando...' : 'Crear rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```
por:
```tsx
  return (
    <Modal title="Nuevo rol" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Nombre *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: supervisor"
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Descripción (opcional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción del rol"
            className="input-field w-full"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
            {submitting ? 'Creando...' : 'Crear rol'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Reskin el encabezado y el panel "Seleccionar rol"**

Cambiar (líneas 189-221):
```tsx
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Permisos por rol</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Seleccionar rol</h3>
          <ul className="space-y-1">
            {roles.map((r: Role) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => handleSelectRole(r.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedRoleId === r.id ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 w-full px-4 py-2.5 border border-dashed border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-primary hover:text-primary transition-colors"
          >
            + Nuevo rol
          </button>
          {roles.length === 0 && (
            <p className="text-slate-500 text-sm mt-2">No hay roles cargados.</p>
          )}
        </div>
```
por:
```tsx
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>Permisos por rol</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Matriz de acceso por recurso del sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-[16px] p-5" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-soft)' }}>Seleccionar rol</h3>
          <ul className="space-y-1">
            {roles.map((r: Role) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => handleSelectRole(r.id)}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={
                    selectedRoleId === r.id
                      ? { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }
                      : { color: 'var(--color-text-soft)' }
                  }
                >
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ border: '1px dashed var(--color-border-strong)', color: 'var(--color-text-muted)' }}
          >
            + Nuevo rol
          </button>
          {roles.length === 0 && (
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>No hay roles cargados.</p>
          )}
        </div>
```
(`hover:bg-slate-100`/`hover:bg-slate-50`/`hover:border-primary`/`hover:text-primary` no tienen equivalente directo en `style` inline — se eliminan los estados hover explícitos de estos dos botones en este paso; el resaltado del rol seleccionado ya es suficiente feedback visual y evita hardcodear grises. Si se requiere el hover, usar `className="... hover:bg-[var(--color-table-row-hover)]"` con la sintaxis de valor arbitrario de Tailwind, que sí resuelve variables CSS.)

- [ ] **Step 3: Reskin el panel de permisos (grid de checkboxes agrupados por recurso)**

Cambiar (líneas 223-284):
```tsx
        <div className="lg:col-span-2 bg-white rounded-[16px] shadow-sm border border-slate-200 p-5">
          {!selectedRoleId ? (
            <p className="text-slate-500">Selecciona un rol para asignar permisos.</p>
          ) : (
            <>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h3 className="text-sm font-bold text-slate-700">
                  Permisos para: {selectedRole?.name}
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm text-slate-600 font-medium hover:underline"
                  >
                    Desmarcar todos
                  </button>
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium"
                    >
                      {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {(Object.entries(groupedByResource) as [string, Permission[]][]).map(([resource, perms]) => (
                  <div key={resource} className="border border-slate-200 rounded-lg p-3">
                    <p className="text-sm font-bold text-slate-700 mb-2 capitalize">{resource}</p>
                    <div className="flex flex-wrap gap-3">
                      {perms.map((p: Permission) => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => togglePermission(p.id)}
                            className="rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-slate-700">{p.action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {allPermissions.length === 0 && (
                <p className="text-slate-500 text-sm">No hay permisos definidos en el sistema.</p>
              )}
            </>
          )}
        </div>
```
por:
```tsx
        <div className="lg:col-span-2 rounded-[16px] p-5" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
          {!selectedRoleId ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Selecciona un rol para asignar permisos.</p>
          ) : (
            <>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>
                  Permisos para: {selectedRole?.name}
                </h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={selectAll} className="text-sm text-primary font-medium hover:underline">
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Desmarcar todos
                  </button>
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {(Object.entries(groupedByResource) as [string, Permission[]][]).map(([resource, perms]) => (
                  <div key={resource} className="rounded-lg p-3" style={{ border: '1px solid var(--color-border)' }}>
                    <p className="text-sm font-bold mb-2 capitalize" style={{ color: 'var(--color-text-soft)' }}>{resource}</p>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((p: Permission) => {
                        const checked = selectedIds.has(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`badge ${checked ? 'badge-amber' : 'badge-slate'} gap-1.5 cursor-pointer`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(p.id)}
                              className="sr-only"
                            />
                            <span className="material-icons" style={{ fontSize: 14 }}>
                              {checked ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            {p.action}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {allPermissions.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No hay permisos definidos en el sistema.</p>
              )}
            </>
          )}
        </div>
```
(El checkbox real se conserva funcionalmente — `checked`/`onChange` intactos — solo se oculta visualmente con `sr-only` y se reemplaza su representación por el ícono Material `check_circle`/`radio_button_unchecked` dentro de una píldora `.badge`, igual al lenguaje visual de íconos coloreados del mockup, sin cambiar el modelo de datos ni la interacción de "click para alternar".)

- [ ] **Step 4: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/role-permissions` (o la ruta configurada): confirmar que el panel izquierdo y derecho ya no son blancos fijos en modo oscuro, que crear un rol nuevo abre el `<Modal>` compartido (Escape lo cierra, foco entra al primer campo), que las píldoras de permisos cambian de gris a ámbar con el ícono de check al hacer click, y que "Guardar cambios" sigue funcionando (toast de éxito, `PUT /roles/:id`).

- [ ] **Step 5: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/RolePermissions/RolePermissionsPage.tsx
git commit -m "$(cat <<'EOF'
feat(redesign): restyle role permissions page to new theme, migrate modal to shared Modal

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 20: ProvidersList — reskin to match "Proveedores" mockup

**Files:**
- Modify: `frontend/src/pages/Providers/ProvidersList.tsx:22-360`

**Interfaces:** N/A. Consumes existing `<Modal>` (Sprint 2) — not currently used by `ProviderFormModal`, migrated in Step 1.

**Nota de alcance:** el mockup (`proveedores.txt`) incluye columnas `"Servicio"` y `"Estado"` en la tabla. `backend/src/database/entities/provider.entity.ts` solo tiene `name`, `contactName`, `phone`, `email`, `address` — no hay campo de tipo/servicio ni de estado activo/inactivo (confirmado leyendo la entidad completa). Añadir esas columnas requeriría un campo nuevo de backend + migración, fuera del alcance de este reskin visual. Se omiten esas dos columnas y se conservan las 4 columnas reales (`Nombre`, `Contacto`, `Teléfono`, `Email`), adoptando el resto del lenguaje visual del mockup (avatar/ícono `business`, fuente mono para teléfono, fila con hover, título/subtítulo).

- [ ] **Step 1: Migrar `ProviderFormModal` al `<Modal>` compartido y a `.input-field`/`.btn-ghost`/`.btn-primary`**

Import: `import { Modal } from '../../components/ui/Modal';`

Cambiar (líneas 70-80, apertura del modal):
```tsx
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {provider ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
```
por:
```tsx
  return (
    <Modal title={provider ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
```

Cambiar cada label + input (líneas 85-132), aplicando el mismo patrón en los 5 campos (`Nombre`, `Contacto`, `Teléfono`, `Email`, `Dirección`) — ejemplo con el primero:
```tsx
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
```
por:
```tsx
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Nombre *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field w-full"
            />
          </div>
```
(aplicar la misma transformación de `className` de label y de input a `Contacto`, `Teléfono`, `Email` y `Dirección` — este último es un `<textarea>`, usar `className="input-field w-full"` también, ya soporta `<textarea>` porque el CSS de `.input-field` no está acotado a `<input>`).

Cambiar el cierre (líneas 133-152):
```tsx
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : provider ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```
por:
```tsx
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
              {submitting ? 'Guardando...' : provider ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Reskin encabezado**

Cambiar (líneas 231-245):
```tsx
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Proveedores</h2>
        <div className="flex flex-wrap items-center gap-3">
          <ViewToggle value={view} onChange={setView} storageKey="providersView" />
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
          >
            Nuevo proveedor
          </button>
        </div>
      </div>
```
por:
```tsx
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>Proveedores</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Talleres, agencias y servicios para la flota.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewToggle value={view} onChange={setView} storageKey="providersView" />
          <button type="button" onClick={openCreate} className="btn-primary">
            <span className="material-icons" style={{ fontSize: 17 }}>add</span>
            Nuevo proveedor
          </button>
        </div>
      </div>
```

- [ ] **Step 3: Fix hardcoded colors en tabla y tarjetas, añadir ícono `business` por fila (mismo patrón visual que el avatar de Usuarios)**

Cambiar (líneas 246-247):
```tsx
      {view === 'table' && (
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
```
por:
```tsx
      {view === 'table' && (
        <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
```

Cambiar la columna `name` (líneas 271-277) para añadir el ícono, y el resto de columnas para usar fuente mono en teléfono:
```tsx
          <DataTable<Provider>
            columns={[
              { key: 'name', header: 'Nombre', sortAccessor: (p) => p.name, cellClassName: 'font-medium', render: (p) => p.name },
              { key: 'contactName', header: 'Contacto', sortAccessor: (p) => p.contactName ?? '', render: (p) => p.contactName ?? '—' },
              { key: 'phone', header: 'Teléfono', render: (p) => p.phone ?? '—' },
              { key: 'email', header: 'Email', sortAccessor: (p) => p.email ?? '', render: (p) => p.email ?? '—' },
```
por:
```tsx
          <DataTable<Provider>
            columns={[
              {
                key: 'name',
                header: 'Proveedor',
                sortAccessor: (p) => p.name,
                render: (p) => (
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                      <span className="material-icons" style={{ fontSize: 16 }}>business</span>
                    </span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                ),
              },
              { key: 'contactName', header: 'Contacto', sortAccessor: (p) => p.contactName ?? '', render: (p) => p.contactName ?? '—' },
              { key: 'phone', header: 'Teléfono', cellClassName: 'font-mono-data', render: (p) => p.phone ?? '—' },
              { key: 'email', header: 'Email', sortAccessor: (p) => p.email ?? '', render: (p) => p.email ?? '—' },
```
(el resto de la definición de `columns` — columna `actions` — queda igual, líneas 277-287 sin cambios.)

Cambiar la vista de tarjetas (líneas 298-337):
```tsx
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.length === 0 ? (
            <div className="col-span-full bg-white rounded-[16px] shadow-sm border border-slate-200 px-6 py-12 text-center text-slate-500">
              No hay proveedores registrados.
            </div>
          ) : (
            providers.map((p: Provider) => (
              <div
                key={p.id}
                className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 flex flex-col"
              >
                <div className="font-medium text-slate-900 text-lg">{p.name}</div>
                <div className="text-slate-600 text-sm mt-1">{p.contactName ?? '—'}</div>
                <div className="text-slate-500 text-sm mt-1">{p.phone ?? '—'}</div>
                <div className="text-slate-500 text-sm">{p.email ?? '—'}</div>
                {p.address && (
                  <div className="text-slate-400 text-xs mt-2 line-clamp-2">{p.address}</div>
                )}
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="text-primary font-medium hover:underline text-sm"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="text-red-600 font-medium hover:underline text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
```
por:
```tsx
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.length === 0 ? (
            <div
              className="col-span-full rounded-[16px] px-6 py-12 text-center"
              style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              No hay proveedores registrados.
            </div>
          ) : (
            providers.map((p: Provider) => (
              <div
                key={p.id}
                className="rounded-[16px] p-5 flex flex-col"
                style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                    <span className="material-icons" style={{ fontSize: 18 }}>business</span>
                  </span>
                  <div className="font-medium text-lg" style={{ color: 'var(--color-text)' }}>{p.name}</div>
                </div>
                <div className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{p.contactName ?? '—'}</div>
                <div className="text-sm font-mono-data" style={{ color: 'var(--color-text-muted)' }}>{p.phone ?? '—'}</div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.email ?? '—'}</div>
                {p.address && (
                  <div className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{p.address}</div>
                )}
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => openEdit(p)} className="text-primary font-medium hover:underline text-sm">Editar</button>
                  <button type="button" onClick={() => handleDelete(p)} className="text-red-600 font-medium hover:underline text-sm">Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
```

- [ ] **Step 4: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/providers`: confirmar título/subtítulo nuevos, ícono `business` junto al nombre en tabla y tarjetas, teléfono en fuente mono, y que crear/editar un proveedor abre el `<Modal>` compartido (Escape cierra, foco entra al primer campo, guardar sigue funcionando contra `POST`/`PUT /providers`). Verificar en modo claro y oscuro que ninguna tarjeta queda blanca fija.

- [ ] **Step 5: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Providers/ProvidersList.tsx
git commit -m "$(cat <<'EOF'
feat(redesign): restyle Providers list to match mockup, migrate modal to shared Modal

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 21: AssignRolesPage — adapt to new design family (no mockup screen)

**Files:**
- Modify: `frontend/src/pages/AssignRoles/AssignRolesPage.tsx:87-162`

**Interfaces:** N/A. No `<Modal>`/`<ConfirmDialog>`/`<DataTable>` usage on this page today (it's a plain inline `<table>`) — this task does not introduce those shared components (out of scope: no delete/modal flow exists here, and swapping the raw `<table>` for `<DataTable>`/`useDataTable` would add search/sort/pagination behavior not requested and not present in Sprint 2's rollout list for this page). Only color/typography literals are fixed, structure is preserved 1:1.

- [ ] **Step 1: Fix all hardcoded `bg-white`/`border-slate-*`/`text-slate-*`/`bg-slate-*` literals, add row-hover state (same pattern as `DataTable.tsx`), reuse `.badge`/`.btn-primary`, keep every other line (data fetching, mutation, `SearchSelect`, disabled/save logic) untouched**

Añadir estado de hover junto a los demás `useState` (línea 20, después de `const [error, setError] = useState<string | null>(null);`):
```tsx
  const [hoveredId, setHoveredId] = useState<string | null>(null);
```

Cambiar (líneas 87-162, el JSX completo de retorno):
```tsx
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-slate-900">Asignar roles a usuarios</h2>
      <p className="text-slate-600 text-sm">
        Usuarios registrados en el sistema. Elige un rol y pulsa Guardar para actualizar.
      </p>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Usuario</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Email</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Rol actual</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Nuevo rol</th>
              <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((u: User) => {
                const currentRoleId = getCurrentRoleId(u);
                const hasChange = (u.roleId ?? '') !== (currentRoleId.trim() || '');
                return (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {u.displayName || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {u.role?.name ?? (u.roleId && roles.find((r: Role) => r.id === u.roleId)?.name) ?? 'Sin rol'}
                    </td>
                    <td className="px-6 py-4">
                      <SearchSelect
                        options={[
                          { value: '', label: 'Sin rol' },
                          ...roles.map((r: Role) => ({ value: r.id, label: r.name })),
                        ]}
                        value={currentRoleId}
                        onChange={(v) => handleRoleChange(u.id, v)}
                        placeholder="Seleccionar rol"
                        className="w-48"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSave(u)}
                        disabled={!hasChange || savingId === u.id}
                        className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {savingId === u.id ? 'Guardando…' : 'Guardar'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
```
por:
```tsx
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>Asignar roles a usuarios</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Usuarios registrados en el sistema. Elige un rol y pulsa Guardar para actualizar.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead style={{ background: 'var(--color-table-head-bg)', borderBottom: '1px solid var(--color-border)' }}>
            <tr>
              <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Usuario</th>
              <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Email</th>
              <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Rol actual</th>
              <th className="text-left px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Nuevo rol</th>
              <th className="text-right px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-soft)' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((u: User) => {
                const currentRoleId = getCurrentRoleId(u);
                const hasChange = (u.roleId ?? '') !== (currentRoleId.trim() || '');
                const currentRoleName = u.role?.name ?? (u.roleId && roles.find((r: Role) => r.id === u.roleId)?.name) ?? null;
                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      background: hoveredId === u.id ? 'var(--color-table-row-hover)' : undefined,
                    }}
                    onMouseEnter={() => setHoveredId(u.id)}
                    onMouseLeave={() => setHoveredId((id) => (id === u.id ? null : id))}
                  >
                    <td className="px-6 py-4 font-medium" style={{ color: 'var(--color-text)' }}>
                      {u.displayName || '—'}
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                    <td className="px-6 py-4">
                      {currentRoleName ? (
                        <span className="badge badge-amber">{currentRoleName}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>Sin rol</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <SearchSelect
                        options={[
                          { value: '', label: 'Sin rol' },
                          ...roles.map((r: Role) => ({ value: r.id, label: r.name })),
                        ]}
                        value={currentRoleId}
                        onChange={(v) => handleRoleChange(u.id, v)}
                        placeholder="Seleccionar rol"
                        className="w-48"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSave(u)}
                        disabled={!hasChange || savingId === u.id}
                        className="btn-primary text-sm px-3 py-1.5 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {savingId === u.id ? 'Guardando…' : 'Guardar'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
```
(Se preserva íntegramente: `getCurrentRoleId`, `handleRoleChange`, `handleSave`, `updateRoleMutation`, `savingId`, `error`, y `SearchSelect` — solo se tocan clases/colores, se añade `hoveredId` para el hover de fila (mismo patrón exacto que `frontend/src/components/ui/DataTable.tsx:32,69-70`), y "Rol actual" pasa a píldora `.badge-amber` para verse consistente con Users/RolePermissions.)

- [ ] **Step 2: Verificación manual**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir la ruta de "Asignar roles" (verificar el path exacto en el router, p. ej. `/assign-roles`): confirmar que la tabla ya no es blanca fija en modo oscuro, que "Rol actual" se ve como píldora ámbar consistente con Users, que el hover de fila funciona, y que cambiar un rol en el `SearchSelect` y pulsar "Guardar" sigue actualizando correctamente (`PUT /users/:id`, el botón se deshabilita mientras no haya cambios o esté guardando).

- [ ] **Step 3: Commit**
```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/AssignRoles/AssignRolesPage.tsx
git commit -m "$(cat <<'EOF'
feat(redesign): restyle Assign Roles page to match new theme (no mockup screen)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 22: Profile page — reskin `ProfilePage.tsx` to theme tokens + shared components

**Files:**
- Modify: `frontend/src/pages/Profile/ProfilePage.tsx:1-468`

**Interfaces:** N/A (leaf page). Consumes existing `notifySuccess`/`notifyError` from `frontend/src/lib/toast.ts` (already used by `SystemSettingsPage.tsx`, not yet by this page) and the shared `.btn-primary`/`.btn-ghost`/`.input-field` classes from `frontend/src/index.css` (already used by `VehiclesList.tsx`/`ReservationsList.tsx`, not yet by this page).

**Context on scope:** `grep -n "#6384ff\|#5a6fff\|#818cf8\|rgba(99, *132, *255\|rgba(99, *102, *241\|#6366f1" frontend/src/pages/Profile/ProfilePage.tsx` returns nothing — no raw old-blue hex literals. The real defect is structural: the entire file is written with hardcoded **light-mode** Tailwind classes (`bg-white`, `text-slate-900`, `border-slate-200`, `bg-indigo-50`, `text-indigo-500`, `bg-rose-50`, `text-rose-500`, etc.) that will not react to the Foundation's dark/light `var(--color-*)` rewrite at all — this is the exact class of bug already fixed once in commit `80500060` ("fix(U1): use theme CSS variables instead of hardcoded light-mode classes") for `UsersList.tsx`/`VehiclesList.tsx`/`ReservationsList.tsx`, but `ProfilePage.tsx` was missed. This task applies that same established pattern here, plus reuses `.btn-primary`/`.btn-ghost`/`.input-field` (already defined in `index.css`, already used by `VehiclesList.tsx`) instead of hand-rolled color utilities, and replaces the page's bespoke success/error banner with the shared toast system SystemSettingsPage already uses — this is a genuine reuse fix, not scope creep, since it's inconsistent for one page in this exact review to hand-roll banners while a sibling page uses the shared mechanism.

**Design-parity note (explicit scope decision):** the mockup's "Mi perfil" screen (`mi-perfil.txt`) is a **read-only summary dashboard** (avatar initials, static role badge, a 3-stat row — "Solicitudes: 48", "km recorridos: 12,480", "Sanciones: 0" — and two read-only cards "Datos y licencia" / "Preferencias" with a light/dark toggle), structurally different from the current **editable form** (personal info / license / emergency contact, with photo upload). Per the "preserve 100% of existing functional behavior" constraint, the edit flow and photo upload/crop are kept. The 3-stat row (Solicitudes/km/Sanciones) and the light/dark theme toggle button are **not ported** — there is no backend endpoint returning aggregate request count / km driven / sanction count for a user, and a theme toggle already exists elsewhere in `MainLayout`'s header (per the Foundation background) so duplicating it here would invent redundant UI backed by no distinct data. Only the visual system (card radius/border/surface tokens, uppercase micro-labels, mono treatment for numeric/ID data, single-accent icon treatment, gradient direction) is ported.

- [ ] **Step 1: Replace the local success/error banner with the shared toast system**

Add import (near the top, alongside the other imports):
```tsx
import { notifySuccess, notifyError } from '../../lib/toast';
```

Cambiar (líneas 33-34):
```tsx
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
```
por: delete both lines entirely (no local success/error state).

Cambiar (líneas 80-91, mutation callbacks):
```tsx
    onSuccess: () => {
      setSuccess(true);
      setEditing(false);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al guardar los cambios.';
      setError(String(msg));
    },
```
por:
```tsx
    onSuccess: () => {
      notifySuccess('Perfil actualizado correctamente.');
      setEditing(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al guardar los cambios.';
      notifyError(String(msg));
    },
```

Cambiar (línea 95, dentro de `handleSave`):
```tsx
  const handleSave = () => {
    setError(null);
    const payload: Record<string, unknown> = {};
```
por:
```tsx
  const handleSave = () => {
    const payload: Record<string, unknown> = {};
```

Cambiar (líneas 114-116, dentro de `handleCancel`):
```tsx
  const handleCancel = () => {
    setEditing(false);
    setError(null);
    // Recargar datos originales
```
por:
```tsx
  const handleCancel = () => {
    setEditing(false);
    // Recargar datos originales
```

Cambiar (líneas 143-179, `handlePhotoChange`):
```tsx
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData?.id) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Formato no válido. Usa JPG, PNG, WebP o GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5 MB.');
      return;
    }
    setError(null);
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'user');
      formData.append('entityId', userData.id);
      const uploadRes = await apiClient.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const firebaseUrl = uploadRes.data.firebaseUrl;
      await apiClient.post('/auth/sync-user', { photoUrl: firebaseUrl });
      await refreshUserData();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al subir la foto.';
      setError(String(msg));
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };
```
por:
```tsx
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData?.id) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      notifyError('Formato no válido. Usa JPG, PNG, WebP o GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifyError('La imagen no debe superar 5 MB.');
      return;
    }
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'user');
      formData.append('entityId', userData.id);
      const uploadRes = await apiClient.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const firebaseUrl = uploadRes.data.firebaseUrl;
      await apiClient.post('/auth/sync-user', { photoUrl: firebaseUrl });
      await refreshUserData();
      notifySuccess('Foto de perfil actualizada.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al subir la foto.';
      notifyError(String(msg));
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };
```

Cambiar (líneas 227-239) — eliminar por completo el bloque de alertas locales:
```tsx
      {/* Alertas */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
          <span className="material-icons text-green-600">check_circle</span>
          Perfil actualizado correctamente.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          <span className="material-icons text-red-500">error_outline</span>
          {error}
        </div>
      )}

```
(borrar todo el bloque, sin reemplazo).

- [ ] **Step 2: Fix header title/subtitle and action buttons — reuse `.btn-primary`/`.btn-ghost`**

Cambiar (líneas 188-225):
```tsx
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mi perfil</h2>
          <p className="text-sm text-slate-500 mt-1">Gestiona tu información personal y de contacto.</p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-[12px] hover:bg-primary-dark font-medium text-sm transition-colors shadow-sm"
          >
            <span className="material-icons text-lg">edit</span>
            Editar perfil
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-[12px] hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-[12px] hover:bg-primary-dark font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <span className="material-icons text-lg">save</span>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
```
por:
```tsx
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Mi perfil</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Gestiona tu información personal y de contacto.</p>
        </div>
        {!editing ? (
          <button type="button" onClick={() => setEditing(true)} className="btn-primary">
            <span className="material-icons text-lg">edit</span>
            Editar perfil
          </button>
        ) : (
          <div className="flex gap-3">
            <button type="button" onClick={handleCancel} className="btn-ghost">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="btn-primary disabled:opacity-50"
            >
              <span className="material-icons text-lg">save</span>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
```

- [ ] **Step 3: Fix the profile header card (container, gradient, avatar, name/role badge)**

Cambiar (líneas 241-300):
```tsx
      {/* Tarjeta de cabecera del perfil */}
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary to-indigo-500" />
        <div className="relative px-6 pb-6 pt-14 -mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar con opción de subir foto */}
            <div className="relative flex-shrink-0">
              {userData?.photoUrl || currentUser?.photoURL ? (
                <img
                  src={userData?.photoUrl ?? currentUser?.photoURL ?? ''}
                  alt=""
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl bg-slate-100"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center text-slate-400">
                  <span className="material-icons text-5xl">person</span>
                </div>
              )}
```
por:
```tsx
      {/* Tarjeta de cabecera del perfil */}
      <div
        className="rounded-[16px] shadow-sm overflow-hidden"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
      >
        <div className="h-24 bg-gradient-to-r from-primary to-primary-dark" />
        <div className="relative px-6 pb-6 pt-14 -mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar con opción de subir foto */}
            <div className="relative flex-shrink-0">
              {userData?.photoUrl || currentUser?.photoURL ? (
                <img
                  src={userData?.photoUrl ?? currentUser?.photoURL ?? ''}
                  alt=""
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                  style={{ background: 'var(--color-border)' }}
                />
              ) : (
                <div
                  className="w-28 h-28 rounded-full border-4 border-white shadow-xl flex items-center justify-center"
                  style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  <span className="material-icons text-5xl">person</span>
                </div>
              )}
```
(el aro `border-4 border-white` alrededor del avatar se conserva intencionalmente — es un anillo de contraste sobre la barra de gradiente, no una superficie de tarjeta, y el mockup tampoco define un color de aro distinto).

Cambiar (líneas 286-297):
```tsx
            <div className="min-w-0 pb-1">
              <h3 className="text-xl font-bold text-slate-900 truncate">
                {userData?.displayName || currentUser?.displayName || 'Usuario'}
              </h3>
              <p className="text-sm text-slate-500 truncate mt-0.5">{userData?.email || currentUser?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  <span className="material-icons text-xs">badge</span>
                  {userData?.role?.name || 'Usuario'}
                </span>
              </div>
            </div>
```
por:
```tsx
            <div className="min-w-0 pb-1">
              <h3 className="text-xl font-bold truncate" style={{ color: 'var(--color-text)' }}>
                {userData?.displayName || currentUser?.displayName || 'Usuario'}
              </h3>
              <p className="text-sm truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {userData?.email || currentUser?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide font-mono-data bg-primary/10 text-primary">
                  <span className="material-icons text-xs">badge</span>
                  {userData?.role?.name || 'Usuario'}
                </span>
              </div>
            </div>
```
(`bg-primary/10 text-primary` ya usa el token estático `--color-primary` de Tailwind — ya se re-pinta solo con el cambio de paleta del Foundation, no necesita `var()` inline; se añade `uppercase tracking-wide font-mono-data` para igualar el tratamiento del badge de rol en el mockup: `font-family:'IBM Plex Mono';... background:var(--accBg);color:var(--accTx)`).

- [ ] **Step 4: Fix the three section cards — containers, icon accents, headings, field labels**

Card containers — mismo string exacto en dos ubicaciones (líneas 305 y 363), usar `replace_all`:

Cambiar (occurs at líneas 305, 363):
```tsx
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-6">
```
por (reemplazar las 2 ocurrencias idénticas):
```tsx
        <div className="rounded-[16px] shadow-sm p-6" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
```

Cambiar (línea 422, variante única con `lg:col-span-2`):
```tsx
        <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-6 lg:col-span-2">
```
por:
```tsx
        <div className="rounded-[16px] shadow-sm p-6 lg:col-span-2" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
```

Icon accents — el mockup no diferencia colores de icono por sección (todo el énfasis de color vive en el único badge de rol con `--acc`), así que se unifica a `bg-primary/10 text-primary` (mismo tratamiento que ya usa la sección "Información personal"), eliminando `indigo-50`/`indigo-500`/`rose-50`/`rose-500` que son residuo de la paleta azul/índigo anterior y, al ser clases Tailwind estáticas, tampoco reaccionan al tema oscuro:

Cambiar (líneas 365-366):
```tsx
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <span className="material-icons text-indigo-500 text-xl">directions_car</span>
```
por:
```tsx
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-icons text-primary text-xl">directions_car</span>
```

Cambiar (líneas 424-425):
```tsx
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
              <span className="material-icons text-rose-500 text-xl">emergency</span>
```
por:
```tsx
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-icons text-primary text-xl">emergency</span>
```

Headings — mismo string exacto en 3 ubicaciones (líneas 310, 368, 427), usar `replace_all`:

Cambiar:
```tsx
            <h4 className="text-base font-bold text-slate-900">
```
por:
```tsx
            <h4 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
```

Field labels — mismo string exacto en 11 ubicaciones (líneas 314, 325, 337, 348, 372, 384, 395, 406, 431, 442, 453), usar `replace_all`:

Cambiar:
```tsx
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
```
por:
```tsx
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
```

- [ ] **Step 5: Simplify `inputClass` to reuse the shared `.input-field` class; drop the redundant className on `SearchSelect`**

Cambiar (líneas 181-186):
```tsx
  const inputClass = (disabled: boolean) =>
    `w-full px-4 py-2.5 border rounded-[12px] text-sm font-medium transition-colors ${
      disabled
        ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed'
        : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-primary/30 focus:border-primary'
    }`;
```
por:
```tsx
  const inputClass = (disabled: boolean) =>
    `input-field ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`;
```

Cambiar (líneas 384-392) — `SearchSelect` ya tematiza su propio disparador vía `var(--color-*)` internamente (`frontend/src/components/ui/SearchSelect.tsx:91-108`), independiente del `className` recibido, así que pasarle `inputClass(!editing)` no aporta nada y puede duplicar el atenuado (`opacity-60` del wrapper sobre el `opacity: disabled ? 0.6 : 1` que ya aplica el propio componente):
```tsx
                <SearchSelect
                  options={LICENSE_TYPES}
                  value={form.licenseType}
                  onChange={(v) => update('licenseType', v)}
                  placeholder="Seleccionar..."
                  disabled={!editing}
                  className={inputClass(!editing)}
                />
```
por:
```tsx
                <SearchSelect
                  options={LICENSE_TYPES}
                  value={form.licenseType}
                  onChange={(v) => update('licenseType', v)}
                  placeholder="Seleccionar..."
                  disabled={!editing}
                />
```

- [ ] **Step 6: Verificación manual**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/profile`. Confirmar: (1) en modo oscuro y claro, las 3 tarjetas y la cabecera ya no se ven blancas fijas — siguen el tema; (2) el botón "Editar perfil" y "Guardar cambios" usan el nuevo look ámbar de `.btn-primary`; "Cancelar" usa `.btn-ghost`; (3) guardar cambios muestra un toast (no el banner verde anterior); (4) subir una foto inválida (ej. un PDF) muestra un toast de error, no el banner rojo anterior; (5) los 3 íconos de sección (persona/licencia/emergencia) son ahora todos del mismo color ámbar; (6) los campos deshabilitados (modo lectura) se ven atenuados pero legibles en ambos temas.

- [ ] **Step 7: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/Profile/ProfilePage.tsx
git commit -m "$(cat <<'EOF'
fix(redesign): reskin Profile page to theme tokens and shared components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 23: Audit logs page — reskin `AuditLogsPage.tsx`, migrate `MetadataModal` to shared `<Modal>`, reuse `.badge` classes

**Files:**
- Modify: `frontend/src/pages/AuditLogs/AuditLogsPage.tsx:1-325`

**Interfaces:** Consumes `<Modal>` (`frontend/src/components/ui/Modal.tsx`, already exists per the Foundation/Sprint 2 background, not yet used by this page).

**Context on scope:** `grep -n "#6384ff\|#5a6fff\|#818cf8\|rgba(99, *132, *255\|rgba(99, *102, *241\|#6366f1" frontend/src/pages/AuditLogs/AuditLogsPage.tsx` returns nothing. **No change needed** for the page header or the "Estadísticas rápidas" stat row — both already use `var(--color-text)`/`var(--color-text-muted)` inline styles and the shared `.glass-panel` class (lines 194-223), confirmed by re-reading those lines: they contain zero hardcoded Tailwind color classes already. The real work is: (a) `MetadataModal` (lines 67-127) is a hand-rolled `fixed inset-0` dialog using `bg-white`/`border-slate-200`/`text-slate-*`, never migrated to the shared `<Modal>` from Sprint 2 Task 1 (that task's rollout only covered Users/Vehicles/Reservations); (b) the outer table container/filter bar (lines 226-249) use the same hardcoded `bg-white`/`border-slate-200`/`border-slate-300` pattern; (c) `actionBadge()` (lines 42-60) hand-computes `rgba(...)` colors including `#2563eb` for "update" — functionally equivalent to, and duplicating, the already-existing theme-aware `.badge`/`.badge-blue`/`.badge-green`/`.badge-amber`/`.badge-red`/`.badge-purple`/`.badge-slate` classes (confirmed defined in `frontend/src/index.css:195-220`, already used by `Dashboard.tsx`); (d) several `DataTable` column `cellClassName` values (`text-slate-600`, `text-slate-700`, `text-slate-500`) are dead code today — `DataTable.tsx:76` always sets `style={{ color: 'var(--color-text)', ...col.cellStyle }}` on the `<td>`, and an inline `style` always wins over a class-based color, so these Tailwind color classes currently have zero visual effect. This task replaces them with real `cellStyle.color` overrides matching the design's `--tx2` (secondary text) / `--accTx` (accent) treatment for the Fecha/Recurso columns.

**Design-parity note:** the mockup's audit table has 5 columns (Fecha, Usuario, Acción, Recurso, Detalle) where "Usuario" shows a friendly name and "Detalle" is a formatted description string. The backend `AuditLog` entity (`backend/src/database/entities/audit-log.entity.ts`) only stores a raw `userId` (no user relation/join in `audit-logs.service.ts`) and a raw `metadata` JSON blob (no pre-formatted description) — surfacing a friendly username or a formatted detail string would require a new backend join/field, which is out of scope. The existing 6-column layout (Fecha, Acción, Recurso, ID Recurso, Usuario, Detalle "Ver" button opening the metadata modal) is kept as-is, functionally, and only restyled.

- [ ] **Step 1: Migrate `MetadataModal` to the shared `<Modal>` component**

Add import (top of file, after the other component imports):
```tsx
import { Modal } from '../../components/ui/Modal';
```

Cambiar (líneas 67-127):
```tsx
function MetadataModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900">Detalle del registro</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono-data">{log.id}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Acción</p>
              <div className="mt-1">{actionBadge(log.action)}</div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Recurso</p>
              <p className="mt-1 font-medium text-slate-800">{resourceLabel(log.resource)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">ID Recurso</p>
              <p className="mt-1 font-mono-data text-xs text-slate-600 break-all">
                {log.resourceId ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Usuario ID</p>
              <p className="mt-1 font-mono-data text-xs text-slate-600 break-all">
                {log.userId ?? '—'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Fecha</p>
              <p className="mt-1 font-mono-data text-sm text-slate-800">
                {new Date(log.createdAt).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Metadata</p>
              <pre className="bg-slate-50 rounded-lg p-3 text-xs overflow-auto max-h-60 text-slate-700 font-mono-data">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```
por:
```tsx
function MetadataModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <Modal title="Detalle del registro" subtitle={log.id} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Acción</p>
            <div className="mt-1">{actionBadge(log.action)}</div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Recurso</p>
            <p className="mt-1 font-medium" style={{ color: 'var(--color-text)' }}>{resourceLabel(log.resource)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>ID Recurso</p>
            <p className="mt-1 font-mono-data text-xs break-all" style={{ color: 'var(--color-text-soft)' }}>
              {log.resourceId ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Usuario ID</p>
            <p className="mt-1 font-mono-data text-xs break-all" style={{ color: 'var(--color-text-soft)' }}>
              {log.userId ?? '—'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Fecha</p>
            <p className="mt-1 font-mono-data text-sm" style={{ color: 'var(--color-text)' }}>
              {new Date(log.createdAt).toLocaleString('es-MX')}
            </p>
          </div>
        </div>
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--color-text-muted)' }}>Metadata</p>
            <pre
              className="rounded-lg p-3 text-xs overflow-auto max-h-60 font-mono-data"
              style={{ background: 'var(--color-table-head-bg)', color: 'var(--color-text-soft)' }}
            >
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
}
```
(`<Modal>` ya provee el header con título/subtítulo/botón de cierre, Escape, click-outside y foco — se elimina el `<div className="px-6 py-4 border-b ...">` manual por completo).

- [ ] **Step 2: Reuse `.badge` classes in `actionBadge()` instead of hand-computed `rgba()`**

Cambiar (líneas 42-60):
```tsx
function actionBadge(action: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    create:  { label: 'Crear',    color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
    update:  { label: 'Editar',   color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
    delete:  { label: 'Eliminar', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
    login:   { label: 'Login',    color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    approve: { label: 'Aprobar',  color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
    reject:  { label: 'Rechazar', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  };
  const s = map[action] ?? { label: action, color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}
```
por:
```tsx
function actionBadge(action: string) {
  const map: Record<string, { label: string; variant: string }> = {
    create:  { label: 'Crear',    variant: 'badge-green' },
    update:  { label: 'Editar',   variant: 'badge-blue' },
    delete:  { label: 'Eliminar', variant: 'badge-red' },
    login:   { label: 'Login',    variant: 'badge-purple' },
    approve: { label: 'Aprobar',  variant: 'badge-green' },
    reject:  { label: 'Rechazar', variant: 'badge-amber' },
  };
  const s = map[action] ?? { label: action, variant: 'badge-slate' };
  return <span className={`badge ${s.variant}`}>{s.label}</span>;
}
```
(las clases `.badge-*` ya tienen valores distintos para tema claro/oscuro definidos en `index.css:207-220`; el Foundation las repinta a la nueva paleta sin cambiar nombres — no se toca `index.css` aquí).

- [ ] **Step 3: Fix the table container, filter bar, and search input**

Cambiar (líneas 226-235):
```tsx
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        {/* Filtros */}
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por acción, recurso, usuario..."
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary w-64"
          />
```
por:
```tsx
      <div
        className="rounded-[16px] shadow-sm overflow-hidden"
        style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
      >
        {/* Filtros */}
        <div className="px-4 py-3 flex flex-wrap gap-3 items-center" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por acción, recurso, usuario..."
            className="input-field w-64"
          />
```
(mismo patrón `input-field` + ancho fijo ya usado en `SystemSettingsPage.tsx:347` — `className="input-field w-full max-w-sm"` — confirma que `.input-field` combinado con un ancho Tailwind ya funciona en este código base).

- [ ] **Step 4: Fix `DataTable` column definitions — replace dead color classes with real `cellStyle` overrides**

Cambiar (líneas 278-309):
```tsx
        <DataTable<AuditLog>
          columns={[
            {
              key: 'createdAt',
              header: 'Fecha',
              sortAccessor: (l) => l.createdAt,
              cellClassName: 'text-sm font-mono-data text-slate-600',
              cellStyle: { whiteSpace: 'nowrap' },
              render: (l) =>
                new Date(l.createdAt).toLocaleString('es-MX', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                }),
            },
            { key: 'action', header: 'Acción', sortAccessor: (l) => l.action, render: (l) => actionBadge(l.action) },
            { key: 'resource', header: 'Recurso', sortAccessor: (l) => resourceLabel(l.resource), cellClassName: 'text-sm text-slate-700', render: (l) => resourceLabel(l.resource) },
            { key: 'resourceId', header: 'ID Recurso', cellClassName: 'text-xs font-mono-data text-slate-500 max-w-[140px] truncate', render: (l) => l.resourceId ?? '—' },
            { key: 'userId', header: 'Usuario', cellClassName: 'text-xs font-mono-data text-slate-500 max-w-[140px] truncate', render: (l) => l.userId ?? '—' },
```
por:
```tsx
        <DataTable<AuditLog>
          columns={[
            {
              key: 'createdAt',
              header: 'Fecha',
              sortAccessor: (l) => l.createdAt,
              cellClassName: 'text-sm font-mono-data',
              cellStyle: { whiteSpace: 'nowrap', color: 'var(--color-text-soft)' },
              render: (l) =>
                new Date(l.createdAt).toLocaleString('es-MX', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                }),
            },
            { key: 'action', header: 'Acción', sortAccessor: (l) => l.action, render: (l) => actionBadge(l.action) },
            {
              key: 'resource',
              header: 'Recurso',
              sortAccessor: (l) => resourceLabel(l.resource),
              cellClassName: 'text-sm font-mono-data',
              cellStyle: { color: 'var(--color-primary)' },
              render: (l) => resourceLabel(l.resource),
            },
            {
              key: 'resourceId',
              header: 'ID Recurso',
              cellClassName: 'text-xs font-mono-data max-w-[140px] truncate',
              cellStyle: { color: 'var(--color-text-muted)' },
              render: (l) => l.resourceId ?? '—',
            },
            {
              key: 'userId',
              header: 'Usuario',
              cellClassName: 'text-xs font-mono-data max-w-[140px] truncate',
              cellStyle: { color: 'var(--color-text-muted)' },
              render: (l) => l.userId ?? '—',
            },
```
(el mockup muestra la columna Fecha en un tono secundario `var(--tx2)` ≈ `var(--color-text-soft)`, y Recurso en el color de acento `var(--accTx)` ≈ `var(--color-primary)` — esto reproduce ese contraste real en vez de las clases `text-slate-*` que hoy no tienen efecto).

- [ ] **Step 5: Verificación manual**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/audit-logs`. Confirmar: (1) la tarjeta de la tabla y la barra de filtros ya no son blancas fijas en modo oscuro; (2) los badges de "Acción" se ven igual de coloridos que antes pero ahora comparten el sistema `.badge-*` (abrir un registro de cada acción para confirmar visualmente create=verde, update=azul, delete=rojo, login=morado, approve=verde, reject=ámbar); (3) click en "Ver" abre el modal de detalle ya con el look de `<Modal>` (Escape cierra, foco entra al primer control, fondo ya no blanco en oscuro); (4) la columna "Recurso" se ve en color de acento y "Fecha"/"ID Recurso"/"Usuario" en tono secundario/atenuado.

- [ ] **Step 6: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/AuditLogs/AuditLogsPage.tsx
git commit -m "$(cat <<'EOF'
fix(redesign): reskin Audit logs page, migrate metadata modal to shared Modal, reuse badge classes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 24: System settings page — reskin `SystemSettingsPage.tsx`, migrate `SettingFormModal` to shared `<Modal>`, surface `max_reservation_days`

**Files:**
- Modify: `frontend/src/pages/SystemSettings/SystemSettingsPage.tsx:1-412`

**Interfaces:** Consumes `<Modal>` (`frontend/src/components/ui/Modal.tsx`, not yet used by this page). No new interfaces produced.

**Context on scope:** `grep -n "#6384ff\|#5a6fff\|#818cf8\|rgba(99, *132, *255\|rgba(99, *102, *241\|#6366f1" frontend/src/pages/SystemSettings/SystemSettingsPage.tsx` returns nothing. Same defect class as Tasks 21/22: hardcoded `bg-white`/`border-slate-200`/`text-slate-*`/`bg-slate-200` throughout, plus `SettingFormModal` (lines 14-113) never migrated to the shared `<Modal>`, plus hand-rolled toggle-track/status-pill markup that duplicates the already-existing `.badge-green`/`.badge-slate`/`.badge-amber` classes. The page heading `text-2xl font-bold text-slate-900` (line 237) is the exact pattern already fixed by commit `80500060` in `UsersList.tsx`/`VehiclesList.tsx`/`ReservationsList.tsx` — this page was missed in that pass.

**Design-parity note (explicit scope decision):** the mockup's "Configuración del sistema" screen (`config-sistema-clean.txt`) shows 3 cards — "Institución" (nombre del sistema, dominio, zona horaria), "Reservas" (aprobación requerida toggle, anticipación mínima, duración máxima), "Notificaciones" (SMTP status, recordatorios toggle, versión). None of `institución.nombre/dominio/zona horaria`, `anticipación mínima`, `SMTP status`, or `versión de la app` exist anywhere in the current API (`GET /system-settings` only returns generic `{id,key,value}` rows; there is no settings/info endpoint for app metadata). Per "do not invent new API endpoints/fields/business logic," the "Institución" and "Notificaciones" cards, and the "Anticipación mínima" field, are **not ported** — they would require backend work outside this plan. The one exception: a `max_reservation_days` key **already exists** in the seed data (`backend/src/database/seeds/index.ts:285`) and is already fetched by this page's own `useQuery` as part of the generic `settings` array — so "Duración máxima" can be surfaced for free, with zero new endpoints, by reading that existing row. This task restyles the existing "Comportamiento de reservas" card (the functional equivalent of the mockup's "Reservas" card) to the design's visual system and adds that one read-only field; it does not fabricate the rest.

- [ ] **Step 1: Migrate `SettingFormModal` to the shared `<Modal>` component**

Add import (línea 11, junto a `ConfirmDialog`):
```tsx
import { Modal } from '../../components/ui/Modal';
```

Cambiar (líneas 52-112):
```tsx
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-xl border border-slate-200 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {setting ? 'Editar configuración' : 'Nueva configuración'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clave *</label>
            <input
              type="text"
              required
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              disabled={!!setting}
              placeholder="ej. max_reservation_days"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-slate-100 disabled:text-slate-500"
            />
            {setting && (
              <p className="text-xs text-slate-500 mt-1">La clave no se puede modificar.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor *</label>
            <textarea
              rows={3}
              required
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              placeholder="Valor de la configuración"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : setting ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```
por:
```tsx
  return (
    <Modal title={setting ? 'Editar configuración' : 'Nueva configuración'} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Clave *</label>
          <input
            type="text"
            required
            value={form.key}
            onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
            disabled={!!setting}
            placeholder="ej. max_reservation_days"
            className="input-field disabled:opacity-60"
          />
          {setting && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>La clave no se puede modificar.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-soft)' }}>Valor *</label>
          <textarea
            rows={3}
            required
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            placeholder="Valor de la configuración"
            className="input-field"
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 py-2">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2 disabled:opacity-50">
            {submitting ? 'Guardando...' : setting ? 'Guardar cambios' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
```
(el banner `bg-red-50 text-red-700` de error de formulario se deja intacto a propósito — es el mismo patrón sin corregir que ya existe en `UsersList.tsx:81`, una página de referencia ya migrada en Sprint 2; no se introduce aquí una inconsistencia nueva tocándolo solo en esta página).

- [ ] **Step 2: Fix page heading and "Nueva configuración" button**

Cambiar (líneas 236-245):
```tsx
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Configuración del sistema</h2>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium"
        >
          Nueva configuración
        </button>
      </div>
```
por:
```tsx
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Configuración del sistema</h2>
        <button type="button" onClick={openCreate} className="btn-primary">
          Nueva configuración
        </button>
      </div>
```

- [ ] **Step 3: Add a `maxReservationDays` lookup (reuses already-fetched data, no new endpoint)**

Cambiar (líneas 139-144, justo después de la derivación de `adminOverdueEnabled`):
```tsx
  const adminOverdueSetting: SystemSetting | undefined = settings.find(
    (s: SystemSetting) => s.key === ADMIN_OVERDUE_KEY,
  );
  // Absent = true (current behavior: admins subject to overdue like everyone else)
  const adminOverdueEnabled = adminOverdueSetting === undefined || adminOverdueSetting.value !== 'false';
```
por:
```tsx
  const adminOverdueSetting: SystemSetting | undefined = settings.find(
    (s: SystemSetting) => s.key === ADMIN_OVERDUE_KEY,
  );
  // Absent = true (current behavior: admins subject to overdue like everyone else)
  const adminOverdueEnabled = adminOverdueSetting === undefined || adminOverdueSetting.value !== 'false';

  const maxReservationDaysSetting: SystemSetting | undefined = settings.find(
    (s: SystemSetting) => s.key === 'max_reservation_days',
  );
```

- [ ] **Step 4: Reskin the "Comportamiento de reservas" card — container, text, toggle track, status pills, and add the read-only "Duración máxima" field**

Cambiar (líneas 247-338):
```tsx
      {/* Opciones rápidas */}
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="material-icons text-primary text-xl">tune</span>
          Comportamiento de reservas
        </h3>
        <div className="space-y-5 divide-y divide-slate-100">
          {/* Auto-aprobación */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Auto-aprobación de reservas</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Cuando está activo, las solicitudes de reserva se aprueban automáticamente si el
                  vehículo está disponible en las fechas solicitadas. Si hay conflicto, la reserva
                  queda en estado pendiente para revisión manual.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoApprove}
                disabled={togglingAutoApprove}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  autoApproveEnabled ? 'bg-primary' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={autoApproveEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoApproveEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  autoApproveEnabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoApproveEnabled ? 'bg-green-500' : 'bg-slate-400'}`} />
                {autoApproveEnabled ? 'Activo' : 'Inactivo — aprobación manual requerida'}
              </span>
            </div>
          </div>

          {/* Vencimiento para administradores */}
          <div className="pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Vencimiento de reservas para administradores</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Cuando está activo, las reservas de administradores vencen igual que las del resto
                  de los usuarios. Si está desactivado, los administradores quedan exentos del
                  proceso automático de vencimiento.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAdminOverdue}
                disabled={togglingAdminOverdue}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  adminOverdueEnabled ? 'bg-primary' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={adminOverdueEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    adminOverdueEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  adminOverdueEnabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${adminOverdueEnabled ? 'bg-green-500' : 'bg-amber-400'}`} />
                {adminOverdueEnabled ? 'Activo — aplica a todos los usuarios' : 'Inactivo — administradores exentos'}
              </span>
            </div>
          </div>
        </div>
      </div>
```
por:
```tsx
      {/* Opciones rápidas */}
      <div className="rounded-[16px] shadow-sm p-6" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <span className="material-icons text-primary text-xl">tune</span>
          Comportamiento de reservas
        </h3>
        <div className="space-y-5">
          {/* Auto-aprobación */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Auto-aprobación de reservas</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Cuando está activo, las solicitudes de reserva se aprueban automáticamente si el
                  vehículo está disponible en las fechas solicitadas. Si hay conflicto, la reserva
                  queda en estado pendiente para revisión manual.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoApprove}
                disabled={togglingAutoApprove}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  autoApproveEnabled ? 'bg-primary' : ''
                }`}
                style={{ background: autoApproveEnabled ? undefined : 'var(--color-border-strong)' }}
                role="switch"
                aria-checked={autoApproveEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoApproveEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="mt-3">
              <span className={`badge ${autoApproveEnabled ? 'badge-green' : 'badge-slate'} inline-flex items-center gap-1.5`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                {autoApproveEnabled ? 'Activo' : 'Inactivo — aprobación manual requerida'}
              </span>
            </div>
          </div>

          {/* Vencimiento para administradores */}
          <div className="pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Vencimiento de reservas para administradores</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Cuando está activo, las reservas de administradores vencen igual que las del resto
                  de los usuarios. Si está desactivado, los administradores quedan exentos del
                  proceso automático de vencimiento.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAdminOverdue}
                disabled={togglingAdminOverdue}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  adminOverdueEnabled ? 'bg-primary' : ''
                }`}
                style={{ background: adminOverdueEnabled ? undefined : 'var(--color-border-strong)' }}
                role="switch"
                aria-checked={adminOverdueEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    adminOverdueEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="mt-3">
              <span className={`badge ${adminOverdueEnabled ? 'badge-green' : 'badge-amber'} inline-flex items-center gap-1.5`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                {adminOverdueEnabled ? 'Activo — aplica a todos los usuarios' : 'Inactivo — administradores exentos'}
              </span>
            </div>
          </div>

          {maxReservationDaysSetting && (
            <div className="pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 11 }}>
                <div
                  className="uppercase font-semibold"
                  style={{ fontSize: 10.5, letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}
                >
                  Duración máxima de reserva
                </div>
                <div className="font-mono-data text-sm mt-1" style={{ color: 'var(--color-text)' }}>
                  {maxReservationDaysSetting.value} días
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
```
(se sustituye el mecanismo `divide-y divide-slate-100` de Tailwind por un `borderTop` inline explícito en cada bloque siguiente, porque `divide-y` aplica el color vía una regla `> :not([hidden]) ~ :not([hidden])` generada en la hoja de estilos — un `style` inline en el contenedor padre no puede sobreescribir esa regla hija; el `borderTop` inline sí lo logra directamente. El pill de estado reutiliza `.badge-green`/`.badge-slate`/`.badge-amber` — ya con variantes de tema claro/oscuro definidas en `index.css` — y el puntito usa `background: 'currentColor'`, técnica idéntica a la que usa el propio mockup para sus badges "Conectado"/"Vigente": `<span style="...background:currentColor">`).

- [ ] **Step 5: Fix the bottom settings table container**

Cambiar (línea 340):
```tsx
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
```
por:
```tsx
      <div className="rounded-[16px] shadow-sm overflow-hidden" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
```

- [ ] **Step 6: Verificación manual**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ/frontend && npm run dev
```
Abrir `/system-settings`. Confirmar: (1) ambas tarjetas y la tabla ya no son blancas fijas en modo oscuro; (2) los dos interruptores se ven ámbar cuando están activos y con un track neutro (no gris claro fijo) cuando están inactivos, en ambos temas; (3) los pills de estado bajo cada interruptor usan el mismo sistema `.badge-*` que el resto de la app; (4) aparece una tercera fila de solo lectura "Duración máxima de reserva" con el valor real de `max_reservation_days` (verificar contra `docker exec -it fleet-postgres psql -U fleet_user -d fleet_management -c "SELECT * FROM system_settings WHERE key='max_reservation_days';"` si existe la fila); (5) click en "Nueva configuración" o "Editar" abre el modal ya con el look de `<Modal>` (Escape cierra, foco en el primer campo, fondo no blanco en oscuro), y guardar/eliminar siguen funcionando (toast de éxito, fila actualizada en la tabla).

- [ ] **Step 7: Commit**

```bash
cd /home/dagargon89/gestor_vehiculos_GPJ
git add frontend/src/pages/SystemSettings/SystemSettingsPage.tsx
git commit -m "$(cat <<'EOF'
fix(redesign): reskin System settings page, migrate setting modal to shared Modal, reuse badge/button classes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Cobertura de la especificación:** las 18 pantallas del mockup (`Flota GPJ Rediseño.dc.html`) tienen tarea asignada: Login (T4), Dashboard (T5), Vehículos (T7), Solicitud de vehículos (T8), Reservas (T9), Mis solicitudes (T10), Mantenimiento (T11), Combustible (T12), Incidencias (T13), Sanciones (T14), Costos (T15), Reportes (T16-17), Usuarios y roles (T18), Permisos por rol (T19), Proveedores (T20), Mi perfil (T22), Bitácora de auditoría (T23), Configuración del sistema (T24). El componente sin pantalla equivalente en el mockup (Asignar roles) tiene tarea propia (T21) que lo adapta al lenguaje visual nuevo sin inventar una pantalla que no existe, cumpliendo la instrucción explícita del usuario. Los cambios de fundación (fuentes T1, paleta T2, shell de sidebar T3, componentes compartidos T6) preceden y habilitan el resto.

**Placeholders:** revisadas las 24 tareas — cada paso trae diffs de código reales con contenido literal (antes/después), o en los casos de "sin cambios necesarios" (Maintenance/Fuel/Incidents sin literales azules, Sanciones sin literales azules) se documenta con evidencia de `grep` en vez de dejarlo implícito. Ningún paso usa "TODO"/"similar a la tarea N"/"agregar manejo de errores apropiado".

**Consistencia de tipos:** el ámbar (`--acc`/`--color-primary: #f5a524`, `--color-primary-dark: #e08700`, `--color-text-on-primary: #1a1206`) y los semánticos (`ok`/verde, `inf`/azul, `err`/rojo, `vio`/morado) se definen una sola vez en Task 2 y se referencian por nombre (`var(--color-primary)`, clases `.badge-*`/`.stat-card.*`) en todas las tareas subsecuentes — ninguna tarea redefine o duplica el sistema de tokens. `getFolio()` se define de forma idéntica (mismo formato `RES-XXXXXX`) tanto en Task 9 (Reservas admin) como en Task 10 (Mis solicitudes), sin colisión de nombres al vivir en archivos distintos. Los nombres de sidebar (`--color-sidebar-bg/text/text-muted/border`) introducidos en Task 2 son consumidos exactamente por esos nombres en Task 3, sin variantes.

**Nota de alcance transversal:** ninguna tarea inventa endpoints, columnas o migraciones de backend nuevas — donde el mockup muestra un dato que no existe en el modelo real (Folio/Taller en Mantenimiento, Tipo en Vehículos, Conductor en Combustible, Severidad en Incidentes, Institución/Notificaciones en Configuración, etc.), la tarea correspondiente lo documenta explícitamente como fuera de alcance en vez de fabricarlo, y usa datos ya cargados por los `useQuery` existentes para cualquier elemento nuevo derivable (KPIs, badges de estado calculados, folios).

