import connectDB from "@/lib/dbconnect";
import { NextRequest, NextResponse } from "next/server";
import { Bank } from "@/models/bankACCModel";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const data = await req.json()

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: `failed to fetch bank data coming from fronted: ${data}`
        },
        { status: 404 }
      )
    }

    const bank = await Bank.create(data)

    return NextResponse.json(
      {
        success: true,
        message: `Bank added Successfully`,
        data: bank,
      },
      { status: 201 }
    )
  } catch (error) {
    console.log("Failed to connected to BANK API", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connected to BANK API",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await connectDB()

    const loan = await Bank.find({}).sort({ createdAt: -1 })

    return NextResponse.json(
      {
        success: true,
        data: loan,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Failed to fetch Bank:", error)

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch Bank",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url)
    const BankId = searchParams.get('id')

    if (!BankId) {
      return NextResponse.json(
        {
          success: false,
          message: 'failed to get BankId'
        }
      )
    }

    const bank = await Bank.findByIdAndDelete(BankId)

    return NextResponse.json(
      {
        success: true,
        message: 'BankAccount DELETED successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.log('failed to delete bank account due to server issue', error)

    return NextResponse.json({
      success: false,
      message: 'failed to delete bank'
    })
  }
}

