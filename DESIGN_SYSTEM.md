# Sistema de diseño - Plan Juárez Fleet Management

Referencia visual: [Ejemplo de paleta de colores y estilos/ejemplo.html](Ejemplo%20de%20paleta%20de%20colores%20y%20estilos/ejemplo.html)

## Tokens

### Colores
| Token | Valor | Uso |
|-------|--------|-----|
| `primary` | `#6366F1` | Botones principales, enlaces, iconos activos |
| `primary-dark` | `#4F46E5` | Hover de botones primarios |
| `accent` | `#EC4899` | Acentos, enlaces secundarios, badges |
| `background-light` | `#F3F4F6` | Fondo claro (modo light) |
| `background-dark` | `#1F2937` | Fondo oscuro (modo dark) |
| `surface` | `#FFFFFF` | Cards, formularios, modales |

### Tipografías
| Token | Familia | Uso |
|-------|---------|-----|
| `font-display` | Nunito (300, 400, 600, 700) | Títulos y encabezados |
| `font-body` | Inter (300, 400, 500, 600, 700) | Cuerpo de texto |

### Radios
- Default: `0.5rem`
- lg: `1rem`, xl: `1.5rem`
- Inputs/botones del ejemplo: `16px` (`rounded-[16px]`)

### Tailwind
- Clases: `bg-primary`, `text-accent`, `font-display`, `bg-background-light`, `rounded-[16px]`, `focus:ring-primary`
- Dark mode: `class` (añadir `.dark` al html si se implementa)

Ningún componente nuevo debe introducir colores o fuentes fuera de este sistema.
