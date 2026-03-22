# UI Navigation Guidelines

Guia de referencia para mantener consistencia en los botones de retorno y navegacion superior en todo Truck Manager.

## Objetivo

Evitar variaciones de texto, estilo y comportamiento en botones como "Volver" o "Volver al Dashboard".

## Componente Estandar

Usar siempre el componente [BackButton](frontend/src/components/BackButton.tsx) para navegacion de retorno.

Archivo: [frontend/src/components/BackButton.tsx](frontend/src/components/BackButton.tsx)

Props principales:

- `label`: texto visible del boton.
- `to`: ruta destino cuando la navegacion es directa.
- `onClick`: callback alternativo cuando se requiere logica custom (ej. cancelaciones con validacion previa).
- `variant`: estilo visual contextual (`default`, `ghost`, `compact`, `sticky`).

## Convencion de Texto

Usar formato explicito, con flecha y destino:

- `← Volver al Dashboard`
- `← Volver a Camiones`
- `← Volver a Choferes`
- `← Volver a Viajes`
- `← Volver a Salarios`
- `← Volver al Detalle del Chofer`

No usar texto ambiguo como solo `← Volver` en headers principales.

## Convencion de Variantes

### `default`

Uso: navegacion principal de seccion, especialmente retorno a dashboard.

Ejemplos:

- [frontend/src/pages/Camiones.tsx](frontend/src/pages/Camiones.tsx)
- [frontend/src/pages/Choferes.tsx](frontend/src/pages/Choferes.tsx)
- [frontend/src/pages/Viajes.tsx](frontend/src/pages/Viajes.tsx)
- [frontend/src/pages/Reportes.tsx](frontend/src/pages/Reportes.tsx)

### `ghost`

Uso: headers de formularios y vistas de detalle con alta densidad visual.

Ejemplos:

- [frontend/src/pages/CamionForm.tsx](frontend/src/pages/CamionForm.tsx)
- [frontend/src/pages/ChoferForm.tsx](frontend/src/pages/ChoferForm.tsx)
- [frontend/src/pages/ViajeForm.tsx](frontend/src/pages/ViajeForm.tsx)
- [frontend/src/pages/CamionDetalle.tsx](frontend/src/pages/CamionDetalle.tsx)
- [frontend/src/pages/ChoferDetalle.tsx](frontend/src/pages/ChoferDetalle.tsx)
- [frontend/src/pages/ChoferSalarios.tsx](frontend/src/pages/ChoferSalarios.tsx)
- [frontend/src/pages/SalarioDetalle.tsx](frontend/src/pages/SalarioDetalle.tsx)

### `compact`

Uso: estados de error o fallback donde el CTA secundario no debe competir visualmente con el mensaje.

Ejemplos:

- [frontend/src/pages/ChoferDetalle.tsx](frontend/src/pages/ChoferDetalle.tsx)
- [frontend/src/pages/ChoferSalarios.tsx](frontend/src/pages/ChoferSalarios.tsx)
- [frontend/src/pages/SalarioDetalle.tsx](frontend/src/pages/SalarioDetalle.tsx)

### `sticky`

Uso: disponible para pantallas largas donde se necesite mantener el retorno visible al hacer scroll.

Estado actual: definido en estilos, aplicar solo cuando UX lo justifique.

## Regla de Implementacion

Antes de crear un nuevo boton de retorno:

1. Importar [BackButton](frontend/src/components/BackButton.tsx).
2. Elegir `label` explicito con destino.
3. Seleccionar `variant` segun contexto visual.
4. Evitar crear estilos locales para retorno si ya existe una variante adecuada.

## Ejemplos de Uso

Navegacion directa por ruta:

```tsx
<BackButton label="← Volver a Viajes" to="/viajes" variant="ghost" />
```

Navegacion con logica custom:

```tsx
<BackButton label="← Volver a Camiones" onClick={handleCancel} variant="ghost" />
```

Error/fallback:

```tsx
<BackButton label="← Volver a Choferes" to="/choferes" variant="compact" />
```

## Checklist de PR

- [ ] Todo boton superior de retorno usa [BackButton](frontend/src/components/BackButton.tsx).
- [ ] El texto del boton indica destino explicito.
- [ ] La variante aplicada coincide con el contexto (`default`, `ghost`, `compact`, `sticky`).
- [ ] No se introducen nuevos estilos locales para reemplazar variantes existentes.
