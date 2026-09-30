import connectDB from "@/lib/dbconnect";
import { NextRequest, NextResponse } from "next/server";
import { Loan } from "@/models/loanModel";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const data = await req.json()

        if (!data) {
            return NextResponse.json(
                {
                    success: false,
                    message: `failed to fetch loan data coming from fronted: ${data}`
                },
                { status: 404 }
            )
        }

        const loan = await Loan.create(data)

        return NextResponse.json(
            {
                success: true,
                message: `Bank added Successfully`,
                data: loan,
            },
            { status: 201 }
        )
    } catch (error) {
        console.log("Failed to connected to LOAN API", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to connected to LOAN API",
            },
            { status: 500 }
        )
    }
}

export async function GET() {
  try {
    await connectDB()

    const loan = await Loan.find({}).sort({ createdAt: -1 })

    return NextResponse.json(
      {
        success: true,
        data: loan,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Failed to fetch loan:", error)

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch workers",
      },
      { status: 500 }
    )
  }
}