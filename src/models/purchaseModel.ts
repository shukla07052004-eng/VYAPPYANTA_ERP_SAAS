import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose";

export interface Purchase extends Document {
    PurchaseIds: string[];
    Patry: Types.ObjectId;
    invDate: Date;
    dueDate: Date;
    invType:Array<string>;
    itemName: Types.ObjectId;
    HSN:string;
    Quantity:number;
    Rate:number;
    Disc:number;
    GST:Array<number>;
    amount:number;
    paymentTerms:Array<string>;
}

const PurchaseSchema: Schema<Purchase> = new Schema(
    {
        PurchaseIds:[
            {
                type:String
            }
        ],
        Patry:{
            type: Schema.Types.ObjectId,
            ref: "Party",
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
           enum:["Retail Invoice", "Tax Invoice", "PerformaInvoice"]
        },
        itemName:{
           type: Schema.Types.ObjectId,
           ref:"Item"
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
            enums:[0, 5, 12, 18, 28],
            required: true
        },
        amount:{
            type:Number,
            required:true
        },
        paymentTerms:{
            enum:["CREDIT", "CASH", "BANK", "UPI", "AGAINST GNR"]
        }

    },
    {
        timestamps: true
    }
);


export const Purchase =
    mongoose.models.Purchase || mongoose.model<Purchase>("Purchase", PurchaseSchema);
