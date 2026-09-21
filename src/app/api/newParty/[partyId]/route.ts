import {NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/dbconnect'
import { Party } from '@/models/partyModel'

export async function PATCH(request: any, { params }: any) {
  try {
    await connectDB()

    const { partyId } = await params
    const body = await request.json()

    const updatedParty = await Party.findByIdAndUpdate(
      partyId,
      body,
      {
        new: true,
        runValidators: true,
      }
    )

    if (!updatedParty) {
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
      message: 'Party updated successfully',
      data: updatedParty,
    })
  } catch (error: any) {
    console.error('PATCH /api/newParty/[partyId] error:', error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update party',
      },
      { status: 500 }
    )
  }
}