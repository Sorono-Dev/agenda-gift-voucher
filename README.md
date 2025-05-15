# Agenda Gift Voucher System

A modern, scalable gift voucher solution with code generation, redemption tracking, and financial operations. This system allows businesses to create, manage, and process gift vouchers with a user-friendly interface.

## Architecture Overview

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | Remix (React + TypeScript) | Server-side rendering, integrated data loading, fast transitions, modern developer experience. |
| **Server** | Fastify + TypeScript | High throughput (~75k req/s), plugins, native schema validation, O(1) overhead, easy horizontal scaling. |
| **ORM** | Prisma | Safe migrations, automatic TypeScript typing, readable queries, multi-database support. |
| **Database** | PostgreSQL 16 (SQLite for demo) | ACID compliance, JSONB support, low cost, production robustness, easy hosting (Railway/Fly.io). |

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) (v1.2.3+)
- [PostgreSQL](https://www.postgresql.org/) (v16 recommended) or SQLite for demo

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/agenda-gift-voucher.git
   cd agenda-gift-voucher
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment variables:
   - Create a `.env` file in the `server` directory with the following content:
     ```
     # For PostgreSQL
     DATABASE_URL="postgresql://username:password@localhost:5432/giftvouchers"
     
     # For SQLite (demo)
     # DATABASE_URL="file:./dev.db"
     ```

4. Initialize the database:
   ```bash
   cd server
   bunx prisma migrate dev
   ```

## Running the Application

### Development Mode

To run both frontend and backend concurrently:
```bash
bun run dev
```

To run backend only:
```bash
bun run server:dev
```

To run frontend only:
```bash
bun run web:dev
```

### Production Mode

Build and start the application for production:
```bash
# In the server directory
bun run build
bun run start

# In the web directory
bun run build
bun run start
```

## Project Structure

```
agenda-gift-voucher/
├── web/                     # Frontend (Remix)
│   ├── app/                 
│   │   ├── routes/          # Frontend routes
│   │   │   ├── _index.tsx   # Home page
│   │   │   ├── checkout.tsx # Checkout page
│   │   │   ├── vouchers/    # Voucher management pages
│   │   │   └── package.json # Frontend dependencies
│   │   └── public/          # Static assets
│   └── package.json         # Root package.json
│
├── server/                  # Backend (Fastify)
│   ├── prisma/              # Database schema and migrations
│   │   └── schema.prisma    # Prisma schema
│   ├── routes/              # API routes
│   │   ├── vouchers.ts      # Voucher API endpoints
│   │   └── sales.ts         # Sales API endpoints
│   │   └── package.json     # Backend dependencies
│   ├── services/            # Business logic services
│   ├── lib/                 # Utility functions
│   └── package.json         # Backend dependencies
│
├── docker-compose.yml       # Docker configuration
└── package.json             # Root package.json
```

## Core Logic

### Voucher Code Generation
- 8-character Base32 codes for human readability
- Collision verification before saving
- SVG inline QR code generation for easy printing

### Transaction Management
- Uses Prisma's `$transaction()` to ensure atomicity during redemption operations
- Double-entry operations (creation, redemption) for financial consistency
- Audit logging for all voucher transactions

### Caching
- Voucher lookup → Redis with 1-hour TTL (optional for production)
- Improves response times for frequently accessed vouchers

### Security
- Hashed codes stored in database
- Separate user roles for voucher creation and redemption
- Comprehensive audit logging

### Scalability
- Fastify cluster mode utilizing multiple threads
- PostgreSQL connection pool (20 connections)
- Containerized deployment (Fly.io, AWS Fargate, or GCP Cloud Run)

## Features

- **Voucher Management**: Create, view, and monitor vouchers
- **Multiple Voucher Types**: Support for amount-based, session-based, and percentage-based vouchers
- **Redemption Tracking**: Track all redemption activities with timestamps
- **Sales Integration**: Process sales with voucher redemption
- **Expiration Handling**: Automatic handling of voucher expiration

## Development

This project uses:
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Prisma for database access
- Remix for frontend routing and data loading

## Deployment

The application is designed to be deployed as containers, with recommended platforms:
- Fly.io
- AWS Fargate
- Google Cloud Run

Database hosting options:
- Railway (PostgreSQL)
- Fly.io Postgres
- AWS RDS
- Self-hosted PostgreSQL

## License

[MIT](LICENSE)
