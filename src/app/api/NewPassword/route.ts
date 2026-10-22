
import connectDB from "@/lib/dbconnect";
import { User } from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid reset token and password.",
        },
        { status: 400 }
      );
    }

    const { resetToken, password } = result.data;

    // Hash the token so it matches the hash stored in MongoDB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Find the user with a matching, unexpired reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Reset token is invalid or expired. Please verify your code again.",
        },
        { status: 400 }
      );
    }

    // Hash the new password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    // Invalidate the reset token so it cannot be reused
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully. You can now log in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
