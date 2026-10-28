# QuickAPI

Lightweight API testing dashboard and auto-documentation tool.  
Built with the **MEAN stack** (MongoDB Cluster, Express, Angular, Node.js).

## Highlights

- **Ultra-Minimal, Spacious Interface**: No emojis, no glowing effects, no neon distractions. Disciplined high-contrast monochrome design.
- **Server-Side Proxy Dispatcher**: High-resolution timings (`process.hrtime.bigint()`), zero CORS issues, headers, params, and body modes.
- **Environment Variables**: Dynamic `{{variable_name}}` token interpolation across URLs, query strings, headers, and request bodies with secret masking.
- **Auto-Documentation Generator**: 1-click export of collections to **OpenAPI 3.0** (JSON/YAML) and **Markdown** with cURL examples.
- **Performance Benchmarks**: Configurable multi-run benchmark suite computing min, mean, median (P50), P95, max latency, and throughput (req/s).
- **Collaboration**: Workspace collections and threaded comments on endpoints.

---

## MongoDB Cluster Setup

QuickAPI is designed to connect to your remote **MongoDB Cluster** (MongoDB Atlas or standalone replica set).

1. Copy `.env.example` in `backend/`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Paste your cluster connection string into `backend/.env`:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.your-cluster.mongodb.net/quickapi?retryWrites=true&w=majority
   ```
   > **Note**: Make sure your current IP address is added to the IP Access List in the MongoDB Atlas Network Access panel.

---

## Running the Application

### 1. Backend (Express + Mongoose + Proxy)
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (Angular 19 Standalone)
```bash
cd frontend
npm install
npm start
```

Visit **http://localhost:4200** in your browser. The Angular dev server proxies `/api` calls directly to the backend at port 3000.

---

## Running Automated Tests

```bash
cd backend
npm test
```
Runs the Vitest test suites verifying token interpolation, latency statistics calculation, and cURL generation.
