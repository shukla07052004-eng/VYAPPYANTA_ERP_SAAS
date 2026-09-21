import mongoose, { Schema, Document } from "mongoose";

export interface Item extends Document {
    name: string;
    batchNo: string;
    category: string;
    mfgDate: Date;
    expiryDate: Date;
    Barcode: string;
    expiryAlert: boolean;
    purchasePrice: number;
    salesPrice: number;
    mrp: number;
    stockQty: number;
    discount: number;
    notesTag: string;
    gst: Array<number>;
    notes: string;
}

const ItemSchema: Schema<Item> = new Schema(
    {
        name: {
            type: String,
            required: true,
            lowercase: true
        },
        batchNo: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            required: true,
            enum: [
                "Tablet",
                "Capsule",
                "Softgel",
                "Syrup",
                "Infusion",
                "infusion",
                "Injection",
                "Other Goods",
                "OtherGoods",
            ]
        },
        mfgDate: {
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
        mrp: {
            type: Number,
            required: true,
        },
        stockQty: {
            type: Number,
            required: true,
        },
        discount: {
            type: Number,
        },
        gst: {
            type: [Number],
            enums: [0, 5, 12, 18, 28],
            required: true
        },
        notesTag: {
            type: String,
        },
        notes: {
            type: String,
        },


    },
    {
        timestamps: true
    }
);


export const Item =
    mongoose.models.Item || mongoose.model<Item>("Item", ItemSchema);
