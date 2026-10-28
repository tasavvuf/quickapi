import mongoose from 'mongoose';
import { config } from './index.js';

/**
 * Sanitize connection URI for safe console logging (masks username:password).
 */
function sanitizeMongoUri(uri: string): string {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:********@');
  } catch {
    return 'mongodb://[protected]';
  }
}

export async function connectDatabase(): Promise<void> {
  const isClusterConfigured = Boolean(
    process.env.MONGODB_URI &&
    (process.env.MONGODB_URI.startsWith('mongodb+srv://') ||
     !process.env.MONGODB_URI.includes('localhost') && !process.env.MONGODB_URI.includes('127.0.0.1'))
  );

  const targetUri = config.mongodbUri;
  const sanitized = sanitizeMongoUri(targetUri);

  // Mongoose connection event listeners for cluster health
  mongoose.connection.on('connected', () => {
    console.log(`[db] Mongoose connected successfully`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[db] Mongoose connection error:`, err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn(`[db] Mongoose disconnected from cluster. Attempting reconnect...`);
  });

  mongoose.connection.on('reconnected', () => {
    console.log(`[db] Mongoose reconnected to cluster`);
  });

  // Attempt connection to the configured cluster or MongoDB instance
  try {
    console.log(`[db] Connecting to MongoDB cluster at ${sanitized}...`);
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      maxPoolSize: 20,
      minPoolSize: 2,
    });
    console.log(`[db] Connected to cluster: ${sanitized}`);
    return;
  } catch (err: any) {
    console.error(`[db] Failed to connect to MongoDB cluster (${sanitized}): ${err?.message || err}`);

    // If an explicit remote cluster URI was specified, fail with actionable guidance
    if (isClusterConfigured) {
      console.error(
        '\n[db] Remote MongoDB cluster connection failed!\n' +
        'Please verify:\n' +
        '  1. Network Access / IP Whitelist: ensure your current IP is allowed in MongoDB Atlas (or 0.0.0.0/0 for dev).\n' +
        '  2. Credentials: check the username and password in MONGODB_URI.\n' +
        '  3. Database User Privileges: verify readWrite permissions for the target database.\n'
      );
      // If user provided cluster URI, do not mask real failure with memory db unless explicitly in dev without URI
      if (process.env.ALLOW_MEMORY_DB_FALLBACK !== 'true') {
        throw new Error(`MongoDB cluster connection failed: ${err?.message || err}`);
      }
    }
  }

  // Fallback for local development if no cluster credentials are provided yet
  console.log('[db] Falling back to embedded development MongoDB instance...');
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create({
      binary: { version: '7.0.14' },
    });
    const localUri = mongod.getUri();
    await mongoose.connect(localUri);
    console.log(`[db] Connected to embedded MongoDB for local testing at ${localUri}`);
  } catch (fallbackErr) {
    console.error('[db] Failed to start embedded fallback MongoDB:', fallbackErr);
    process.exit(1);
  }
}
