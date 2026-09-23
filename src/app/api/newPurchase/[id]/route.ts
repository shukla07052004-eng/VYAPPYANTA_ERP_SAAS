import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbconnect";
import {Purchase} from "@/models/purchaseModel";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid purchase ID",
        },
        { status: 400 }
      );
    }

    const deletedPurchase = await Purchase.findByIdAndDelete(id);

    if (!deletedPurchase) {
      return NextResponse.json(
        {
          success: false,
          message: "Purchase not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Purchase deleted successfully",
        data: deletedPurchase,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/newPurchase/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete purchase",
      },
      { status: 500 }
    );
  }
}