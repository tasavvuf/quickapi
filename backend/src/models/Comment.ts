import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment extends Document {
  requestId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  author: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'ApiRequest', required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    author: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

commentSchema.index({ requestId: 1, createdAt: -1 });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
