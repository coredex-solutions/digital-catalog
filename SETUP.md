# Dynamic CMS Setup Guide

## Overview
This application has been converted from a static Next.js app to a fully dynamic CMS-powered application using:
- **Turso Database** (SQLite-based, edge database)
- **Cloudflare R2** (for category images)
- **Next.js 16** with App Router
- **ISR (Incremental Static Regeneration)** with 10-minute intervals
- **On-demand revalidation** when CMS updates

## Environment Variables

Create a `.env.local` file with:

```env
# Turso Database
TURSO_DATABASE_URL=libsql://your-database-url
TURSO_AUTH_TOKEN=your-auth-token

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://pub-your-account-id.r2.dev

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Admin User (set initial password)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
```

## Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Turso Database**
   - Create a database at https://turso.tech
   - Get your database URL and auth token
   - Add them to `.env.local`

3. **Set up Cloudflare R2**
   - Create an R2 bucket in Cloudflare
   - Create API tokens with read/write permissions
   - Add credentials to `.env.local`
   - Configure CORS for public access

4. **Run Database Migrations & Seed**
   ```bash
   npm run seed
   ```

5. **Create Admin User**
   ```bash
   npm run create-admin
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Access CMS**
   - Navigate to `/admin/login`
   - Login with credentials from step 5

## Database Schema

- **categories**: Category data with images (R2 URLs)
- **menu_items**: Menu items (no images)
- **restaurant_settings**: Contact info, map URL, phone numbers
- **operating_hours**: Opening hours for each day
- **social_media**: Social media links
- **branches**: Restaurant branch information
- **admin_users**: Admin authentication

## CMS Features

### Categories Management
- Create, edit, delete categories
- Upload category images to R2
- Set display order
- Enable/disable categories

### Menu Items Management
- Create, edit, delete menu items
- Multi-language support (AR, EN, FR)
- Price management
- Category assignment
- Display order

### Restaurant Settings
- Google Maps iframe URL
- Phone numbers (reservation & checkout)
- WhatsApp number
- Email
- Address (multi-language)

### Operating Hours
- Set hours for each day
- Mark days as closed
- Real-time open/closed status

### Social Media
- Instagram, Facebook, TikTok, YouTube links

### Branches
- Multiple branch support
- Address, phone numbers, map URLs

## API Routes

All API routes require authentication (except GET endpoints):

- `GET /api/categories` - Public
- `POST /api/categories` - Auth required
- `PUT /api/categories/[id]` - Auth required
- `DELETE /api/categories/[id]` - Auth required
- `GET /api/menu-items` - Public
- `POST /api/menu-items` - Auth required
- `PUT /api/menu-items/[id]` - Auth required
- `DELETE /api/menu-items/[id]` - Auth required
- `GET /api/restaurant-settings` - Public
- `PUT /api/restaurant-settings` - Auth required
- `GET /api/operating-hours` - Public
- `PUT /api/operating-hours` - Auth required
- `GET /api/social-media` - Public
- `PUT /api/social-media` - Auth required
- `GET /api/branches` - Public
- `POST /api/branches` - Auth required
- `PUT /api/branches/[id]` - Auth required
- `DELETE /api/branches/[id]` - Auth required
- `POST /api/upload` - Auth required (image upload to R2)
- `POST /api/revalidate` - Auth required (on-demand revalidation)
- `POST /api/auth/login` - Public

## ISR Configuration

- **Revalidation Interval**: 10 minutes (600 seconds)
- **On-demand Revalidation**: Triggered automatically when CMS updates content
- **Static Generation**: All category pages pre-generated at build time

## Image Upload

- Images are uploaded to Cloudflare R2
- Upload happens on form submit (not on file select)
- Progress indicator shown during upload
- Only category images are supported (menu items have no images)

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- CORS configuration for R2

## Deployment

1. Set all environment variables in Netlify
2. Build command: `npm run build`
3. Publish directory: `.next` (or configure for static export if needed)
4. Ensure Turso and R2 credentials are set

## Notes

- Menu items no longer have images (removed from frontend)
- Categories can have images from R2
- All dynamic pages use ISR with 10-minute revalidation
- CMS updates trigger immediate revalidation

