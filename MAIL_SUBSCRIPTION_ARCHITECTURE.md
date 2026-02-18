# Arquitectura de Suscripción por Email — Guía de Implementación

> Arquitectura completa extraída del proyecto **ENGRAM.cloud** para replicar en cualquier sitio estático (GitHub Pages, Netlify, Vercel, etc.) usando **Supabase** como backend.

---

## Índice

1. [Resumen de Arquitectura](#1-resumen-de-arquitectura)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Configuración de Supabase (Backend)](#3-configuración-de-supabase-backend)
4. [Implementación Frontend](#4-implementación-frontend)
5. [Estilos CSS](#5-estilos-css)
6. [Comportamiento UX](#6-comportamiento-ux)
7. [Seguridad](#7-seguridad)
8. [Exportar Suscriptores](#8-exportar-suscriptores)
9. [Checklist de Implementación](#9-checklist-de-implementación)
10. [Limitaciones y Evolución Futura](#10-limitaciones-y-evolución-futura)

---

## 1. Resumen de Arquitectura

```
┌─────────────────────────┐
│   Sitio Estático        │
│   (GitHub Pages/Jekyll) │
│                         │
│   ┌─────────────────┐   │
│   │  Formulario     │   │
│   │  <form> HTML    │   │
│   └────────┬────────┘   │
│            │             │
│   ┌────────▼────────┐   │
│   │  JavaScript     │   │
│   │  Vanilla (fetch)│   │
│   └────────┬────────┘   │
└────────────┼────────────┘
             │ POST /rest/v1/emails
             │ Headers: apikey, Authorization
             ▼
┌─────────────────────────┐
│     Supabase             │
│  ┌───────────────────┐   │
│  │   PostgREST API   │   │
│  │   (REST endpoint) │   │
│  └────────┬──────────┘   │
│           ▼              │
│  ┌───────────────────┐   │
│  │   PostgreSQL      │   │
│  │                   │   │
│  │   Table: emails   │   │
│  │   - id (uuid)     │   │
│  │   - email (text)  │   │
│  │   - created_at    │   │
│  │                   │   │
│  │   RLS: solo INSERT│   │
│  └───────────────────┘   │
└──────────────────────────┘
```

**Flujo:**
1. El usuario ingresa su email en el formulario HTML.
2. JavaScript valida el email en tiempo real (formato, longitud, caracteres).
3. Al enviar, se hace un `POST` directo a la REST API de Supabase.
4. Supabase inserta el registro en PostgreSQL protegido por Row Level Security (RLS).
5. Si el email ya existe, PostgreSQL retorna `409 Conflict` (constraint `UNIQUE`).
6. El frontend muestra feedback inmediato según el código de respuesta.

---

## 2. Stack Tecnológico

| Componente | Tecnología | Propósito |
|---|---|---|
| Frontend | HTML + Vanilla JS | Formulario y lógica de envío |
| Backend | Supabase (PostgREST) | API REST automática sobre PostgreSQL |
| Base de datos | PostgreSQL (Supabase) | Almacenamiento de emails |
| Seguridad | RLS + UNIQUE index | Protección de datos y deduplicación |
| Hosting | GitHub Pages / Jekyll | Sitio estático (cualquier host sirve) |

**Sin dependencias externas.** No se necesita Node.js, npm, ni ninguna librería JS.

---

## 3. Configuración de Supabase (Backend)

### 3.1 Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Elegir región, nombre y contraseña de la BD
3. Una vez creado, ir a **Settings → API** y copiar:
   - `Project URL` → será tu `SUPABASE_URL`
   - `anon public key` → será tu `SUPABASE_ANON_KEY`

### 3.2 Crear tabla `emails`

Ejecutar en el **SQL Editor** de Supabase:

```sql
-- Crear tabla de emails
CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3.3 Crear índice UNIQUE case-insensitive

```sql
-- Impedir duplicados independientemente de mayúsculas/minúsculas
CREATE UNIQUE INDEX emails_email_unique_idx
ON public.emails (lower(email));
```

Esto garantiza que `user@mail.com` y `User@MAIL.com` se traten como el mismo email.

### 3.4 Activar Row Level Security (RLS)

```sql
-- Activar RLS en la tabla
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
```

### 3.5 Crear política de solo INSERT público

```sql
-- Permitir SOLO inserción desde el rol anónimo (público)
CREATE POLICY "allow public insert"
ON public.emails
FOR INSERT
TO anon
WITH CHECK (true);
```

### 3.6 Verificación de seguridad

| Operación | Permitida | Por qué |
|---|---|---|
| `INSERT` | ✅ Sí | Policy `allow public insert` para rol `anon` |
| `SELECT` | ❌ No | No hay policy de lectura pública |
| `UPDATE` | ❌ No | No hay policy de actualización |
| `DELETE` | ❌ No | No hay policy de eliminación |

> **Resultado:** Un usuario anónimo solo puede insertar emails. No puede leer, modificar ni borrar registros existentes.

### 3.7 SQL Completo (copiar y pegar)

```sql
-- =============================================
-- CONFIGURACIÓN COMPLETA: Tabla de suscripción
-- =============================================

-- 1. Crear tabla
CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Índice único case-insensitive
CREATE UNIQUE INDEX emails_email_unique_idx
ON public.emails (lower(email));

-- 3. Activar RLS
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- 4. Policy: solo INSERT público
CREATE POLICY "allow public insert"
ON public.emails
FOR INSERT
TO anon
WITH CHECK (true);
```

---

## 4. Implementación Frontend

### 4.1 HTML — Formulario

```html
<section id="newsletter">
  <div class="newsletter">
    <h2>Stay Updated</h2>
    <p>Be the first to know about new developments and releases.</p>

    <form id="subscribe-form" class="subscribe-form">
      <input
        type="email"
        id="email-input"
        placeholder="your@email.com"
        required
        aria-label="Email address"
      />
      <button type="submit" class="btn btn-primary">Subscribe</button>
      <p id="form-message" class="form-message"></p>
    </form>
  </div>
</section>
```

### 4.2 JavaScript — Lógica completa (Vanilla JS, zero dependencies)

Incluir dentro de la sección del formulario o al final del `<body>`:

```html
<script>
// ===== CONFIGURACIÓN =====
// Reemplazar con tus valores de Supabase → Settings → API
const SUPABASE_URL = "https://TU_PROJECT_ID.supabase.co/rest/v1/emails";
const SUPABASE_ANON_KEY = "TU_ANON_PUBLIC_KEY";

const MAX_EMAIL_LENGTH = 254;
const ALLOWED_EMAIL_CHARS = /^[a-zA-Z0-9@._-]+$/;

// ===== DOM ELEMENTS =====
const emailInput = document.getElementById("email-input");
const message = document.getElementById("form-message");

// ===== FUNCIONES DE VALIDACIÓN =====

/**
 * Sanitiza el email: trim y remueve caracteres no permitidos
 */
function sanitizeEmail(email) {
  email = email.trim();
  email = email.replace(/[^a-zA-Z0-9@._-]/g, '');
  return email;
}

/**
 * Valida formato de email con regex
 * Requiere: inicio alfanumérico, @, dominio, TLD de 2+ caracteres
 */
function validateEmailFormat(email) {
  const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Valida longitud máxima del email (RFC 5321: 254 caracteres)
 */
function validateEmailLength(email) {
  return email.length <= MAX_EMAIL_LENGTH;
}

/**
 * Validación completa del email
 * Retorna objeto { valid: boolean, error?: string }
 */
function validateEmail(email) {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }

  if (!validateEmailLength(email)) {
    return { valid: false, error: `Email exceeds ${MAX_EMAIL_LENGTH} characters limit` };
  }

  if (!ALLOWED_EMAIL_CHARS.test(email)) {
    return { valid: false, error: "Email contains invalid characters. Only letters, numbers, @._- are allowed" };
  }

  if (!validateEmailFormat(email)) {
    return { valid: false, error: "Invalid email format. Must be user@domain.com" };
  }

  return { valid: true };
}

// ===== VALIDACIÓN EN TIEMPO REAL =====
// Muestra feedback mientras el usuario escribe
emailInput.addEventListener("input", function(e) {
  const email = e.target.value;
  const validation = validateEmail(email);

  if (email.length === 0) {
    message.textContent = "";
    message.className = "form-message";
    return;
  }

  if (!validation.valid) {
    message.textContent = validation.error;
    message.className = "form-message error";
    return;
  }

  message.textContent = "Valid email format";
  message.className = "form-message success";
});

// Limpia mensaje al perder foco si está vacío
emailInput.addEventListener("blur", function(e) {
  const email = e.target.value;
  if (email.length === 0) {
    message.textContent = "";
    message.className = "form-message";
  }
});

// ===== ENVÍO DEL FORMULARIO =====
document
  .getElementById("subscribe-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = sanitizeEmail(emailInput.value);
    const validation = validateEmail(email);

    // Validación pre-envío
    if (!validation.valid) {
      message.textContent = validation.error;
      message.className = "form-message error";
      return;
    }

    // Estado: enviando
    message.className = "form-message info";
    message.textContent = "Submitting...";

    try {
      const response = await fetch(SUPABASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=minimal"    // No retornar el registro insertado
        },
        body: JSON.stringify({ email })
      });

      // Éxito: email insertado
      if (response.status === 201 || response.status === 204) {
        message.textContent = "Subscribed.";
        emailInput.value = "";
        message.className = "form-message success";
        return;
      }

      // Duplicado: el email ya existe (violación del UNIQUE constraint)
      if (response.status === 409) {
        message.textContent = "Already subscribed.";
        message.className = "form-message warning";
        return;
      }

      // Otro error del servidor
      const errorText = await response.text();
      message.textContent = "Error. Try again later.";
      message.className = "form-message error";
      console.error(errorText);

    } catch (error) {
      // Error de red (sin conexión, CORS, timeout, etc.)
      console.error(error);
      message.textContent = "Network error. Check console.";
      message.className = "form-message error";
    }
  });
</script>
```

### 4.3 Desglose de los Headers HTTP

| Header | Valor | Propósito |
|---|---|---|
| `Content-Type` | `application/json` | Indica que el body es JSON |
| `apikey` | `SUPABASE_ANON_KEY` | Autenticación de la API de Supabase |
| `Authorization` | `Bearer SUPABASE_ANON_KEY` | Token de autorización (misma key) |
| `Prefer` | `return=minimal` | No retorna el registro insertado (ahorra bandwidth) |

### 4.4 Códigos de respuesta HTTP

| Código | Significado | Acción en UI |
|---|---|---|
| `201` / `204` | Email insertado correctamente | "Subscribed." |
| `409` | Email duplicado (UNIQUE constraint) | "Already subscribed." |
| `4xx` / `5xx` | Error del servidor | "Error. Try again later." |
| `catch` | Error de red | "Network error." |

---

## 5. Estilos CSS

### 5.1 Estilos del contenedor Newsletter

```css
/* Contenedor principal del newsletter */
.newsletter {
  background: var(--color-bg-card, #1a1a2e);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
}
```

### 5.2 Estilos del formulario

```css
/* Formulario: layout flex horizontal */
.subscribe-form {
  display: flex;
  gap: 8px;
  max-width: 500px;
  margin: 1rem auto 0;
  flex-wrap: wrap;
  align-items: center;
}

/* Input de email */
.subscribe-form input[type="email"] {
  flex: 1;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  min-width: 200px;
}

.subscribe-form input[type="email"]:focus {
  outline: none;
  border-color: #00d4ff; /* cyan accent */
}

.subscribe-form input[type="email"]::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* Botón de envío */
.subscribe-form button {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.subscribe-form button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.subscribe-form button:active {
  transform: scale(0.98);
}
```

### 5.3 Estilos de mensajes de feedback

```css
/* Mensaje de feedback debajo del formulario */
.form-message {
  font-size: 0.85rem;
  margin-top: 6px;
  width: 100%;
  text-align: center;
  min-height: 1.2em;
  transition: color 0.2s ease;
}

/* Sin estado: color neutro */
.form-message {
  color: #888;
}

/* Éxito */
.form-message.success {
  color: #30d158;
}

/* Error */
.form-message.error {
  color: #ff453a;
}

/* Advertencia (duplicado) */
.form-message.warning {
  color: #ffd60a;
}

/* Info (enviando...) */
.form-message.info {
  color: #64d2ff;
}
```

### 5.4 Responsive (mobile)

```css
@media (max-width: 640px) {
  .subscribe-form {
    flex-direction: column;
  }

  .subscribe-form input[type="email"],
  .subscribe-form button {
    width: 100%;
  }
}
```

---

## 6. Comportamiento UX

### Diagrama de estados

```
[Vacío] → usuario escribe → [Validación en tiempo real]
                                    │
                            ┌───────┴───────┐
                            ▼               ▼
                      [Error format]   [Valid format]
                      (texto rojo)     (texto verde)
                            │               │
                            ▼               ▼
                      [No envía]      [Submit click]
                                           │
                                    ┌──────┴──────┐
                                    ▼             ▼
                              [Validación]  [Sanitize]
                                    │             │
                                    └──────┬──────┘
                                           ▼
                                    [POST a Supabase]
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                        [201/204]      [409]      [Error/Catch]
                        "Subscribed"   "Already    "Error/
                        (verde)         subscribed"  Network error"
                        + clear input  (amarillo)   (rojo)
```

### Tabla de estados UX

| Evento | Respuesta visual | Clase CSS | Color |
|---|---|---|---|
| Campo vacío | Sin mensaje | `form-message` | — |
| Email inválido (mientras escribe) | Mensaje de error específico | `form-message error` | Rojo |
| Email válido (mientras escribe) | "Valid email format" | `form-message success` | Verde |
| Enviando | "Submitting..." | `form-message info` | Azul |
| Email nuevo registrado | "Subscribed." | `form-message success` | Verde |
| Email duplicado | "Already subscribed." | `form-message warning` | Amarillo |
| Error de servidor | "Error. Try again later." | `form-message error` | Rojo |
| Error de red | "Network error. Check console." | `form-message error` | Rojo |

---

## 7. Seguridad

### 7.1 Capas de protección implementadas

| Capa | Mecanismo | Descripción |
|---|---|---|
| **Frontend** | Sanitización | Remueve caracteres no permitidos (`[^a-zA-Z0-9@._-]`) |
| **Frontend** | Validación de formato | Regex que valida estructura `user@domain.tld` |
| **Frontend** | Límite de longitud | Máximo 254 caracteres (RFC 5321) |
| **Frontend** | Whitelist de caracteres | Solo `a-zA-Z0-9@._-` |
| **Backend** | `UNIQUE INDEX` | `lower(email)` — deduplicación case-insensitive |
| **Backend** | RLS (Row Level Security) | Solo permite `INSERT` al rol `anon` |
| **Backend** | Sin `SELECT` público | Nadie puede listar los emails existentes |
| **Backend** | Sin `UPDATE`/`DELETE` | No se pueden modificar ni borrar registros |

### 7.2 La API key pública es segura

La `anon key` de Supabase es **diseñada para ser pública**. Su seguridad depende de las políticas RLS:

- La key solo permite operaciones que las RLS policies permitan
- Sin policy de `SELECT`, nadie puede leer los datos
- Sin policy de `DELETE`/`UPDATE`, nadie puede modificarlos
- La key es equivalente a un "permiso de entrada" — los RLS son los "guardias"

### 7.3 Lo que NO está implementado (deliberadamente)

| Feature | Estado | Razón |
|---|---|---|
| hCaptcha / reCAPTCHA | ❌ | Minimalismo. Agregar cuando haya abuso |
| Double opt-in | ❌ | Requiere servicio de email (SendGrid, etc.) |
| Email verification | ❌ | Misma razón que double opt-in |
| Rate limiting | ❌ | Supabase tiene rate limiting integrado básico |
| Automatización de envíos | ❌ | Agregar cuando el volumen lo justifique |

---

## 8. Exportar Suscriptores

### Desde el Dashboard de Supabase

1. Ir a **Table Editor** → seleccionar tabla `emails`
2. Click en **Export** → **CSV**
3. Descargar el archivo

### Desde SQL

```sql
-- Exportar todos los emails ordenados por fecha
SELECT email, created_at
FROM public.emails
ORDER BY created_at DESC;
```

### Uso posterior del CSV

- Importar a plataformas de newsletter (Mailchimp, Buttondown, Resend, etc.)
- Enviar emails manualmente
- Analizar crecimiento de suscriptores
- Integrar con CRM

---

## 9. Checklist de Implementación

Sigue estos pasos en orden para replicar esta arquitectura en otro proyecto:

### Backend (Supabase) — ~5 minutos

- [ ] Crear cuenta/proyecto en [supabase.com](https://supabase.com)
- [ ] Abrir SQL Editor
- [ ] Ejecutar el [SQL completo de la Sección 3.7](#37-sql-completo-copiar-y-pegar)
- [ ] Copiar `Project URL` desde Settings → API
- [ ] Copiar `anon public key` desde Settings → API

### Frontend — ~10 minutos

- [ ] Agregar el [HTML del formulario](#41-html--formulario) en tu página
- [ ] Agregar el [JavaScript](#42-javascript--lógica-completa-vanilla-js-zero-dependencies) (inline o en archivo `.js`)
- [ ] **Reemplazar** `TU_PROJECT_ID` en `SUPABASE_URL` por tu Project ID
- [ ] **Reemplazar** `TU_ANON_PUBLIC_KEY` en `SUPABASE_ANON_KEY` por tu anon key
- [ ] Agregar los [estilos CSS](#5-estilos-css) a tu stylesheet
- [ ] Adaptar colores/variables CSS a tu diseño

### Verificación — ~2 minutos

- [ ] Probar con un email nuevo → debe mostrar "Subscribed."
- [ ] Probar con el mismo email → debe mostrar "Already subscribed."
- [ ] Verificar en Supabase Table Editor que el registro aparece
- [ ] Probar con email inválido → debe mostrar error antes de enviar
- [ ] Abrir DevTools → verificar que no hay errores en Console

---

## 10. Limitaciones y Evolución Futura

### Arquitectura actual: Tier 0 (MVP)

Esta implementación es **deliberadamente minimalista**. Suficiente para captar emails con un sitio de bajo-mediano tráfico sin infraestructura adicional.

### Evolución sugerida por tier

| Tier | Trigger | Agregar |
|---|---|---|
| **0 (actual)** | Lanzamiento | Solo captura de emails |
| **1** | >100 suscriptores | Integración con Resend/Buttondown para envíos |
| **2** | Abuso/bots | hCaptcha o Cloudflare Turnstile |
| **3** | Requisitos legales | Double opt-in + unsubscribe link |
| **4** | Crecimiento real | Segmentación, analytics, automatización |

### Para agregar hCaptcha (Tier 2)

```html
<!-- Agregar en el <head> -->
<script src="https://js.hcaptcha.com/1/api.js" async defer></script>

<!-- Agregar dentro del <form>, antes del botón -->
<div class="h-captcha" data-sitekey="TU_SITE_KEY"></div>
```

Y validar el token en el JavaScript antes del `fetch`.

### Para agregar Double Opt-in (Tier 3)

Requiere un servicio de envío de emails (Resend, SendGrid, etc.):
1. Al insertar el email, guardar con campo `confirmed = false`
2. Enviar email con link de confirmación (token único)
3. Al hacer click, actualizar `confirmed = true`
4. Solo enviar newsletters a emails confirmados

---

## Archivo de Referencia Rápida

### Variables a reemplazar

| Variable | Dónde obtenerla |
|---|---|
| `TU_PROJECT_ID` | Supabase → Settings → API → Project URL (el subdominio) |
| `TU_ANON_PUBLIC_KEY` | Supabase → Settings → API → `anon` `public` key |

### Endpoint resultante

```
POST https://TU_PROJECT_ID.supabase.co/rest/v1/emails
```

### Body del request

```json
{
  "email": "usuario@ejemplo.com"
}
```

### Headers requeridos

```json
{
  "Content-Type": "application/json",
  "apikey": "TU_ANON_PUBLIC_KEY",
  "Authorization": "Bearer TU_ANON_PUBLIC_KEY",
  "Prefer": "return=minimal"
}
```

---

*Documentación generada desde el proyecto ENGRAM.cloud — Febrero 2026*


PUBLISHABLE API KEY = sb_publishable_EFI12D4AaO2Y7o5gyWrB-g_i--T5Arz


ProjectID = yfofmawbvlontugygfcj