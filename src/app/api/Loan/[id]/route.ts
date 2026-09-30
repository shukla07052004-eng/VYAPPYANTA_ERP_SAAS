import connectDB from "@/lib/dbconnect";
import { NextRequest, NextResponse } from "next/server";
import { Loan } from "@/models/loanModel";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan ID is required",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Don't allow _id/id to be changed through PATCH
    const { _id, id: bodyId, ...updateData } = body;

    const updatedLoan = await Loan.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedLoan) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Loan updated successfully",
        data: updatedLoan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/Loan/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update loan",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;

        const deletedLoan = await Loan.findByIdAndDelete(id);

        if (!deletedLoan) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Loan not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Loan deleted successfully",
            data: deletedLoan,
        });
    } catch (error) {
        console.error("DELETE /api/Loan/[id] error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to delete Loan",
            },
            { status: 500 }
        );
    }
}