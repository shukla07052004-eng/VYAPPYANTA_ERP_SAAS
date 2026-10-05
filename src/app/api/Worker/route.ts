import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/dbconnect";
import { Worker } from "@/models/workerModel"

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const data = await req.json()

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid worker data",
        },
        { status: 400 }
      )
    }

    const Name = String(data.Name ?? "").trim()
    const Role = String(data.Role ?? "").trim()
    const Phone = Number(data.Phone)
    const Salary = Number(data.Salary)
    const joinDate = data.joinDate || ""

    if (!Name) {
      return NextResponse.json(
        {
          success: false,
          message: "Worker name is required",
        },
        { status: 400 }
      )
    }

    if (!Role) {
      return NextResponse.json(
        {
          success: false,
          message: "Worker role is required",
        },
        { status: 400 }
      )
    }

    if (!Number.isFinite(Phone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid worker phone is required",
        },
        { status: 400 }
      )
    }

    if (!Number.isFinite(Salary)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid worker salary is required",
        },
        { status: 400 }
      )
    }

    if (!joinDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Worker join date is required",
        },
        { status: 400 }
      )
    }

    const worker = await Worker.create({
      Name,
      Role,
      Phone,
      Salary,
      joinDate,

      paid: false,
      advance: 0,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Worker added successfully",
        data: worker,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Failed to add worker:", error)

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to add worker",
      },
      { status: 500 }
    )
  }
}
export async function GET() {
  try {
    await connectDB()
    const workers = await Worker.find({}).sort({ createdAt: -1 })
    return NextResponse.json(
      {
        success: true,
        data: workers,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Failed to fetch workers:", error)
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

