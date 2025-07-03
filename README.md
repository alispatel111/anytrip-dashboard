# AnyTrip Dashboard - Full Stack Application

A modern full-stack dashboard application with React frontend and Node.js backend, both deployable to Vercel.

## Project Structure

\`\`\`
anytrip-dashboard/
├── client/                 # React frontend (Vite)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── server/                 # Node.js backend (Express)
│   ├── index.js
│   ├── data/
│   ├── package.json
│   └── vercel.json
├── package.json           # Root package.json
└── README.md
\`\`\`

## Local Development

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Setup Instructions

1. **Install all dependencies:**
   \`\`\`bash
   npm run install:all
   \`\`\`

2. **Start development servers:**
   \`\`\`bash
   # Start both client and server concurrently
   npm run dev
   
   # Or start individually:
   npm run dev:client  # Frontend on http://localhost:3000
   npm run dev:server  # Backend on http://localhost:3001
   \`\`\`

3. **Build for production:**
   \`\`\`bash
   npm run build
   \`\`\`

## Vercel Deployment Guide

### Step 1: Deploy the Server (Backend)

1. **Navigate to server directory:**
   \`\`\`bash
   cd server
   \`\`\`

2. **Deploy to Vercel:**
   \`\`\`bash
   npx vercel --prod
   \`\`\`
   
   Or use Vercel dashboard:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Set **Root Directory** to `server`
   - Deploy

3. **Note your server URL** (e.g., `https://your-server-name.vercel.app`)

### Step 2: Deploy the Client (Frontend)

1. **Update client configuration:**
   
   Edit `client/vercel.json` and replace `your-server-deployment.vercel.app` with your actual server URL:
   \`\`\`json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://YOUR-ACTUAL-SERVER-URL.vercel.app/api/$1"
       }
     ],
     "env": {
       "VITE_API_URL": "https://YOUR-ACTUAL-SERVER-URL.vercel.app"
     }
   }
   \`\`\`

2. **Navigate to client directory:**
   \`\`\`bash
   cd client
   \`\`\`

3. **Deploy to Vercel:**
   \`\`\`bash
   npx vercel --prod
   \`\`\`
   
   Or use Vercel dashboard:
   - Click "New Project" again
   - Import the same repository
   - Set **Root Directory** to `client`
   - Add environment variable: `VITE_API_URL` = `https://your-server-url.vercel.app`
   - Deploy

### Step 3: Update CORS Settings

After both deployments, update the server's CORS configuration:

1. **Edit `server/index.js`:**
   \`\`\`javascript
   app.use(cors({
     origin: [
       "http://localhost:3000",
       "https://your-actual-client-url.vercel.app", // Add your client URL
       /\.vercel\.app$/
     ],
     credentials: true,
   }));
   \`\`\`

2. **Redeploy the server:**
   \`\`\`bash
   cd server
   npx vercel --prod
   \`\`\`

## Environment Variables

### Client (.env.local)
\`\`\`
VITE_API_URL=https://your-server-deployment.vercel.app
\`\`\`

### Server
No additional environment variables required for basic functionality.

## Features

- **Dashboard**: Overview of tasks and Google Sheets
- **Google Sheets Management**: Add, edit, delete, and organize sheets
- **Task Management**: Create and track tasks with status updates
- **File Upload**: Drag-and-drop file upload interface
- **Downloads**: View download history
- **Settings**: User preferences and theme switching
- **Dark/Light Theme**: Toggle between themes
- **Responsive Design**: Works on desktop and mobile

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/sheets` - Get all sheets
- `GET /api/tasks` - Get all tasks
- `POST /api/update-sheets` - Update sheets data
- `POST /api/update-tasks` - Update tasks data
- `GET /api/verify/:type` - Verify data integrity
