import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/dbconnect";
import { Expense } from "@/models/expenseWorker"

export async function GET() {
  try {
    await connectDB()

    const expense = await Expense.find({}).sort({ createdAt: -1 })

    return NextResponse.json(
      {
        success: true,
        data: expense,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Failed to fetch expense:", error)

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch expense",
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const data = await req.json()

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid expense data",
        },
        { status: 400 }
      )
    }

    if (!data.title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Expense title is required",
        },
        { status: 400 }
      )
    }

    const expense = await Expense.create(data)

    return NextResponse.json(
      {
        success: true,
        message: "Worker added successfully",
        data: expense,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to add expense:", error)

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to add expense",
      },
      { status: 500 }
    )
  }
}
