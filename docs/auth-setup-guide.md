# Auth Setup Guide — Logto OAuth Providers

This guide covers configuring external OAuth providers in the self-hosted Logto instance and setting up redirect URIs for production and staging environments.

## Prerequisites

- Logto admin console accessible at `https://logto-admin.hd5.dev` (production) or `https://logto-admin-staging.hd5.dev` (staging)
- Production domain: `framedle.wtf`
- Staging domain: `api-staging.framedle.wtf` / `staging.framedle.wtf`

---

## Redirect URIs

Configure these in each Logto connector and in each OAuth app's developer console.

| Environment | Callback URL |
|-------------|-------------|
| Production  | `https://framedle.wtf/api/auth/callback` |
| Staging     | `https://staging.framedle.wtf/api/auth/callback` |
| Local dev   | `http://localhost:3000/api/auth/callback` |

---

## 1. Username + Email (Built-in)

Enable in Logto Console → Sign-in experience → Sign-in methods.

1. Toggle **Email address** as an identifier
2. Toggle **Username** as an identifier (optional)
3. Enable **Email verification** for password resets
4. Set password policy under Sign-in experience → Password policy

No external OAuth app required.

---

## 2. Google (Gmail)

### Create OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Click **Create Credentials** → OAuth client ID
3. Application type: **Web application**
4. Name: `Framedle`
5. Authorized redirect URIs: add all redirect URIs from the table above
6. Copy **Client ID** and **Client Secret**

### Configure Logto

1. Logto Console → Connectors → Social connectors → **Add connector**
2. Select **Google**
3. Enter Client ID and Client Secret
4. Set scopes: `openid email profile`
5. Save and enable

---

## 3. GitHub

### Create OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**
2. Application name: `Framedle`
3. Homepage URL: `https://framedle.wtf`
4. Authorization callback URL: `https://framedle.wtf/api/auth/callback`
   - For staging, create a separate OAuth App with the staging callback URL
5. Copy **Client ID** and generate a **Client Secret**

### Configure Logto

1. Logto Console → Connectors → Social connectors → **Add connector**
2. Select **GitHub**
3. Enter Client ID and Client Secret
4. Set scopes: `read:user user:email`
5. Save and enable

---

## 4. Twitter / X

### Create App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app under it
3. App settings → User authentication settings → **Set up**
4. App type: **Web App**
5. Callback URI: add all redirect URIs from the table above
6. Website URL: `https://framedle.wtf`
7. Copy **Client ID** and **Client Secret** (OAuth 2.0)

### Configure Logto

1. Logto Console → Connectors → Social connectors → **Add connector**
2. Select **Twitter** (OAuth 2.0)
3. Enter Client ID and Client Secret
4. Set scopes: `tweet.read users.read offline.access`
5. Save and enable

---

## 5. Instagram

### Create App

1. Go to [Meta Developer Portal](https://developers.facebook.com/) → **Create App**
2. Use case: **Authenticate and request data from users with Facebook Login**
3. Add product: **Instagram Graph API**
4. Go to Instagram → Basic Display → Instagram App Settings
5. Add OAuth redirect URIs: all redirect URIs from the table above
6. Copy **Instagram App ID** and **Instagram App Secret**

### Configure Logto

1. Logto Console → Connectors → Social connectors → **Add connector**
2. Select **Instagram** (if available) or use the **OAuth 2.0 generic connector**
3. Authorization endpoint: `https://api.instagram.com/oauth/authorize`
4. Token endpoint: `https://api.instagram.com/oauth/access_token`
5. Scopes: `user_profile,user_media`
6. Enter App ID and App Secret
7. Save and enable

---

## 6. Facebook

### Create App

1. Go to [Meta Developer Portal](https://developers.facebook.com/) → **Create App**
2. Use case: **Authenticate and request data from users with Facebook Login**
3. Add product: **Facebook Login** → **Web**
4. Site URL: `https://framedle.wtf`
5. Facebook Login → Settings → Valid OAuth Redirect URIs: add all redirect URIs from the table above
6. Copy **App ID** and **App Secret** from App Settings → Basic

### Configure Logto

1. Logto Console → Connectors → Social connectors → **Add connector**
2. Select **Facebook**
3. Enter App ID and App Secret
4. Set scopes: `email,public_profile`
5. Save and enable

---

## Machine-to-Machine App (Management API)

The M2M app is used by the Hono API to call Logto's Management API for user invites and role management.

1. Logto Console → Applications → **Create application**
2. Type: **Machine-to-machine**
3. Name: `Framedle API (M2M)`
4. Go to the app → **API Resources** tab → Add `Logto Management API`
5. Assign role: **all** (or scope to specific management endpoints)
6. Copy **App ID** and **App Secret**
7. Set in environment:
   ```
   LOGTO_M2M_APP_ID=<App ID>
   LOGTO_M2M_APP_SECRET=<App Secret>
   ```

> **Important**: The Logto Management API resource identifier is always `https://default.logto.app/api` — not your instance domain. This is hardcoded in Logto OSS. Set `LOGTO_MANAGEMENT_API_RESOURCE=https://default.logto.app/api` in the API environment.

---

## API Resource

Register the Framedle API as a resource so Logto issues JWTs with the correct audience.

1. Logto Console → API Resources → **Create API resource**
2. API name: `Framedle API`
3. API identifier: `https://api.framedle.wtf`
4. Token expiry: `3600` (1 hour)
5. Add permission (scope): `admin` — grants admin role in JWT claims
6. Set in environment:
   ```
   LOGTO_API_RESOURCE=https://api.framedle.wtf
   NUXT_LOGTO_API_RESOURCE=https://api.framedle.wtf
   ```

---

## Sign-in Experience

Configure in Logto Console → Sign-in experience:

1. **Branding** — Upload Framedle logo, set brand color
2. **Sign-in methods** — Enable: Email, Username, Google, GitHub, Twitter, Facebook, Instagram
3. **Sign-up** — Enable email verification
4. **Password policy** — Minimum 8 characters
5. **Identifiers** — Primary: Email address; secondary: Username

---

## Webhook Setup

Configure Logto to fire lifecycle events to the Framedle API.

1. Logto Console → Webhooks → **Create webhook**
2. Name: `Framedle user sync`
3. Endpoint URL: `https://api.framedle.wtf/webhooks/logto`
4. Events to subscribe:
   - `User.Created`
   - `User.Data.Updated`
   - `User.Deleted`
5. Copy the **Signing key** and set:
   ```
   LOGTO_WEBHOOK_SECRET=<Signing key>
   ```

---

## Testing OAuth Flows

After configuring each provider:

1. Open an incognito window
2. Navigate to `https://framedle.wtf` (or `https://staging.framedle.wtf` for staging)
3. Trigger sign-in and select the provider
4. Verify redirect to provider, consent, and redirect back to `/api/auth/callback`
5. Verify session is established (`/api/auth/session` returns `authenticated: true`)

For staging, ensure each OAuth app has the staging callback URL registered.
