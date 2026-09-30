import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/dbconnect";
import { Expense } from "@/models/expenseWorker"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
      data: deletedExpense,
    });
  } catch (error) {
    console.error("DELETE /api/Expense/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete Expense",
      },
      { status: 500 }
    );
  }
}