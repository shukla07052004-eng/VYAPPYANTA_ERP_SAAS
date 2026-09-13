import mongoose, { Schema, Document } from "mongoose";

export interface Target extends Document {
    targetName: string;
    targetValue: number;
    currentProgress: number;
    deadline: Date;
    priority:Array<string>;
    status: Array<string>;
    notes:string;
}

const TargetSchema: Schema<Target> = new Schema(
    {
        targetName: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        targetValue:{
            type:Number,
            required: true,
            trim:true
        },
        currentProgress:{
            type:Number,
            required: true,
            trim:true
        },
        deadline:{
            type:Date,
            required:true
        },
        priority:{
            enum:["High","Medium","Low"],
            required:true
        },
        status:{
            enum:["open","completed"],
            required:true
        },
        notes:{
            type:String
        }

    },
    {
        timestamps: true
    }
);


export const Target =
    mongoose.models.Target || mongoose.model<Target>("Target", TargetSchema);
