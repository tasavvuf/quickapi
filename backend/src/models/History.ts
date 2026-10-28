import mongoose, { Schema, Document, Types } from 'mongoose';
import type { HttpMethod } from './ApiRequest.js';

export interface IHistory extends Document {
  workspaceId: Types.ObjectId;
  requestId: Types.ObjectId | null;
  method: HttpMethod;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  responseStatus: number;
  responseStatusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
  responseSize: number;
  duration: number;
  createdAt: Date;
}

const historySchema = new Schema<IHistory>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'ApiRequest', default: null },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      required: true,
    },
    url: { type: String, required: true },
    requestHeaders: { type: Schema.Types.Mixed, default: {} },
    requestBody: { type: String, default: null },
    responseStatus: { type: Number, required: true },
    responseStatusText: { type: String, default: '' },
    responseHeaders: { type: Schema.Types.Mixed, default: {} },
    responseBody: { type: String, default: '' },
    responseSize: { type: Number, default: 0 },
    duration: { type: Number, required: true },
  },
  { timestamps: true }
);

historySchema.index({ workspaceId: 1, createdAt: -1 });
historySchema.index({ method: 1 });

export const History = mongoose.model<IHistory>('History', historySchema);
