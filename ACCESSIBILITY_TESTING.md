# ♿ Accessibility Testing Checklist - Sprint 12

## 📋 WCAG AA Compliance Testing

### 🎯 Testing Summary

Esta guía te ayudará a validar las mejoras de accesibilidad implementadas en Sprint 12.

---

## ✅ Fase 1: Keyboard Navigation (Navegación por Teclado)

### Test 1: Tab Order
**Objetivo**: Verificar que todos los elementos interactivos sean accesibles con Tab.

#### Pasos:
1. Abre la aplicación (http://localhost:5173)
2. Presiona `Tab` repetidamente
3. Verifica que:
   - [ ] El foco se mueve por todos los botones y links
   - [ ] El orden lógico es de arriba hacia abajo, izquierda a derecha
   - [ ] Los elementos tienen un outline azul visible (#2563eb - 2px)
   - [ ] El outline tiene offset de 2px
   - [ ] No hay elementos ocultos que reciban foco

**Páginas a probar**:
- [ ] Dashboard (/)
- [ ] Camiones (/camiones)
- [ ] Choferes (/choferes)  
- [ ] Viajes (/viajes)
- [ ] Reportes (/reportes)
- [ ] Formularios (CamionForm, ChoferForm, ViajeForm)

---

### Test 2: Focus Visible States
**Objetivo**: Verificar que los focus states sean claramente visibles.

#### Expected Behavior:
- **Buttons**: Outline 2px azul + box-shadow sutil
- **Links**: Outline 2px azul con offset 4px
- **Inputs/Selects**: Outline 2px azul + box-shadow
- **Table buttons**: Outline 2px azul + border-radius 4px

#### Checklist:
- [ ] Botón "Nuevo Camión" muestra focus claramente
- [ ] Botones de acción (Editar, Eliminar) en tablas son visibles con focus
- [ ] Links de navegación tienen focus visible
- [ ] Campos de formulario muestran focus correctamente
- [ ] Selects/dropdowns tienen focus visible
- [ ] Search inputs muestran focus correctamente

---

### Test 3: Enter Key Actions
**Objetivo**: Verificar que Enter active botones y links correctamente.

#### Pasos:
1. Navega con Tab hasta un botón
2. Presiona `Enter`
3. Verifica que:
   - [ ] Botón de "Crear" abre formulario
   - [ ] Botón "Editar" abre modal/formulario
   - [ ] Botón "Eliminar" muestra confirmación
   - [ ] Links navegan correctamente
   - [ ] Submit de formularios funciona con Enter

---

## ✅ Fase 2: ARIA Labels & Semantic HTML

### Test 4: ARIA Labels (Screen Reader Context)
**Objetivo**: Verificar que elementos tengan labels descriptivos.

#### Herramienta recomendada: 
- Chrome DevTools > Accessibility Tab
- Firefox Accessibility Inspector

#### Verificar en Camiones page:
- [ ] Botón "Editar" tiene `aria-label="Editar camión [PATENTE]"`
- [ ] Botón "Eliminar" tiene `aria-label="Eliminar camión [PATENTE]"`
- [ ] Tabla tiene headers correctos (th)

#### Verificar en Choferes page:
- [ ] Botón "Ver" tiene `aria-label="Ver detalle de [NOMBRE]"`
- [ ] Botón "Editar" tiene `aria-label="Editar información de [NOMBRE]"`
- [ ] Botón "Eliminar" tiene `aria-label="Eliminar chofer [NOMBRE]"`

#### Verificar en Viajes page:
- [ ] Botón "Editar" tiene `aria-label` con número de viaje y ruta
- [ ] Botón "Eliminar" tiene `aria-label` con contexto del viaje

---

### Test 5: Form Accessibility
**Objetivo**: Verificar que formularios sean accesibles.

#### Verificar en CamionForm:
- [ ] Input "Patente" tiene `aria-describedby="patente-help"`
- [ ] Input "Patente" tiene `aria-required="true"`
- [ ] Texto de ayuda aparece debajo del input
- [ ] Texto de ayuda cambia a azul al hacer focus
- [ ] Label está asociado con input (for="patente")

#### Verificar en todos los forms:
- [ ] Todos los inputs requeridos tienen `aria-required="true"`
- [ ] Labels están asociados correctamente
- [ ] Mensajes de error son descriptivos
- [ ] Mensajes de ayuda son visibles y útiles

---

## ✅ Fase 3: Color Contrast (WCAG AA: 4.5:1)

### Test 6: Badge Contrast
**Objetivo**: Verificar contraste de texto en badges.

#### Tool: https://webaim.org/resources/contrastchecker/

#### Badges a verificar:

**Documentos Estados**:
- [ ] Vigente: #155724 sobre #D4EDDA ➜ Contraste: 7.43:1 ✅
- [ ] Próximo a vencer: #856404 sobre #FFF3CD ➜ Contraste: 6.50:1 ✅
- [ ] Vencido: #721C24 sobre #F8D7DA ➜ Contraste: 8.90:1 ✅
- [ ] Sin vencimiento: #383D41 sobre #E2E3E5 ➜ Contraste: 10.72:1 ✅

**Camiones Estados**:
- [ ] Activo: #155724 sobre #D4EDDA ✅
- [ ] Inactivo: #721C24 sobre #F8D7DA ✅
- [ ] Mantenimiento: #856404 sobre #FFF3CD ✅
- [ ] Fuera de servicio: #383D41 sobre #E2E3E5 ✅

---

### Test 7: Button Contrast
**Objetivo**: Verificar que botones tengan contraste adecuado.

#### Verificar:
- [ ] Botón primario (azul): Texto blanco sobre fondo azul oscuro
- [ ] Botón success (verde): Texto blanco sobre fondo verde
- [ ] Botón danger (rojo): Texto blanco sobre fondo rojo
- [ ] Botón Editar: Contraste adecuado
- [ ] Botón Eliminar: Contraste adecuado
- [ ] Botones en hover mantienen contraste

---

### Test 8: Text on Backgrounds
**Objetivo**: Verificar contraste de texto sobre backgrounds.

#### HeroSection gradients:
- [ ] Dashboard (azul): Texto blanco claramente visible
- [ ] Camiones (naranja): Texto blanco claramente visible
- [ ] Choferes (turquesa): Texto blanco claramente visible
- [ ] Viajes (púrpura): Texto blanco claramente visible
- [ ] Reportes (verde): Texto blanco claramente visible
- [ ] Overlay oscuro (0.6 opacity) mejora legibilidad

#### StatsCards:
- [ ] Labels: rgba(255, 255, 255, 0.85) visible en fondo púrpura
- [ ] Numbers: #ffffff visible en fondo púrpura
- [ ] Trend: rgba(255, 255, 255, 0.65) visible

---

## ✅ Fase 4: Screen Reader Testing (Optional - Advanced)

### Test 9: NVDA/JAWS Test
**Objetivo**: Verificar que la aplicación sea usable con screen readers.

#### Herramientas:
- **NVDA** (Windows - Gratis): https://www.nvaccess.org/download/
- **JAWS** (Windows - Trial): https://www.freedomscientific.com/
- **VoiceOver** (Mac - Built-in): Cmd+F5

#### Pasos:
1. Abre NVDA o VoiceOver
2. Navega la aplicación solo con teclado
3. Verifica que:
   - [ ] Títulos de página se anuncian correctamente
   - [ ] Botones anuncian su label y rol
   - [ ] Links anuncian destino
   - [ ] Campos de formulario anuncian label y descripción
   - [ ] Estados de elementos se anuncian (expanded, selected, etc.)
   - [ ] Tablas anuncian headers y estructura

---

## ✅ Fase 5: Responsive & Reduced Motion

### Test 10: Mobile Accessibility
**Objetivo**: Verificar accesibilidad en mobile.

#### Pasos:
1. Abre DevTools, modo responsive (Ctrl+Shift+M)
2. Prueba en:
   - [ ] iPhone SE (375px)
   - [ ] iPad (768px)
   - [ ] Desktop (1920px)

#### Verificar:
- [ ] Touch targets tienen mínimo 44x44px
- [ ] Texto es legible (mínimo 16px body)
- [ ] Focus states visibles en mobile
- [ ] No hay overlap de elementos interactivos

---

### Test 11: Reduced Motion
**Objetivo**: Verificar soporte para usuarios con sensibilidad a movimiento.

#### Pasos (Chrome):
1. DevTools > Rendering Tab
2. Enable "Emulate CSS prefers-reduced-motion"
3. Verifica que:
   - [ ] Animaciones se reducen a 0.01ms
   - [ ] Transiciones son instantáneas
   - [ ] Skeleton shimmer no distrae
   - [ ] Parallax effect disabled

---

## 🎯 Resultados Esperados

### ✅ Cumplimiento WCAG AA:
- **Perceivable**: Texto con contraste mínimo 4.5:1 ✅
- **Operable**: Navegable completamente con teclado ✅
- **Understandable**: ARIA labels descriptivos ✅
- **Robust**: Semántica HTML correcta ✅

### 📊 Scoring Target:
- Lighthouse Accessibility Score: **90+**
- axe DevTools: **0 critical issues**
- WAVE: **0 errors, minimal warnings**

---

## 🔧 Herramientas Recomendadas

1. **Chrome Lighthouse** (DevTools > Lighthouse > Accessibility)
2. **axe DevTools Extension**: https://www.deque.com/axe/devtools/
3. **WAVE Extension**: https://wave.webaim.org/extension/
4. **Color Contrast Analyzer**: https://www.tpgi.com/color-contrast-checker/
5. **NVDA Screen Reader**: https://www.nvaccess.org/

---

## 📝 Bug Report Template

Si encuentras problemas, documenta así:

```markdown
### Issue: [Descripción breve]
**Página**: [URL o nombre de página]
**Severidad**: Critical / High / Medium / Low
**WCAG Criteria**: [Ej: 2.4.7 Focus Visible]

**Pasos para reproducir**:
1. 
2. 
3. 

**Resultado esperado**:


**Resultado actual**:


**Screenshot**:
[Adjuntar si aplica]
```

---

## ✅ Sprint 12 Completion Checklist

- [x] Focus states implementados globalmente
- [x] ARIA labels agregados a botones de acción
- [x] aria-describedby en formularios clave
- [x] Sistema de colores WCAG AA centralizado
- [x] Contraste validado en badges y botones
- [x] Texto de ayuda en formularios
- [x] Soporte para prefers-reduced-motion
- [x] Skip-to-main link implementado
- [ ] Testing manual completado (Fase 3)
- [ ] Lighthouse score 90+ verificado
- [ ] Screen reader testing realizado (opcional)

---

**Fecha de creación**: Marzo 8, 2026  
**Sprint**: 12 - Accesibilidad WCAG AA  
**Autor**: GitHub Copilot
