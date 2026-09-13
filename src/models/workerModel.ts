import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose";

export interface Worker extends Document {
    fullName: string;
    Role: string;
    Phone: number;
    Salary: number;
    joinDate:Date;
}

const WorkerSchema: Schema<Worker> = new Schema(
    {
        fullName:{
            type:String,
            required: true,
            trim: true,
            lowercase: true
        },        
        Role:{
            type: String,
            required: true
        },
        Phone:{
            type:Number,
            required:true
        },
        Salary:{
            type:Number,
            required:true
        },
        joinDate:{
            type:Date,
            required:true
        },
        
        

    },
    {
        timestamps: true
    }
);


export const Worker =
    mongoose.models.Worker || mongoose.model<Worker>("Worker", WorkerSchema);
