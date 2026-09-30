import mongoose, { Schema, Document } from "mongoose";
import { INDIAN_BANKS } from "@/utils/banks"

const ACCOUNT_TYPES = [
  "Savings Account",
  "Current Account",
  "Fixed Deposit",
  "Recurring Deposit",
  "NRI Account",
  "Demat Account",
  "Other",
] as const;


export interface Bank extends Document {
  bankName: string;
  accountHolder: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  accountType: string;
  openingBalance: number;
  currentBalance: number;
}

const BankSchema: Schema<Bank> = new Schema(
  {
    bankName: {
      type: String,
      required: true,
      trim: true,
      enum: INDIAN_BANKS,
    },

    accountHolder: {
      type: String,
      required: true,
      trim: true,
    },

    accountNo: {
      type: String,
      required: true,
      trim: true,
    },

    ifsc: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    },

    branch: {
      type: String,
      required: true,
      trim: true,
    },

    accountType: {
      type: String,
      required: true,
      trim: true,
      enum: ACCOUNT_TYPES,
    },

    openingBalance: {
      type: Number,
      required: true,
      default: 0,
    },

    currentBalance: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Bank =
  mongoose.models.Bank ||
  mongoose.model<Bank>("Bank", BankSchema);