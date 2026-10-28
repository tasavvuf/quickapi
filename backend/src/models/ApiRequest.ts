import mongoose, { Schema, Document, Types } from 'mongoose';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

export interface IKeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export interface IAuth {
  type: AuthType;
  bearer?: { token: string };
  basic?: { username: string; password: string };
  apikey?: { key: string; value: string; addTo: 'header' | 'query' };
}

export interface IBody {
  mode: 'none' | 'json' | 'urlencoded' | 'text';
  raw?: string;
  urlencoded?: IKeyValue[];
}

export interface IApiRequest extends Document {
  name: string;
  description: string;
  method: HttpMethod;
  url: string;
  headers: IKeyValue[];
  queryParams: IKeyValue[];
  auth: IAuth;
  body: IBody;
  collectionId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const keyValueSchema = new Schema<IKeyValue>(
  {
    key: { type: String, required: true },
    value: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const apiRequestSchema = new Schema<IApiRequest>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      default: 'GET',
    },
    url: { type: String, required: true },
    headers: [keyValueSchema],
    queryParams: [keyValueSchema],
    auth: {
      type: {
        type: String,
        enum: ['none', 'bearer', 'basic', 'apikey'],
        default: 'none',
      },
      bearer: { token: { type: String } },
      basic: { username: { type: String }, password: { type: String } },
      apikey: {
        key: { type: String },
        value: { type: String },
        addTo: { type: String, enum: ['header', 'query'], default: 'header' },
      },
    },
    body: {
      mode: { type: String, enum: ['none', 'json', 'urlencoded', 'text'], default: 'none' },
      raw: { type: String },
      urlencoded: [keyValueSchema],
    },
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

apiRequestSchema.index({ collectionId: 1 });
apiRequestSchema.index({ workspaceId: 1 });

export const ApiRequest = mongoose.model<IApiRequest>('ApiRequest', apiRequestSchema);

