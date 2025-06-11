# PostgreSQL Database Setup Guide

This guide will help you set up PostgreSQL for your YABLU-MC planner. **This app now requires a PostgreSQL database and no longer uses localStorage.**

## Prerequisites

1. **PostgreSQL Database**: You'll need a PostgreSQL database. Options include:
   - Local PostgreSQL installation
   - [Railway](https://railway.app) (recommended for easy setup)
   - [Supabase](https://supabase.com)
   - [Neon](https://neon.tech)
   - Any PostgreSQL hosting service

## Setup Steps

### 1. Get Your Database

**Option A: Railway (Recommended)**
1. Sign up at [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the DATABASE_URL from the Connect tab

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb yablu_mc

# Your DATABASE_URL will be:
# postgresql://username@localhost:5432/yablu_mc
```

### 2. Install Server Dependencies

```bash
# Install server dependencies
npm run setup:server
```

### 3. Configure Environment

```bash
# Copy environment template
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
DATABASE_URL=your_postgresql_connection_string_here
PORT=3001
NODE_ENV=development
```

### 4. Run Database Migration

```bash
# Create database tables
npm run migrate
```

### 5. Configure Frontend

```bash
# Copy frontend environment template
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### 6. Start Development Servers

```bash
# Terminal 1: Start backend
npm run dev:server

# Terminal 2: Start frontend
npm run dev
```

## Data Storage

This app uses PostgreSQL exclusively for data storage. All tasks, projects, completed items, and deleted items are stored in the database and sync across all devices on your network.

## Production Deployment

### Backend Deployment
1. Deploy server folder to your hosting service (Railway, Heroku, etc.)
2. Set environment variables in your hosting dashboard
3. Your DATABASE_URL should point to your production database

### Frontend Deployment
1. Update `.env` with your production API URL:
   ```env
   VITE_API_URL=https://your-api-domain.com/api
   ```
2. Build and deploy: `npm run build`

## Troubleshooting

### Connection Issues
- Verify DATABASE_URL is correct
- Check if database is accessible from your network
- Ensure PostgreSQL service is running

### Data Issues
- Check browser console for detailed error messages
- Verify API server is running and accessible
- Ensure PostgreSQL database is accessible

### CORS Issues
- The server includes CORS middleware for development
- For production, configure CORS with your specific frontend domain

## Data Structure

The PostgreSQL schema maintains the same data structure as localStorage:

- **projects**: Project definitions with colors and order
- **tasks**: Tasks organized by containers (master, monday, tuesday, etc.)
- **completed_tasks**: Completed tasks with timestamps
- **deleted_tasks**: Soft-deleted tasks for recovery

## Offline Support

The app includes offline support:
- Data is always saved to localStorage as backup
- When online, changes sync to PostgreSQL
- When offline, app continues working with localStorage
- Automatic sync when connection is restored

## API Endpoints

- `GET /api/sync/all` - Get all data
- `POST /api/sync/import` - Import localStorage data
- CRUD endpoints for projects and tasks
- See `server/routes/` for complete API documentation

## Database Administration Notes

**IMPORTANT**: Database migrations and schema changes must be run as the `tippyflits` system user, NOT as `yablu_user`.

- **Application runtime**: Uses `yablu_user` with credentials in `server/.env`
- **Schema migrations**: Must be run as `tippyflits` (system user who owns the tables)
- **Migration command**: `psql -d yablu_mc -f migration_file.sql`

The database tables are owned by `tippyflits`, while the application connects as `yablu_user` for normal operations.