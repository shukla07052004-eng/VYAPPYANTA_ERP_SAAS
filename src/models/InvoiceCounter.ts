import mongoose, { Schema, Document } from "mongoose";

interface IInvoiceCounter extends Document {
  key: string;
  seq: number;
}

const InvoiceCounterSchema = new Schema<IInvoiceCounter>(
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

export default mongoose.models.InvoiceCounter ||
  mongoose.model<IInvoiceCounter>(
    "InvoiceCounter",
    InvoiceCounterSchema
  );