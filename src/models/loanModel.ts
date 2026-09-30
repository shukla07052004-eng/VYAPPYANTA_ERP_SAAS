import mongoose, { Schema, Document } from "mongoose";

export interface Loan extends Document {
    name: string;
    institution: string;
    interestRate: number;
    emiAmount: number;
    dueDate:Date;
    remainingBalance:number;
    reminder:string;
}

const LoanSchema: Schema<Loan> = new Schema(
    {
        name:{
            type:String,
            required: true,
            trim: true,
            lowercase: true
        },        
        institution:{
            type: String,
            required: true
        },
        interestRate:{
            type:Number,
            required:true
        },
        emiAmount:{
            type:Number,
            required:true
        },
        dueDate:{
            type:Date,
            required:true
        },
        remainingBalance:{
            type:Number,
            required:true
        },
        reminder:{
            type:String,
            required:true
        },
    },
    {
        timestamps: true
    }
);


export const Loan =
    mongoose.models.Loan || mongoose.model<Loan>("Loan", LoanSchema);
