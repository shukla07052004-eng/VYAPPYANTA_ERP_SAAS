import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose";

export interface Expense extends Document {
    title: string;
    category: string;
    amount: number;
    date: Date;
    mode:string;
    notes:string;
}

const ExpenseSchema: Schema<Expense> = new Schema(
    {
        title:{
            type:String,
            required: true,
            trim: true,
            lowercase: true
        },        
        category:{
            type: String,
            required: true,
            enum:["Electricity", "Salary", "Rent", "Transport", "Internet", "Maintenance", "Miscellaneous"]
        },
        amount:{
            type:Number,
            required:true
        },
        date:{
            type:Date,
            required:true
        },
        mode:{
            type:String,
            required:true,
            enum: ["Cash", "UPI", "Bank", "Check"]
        },
        notes:{
            type:String,
            required:true
        }
    },
    {
        timestamps: true
    }
);


export const Expense =
    mongoose.models.Expense || mongoose.model<Expense>("Expense", ExpenseSchema);
