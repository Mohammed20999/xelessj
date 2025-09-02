# Deployment Guide - Xeless Janitorial Management System

## Prerequisites

- Node.js 18+ installed
- Git installed
- Supabase account
- Vercel account (for Vercel deployment)
- Netlify account (for Netlify deployment)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and enter project details:
   - Name: `xeless-janitorial`
   - Database Password: (generate strong password)
   - Region: Choose closest to your users

### 1.2 Set up Database Schema

1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the entire content from `supabase-schema.sql`
3. Click "Run" to execute the schema
4. Verify tables are created in the Table Editor

### 1.3 Configure Authentication

1. Go to Authentication > Settings
2. Set Site URL to your domain (e.g., `https://xeless-janitorial.vercel.app`)
3. Add redirect URLs:
   - `https://xeless-janitorial.vercel.app/**`
   - `https://xeless-janitorial.netlify.app/**`
   - `http://localhost:3000/**` (for development)

### 1.4 Get API Keys

1. Go to Settings > API
2. Copy the following:
   - Project URL
   - Anon/Public key
   - Service Role key (keep this secret!)

## Step 2: Local Development Setup

### 2.1 Clone and Install

```bash
git clone <your-repo-url>
cd xeless-janitorial
npm install
```

### 2.2 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2.3 Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to test the application.

## Step 3: Create Admin User

### 3.1 Sign Up First User

1. Go to your local app at `http://localhost:3000`
2. Try to access any page (will redirect to login)
3. Sign up with your admin email
4. Check Supabase Authentication > Users to see the new user

### 3.2 Set Admin Role

1. Go to Supabase SQL Editor
2. Run this query (replace with your email):

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
```

3. Refresh your app and you should have admin access

## Step 4: Vercel Deployment

### 4.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Choose "Next.js" framework preset

### 4.2 Configure Environment Variables

In Vercel dashboard, add these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### 4.3 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Test your live site

### 4.4 Update Supabase URLs

1. Go back to Supabase Authentication settings
2. Update Site URL to your Vercel domain
3. Add your Vercel domain to redirect URLs

## Step 5: Netlify Deployment

### 5.1 Connect Repository

1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Choose your Git provider and repository
4. Build settings should auto-detect from `netlify.toml`

### 5.2 Configure Environment Variables

In Netlify dashboard > Site settings > Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### 5.3 Deploy

1. Click "Deploy site"
2. Wait for build to complete
3. Test your live site

### 5.4 Update Supabase URLs

Add your Netlify domain to Supabase redirect URLs.

## Step 6: Create Sample Users

### 6.1 Staff Users

Create staff accounts for cleaners:

```sql
-- After staff members sign up, update their roles:
UPDATE users SET role = 'staff' WHERE email = 'cleaner1@example.com';
UPDATE users SET role = 'staff' WHERE email = 'cleaner2@example.com';
```

### 6.2 Client Users

Create client accounts and assign rooms:

```sql
-- After clients sign up, assign them rooms:
UPDATE users SET 
  role = 'client',
  assigned_room_id = (SELECT id FROM rooms WHERE room_number = '001' LIMIT 1)
WHERE email = 'resident1@example.com';
```

## Step 7: Generate QR Codes

### 7.1 Access Admin Panel

1. Log in as admin user
2. Go to Dashboard > Generate QR Codes
3. Click "Generate QR Codes" button
4. Download the PDF with all 670 QR codes

### 7.2 Print and Distribute

1. Print the QR codes PDF
2. Cut out individual QR codes
3. Attach to respective rooms
4. Each QR code links to `/room/[id]` for that specific room

## Step 8: Testing the System

### 8.1 Test Staff Workflow

1. Use a QR code scanner app on your phone
2. Scan a room's QR code
3. Should open the web app to that room's page
4. Log in as staff user
5. Click "Mark as Cleaned"
6. Verify log appears in admin reports

### 8.2 Test Client Workflow

1. Log in as client user
2. View cleaning history for assigned room
3. Submit a problem report
4. Verify report appears in admin dashboard

### 8.3 Test Admin Features

1. Log in as admin
2. View all cleaning logs and reports
3. Export data to Excel
4. Generate new QR codes
5. Manage users and rooms

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check Supabase site URL and redirect URLs
2. **Database errors**: Verify schema was applied correctly
3. **QR codes not working**: Ensure room IDs match database
4. **Export not working**: Check browser allows file downloads
5. **Mobile issues**: Test on actual mobile devices

### Support

For technical issues:

1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify environment variables are set correctly
4. Test with different user roles

## Security Checklist

- [ ] Environment variables are set correctly
- [ ] Supabase RLS policies are enabled
- [ ] Admin user is properly configured
- [ ] HTTPS is enforced on production
- [ ] No sensitive data in client-side code
- [ ] Regular backups of Supabase database

## Maintenance

### Regular Tasks

1. Monitor Supabase usage and billing
2. Review cleaning logs and reports
3. Update user roles as needed
4. Generate new QR codes if rooms change
5. Export data for record keeping

### Updates

1. Keep dependencies updated
2. Monitor Next.js and Supabase updates
3. Test changes in development first
4. Deploy updates during low-usage times

## Success Metrics

After deployment, you should have:

- ✅ 670 rooms with unique QR codes
- ✅ 17 buildings properly configured
- ✅ Admin, staff, and client user roles working
- ✅ QR code scanning and room marking functional
- ✅ Problem reporting system active
- ✅ Excel export working for admin
- ✅ Multilingual support (English, Kurdish, Arabic)
- ✅ Mobile-friendly interface
- ✅ Both Vercel and Netlify deployments live