import mongoose, { Schema, Document } from "mongoose";

export interface Item extends Document {
    itemName: string;
    batchNumber: string;
    productType: string;
    manufacturingDate: Date;
    expiryDate: Date;
    Barcode: string;
    expiryAlert: boolean;
    purchasePrice: number;
    salesPrice: number;
    MRP: number;
    stockQty: number;
    Discount: number;
    storageNoteTag: string;
    GST: Array<number>;
    Notes: string;
}

const ItemSchema: Schema<Item> = new Schema(
    {
        itemName: {
            type: String,
            required: true,
            lowercase: true
        },
        batchNumber: {
            type: String,
            required: true,
            trim: true
        },
        productType: {
            type: String,
            required: true,
            enum: [
                "Tablet",
                "Capsule",
                "Softgel",
                "Syrup",
                "infusion",
                "Injection",
                "OtherGoods"
            ]
        },
        manufacturingDate: {
            type: Date,
            required: true
        },
        expiryDate: {
            type: Date,
            required: true
        },
        Barcode:{
            type: String
        },
        expiryAlert:{
            type:Boolean,
            required:true,
            default: true
        },

        purchasePrice: {
            type: Number,
            required: true
        },
        salesPrice: {
            type: Number,
            trim: true
        },
        MRP: {
            type: Number,
            required: true,
        },
        stockQty: {
            type: Number,
            required: true,
        },
        Discount: {
            type: Number,
        },
        GST: {
            type: [Number],
            enums: [0, 5, 12, 18, 28],
            required: true
        },
        storageNoteTag: {
            type: String,
        },
        Notes: {
            type: String,
        },


    },
    {
        timestamps: true
    }
);


export const Item =
    mongoose.models.Item || mongoose.model<Item>("Item", ItemSchema);
