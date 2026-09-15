import connectDB from "@/lib/dbconnect";
import { NextRequest, NextResponse } from "next/server";
import { Target } from "@/models/targetModel";
import { success } from "zod";


export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const data = await req.json();
        const { title, targetValue, currentValue, deadline, priority, completed, notes } = data;

        const existingTarget = await Target.findOne({ title });

        if (existingTarget) {
            return Response.json(
                {
                    success: false,
                    message: "Target Name already exists. Try another."
                },
                {
                    status: 409
                }
            );
        }

        const target = await Target.create({
            title,
            targetValue,
            currentValue,
            deadline,
            priority,
            completed: completed ? "Open" : "Completed",
            notes
        });

        const targetForClient = {
            _id: target._id.toString(),
            title: target.title,
            targetValue: target.targetValue,
            currentValue: target.currentValue,
            deadline: target.deadline,
            priority: target.priority,
            completed: target.completed,
            notes: target.notes,
        };

        return Response.json(
            {
                success: true,
                message: "Data saved successfully",
                data: targetForClient
            },
            {
                status: 201
            }
        )


    } catch (error) {
        console.log("Failed To Save Target", error);
        return Response.json(
            {
                success: false,
                message: "Failed to save the target",
            },
            { status: 500 }
        )
    }
}
export async function GET() {
    try {
        await connectDB();

        const targets = await Target.find();

        return NextResponse.json({
            success: true,
            data: targets,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch targets",
            },
            { status: 500 }
        );
    }
}
export async function DELETE(request:NextRequest ) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const targetId = searchParams.get("id");

        const deletedTarget = await Target.findByIdAndDelete(targetId);

        if (!deletedTarget) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Target not found",
                },
                { status: 404 }
            );
        }
        return NextResponse.json({
            success: true,
            message: `Target deleted successfully`,
        });

    } catch (error) {
        console.log("Something went wrong causing problem in DELETE", error)
        return NextResponse.json({
            success: false,
            message: "Something went wrong causing problem in DELETE"
        })
    }
}
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const data = await req.json();

    const { _id, ...updates } = data;

    const updatedTarget = await Target.findByIdAndUpdate(
      _id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTarget) {
      return NextResponse.json(
        {
          success: false,
          message: "Target not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Target updated successfully",
      data: updatedTarget,
    });

  } catch (error) {
    console.error("Failed to update target:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update target",
      },
      { status: 500 }
    );
  }
}