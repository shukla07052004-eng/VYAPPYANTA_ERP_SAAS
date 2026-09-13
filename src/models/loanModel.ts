import mongoose, { Schema, Document } from "mongoose";

export interface Loan extends Document {
    loanName: string;
    Bank: string;
    intrestRate: number;
    EmiAmount: number;
    DueDate:Date;
    RemainingBal:number;
    Reminder:string;
}

const LoanSchema: Schema<Loan> = new Schema(
    {
        loanName:{
            type:String,
            required: true,
            trim: true,
            lowercase: true
        },        
        Bank:{
            type: String,
            required: true
        },
        intrestRate:{
            type:Number,
            required:true
        },
        EmiAmount:{
            type:Number,
            required:true
        },
        DueDate:{
            type:Date,
            required:true
        },
        RemainingBal:{
            type:Number,
            required:true
        },
        Reminder:{
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
