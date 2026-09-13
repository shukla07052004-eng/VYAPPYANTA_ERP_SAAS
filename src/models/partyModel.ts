import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose";

interface IAddress {
    house: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
}
interface IBank {
    bankName: string;
    IFSC: string;
    accountNumber: string;
}
interface IRemarks {
    internalRemaks: string;
    openingBalance: number;
    currierNote: string;
    supplierNote: string;
}
export interface Party extends Document {
    partyType: Array<string>;
    accountGroup: Array<string>;
    partyName: string;
    partyCode: number;
    GSTIN: string;
    Contact: number;
    Email: string;
    address: IAddress;
    paymentTerm: Array<string>;
    creditLimit: number;
    billingCurrency: Array<string>;
    discount: number;
    bank: IBank;
    partnerRole: Array<string>;
    shippingMethod: Array<string>;
    recordStatus: Array<string>;
    remarks: IRemarks;

}

const PartySchema: Schema<Party> = new Schema(
    {
        partyType: {
            type: [String],
            required: true,
            enum: ["Customer", "Supplier", "Distributer", "Carrier", "Agent"]
        },
        accountGroup: {
            type: [String],
            enum: ["Sundry Debtor", "Sundry Creditor", "Distributors", "Transporters", "Commission Agent"],
            required: true,
        },
        partyName: {
            type: String,
            required: true
        },
        partyCode: {
            type: Number,
            required: true
        },
        GSTIN: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        Contact: {
            type: Number,
            required: true
        },
        Email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        address: {

            house: {
                type: String,

            },
            street: {
                type: String,

            },
            city: {
                type: String,
                required: true

            },
            state: {
                type: String,
                required: true

            },
            pincode: {
                type: String,
                required: true

            },
            country: {
                type: String,
                required: true

            },

        },
        paymentTerm: {
            type:[String],
            enum: ["Net7", "Net15", "Net30", "Net45", "COD", "Advance"]
        },
        creditLimit: {
            type: Number,
            trim: true
        },
        billingCurrency: {
            type: [String],
            enum: ["INR", "USD", "EUR", "AED"],
            required: true
        },
        discount: {
            type: Number
        },
        bank: {
            bankName: {
                type: String,
                // required: true
            },
            IFSC: {
                type: String,
                // required: true
            },
            accountNumber: {
                type: String,
                // required: true
            },
        },
        partnerRole: {
            type:[String],
            enum: ["Sold-TO", "Ship-TO", "Bill-TO"]
        },
        shippingMethod: {
            type:[String],
            enum: ["Road", "Air", "Rail", "Courier", "Local-Delivery", "Pick-Up"]
        },
        recordStatus: {
            type:[String],
            enum: ['Active', 'Blocked', 'Archived']
        },
        remarks: {
            internalRemaks: {
                type: String,
                // required: true
            },
            openingBalance: {
                type: Number,
                // required: true
            },
            currierNote: {
                type: String,
                // required: true
            },
            supplierNote: {
                type: String,
                // required: true
            },
        }
    },
    {
        timestamps: true
    }
);


export const Party =
    mongoose.models.Party || mongoose.model<Party>("Party", PartySchema);
