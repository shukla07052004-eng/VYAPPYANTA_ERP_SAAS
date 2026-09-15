import mongoose, { Schema, Document } from "mongoose";

export interface Target extends Document {
    title: string;
    targetValue: number;
    currentValue: number;
    deadline: Date;
    priority: string;
    completed: string;
    notes: string;
}

const TargetSchema: Schema<Target> = new Schema(
    {
        title: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        targetValue: {
            type: Number,
            required: true,
        },
        currentValue: {
            type: Number,
            required: true,
        },
        deadline: {
            type: Date,
            required: true
        },
        priority: {
            type: String,
            enum: ["High", "Medium",     "Low"],
            required: true
        },
        completed: {
            type: String,
            required: true,
            enum:['Open', 'Completed']
        },
        notes: {
            type: String,
        }

    },
    {
        timestamps: true
    }
);


export const Target =
    mongoose.models.Target || mongoose.model<Target>("Target", TargetSchema);
