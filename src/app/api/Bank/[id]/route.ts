import connectDB from "@/lib/dbconnect";
import { NextRequest, NextResponse } from "next/server";
import { Bank } from "@/models/bankACCModel";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: String }> }) {
    try {
        await connectDB();
        const { id } = await params
        console.log('BANK ID:', id)
        const data = await req.json()
        console.log('BANK DATA',data)

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: `failed to fetch bank data coming from fronted: ${data}`
                },
                { status: 404 }
            )
        }

        const bank = await Bank.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        if (!bank) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Bank account not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: `Bank updated Successfully`,
                data: bank,
            },
            { status: 201 }
        )

    } catch (error) {
        console.log('Failed to Patch to the Bank', error)
        return NextResponse.json(
            {
                success: false,
                message: "Failed to Patch to the Bank"
            },
            { status: 500 }
        )
    }
}

