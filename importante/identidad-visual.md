# Estándar de interfaz — Gestión de Vehículos Institucionales

Documento de referencia para desarrollo UI. Describe la identidad visual, tokens, temas claro/oscuro y patrones de componentes a implementar en el frontend (React + Vite + Tailwind CSS 4).

Las fuentes de verdad en código son `frontend/src/index.css` (variables CSS por tema) y los componentes en `frontend/src/`.

---

## 1. Identidad de producto

| Aspecto | Valor |
|--------|--------|
| **Nombre en UI** | **Gestión de Vehículos Institucionales** (cabecera completa) / **Vehículos Inst.** (mobile). |
| **Título del documento** | `Gestión de Vehículos Institucionales` (`index.html`). |
| **Propósito** | Sistema institucional para solicitud, asignación y seguimiento de vehículos de flota. |
| **Tono visual** | Profesional-institucional con efecto "glass" suave, acento **índigo** (`#6366f1` → `#4f46e5`), fondos profundos en oscuro y gris azulado muy claro en modo claro. |
| **Ícono en header** | Ícono Material `local_shipping` en contenedor cuadrado redondeado con tinte del acento (`bg-primary/10`, 48×48 px, `border-radius: 16px`). |
| **Dominio** | vehiculos.participajuarez.org |

---

## 2. Tipografía

### 2.1 Familias

| Uso | Familia | Carga |
|-----|---------|--------|
| **Interfaz general** | **DM Sans** | Google Fonts (optical size 9..40, pesos 300–700). |
| **Fallbacks** | `'Segoe UI', system-ui, sans-serif` | Definidos en el contenedor raíz. |
| **Datos tabulares, badges, métricas, IDs, placas** | **JetBrains Mono** | Google Fonts (pesos 400, 500). |

> **Migración**: Reemplazar Nunito/Inter actuales por DM Sans + JetBrains Mono. DM Sans ofrece la misma legibilidad con personalidad más moderna; JetBrains Mono es esencial para placas, folios y datos numéricos de flota.

### 2.2 Pesos habituales

| Peso | Uso |
|------|-----|
| **400** | Cuerpo de texto, descripciones, párrafos de ayuda. |
| **500** | Botones secundarios, ítems de navegación, texto de tabla. |
| **600** | Etiquetas de sección, títulos de card, botones primarios, th de tabla. |
| **700** | Títulos de página, valores KPI destacados, nombre del app en header. |

### 2.3 Escala de tamaños

| Tamaño | Tailwind equiv. | Uso típico |
|--------|-----------------|------------|
| **10px** | — | Labels de tiles de estadística, sección sidebar "caption". |
| **11px** | `text-xs` reducido | Meta info, `th` uppercase, badges. |
| **12px** | `text-xs` | Texto secundario, datos de tabla (JetBrains Mono), ayuda de formulario. |
| **13px** | `text-[13px]` | Cuerpo estándar en botones, filas, inputs. |
| **14–16px** | `text-sm`–`text-base` | Títulos de card, etiquetas de formulario. |
| **18px** | `text-lg` | Título de formulario login, sub-encabezados. |
| **22–24px** | `text-2xl` | KPIs, título de página, header de sección. |

### 2.4 Letter-spacing y mayúsculas

- **Nombre del app (header)**: `letter-spacing: -0.3px`, peso 700.
- **`th` de tablas**: `text-transform: uppercase`, `letter-spacing: 0.8px`, 11px.
- **Etiquetas de sección lateral**: `uppercase`, `letter-spacing: 1.2px`, 10px.
- **Badges**: `letter-spacing: 0.3px`.
- **Placas / folios**: JetBrains Mono, sin letter-spacing adicional.

---

## 3. Paleta y roles de color

### 3.1 Color de marca (acento)

| Token visual | Valor | Uso |
|--------------|--------|-----|
| **Primario** | `#6366f1` | Botones primarios, estados activos, indicadores, FAB. |
| **Primario oscuro** | `#4f46e5` | Fondo de navbar, secciones prominentes. |
| **Gradiente primario** | `linear-gradient(135deg, #6366f1, #4f46e5)` | Botones CTA, burbujas usuario, acento de cards. |
| **Acento RGBA** | `rgba(99, 102, 241, …)` | Bordes foco, hovers de nav, sombras, anillos. |

### 3.2 Escala semántica

| Semántica | Verde | Ámbar | Rojo | Violeta | Azul |
|-----------|--------|--------|------|---------|------|
| **Base dark** | `#10b981` → `#34d399` | `#f59e0b` → `#fbbf24` | `#ef4444` → `#f87171` | `#a855f7` → `#c084fc` | `#6366f1` → `#818cf8` |
| **Texto dark** | `#34d399` | `#fbbf24` | `#f87171` | `#c084fc` | `#818cf8` |
| **Texto light** | `#047857` | `#b45309` | `#b91c1c` | `#6b21a8` | `#3730a3` |

**Estados de vehículos / reservas (colores semánticos mapeados)**:
- Disponible → Verde `#10b981`
- En uso / en camino → Azul `#6366f1`
- Pendiente / por aprobar → Ámbar `#f59e0b`
- No disponible / rechazado → Rojo `#ef4444`
- Mantenimiento → Violeta `#a855f7`

### 3.3 Avatar de usuario en header

- Gradiente: `linear-gradient(135deg, #f59e0b, #ef4444)` (cálido, distingue del acento frío).

### 3.4 Variable de enlace

- Dark: `--color-link: #818cf8`
- Light: `--color-link: #3730a3`
- Todo enlace de texto plano usa `var(--color-link)`.

### 3.5 Texto sobre primario

- `--color-text-on-primary: #ffffff` (ambos temas) para etiquetas sobre fondo acento.

---

## 4. Variables CSS por tema (`src/index.css`)

El tema se controla con el atributo `data-theme="dark"` | `data-theme="light"` en `<html>`.

### 4.1 Modo oscuro (`html[data-theme="dark"]` / `:root` por defecto)

| Variable | Valor |
|----------|--------|
| `--color-bg` | `#0a0e17` |
| `--color-bg-soft` | `#0f1423` |
| `--color-text` | `#e2e8f0` |
| `--color-text-soft` | `#c5cde0` |
| `--color-text-muted` | `#8892a8` |
| `--color-border` | `rgba(99, 102, 241, 0.12)` |
| `--color-border-strong` | `rgba(99, 102, 241, 0.22)` |
| `--color-panel-bg` | `linear-gradient(135deg, rgba(15,20,40,0.9), rgba(10,14,23,0.95))` |
| `--color-header-bg` | `rgba(10, 14, 23, 0.85)` (blur 20px) |
| `--color-sidebar-bg` | `rgba(10, 14, 23, 0.5)` |
| `--color-table-head-bg` | `rgba(15, 20, 35, 0.98)` |
| `--color-table-row-hover` | `rgba(99, 102, 241, 0.04)` |
| `--color-input-bg` | `rgba(10, 14, 23, 0.6)` |
| `--color-modal-overlay` | `rgba(0, 0, 0, 0.6)` |
| `--color-modal-bg` | `linear-gradient(135deg, #141b2d, #0f1423)` |
| `--color-menu-bg` | `rgba(10, 14, 23, 0.98)` |
| `--color-link` | `#818cf8` |
| `--color-text-on-primary` | `#ffffff` |
| Scrollbar track/thumb | `#131825` / `#2a3348` / hover `#3d4f6f` |

`color-scheme: dark` para inputs nativos coherentes.

### 4.2 Modo claro (`html[data-theme="light"]`)

| Variable | Valor |
|----------|--------|
| `--color-bg` | `#f3f4f8` |
| `--color-bg-soft` | `#ffffff` |
| `--color-text` | `#162033` |
| `--color-text-soft` | `#2f3b52` |
| `--color-text-muted` | `#5e6b85` |
| `--color-border` | `rgba(99, 102, 241, 0.15)` |
| `--color-border-strong` | `rgba(99, 102, 241, 0.25)` |
| `--color-panel-bg` | `rgba(255, 255, 255, 0.85)` |
| `--color-header-bg` | `rgba(79, 70, 229, 1)` (sólido en light, como navbar original) |
| `--color-table-head-bg` | `rgba(248, 249, 255, 0.98)` |
| `--color-table-row-hover` | `rgba(99, 102, 241, 0.06)` |
| `--color-input-bg` | `#ffffff` |
| `--color-modal-overlay` | `rgba(15, 22, 38, 0.3)` |
| `--color-modal-bg` | `#ffffff` |
| `--color-link` | `#3730a3` |
| Scrollbar track/thumb | `#dce5f7` / `#a9b9de` / hover `#8da0cb` |

---

## 5. Modo oscuro y modo claro (comportamiento)

| Aspecto | Implementación |
|---------|----------------|
| **Proveedor** | `ThemeProvider` en `src/theme/ThemeContext.tsx` (envuelve app en `main.tsx`). |
| **Valores** | `"dark"` \| `"light"`. |
| **Persistencia** | `localStorage` clave `vehicles-theme`. |
| **Sincronización DOM** | `useEffect` asigna `data-theme` en `<html>`. |
| **Por defecto** | Si no hay valor válido en storage → **`light`** (app institucional, acceso diurno). |
| **Toggle en UI** | Botón en navbar header; icono sol/luna con `aria-label`. |
| **Transición global** | `background-color` y `color` en `0.2s ease`. |

**Regla para nuevos componentes**: usar siempre `var(--color-bg)`, `var(--color-text)`, etc. Para colores semánticos que difieren entre temas, duplicar bajo `html[data-theme="light"] .mi-clase { … }`.

---

## 6. Formas, radios y layout

### 6.1 Radio de borde

| Radio | Uso |
|-------|-----|
| **4px** | Scrollbar thumb WebKit, barras de gráfica (tope superior). |
| **8px** | Tiles de estadística pequeños, badges compactos. |
| **10px** | Inputs, selects, botones (primario y ghost), avatar menú, `.nav-btn`. |
| **14px** | Card formulario login. |
| **16px** | `.glass-panel`, modales de detalle, burbujas de notificación. |
| **20px** | Badges tipo píldora, `.modal-content` grande. |
| **50%** | Avatares circulares, FAB. |

### 6.2 Sombras

| Elemento | Sombra |
|----------|--------|
| Botón primario | `0 2px 12px rgba(99,102,241,0.25)` → hover `0 4px 20px rgba(99,102,241,0.35)` |
| Header/Navbar | `0 1px 20px rgba(99,102,241,0.15)` |
| Stat card hover | `0 8px 32px rgba(99,102,241,0.1)` + borde strong |
| Modal | `0 24px 80px rgba(0,0,0,0.45)` |
| Dropdown/Menú | `0 8px 32px rgba(0,0,0,0.2)` |
| Nav ítem activo | `box-shadow: 0 0 0 1px rgba(99,102,241,0.25)` |
| Logo container | `0 2px 12px rgba(99,102,241,0.2)` |

### 6.3 Blur (efecto "glass")

- Paneles: `backdrop-filter: blur(20px)`.
- Header: `backdrop-filter: blur(20px)`.
- Overlays modales: `backdrop-filter: blur(8px)`.

### 6.4 Espaciado habitual

- **Header**: padding `16px 24px` (desktop) / `12px 16px` (mobile).
- **Modal**: padding `32px`, `max-width: 520px`, `width: 90%`.
- **Tabla `th`/`td`**: `12px 16px`.
- **Cards dashboard**: padding `24px`, gap entre cards `16–24px`.
- **Contenido principal**: `max-width: 1280px`, `mx-auto`, `px-4 sm:px-6`.

---

## 7. Componentes y clases CSS

### 7.1 `.glass-panel`

```css
background: var(--color-panel-bg);
border: 1px solid var(--color-border);
border-radius: 16px;
backdrop-filter: blur(20px);
```

### 7.2 `.stat-card` (KPIs del dashboard)

- Panel glass con **franja superior 3px** del color semántico de la variante: `.green`, `.amber`, `.red`, `.blue`, `.purple`.
- Valores en **JetBrains Mono** 22–24px, peso 700.
- Label en DM Sans 11px, uppercase.
- Hover: `translateY(-2px)`, borde strong, sombra acento.
- Transición: `0.3s cubic-bezier(0.4, 0, 0.2, 1)`.

### 7.3 Navegación `.nav-btn`

- Padding `10px 16px`, radio `10px`, DM Sans 13px / 500.
- Activo: fondo `rgba(99,102,241,0.12)`, anillo sombra `0 0 0 1px rgba(99,102,241,0.25)`.
- Hover: fondo `rgba(99,102,241,0.07)`.

### 7.4 `.badge` (+ variantes de estado de vehículos)

```
.badge-green   → disponible
.badge-blue    → en uso / en camino
.badge-amber   → pendiente / por aprobar
.badge-red     → rechazado / no disponible
.badge-purple  → mantenimiento
```

- Forma píldora `border-radius: 20px`, **JetBrains Mono** 11px, peso 600.
- Dark: fondos semitransparentes ~12%.
- Light: fondos más opacos, `border: 1px solid`, peso 700.

### 7.5 `.input-field` y `select.input-field`

- Radio 10px, borde `var(--color-border)`, fondo `var(--color-input-bg)`.
- Foco: `border-color: rgba(99,102,241,0.45)`, `box-shadow: 0 0 0 3px rgba(99,102,241,0.1)`.
- Select: flecha SVG data-URI (trazo muted según tema).
- Placeholder: `var(--color-text-muted)`.

### 7.6 `.btn-primary` / `.btn-ghost`

```css
/* Primario */
background: linear-gradient(135deg, #6366f1, #4f46e5);
color: #ffffff;
border-radius: 10px;
box-shadow: 0 2px 12px rgba(99,102,241,0.25);
transition: 0.2s;

/* Primario hover */
transform: translateY(-1px);
box-shadow: 0 4px 20px rgba(99,102,241,0.35);

/* Ghost */
background: transparent;
border: 1px solid var(--color-border);
color: var(--color-text);

/* Ghost hover */
background: rgba(99,102,241,0.05);
border-color: var(--color-border-strong);
```

### 7.7 Tablas

- Contenedor con scroll horizontal `.table-container`.
- `th`: sticky, uppercase, `letter-spacing: 0.8px`, 11px, `var(--color-table-head-bg)`.
- `td` datos de ID/placa/folio: **JetBrains Mono** 12px.
- `td` nombre conductor: DM Sans 13px, peso 500.
- Hover fila: `var(--color-table-row-hover)`.
- Borde celdas: `rgba(99,102,241,0.06)`.

### 7.8 Modales

- `.modal-overlay`: `rgba(0,0,0,0.6)`, `backdrop-filter: blur(8px)`.
- `.modal-content`: `var(--color-modal-bg)`, radio 16–20px, sombra heavy.
- Animaciones entrada: `fadeIn` 0.2s + `slideUp` 0.3s `ease`.

### 7.9 `.upload-zone` (carga de documentos de vehículo)

- Borde `2px dashed rgba(99,102,241,0.2)`, radio 16px.
- Hover: opacidad borde → `0.4`, fondo `rgba(99,102,241,0.03)`.

### 7.10 Otros

- **`.pulse`**: animación opacidad 2s loop (indicadores de estado en tiempo real).
- **Tooltips**: fondo `var(--color-menu-bg)`, borde `var(--color-border)`, DM Sans 12px.
- **Notificaciones badge**: círculo rojo `#ef4444`, JetBrains Mono 10px.

---

## 8. Pantallas especiales

### 8.1 Login (`AuthGate` / `LoginPage`)

- Fondo página: `var(--color-bg)`.
- Card: `var(--color-panel-bg)`, `var(--color-border-strong)`, `border-radius: 14px`, blur 20px.
- Inputs: mismo estándar `.input-field`.
- Botón principal: `.btn-primary` (gradiente índigo).
- Toggle de tema: visible en esta pantalla también.

### 8.2 Dashboard por rol

Tres variantes del dashboard según rol del usuario autenticado:
- **Administrador**: visión global, todas las reservas, asignación de vehículos.
- **Conductor**: vista de asignaciones propias, historial.
- **Solicitante**: solicitudes propias, estado en tiempo real.

Cada dashboard muestra `.stat-card` con KPIs relevantes al rol y el calendario `AllReservationsCalendar`.

### 8.3 Solicitud de vehículo

- Modal de reserva con calendario integrado (`minHeight: 620px`).
- Selector de fecha/hora con `.input-field`.
- Validación inline (mensajes en `#f87171` rojo suave).

---

## 9. Motion y curvas

| Uso | Valor |
|-----|--------|
| Transiciones genéricas (botones, inputs) | `0.2s ease` |
| Stat cards, paneles | `0.3s cubic-bezier(0.4, 0, 0.2, 1)` |
| Barras de gráfica | `0.4s cubic-bezier(0.4, 0, 0.2, 1)` |
| Modales entrada | `fadeIn 0.2s` + `slideUp 0.3s ease` |
| Keyframes disponibles | `fadeIn`, `slideUp`, `pulse`, `typingBounce` |

Evitar duraciones > 400ms en interacciones frecuentes. Mantener `cubic-bezier(0.4, 0, 0.2, 1)` para sensación consistente.

---

## 10. Scrollbars (WebKit)

- Ancho/alto: **6px**.
- Track y thumb desde variables de tema.
- Thumb `border-radius: 3px`.

---

## 11. Accesibilidad y buenas prácticas

- **Contraste**: en modo claro, badges y tiles añaden borde y peso para compensar.
- **Foco**: usar `border-color` + `box-shadow` anillo en lugar de `outline: none` sin sustituto.
- **Touch targets**: mínimo 44px de altura para elementos interactivos mobile.
- **ARIA**: `aria-label` en botones icon-only (toggle tema, notificaciones, menú mobile).
- **Íconos**: Material Icons con texto alternativo o `aria-hidden` si son decorativos.

---

## 12. Antipatrones (no hacer)

1. **No mezclar clases Tailwind hardcodeadas de color** con las variables CSS de tema. Preferir `var(--color-*)` o clases semánticas para garantizar dark/light.
2. **No usar negro puro `#000` o blanco puro `#fff`** para fondos de página; siempre `var(--color-bg)` o `var(--color-bg-soft)`.
3. **No ignorar `data-theme`**: colores fijos solo para un modo rompen el sistema.
4. **No introducir nueva familia tipográfica** sin decisión de producto. Solo DM Sans + JetBrains Mono.
5. **No hardcodear el primario** como `#6366f1` en TSX; usar la variable o clase CSS correspondiente.
6. **No crear sombras sin el tinte del acento índigo**; las sombras neutras (grises puros) no encajan con la identidad.

---

## 13. Resumen ejecutivo

| Aspecto | Valor |
|---------|-------|
| **Marca** | Gestión de Vehículos Institucionales |
| **Ícono** | Material `local_shipping` en contenedor `bg-primary/10` |
| **Acento** | Índigo `#6366f1` → `#4f46e5` |
| **Gradiente primario** | `linear-gradient(135deg, #6366f1, #4f46e5)` |
| **Estética** | Glass morphism, blur 20px, fondos semitransparentes |
| **Tipografía** | DM Sans (UI) + JetBrains Mono (datos/placas/folios) |
| **Temas** | **Light por defecto** (app institucional), Dark disponible vía `data-theme` + `localStorage` (`vehicles-theme`) |
| **Radios predominantes** | 10px (controles) / 16px (panels) / 20px (modales/badges) |
| **Implementación** | Variables CSS en `index.css`, componentes con clases + inline styles coherentes |

Cualquier nuevo componente debe respetar las variables de tema, la paleta semántica de estados de vehículos y la tipografía dual DM Sans / JetBrains Mono.
