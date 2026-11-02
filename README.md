# Driving License Exam System (DLES)

A full-stack web app for candidates to register, take a driving theory exam, and view exam results. The application includes a React frontend and an Express backend with optional MySQL support and a demo mode that works without a database.

## Features

- Candidate registration and login
- Theory exam with multiple-choice questions
- Automatic scoring and pass/fail result
- Result history for candidates
- Admin dashboard summary and stats
- Demo credentials for quick testing

## Quick start

1. Install dependencies:
   npm install
2. Start the app in development mode:
   npm run dev
3. Open the frontend at http://localhost:5173
4. The backend API runs at http://localhost:5000

## Demo accounts

Candidate:
- Email: candidate@dles.com
- Password: Candidate@123

Admin:
- Email: admin@dles.com
- Password: Admin@123

## MySQL setup

Copy `server/.env.example` to `server/.env` and configure your MySQL connection settings. If the database is not configured, the app automatically runs in demo mode using in-memory data.

## Project structure

- `client/` - React frontend
- `server/` - Express API
- `server/schema.sql` - MySQL table definitions
