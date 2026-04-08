# Vercel Environment Variables Configuration

This project requires proper environment variable configuration in Vercel for correct URL routing.

## Required Environment Variable

### `NEXT_PUBLIC_EVENT_LANDING_BASE_URL`

- **Type**: Public (visible to browser)
- **Purpose**: Base URL for event landing pages
- **Format**: `https://domain.com` (no trailing slash)

## Configuration by Environment

### Preview (main branch → uat-events.future-cards.com)
```
NEXT_PUBLIC_EVENT_LANDING_BASE_URL = https://uat-events.future-cards.com
```

### Production (Prod branch → events.future-cards.com)
```
NEXT_PUBLIC_EVENT_LANDING_BASE_URL = https://events.future-cards.com
```

## Setup Instructions

1. **Go to Vercel Dashboard**
   - Navigate to your `hc-event-landing` project
   - Click **Settings** → **Environment Variables**

2. **Add the Variable**
   - **Name**: `NEXT_PUBLIC_EVENT_LANDING_BASE_URL`
   - **Value** (Preview): `https://uat-events.future-cards.com`
   - **Environments**: Select "Preview"
   - Click **Add**

3. **Add Production Variable**
   - **Name**: `NEXT_PUBLIC_EVENT_LANDING_BASE_URL`
   - **Value** (Production): `https://events.future-cards.com`
   - **Environments**: Select "Production"
   - Click **Add**

## Development Setup

For local development, create a `.env.local` file:

```bash
NEXT_PUBLIC_EVENT_LANDING_BASE_URL=http://localhost:3001
```

**Important**: Do NOT commit `.env.local` to git. Add it to `.gitignore`.

## Verifying Configuration

After setting environment variables:

1. **Redeploy** both Preview and Production deployments
   - Settings → Deployments → Click "Redeploy" on each deployment
   - OR push new commits to trigger automatic redeploys

2. **Test URLs**
   - Preview: https://uat-events.future-cards.com/events/{event-slug}
   - Production: https://events.future-cards.com/events/{event-slug}

3. **Check Console Logs**
   - If `NEXT_PUBLIC_EVENT_LANDING_BASE_URL` is still missing, you'll see a warning in browser console
   - This indicates the env var wasn't properly set in Vercel

## Troubleshooting

### Issue: Still redirecting to futurecards-events.vercel.app

**Cause**: The Prod branch still has hardcoded URLs. You need to:
1. Merge the latest main branch changes to Prod
2. Deploy Prod branch to production

**Solution**:
```bash
git checkout Prod
git merge main
git push origin Prod
```

### Issue: Build failures or errors

**Cause**: Vercel might have cached old build configuration

**Solution**:
1. Go to Settings → General → Project Settings
2. Scroll down to **Build Cache** → Click **Clear**
3. Redeploy the project

## Configuration Files

- `vercel.json` - Specifies environment variables structure
- `.env.local` - Local development (not committed)
- Vercel Dashboard - Runtime environment configuration
