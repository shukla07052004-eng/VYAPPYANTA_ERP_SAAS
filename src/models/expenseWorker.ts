import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose";

export interface Expense extends Document {
    Title: string;
    Category: string;
    Amount: number;
    expenseDate: Date;
    Mode:string;
    Note:string;
}

const ExpenseSchema: Schema<Expense> = new Schema(
    {
        Title:{
            type:String,
            required: true,
            trim: true,
            lowercase: true
        },        
        Category:{
            type: String,
            required: true,
            enum:["Electricity", "Salary", "Rent", "Transport", "Internet", "Maintenance", "Miscellaneous"]
        },
        Amount:{
            type:Number,
            required:true
        },
        expenseDate:{
            type:Date,
            required:true
        },
        Mode:{
            type:String,
            required:true,
            enum: ["Cash", "UPI", "Bank", "Check"]
        },
        Note:{
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
