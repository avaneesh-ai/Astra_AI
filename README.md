# Astra_AI

Astra_AI is a Vercel-ready AI workspace with email-link registration, saved local sessions, a friendly chatbot named Aurexis, projects, image generation, co-work space, settings, subscription QR, and a laptop-only admin area.

The app is powered by Create:

```txt
https://create-pied.vercel.app
```

## Run Locally

```bash
npm run dev
```

Open:

```txt
http://localhost:4173
```

## Vercel Environment Variables

For the Create-powered version, add this in Vercel:

```txt
CREATE_PROVIDER_URL=https://create-pied.vercel.app
CREATE_API_KEY=your_create_ai_api_key
```

Optional:

```txt
CREATE_CHAT_ENDPOINT=only_if_create_gives_an_exact_chat_api_url
CREATE_MODEL=create-pied
PUBLIC_APP_URL=https://your-vercel-app.vercel.app
RESEND_API_KEY=optional_for_real_email_links
LOGIN_FROM_EMAIL=Astra_AI <login@your-domain.com>
IMAGE_API_URL=optional_custom_image_endpoint
IMAGE_API_KEY=optional_if_your_image_endpoint_requires_it
```

If you do not set `CREATE_PROVIDER_URL`, Astra_AI automatically uses `https://create-pied.vercel.app`.

Keep `CREATE_API_KEY` in Vercel Environment Variables. Do not paste it into chat or commit it to GitHub.

## Test The Provider

After deployment, open Settings in the app and click:

```txt
Test Create connection
```

You can also open:

```txt
https://YOUR-APP.vercel.app/api/provider-status
```

It should return JSON.

## Deploy Notes

Deploy the whole folder, not only `public`.

Required files and folders:

```txt
api/
lib/
public/
package.json
vercel.json
README.md
server.mjs
```
