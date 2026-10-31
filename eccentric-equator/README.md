# hackfluency.com

Sitio público de HFLUENCY — *Just a group of specialists*.

Una sola página: hero, ticker de certificaciones y formulario de contacto.
Todo lo demás (research, artículos, tooling, dashboards, perfiles del equipo)
está archivado fuera de este repositorio y se reintegrará más adelante con
otra estructura.

## Estructura

```
src/
├─ pages/
│  ├─ index.astro              # la home
│  └─ 404.astro
├─ layouts/
│  └─ Layout.astro             # head, meta, CSP, estilos globales
└─ components/
   ├─ CertTicker.astro         # ticker de 15 certificaciones
   ├─ ThemeInit.astro          # tema sin flash
   └─ pages/HomeContent.astro  # hero + contacto
public/
├─ assets/certs/               # logos del ticker
├─ HFNeon.*                    # logo
├─ favicon*
└─ CNAME, robots.txt
```

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/
```

## Deploy

Push a `main` → GitHub Actions construye y publica en GitHub Pages.
El build corre dentro de `eccentric-equator/` (ver `BUILD_PATH` en el workflow).

## Formulario de contacto

El navegador **no** habla con Telegram. Envía `{ name, email, message }` a
`PUBLIC_CONTACT_ENDPOINT`, un Cloudflare Worker que guarda el token como
secreto (`worker/`). Sin esa variable configurada, el formulario cae en un
`mailto:` para no romperse.

El token del bot nunca debe volver al cliente: con prefijo `PUBLIC_` en Astro,
cualquier valor termina escrito en el HTML público.

## Licencia

Todos los derechos reservados — ver [LICENSE](./LICENSE).
