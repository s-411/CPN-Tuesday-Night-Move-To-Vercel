# CPN v2 - Cost Per Nut Calculator

> A comprehensive relationship metrics tracking application with Supabase backend and mobile-first PWA design.
Skipping data valut
## Overview

CPN (Cost Per Nut) v2 is a greenfield Supabase-native application that helps users track and analyze relationship efficiency metrics. Built with React, TypeScript, and Tailwind CSS, it provides real-time calculations, multi-profile management, and powerful analytics.

## Latest Updates (Just Added!)

**Data Entry Management:**
- ✅ Individual girl detail pages with complete data entry history
- ✅ Inline edit/delete for data entries with real-time updates
- ✅ Edit data entry modal with validation and preview
- ✅ Clickable girl cards that navigate to detail pages
- ✅ Desktop table and mobile card views for entry history
- ✅ Back navigation from detail pages

**Enhanced Analytics:**
- ✅ Recharts integration with 4 interactive visualizations
- ✅ Bar chart: Total spending by girl
- ✅ Line chart: Cost efficiency trends
- ✅ Pie chart: Spending distribution with percentages
- ✅ Bar chart: Total nuts by girl
- ✅ ROI rankings table with detailed metrics
- ✅ Summary statistics cards
- ✅ Mobile-responsive charts with tooltips
- ✅ Time range filtering UI (7d, 30d, 90d, All)

## Features

### ✅ Implemented (MVP - Phase 1)

#### Authentication & User Management
- Email/password authentication with Supabase Auth
- Persistent sessions with automatic token refresh
- Secure sign-up with email verification
- Password reset functionality
- Multi-device session support

#### Profile Management
- Create unlimited profiles (subscription tier based)
- Hotness rating system (5.0-10.0 scale with tile selector)
- Demographic tracking (ethnicity, hair color, location)
- Active/inactive profile status
- Edit and delete profiles with cascade deletion
- Subscription tier enforcement (Free: 1 profile, Premium/Lifetime: 50 profiles)

#### Data Entry & Tracking
- Add data entries with date, amount spent, duration, and nuts count
- Real-time metric calculations and preview
- Form validation with user-friendly error messages
- Automatic metric recalculation on data changes

#### Real-Time Metrics
- **Cost per Nut**: Total Spent ÷ Total Nuts
- **Time per Nut**: Total Minutes ÷ Total Nuts
- **Cost per Hour**: (Total Spent ÷ Total Minutes) × 60
- **Nuts per Hour**: (Total Nuts ÷ Total Minutes) × 60
- **Efficiency Score**: (Nuts per Dollar × 100) + (Nuts per Hour × 10) + Rating

#### Dashboard
- Global statistics across all active profiles
- Performance insights (best value, highest investment)
- Recent activity feed
- Empty state with onboarding guidance

#### Girls Management View
- Card-based grid layout with profile metrics
- Add data, edit, and delete actions per profile
- Mobile-responsive with touch-optimized interactions
- Filter by active/inactive status
- Upgrade prompts for free tier users

#### Overview Table
- Sortable table view with all metrics
- Multi-column sorting (ascending/descending/none)
- Filter by all/active/inactive profiles
- Desktop table and mobile card views
- Export data to CSV

#### Analytics
- Interactive Recharts visualizations (4 chart types)
- Bar charts for spending and nuts distribution
- Line chart for cost efficiency trends
- Pie chart for spending distribution
- ROI rankings table with detailed metrics
- Summary statistics cards
- Time range filtering UI (7d, 30d, 90d, All)
- Mobile-responsive charts with tooltips
- Empty state guidance

#### Individual Girl Detail Pages
- Comprehensive profile view with all metrics
- Data entry history table (desktop) and cards (mobile)
- Inline edit and delete for entries
- Metric cards showing totals and averages
- Back navigation to girls list
- Real-time updates after changes

#### Settings
- Profile information display
- Subscription tier management
- CSV export for data backup
- Account statistics
- Sign out functionality

#### Mobile-First Design
- Responsive layouts (375px to desktop)
- Desktop sidebar navigation
- Mobile bottom navigation with floating add button
- Touch-optimized forms and buttons
- Mobile-friendly modals and inputs

#### Data Export
- CSV export of all profiles and metrics
- Automatic filename with timestamp
- Proper CSV formatting with quote escaping

### 🚧 Planned Features (Phase 2+)

- Leaderboards with private groups and invite tokens
- Social sharing with canvas-generated images
- Data Vault with community analytics
- Achievement system with badges
- Advanced time-based data filtering and aggregation
- User preferences persistence (theme, date format)
- PWA features (offline mode, push notifications)
- Stripe subscription integration with payment flows
- Monthly/weekly trend analysis
- Efficiency score leaderboards

## Tech Stack

- **Frontend**: React 18.3, TypeScript 5.5, Vite 5.4
- **Styling**: Tailwind CSS 3.4, Custom CPN Design System
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Recharts 3.2 for data visualizations
- **Icons**: Lucide React
- **Build**: Vite with TypeScript compilation

## Database Schema

### Tables

#### users
Extends Supabase auth.users with application-specific data
- Subscription tier management (free, premium, lifetime)
- Stripe integration fields
- User metadata and preferences

#### girls
Profile management for tracked relationships
- Personal attributes (name, age, rating)
- Demographics (ethnicity, hair color, location)
- Active/inactive status

#### data_entries
Transaction records for relationship metrics
- Date, amount spent, duration, nuts count
- Foreign key to girl profiles

#### user_settings
User preferences stored as JSONB
- Theme, datetime formats, privacy, notifications

### Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data (enforced at database level)
- Policies use `auth.uid()` for user identification
- CASCADE deletion prevents orphaned records
- Subscription tier limits enforced via database triggers

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd cpn-v2
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Design System

### CPN Brand Colors

- **Primary Yellow**: `#f2f661` (cpn-yellow) - Primary actions, highlights, active states
- **Dark Background**: `#1f1f1f` (cpn-dark) - Main app background
- **Elevated Surfaces**: `#2a2a2a` (cpn-dark2) - Cards, modals, elevated panels
- **Primary Text**: `#ffffff` (cpn-white) - Main body text
- **Secondary Text**: `#ababab` (cpn-gray) - Meta information, labels

### Typography

- **Headings**: National2Condensed (bold) - `/public/fonts/National-2-Condensed-Bold.ttf`
- **Body Text**: ESKlarheit - `/public/fonts/ESKlarheitGrotesk-Rg.otf`

### Component Classes

- `.btn-cpn`: Yellow button with dark text, pill-shaped (100px border radius)
- `.btn-secondary`: Dark button with gray border
- `.btn-danger`: Red button for destructive actions
- `.input-cpn`: Dark input with gray border, yellow focus ring
- `.select-cpn`: Dark dropdown with focus styling
- `.card-cpn`: Dark card with gray border and padding
- `.sidebar-item`: Navigation item with yellow active state
- `.mobile-nav-item`: Bottom nav item with yellow active text
- `.rating-tile`: Hotness rating tile selector
- `.stat-card`: Dashboard statistic card

## Project Structure

```
/src
  /components       # Reusable React components
    AddGirlModal.tsx
    EditGirlModal.tsx
    AddDataModal.tsx
    Modal.tsx
    RatingTileSelector.tsx
  /pages           # Page-level components
    SignIn.tsx
    SignUp.tsx
    Overview.tsx
  /lib             # Business logic and utilities
    /context       # React context providers
      AuthContext.tsx
    /supabase      # Supabase client configuration
      client.ts
    /types         # TypeScript type definitions
      database.ts
    calculations.ts  # Metric calculation functions
    export.ts       # CSV export utilities
  App.tsx          # Main application component
  index.css        # Global styles and design system
  main.tsx         # Application entry point
/supabase
  /migrations      # Database migration files
/public
  /fonts          # Custom font files
```

## Usage Guide

### Creating an Account

1. Click "Sign up" on the landing page
2. Enter email and password (minimum 8 characters)
3. Verify email with the 6-digit code sent to your inbox
4. Sign in with your credentials

### Adding Your First Girl

1. Click "Add New Girl" button (or floating yellow + button on mobile)
2. Enter required fields: Name, Age (18+)
3. Select hotness rating using the tile selector (5.0-10.0)
4. Optionally add demographics: ethnicity, hair color, location
5. Click "Add Girl"

### Tracking Data

1. Click "Add Data" on a profile card
2. Enter date, amount spent, duration (hours and minutes), and number of nuts
3. View real-time metric calculations in the preview
4. Click "Add Entry"

### Viewing Metrics

- **Dashboard**: Overview of all active profiles with global statistics
- **Girls**: Card view with individual profile metrics
- **Overview**: Sortable table with all profiles and metrics
- **Analytics**: ROI rankings and performance insights

### Exporting Data

1. Go to Settings page
2. Scroll to "Data Management" section
3. Click "Export All Data to CSV"
4. CSV file downloads automatically with timestamp

### Editing Profiles

1. Click the edit button (pencil icon) on any profile
2. Modify any fields including active/inactive status
3. Click "Save Changes"

### Subscription Tiers

- **Free**: 1 active profile, all basic features
- **Premium**: $1.99/week, unlimited profiles (up to 50)
- **Lifetime**: $27 one-time, unlimited profiles + API access

## Calculations Reference

All calculations follow precise formulas defined in the PRD:

- **Cost per Nut** = Total Spent ÷ Total Nuts
- **Time per Nut** = Total Minutes ÷ Total Nuts
- **Cost per Hour** = (Total Spent ÷ Total Minutes) × 60
- **Nuts per Hour** = (Total Nuts ÷ Total Minutes) × 60
- **Efficiency Score** = (Nuts per Dollar × 100) + (Nuts per Hour × 10) + Rating

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Database Migrations

Database schema is managed via Supabase migrations in `/supabase/migrations/`. The migration includes:

- Table creation with constraints and indexes
- Row Level Security policies
- Database triggers for automatic updates
- Subscription tier enforcement functions

## Contributing

This is a greenfield implementation based on a comprehensive PRD. Future contributions should:

1. Follow the CPN design system specifications
2. Maintain TypeScript strict mode compliance
3. Add unit tests for business logic
4. Update documentation for new features
5. Follow the established file organization patterns

## License

All rights reserved.

## Support

For issues, questions, or feature requests, please open an issue in the repository.

---

**Built with React + TypeScript + Supabase + Tailwind CSS**
