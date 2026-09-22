import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose";

interface IAddress {
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
interface IBank {
    bankName: string;
    ifsc: string;
    accountNo: string;
}
interface IRemarks {
    notes: string;
    openingBalance: number;
    carrierInfo: string;
    supplierDetails: string;
}
interface ILocation {
    latitude: number,
    longitude: number
}
export interface Party extends Document {
    sr: number;
    partyType: string;
    accountGroup: string;
    companyName: string;
    partyCode: string;
    gstin: string;
    taxID: string;
    primaryContactName: string;
    primaryContactRole: string;
    phone: string;
    email: string;
    address: IAddress;
    paymentTerm: string;
    creditLimit: number;
    currency: string;
    discountStructure: string;
    bank: IBank;
    partnerRoles: Array<string>;
    shippingMethods: Array<string>;
    status: string;
    remarks: IRemarks;
    location: ILocation;
    balance:number;
    drCr: string;

}

const PartySchema = new Schema(
  {
    sr:{
      type:String,
      required: true
    },
    partyType: {
      type: String,
      required: true,
      enum: [
        "Customer",
        "Supplier",
        "Distributor",
        "Carrier",
        "Agent"
      ]
    },

    accountGroup: {
      type: String,
      required: true,
      enum: [
        "Sundry Debtors",
        "Sundry Creditors",
        "Distributors",
        "Transporters",
        "Commission Agents"
      ]
    },

    companyName: {
      type: String,
      required: true,
      trim: true
    },

    partyCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    gstin:{
      type: String,
      required:true,
      trim:true,
    },

    taxID: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    primaryContactName: {
      type: String,
      required: true
    },

    primaryContactRole: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    address: {
      addressLine1: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      postalCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      }
    },

    paymentTerm: {
      type: String,
      enum: [
        "Net 7",
        "Net 15",
        "Net 30",
        "Net 45",
        "COD",
        "Advance"
      ]
    },

    creditLimit: {
      type: Number
    },

    currency: {
      type: String,
      required: true,
      enum: ["INR", "USD", "EUR", "AED"]
    },

    discountStructure: {
      type: String
    },

    bank: {
      bankName: String,
      ifsc: String,
      accountNo: String
    },

    partnerRoles: {
      type: [String],
      enum: [
        "Sold-To",
        "Ship-To",
        "Bill-To",
        "Payer"
      ]
    },

    shippingMethods: {
      type: [String],
      enum: [
        "Road",
        "Air",
        "Rail",
        "Courier",
        "Local Delivery",
        "Pickup"
      ]
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Blocked",
        "Archived"
      ]
    },

    remarks: {
      notes: String,
      openingBalance: Number,
      carrierInfo: String,
      supplierDetails: String
    },

    location: {
      latitude: Number,
      longitude: Number
    },
    balance:{
      type: Number,
    },
    drCr: {
      type:String
    }
  },
  {
    timestamps: true
  }
)

export const Party =
    mongoose.models.Party || mongoose.model<Party>("Party", PartySchema);
