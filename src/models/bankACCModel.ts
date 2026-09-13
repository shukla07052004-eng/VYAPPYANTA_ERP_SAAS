import mongoose, { Schema, Document } from "mongoose";

export interface Bank extends Document {
    bankName: string;
    accHolder: string;
    accNumber: number;
    IFSC: number;
    Branch:string;
    currentBal:Number;
}

const BankSchema: Schema<Bank> = new Schema(
    {
        bankName:{
            type:String,
            required: true,
            trim: true,
            lowercase: true
        },        
        accHolder:{
            type: String,
            required: true,
            trim: true,
            lowercase:true
        },
        accNumber:{
            type:Number,
            required:true
        },
        IFSC:{
            type:Number,
            required:true
        },
        Branch:{
            type:String,
            required:true
        },
        currentBal:{
            type:String,
            required: true
        }
    },
    {
        timestamps: true
    }
);


export const Bank =
    mongoose.models.Bank || mongoose.model<Bank>("Bank", BankSchema);
