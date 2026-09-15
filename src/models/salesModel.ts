import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose";

export interface Sales extends Document {
    invoiceNumber: string[];
    Patry: Types.ObjectId;
    invDate: Date;
    dueDate: Date;
    invType:string;
    itemName: Types.ObjectId;
    HSN:string;
    Quantity:number;
    Rate:number;
    Disc:number;
    GST:number;
    amount:number;
    paymentTerms:string;
}

const SalesSchema: Schema<Sales> = new Schema(
    {
        invoiceNumber:[
            {
                type:String
            }
        ],
        Patry:{
            type: Schema.Types.ObjectId,
            ref: "Party",
            required:true   
        },
        invDate:{
            type:Date,
            required:true
        },
        dueDate:{
            type:Date,
            required:true
        },
        invType:{
            type:String,
           enum:["Retail Invoice", "Tax Invoice", "PerformaInvoice"]
        },
        itemName:{
           type: Schema.Types.ObjectId,
           ref:"Item",
           required:true,
        },
        HSN:{
            type:String,
            trim:true
        },
        Quantity:{
            type:Number,
            required:true,
        },
        Rate:{
            type:Number,
            required:true,
        },
        Disc:{
            type:Number,
        },
        GST:{
            type:Number,
            enums:[0, 5, 12, 18, 28],
            required: true
        },
        amount:{
            type:Number,
            required:true
        },
        paymentTerms:{
            type:String,
            enum:["CREDIT", "CASH", "BANK", "UPI", "AGAINST GNR"]
        }

    },
    {
        timestamps: true
    }
);


export const Sales =
    mongoose.models.Sales || mongoose.model<Sales>("Sales", SalesSchema);
