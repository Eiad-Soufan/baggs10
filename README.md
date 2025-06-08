# API Documentation

This directory contains the backend API server for the Transfer Service Management Platform.

## Directory Structure

```
api/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── tests/              # API tests
└── package.json        # Dependencies and scripts
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with required environment variables:
```
PORT=9091
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=1d
JWT_COOKIE_EXPIRE=1
MONGODB_URI=mongodb URL
```

3. Start development server:
```bash
npm run dev
```

## API Documentation

Access the Swagger documentation at `http://localhost:9091/api-docs` when the server is running.

## Testing

Run tests with:
```bash
npm test
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run linter 
