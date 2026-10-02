---
name: sdd
description: Úsala siempre que trabajes con Spec-Driven Development en este proyecto (docs/constitution.md o cualquier archivo dentro de specs/) - redactar, revisar o cambiar specs, planes y tareas, o implementar y validar tareas de una spec.
---

# Spec-Driven Development (SDD)

## Flujo
Constitución → Spec → Clarificación → Plan → Tareas → Implementación → Validación → Traducción → Cambio.

- Nunca pases a la siguiente fase sin la aprobación explícita del usuario.
- La spec manda: si algo no está en la spec, no se implementa. Si falta una decisión, para y pregunta.
- Un cambio de requisitos se hace primero en la spec, luego en el plan y las tareas, y por último en el código.
- Cada spec vive en su carpeta: `specs/NNN-nombre/` con `spec.md`, `plan.md` y `tasks.md`.
- Todo informe técnico que se enseñe al usuario (@reviewer, @hacker o cualquier otro) pasa antes por @traductor: explicaciones extensas, con detalle y sin tecnicismos, sin cambiar el orden ni la gravedad de los hallazgos. Los informes originales se conservan para el equipo técnico.
- Al terminar cada fase, actualiza `MEMORY.md` (máximo ~80 líneas).

## Plantilla de spec (spec.md)
```
# Spec NNN — <Nombre>

Estado: borrador | aprobada | implementada

## Contexto y objetivo
## Usuarios
## Historias de usuario
- HU-1. Como <rol>, quiero <acción> para <beneficio>.
## Definiciones (solo si hay términos que puedan interpretarse de varias formas)
## Requisitos funcionales
## Requisitos no funcionales
## Casos límite
## Fuera de alcance
## Criterios de finalización
## Dudas abiertas
- [NECESITA ACLARACIÓN] <duda>
```

La spec describe el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos.

## Requisitos en EARS (en español)
- RF-x: CUANDO <evento>, EL SISTEMA <respuesta>.
- RF-x: SI <condición no deseada>, ENTONCES EL SISTEMA <respuesta>.
- RF-x: MIENTRAS <estado>, EL SISTEMA <respuesta>.
- RF-x: EL SISTEMA <comportamiento permanente>.

Cada RF debe ser verificable: nada de "rápido", "intenso" o "bonito" sin un criterio
medible.

## Plan (plan.md)
Archivos y responsabilidades (respetando pages/ → hooks/ → services/ → utils/ + config/, red solo en services/, CSS solo en estilos/) · Cálculos o funciones afectados · Algoritmo en pseudocódigo · Interfaz (móvil primero) · Decisiones justificadas con su alternativa descartada · Estrategia de verificación con `npm run build` y `npm run lint` más prueba en navegador (`npm run dev` con 28001 peninsular y 38628 isla; GPS con DevTools → Sensors). Si se usa una librería o API nueva, contrastar la sintaxis con context7. Indica qué RF cubre cada parte.

## Tareas (tasks.md)
```
- [ ] **Tn. <Descripción>.** RF-x, RF-y
  - Hecho cuando: <comprobación verificable>.
```
Máximo 20-30 min por tarea, en orden de dependencia. Si salen más de 10, propón dividir
la spec.

## Implementación
Una sola tarea cada vez: código mínimo que cumpla la tarea (respetando capas, `import type`, valores mágicos en `config/` y parseo con coma, nunca `Number()` directo ni `places[0]`), ante dudas de API consultar context7, `npm run build` y `npm run lint` en verde, marcar la tarea y parar.
