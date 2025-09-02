# Xeless Janitorial Management System

A complete multilingual web-based janitorial management system built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Multilingual Support**: English (default), Kurdish (Sorani), and Arabic
- **QR Code System**: Automatic generation for 670 rooms across 17 buildings
- **Role-based Access**: Admin, Staff, and Client roles with different permissions
- **Mobile-first Design**: Clean, professional, and easy-to-use interface
- **Real-time Logging**: Staff can scan QR codes and mark rooms as cleaned
- **Problem Reporting**: Clients can report cleaning issues
- **Export Functionality**: Admin can export logs to Excel/CSV
- **Secure Authentication**: Powered by Supabase Auth

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, API)
- **Internationalization**: next-i18next
- **QR Codes**: qrcode library
- **Export**: xlsx, jsPDF
- **Deployment**: Vercel + Netlify

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd xeless-janitorial
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Copy your project URL and anon key

### 3. Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Roles

### Admin
- Manage users and roles
- Generate QR codes for all rooms
- View and export cleaning logs and reports
- Full system access

### Staff (Cleaners)
- Scan QR codes to access room pages
- Mark rooms as cleaned with one button
- Simple, mobile-friendly interface

### Client (Residents)
- View cleaning history for assigned room
- Submit problem reports
- Track issue resolution

## Database Schema

The system uses 5 main tables:

- `users` - User accounts with roles
- `locations` - Buildings (17 total)
- `rooms` - Individual rooms (670 total)
- `cleaning_logs` - Cleaning activity records
- `problem_reports` - Issue reports from clients

## QR Code System

Each room has a unique QR code that links to `/room/[id]`. When scanned:

1. Opens the web app for that specific room
2. Requires staff authentication
3. Allows one-click cleaning confirmation
4. Logs timestamp and staff ID automatically

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Add environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

## Language Support

The system supports three languages with complete translations:

- **English** (en) - Default
- **Kurdish Sorani** (ku) - کوردی
- **Arabic** (ar) - العربية

Language switching is available in the header and persists across sessions.

## Security Features

- Row Level Security (RLS) policies in Supabase
- Role-based access control
- JWT token authentication
- HTTPS everywhere
- No image uploads (security by design)

## Mobile Optimization

- Phone-first responsive design
- Large touch targets for cleaners
- Simple navigation
- Optimized for quick interactions

## Export Features

Admins can export data in multiple formats:

- **Excel/CSV**: Cleaning logs and problem reports
- **PDF**: QR codes for printing and distribution
- **Filtered exports**: By date, building, or room

## Support

For technical support or questions about the Xeless Janitorial Management System, please contact the development team.

## License

This project is proprietary software developed for Xeless.