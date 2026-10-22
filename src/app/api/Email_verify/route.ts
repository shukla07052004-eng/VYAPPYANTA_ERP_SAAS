
import connectDB from "@/lib/dbconnect";
import { NextRequest } from "next/server";
import { User } from "@/models/userModel";
import { sendEmail } from "@/helper/sendVerificationEmail";
import { apiResponse } from "@/types/apiResShortcut";
import { randomInt } from "crypto";
import { z } from "zod";

export const identifierSchema = z.object({
 identifier: z
  .string()
  .trim()
  .min(1, "Email or username is required")
})

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    console.log("BODY:", body);
    console.log("BODY EMAIL:", body);

    // Validate the email or username provided by the user
    const result = identifierSchema.safeParse(body);
    console.log("VALIDATION RESULT:", result);

    if (!result.success) {
      return apiResponse({
        success: false,
        message: "Please enter your email or username.",
      });
    }

    const identifier = result.data.identifier;

    // Find the user by email OR username
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier },
      ],
    });

    // Use a generic response to avoid revealing registered accounts.
    if (!user) {
      return apiResponse({
        success: true,
        message:
          "If an account matches those details, a verification code will be sent.",
      });
    }

    // Generate a cryptographically secure 6-digit code
    const verifyCode = randomInt(100000, 1000000).toString();

    // Store the code with a 10-minute expiry
    user.verifyCode = verifyCode;
    user.verifyCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    try {
      // Always send to the email stored on the account
      await sendEmail({
        email: user.email,
        username: user.username,
        verifyCode,
      });
    } catch (emailError) {
      // Invalidate the code if delivery fails
      user.verifyCode = undefined;
      user.verifyCodeExpiry = undefined;
      await user.save();

      throw emailError;
    }

    return apiResponse({
      success: true,
      message:
        "If an account matches those details, a verification code will be sent.",
    });
  } catch (error) {
    console.error("Forgot password API error:", error);

    return apiResponse({
      success: false,
      message: "Unable to process your request. Please try again.",
    });
  }
}
