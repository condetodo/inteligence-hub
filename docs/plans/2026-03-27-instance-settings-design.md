# Instance Settings Tab + Archive — Design

> Date: 2026-03-27

## Summary

Add a "Ajustes" (Settings) tab to each instance view where users can edit instance details, configure processing settings, and archive the instance. Archived instances are hidden from the sidebar but visible/restorable from the global Configuracion page.

## UI Changes

### 1. New "Ajustes" tab in instance view

Added as the last tab: Contenido | Inputs | Insights | Brand Voice | Historial | **Ajustes**

Route: `/instances/[id]/settings`

### 2. Settings page layout

Three sections:

**Section A — Datos de la instancia**
Editable form fields:
- Nombre de instancia (`name`)
- Nombre del cliente (`clientName`)
- Rol del cliente (`clientRole`)
- Empresa (`company`)
- Industria (`industry`)

**Section B — Configuracion de procesamiento**
- Periodo de procesamiento: select dropdown (Semanal / Mensual) → maps to `processingPeriod` (WEEKLY/MONTHLY)
- Ventana activa: numeric input → maps to `activeWindow` (default 8)

**Section C — Zona de peligro**
- Visually separated (red/destructive styling)
- "Archivar instancia" button
- On click: opens confirmation modal
- Modal text: "Esta instancia dejara de aparecer en tu sidebar. Podras restaurarla desde Configuracion."
- On confirm: DELETE `/instances/:id` (backend sets status=ARCHIVED), redirect to Dashboard

### 3. Save button
- Single "Guardar cambios" button for sections A+B
- Disabled when no changes detected (dirty check)
- Calls PUT `/instances/:id` with changed fields
- Shows success toast on save

### 4. Archived instances in Configuracion page

In the global `/configuracion` page, add a section:
- Title: "Instancias archivadas"
- List of archived instances (name, company, archived date)
- Each row has a "Restaurar" button → PUT `/instances/:id` with `{ status: "ACTIVE" }`
- On restore: instance reappears in sidebar, show success toast

### 5. Sidebar filtering

The sidebar instance list must filter out `status: ARCHIVED` instances. Currently it fetches all — add filter.

## Backend

No changes needed. Existing endpoints:
- `PUT /instances/:id` — partial update (all fields)
- `DELETE /instances/:id` — sets status to ARCHIVED

## Data Flow

```
Settings Tab (edit form)
  → PUT /instances/:id { name, clientName, ... }
  → Refresh instance context
  → Toast "Cambios guardados"

Archive button
  → Confirm modal
  → DELETE /instances/:id
  → Backend sets status=ARCHIVED
  → Redirect to /dashboard
  → Sidebar refreshes (instance gone)

Configuracion page (restore)
  → GET /instances?status=ARCHIVED (or filter client-side)
  → "Restaurar" → PUT /instances/:id { status: "ACTIVE" }
  → Sidebar refreshes (instance back)
```
