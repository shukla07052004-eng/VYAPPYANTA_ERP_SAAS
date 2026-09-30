import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/dbconnect";
import { Worker } from "@/models/workerModel"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const deletedWorker = await Worker.findByIdAndDelete(id);

    if (!deletedWorker) {
      return NextResponse.json(
        {
          success: false,
          message: "Worker not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Worker deleted successfully",
      data: deletedWorker,
    });
  } catch (error) {
    console.error("DELETE /api/Worker/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete Worker",
      },
      { status: 500 }
    );
  }
}