# DevPulse Issue Tracker API

A RESTful API for tracking issues with role-based access control.

## Tech Stack

- **Runtime:** Node.js + Express
- **Language:** TypeScript (ES Modules)
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt

## Project Structure

```
src/
├── config/          # Configuration (DB, environment)
├── db/              # Database connection pool
├── middleware/      # Auth & error handling middleware
├── modules/
│   ├── auth/        # Authentication (signup, login)
│   └── issue/       # Issue CRUD operations
├── types/           # Global type definitions
├── utility/         # Shared utilities
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Issues

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/issues` | Public | List all issues |
| GET | `/api/issues/:id` | Public | Get single issue |
| POST | `/api/issues` | Contributor, Maintainer | Create new issue |
| PATCH | `/api/issues/:id` | Contributor (own + open), Maintainer (any) | Update issue |
| DELETE | `/api/issues/:id` | Maintainer only | Delete issue |

## Roles

| Role | Permissions |
|------|-------------|
| `contributor` | Create issues, update own issues (status must be `open`) |
| `maintainer` | Create/update/delete any issue |

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

3. **Run the server:**
   ```bash
   npm run dev
   ```

## API Documentation

### Signup
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "contributor"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Create Issue (Authenticated)
```bash
POST /api/issues
Authorization: <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Database pool exhaustion",
  "description": "Fix needed for connection pooling",
  "type": "bug"
}
```

### Get All Issues
```bash
GET /api/issues?sort=newest&type=bug&status=open
```

### Update Issue (Authenticated)
```bash
PATCH /api/issues/:id
Authorization: <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description"
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `NODE_ENV` | `development` or `production` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run server with hot reload (tsx watch) |
| `npm run build` | Build TypeScript |
| `npm start` | Run production build |
