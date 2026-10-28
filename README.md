# QuickAPI

Lightweight API testing dashboard and auto-documentation tool.  
Built with the MEAN stack (MongoDB, Express, Angular, Node.js).

## Features

- HTTP client with server-side proxy (bypass CORS, high-res timings)
- Environment variables with {{interpolation}}
- Collections and folders to organize endpoints
- Request history with search and replay
- Auto-generated API documentation (OpenAPI 3.0, Markdown, cURL)
- Performance benchmarking (min, max, mean, p95, throughput)
- Team collaboration with comments on endpoints

## Quick Start

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm start
```

## Requirements

- Node.js 20+
- MongoDB (or uses embedded in-memory MongoDB automatically)
