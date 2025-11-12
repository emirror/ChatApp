import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  message: string;
  from: Types.ObjectId;
  to: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ to: 1, from: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);




