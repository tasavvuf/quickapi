import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICollection extends Document {
  name: string;
  description: string;
  workspaceId: Types.ObjectId;
  parentId: Types.ObjectId | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Collection', default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

collectionSchema.index({ workspaceId: 1 });
collectionSchema.index({ parentId: 1 });

export const Collection = mongoose.model<ICollection>('Collection', collectionSchema);
