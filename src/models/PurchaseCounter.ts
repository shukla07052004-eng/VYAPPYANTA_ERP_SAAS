import mongoose, { Schema, Document } from "mongoose";

interface IPurchaseCounter extends Document {
  key: string;
  seq: number;
}

const PurchaseCounterSchema = new Schema<IPurchaseCounter>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },

    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PurchaseCounter ||
  mongoose.model<IPurchaseCounter>(
    "PurchaseCounter",
    PurchaseCounterSchema
  );