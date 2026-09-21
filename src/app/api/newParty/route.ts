import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/dbconnect";
import { Party } from "@/models/partyModel"

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const data = await req.json();

        console.log("PARTY DATA RECEIVED:", data);

        const party = await Party.create(data);

        return NextResponse.json(
            {
                success: true,
                message: "Party created successfully",
                data: party,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("CREATE PARTY ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to create party",
            },
            { status: 500 }
        );
    }
}

export async function GET() {
  try {
    await connectDB()

    const parties = await Party.find({}).sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: parties,
    })
  } catch (error:any) {
    console.error('GET /api/newParty error:', error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch parties',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request:any) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const partyId = searchParams.get('id')

    console.log('PARTY ID:', partyId)

    const deletedParty =
      await Party.findByIdAndDelete(partyId)

    console.log('DELETED PARTY:', deletedParty)

    if (!deletedParty) {
      return NextResponse.json(
        {
          success: false,
          message: 'Party not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Party deleted successfully',
    })

  } catch (error) {
    console.error('DELETE ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: "DELETE ERROR"
      },
      { status: 500 }
    )
  }
}