import mongoose from 'mongoose';
import { config } from './index.js';

let mongoUri = config.mongodbUri;

export async function connectDatabase(): Promise<void> {
  // Try external MongoDB first
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[db] Connected to MongoDB at ${mongoUri}`);
    return;
  } catch {
    console.log('[db] External MongoDB unavailable, starting embedded instance...');
  }

  // Fallback: in-memory MongoDB
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create({
      binary: { version: '7.0.14' },
    });
    mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
    console.log(`[db] Connected to embedded MongoDB at ${mongoUri}`);
  } catch (err) {
    console.error('[db] Failed to start embedded MongoDB:', err);
    process.exit(1);
  }
}

