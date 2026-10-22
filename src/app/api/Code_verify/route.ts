
import connectDB from "@/lib/dbconnect";
import { User } from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

// Validate the request body
const verifyCodeSchema = z.object({
  identifier: z.string().trim().min(1),
  validCode: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const result = verifyCodeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid identifier and 6-digit code.",
        },
        { status: 400 }
      );
    }

    const { identifier, validCode } = result.data;

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier },
      ],
    });

    if (!user || !user.verifyCode || !user.verifyCodeExpiry) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired verification code.",
        },
        { status: 401 }
      );
    }

    // Check whether the code has expired
    if (new Date(user.verifyCodeExpiry).getTime() <= Date.now()) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification code has expired. Request a new code.",
        },
        { status: 402 }
      );
    }

    // Compare the submitted code with the stored code
    if (String(user.verifyCode) !== validCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid verification code.",
        },
        { status: 403  }
      );
    }

    // Create a cryptographically random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the hash of the reset token.
    // Add these fields to your User schema first.
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires in 10 minutes
    user.resetPasswordTokenExpiry = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // Consume the verification code so it cannot be reused
    user.verifyCode = undefined;
    user.verifyCodeExpiry = undefined;

    await user.save();

    // Send the raw token to the frontend once.
    // API 3 must hash it and compare it with the stored hash.
    return NextResponse.json(
      {
        success: true,
        message: "Code verified successfully.",
        resetToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify reset code error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
