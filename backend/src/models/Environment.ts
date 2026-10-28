import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEnvironmentVariable {
  key: string;
  value: string;
  isSecret: boolean;
  enabled: boolean;
}

export interface IEnvironment extends Document {
  name: string;
  workspaceId: Types.ObjectId;
  variables: IEnvironmentVariable[];
  createdAt: Date;
  updatedAt: Date;
}

const environmentSchema = new Schema<IEnvironment>(
  {
    name: { type: String, required: true, trim: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    variables: [
      {
        key: { type: String, required: true },
        value: { type: String, default: '' },
        isSecret: { type: Boolean, default: false },
        enabled: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

environmentSchema.index({ workspaceId: 1 });

export const Environment = mongoose.model<IEnvironment>('Environment', environmentSchema);
