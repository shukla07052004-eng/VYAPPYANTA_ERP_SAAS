import mongoose, { Schema, Document } from "mongoose";

interface ISupplier {
    Party: string;
    phone?: string;
    city?: string;
    gstin?: string;
    contactPerson?: string;
    billingAddress?: string;
}

interface IItem {
    desc: string;
    hsn?: string;
    qty: number;
    rate: number;
    discountPct: number;
    taxPct: number;
    taxLabel: string;
    baseAmount: number;
    taxAmount: number;
    amount: number;
}

interface ITaxBreakdown {
    rate: number;
    taxable: number;
}

export interface Purchase extends Document {
    billNo: string;
    customer: ISupplier;
    date: Date;
    dueDate: Date;
    purchaseType: string;
    items: IItem[];
    subtotal: number;
    tax: number;
    taxBreakdown: ITaxBreakdown[];
    amount: number;
    paid: number;
    mode: string;
    status: string;
    notes?: string;
}

const SupplierSchema = new Schema<ISupplier>(
    {
        Party: {
            type: mongoose.Types.ObjectId,
            required: true,
        },

        phone: {
            type: String,
        },

        city: {
            type: String,
        },

        gstin: {
            type: String,
        },

        contactPerson: {
            type: String,
        },

        billingAddress: {
            type: String,
        },
    },
    { _id: false }
);

const ItemSchema = new Schema<IItem>(
    {
        desc: {
            type: String,
            required: true,
        },

        hsn: {
            type: String,
        },

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
            required: true,
        },

        taxPct: {
            type: Number,
            required: true,
        },

        taxLabel: {
            type: String,
            required: true,
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
    { _id: false }
);

const TaxBreakdownSchema = new Schema<ITaxBreakdown>(
    {
        rate: {
            type: Number,
            required: true,
        },

        taxable: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const PurchaseSchema = new Schema<Purchase>(
    {
        billNo: {
            type: String,
            required: true,
            unique: true,
        },

        customer: {
            type: SupplierSchema,
            required: true,
        },

        date: {
            type: Date,
            required: true,
        },

        dueDate: {
            type: Date,
            required: true,
        },

        purchaseType: {
            type: String,
            enum: ["Purchase Bill", "Debit Note"],
            required: true,
        },

        items: {
            type: [ItemSchema],
            required: true,
            validate: {
                validator: (items: IItem[]) => items.length > 0,
                message: "At least one purchase item is required",
            },
        },

        subtotal: {
            type: Number,
            required: true,
        },

        tax: {
            type: Number,
            required: true,
        },

        taxBreakdown: {
            type: [TaxBreakdownSchema],
            default: [],
        },

        amount: {
            type: Number,
            required: true,
        },

        paid: {
            type: Number,
            default: 0,
        },

        mode: {
            type: String,
            enum: ["Credit", "Cash", "Bank", "UPI", "Against GRN"],
            default: "Credit",
        },

        status: {
            type: String,
            enum: ["Unpaid", "Partial", "Paid"],
            default: "Unpaid",
        },

        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const Purchase =
    mongoose.models.Purchase ||
    mongoose.model<Purchase>("Purchase", PurchaseSchema);