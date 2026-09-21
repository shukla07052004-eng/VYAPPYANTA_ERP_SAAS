import mongoose, { Schema, Document } from "mongoose";

interface IPartySnapshot {
  name: string;
  gstin?: string;
  phone?: string;
  contactPerson?: string;
  billingAddress?: string;
  city?: string;
}

interface IInvoiceItem {
  itemId: mongoose.Types.ObjectId;

  desc: string;
  hsn?: string;

  qty: number;
  rate: number;
  discountPct: number;
  taxPct: number;

  baseAmount: number;
  taxAmount: number;
  amount: number;
}

interface ITransport {
  vehicleNo?: string;
  dispatchFrom?: string;
  dispatchThrough?: string;
}

export interface Invoice extends Document {
  invoiceNumber: string;

  invoiceType: string;

  partyId: mongoose.Types.ObjectId;
  partySnapshot: IPartySnapshot;

  date: Date;
  dueDate: Date;

  items: IInvoiceItem[];

  subtotal: number;
  tax: number;
  total: number;

  transport: ITransport;

  notes?: string;
  paid: number;
  status: string;

  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<Invoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    invoiceType: {
      type: String,
      enum: [
        "Tax Invoice",
        "Retail Invoice",
        "Proforma Invoice",
      ],
      required: true,
    },

    partyId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    partySnapshot: {
      name: { type: String, required: true },
      gstin: String,
      phone: String,
      contactPerson: String,
      billingAddress: String,
      city: String,
    },

    date: {
      type: Date,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    items: [
      {
        // we are going to make it as type: Schema.Types.ObjectId,when item schema is ready
        itemId: {
          type: String,
          required: true,
        },

        desc: {
          type: String,
          required: true,
        },

        hsn: String,

        qty: {
          type: Number,
          required: true,
        },

        rate: {
          type: Number,
          required: true,
        },

        discountPct: {
          type: Number,
          default: 0,
        },

        taxPct: {
          type: Number,
          default: 0,
        },

        baseAmount: {
          type: Number,
          required: true,
        },

        taxAmount: {
          type: Number,
          required: true,
        },

        amount: {
          type: Number,
          required: true,
        },
      },
    ],

    subtotal: {
      type: Number,
      required: true,
    },

    tax: {
      type: Number,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },

    transport: {
      vehicleNo: String,
      dispatchFrom: String,
      dispatchThrough: String,
    },

    notes: String,

    paid: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Partial", "Paid"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Invoice ||
  mongoose.model<Invoice>("Invoice", InvoiceSchema);