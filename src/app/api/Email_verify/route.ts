
import Pool from '@/lib/dbconnect';
import { sendEmail } from "@/helper/sendVerificationEmail";
import { apiResponse } from "@/types/apiResShortcut";
import { randomInt } from "crypto";
import { z } from "zod";
import { NextRequest } from "next/server";

export const identifierSchema = z.object({
 identifier: z
  .string()
  .trim()
  .min(1, "Email or username is required")
})

export async function POST(req: NextRequest) {
  try {

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
    const user = await Pool.query(
      `SELECT * FROM users WHERE email = $1 OR username = $2 LIMIT 1;`,
      [identifier, identifier]
    );

    const userdata = user.rows[0];

    // Use a generic response to avoid revealing registered accounts.
    if (!userdata) {
      return apiResponse({
        success: true,
        message:
          "If an account matches those details, a verification code will be sent.",
      });
    }

    // Generate a cryptographically secure 6-digit code
    const verifyCode = randomInt(100000, 1000000).toString();

    // Store the code with a 10-minute expiry
    userdata.verifycode = verifyCode;
    userdata.verifycodeexpiry = new Date(Date.now() + 10 * 60 * 1000);

    await Pool.query(
      `UPDATE users SET verifycode = $1, verifycodeexpiry = $2 WHERE id = $3`,
      [userdata.verifycode, userdata.verifycodeexpiry, userdata.id]
    );

    try {
      // Always send to the email stored on the account
      await sendEmail({
        email: userdata.email,
        username: userdata.username,
        verifyCode,
      });
    } catch (emailError) {
      // Invalidate the code if delivery fails
      userdata.verifycode = undefined;
      userdata.verifycodeexpiry = undefined;
      await Pool.query(
        `UPDATE users SET verifycode = $1, verifycodeexpiry = $2 WHERE id = $3`,
        [userdata.verifycode, userdata.verifycodeexpiry, userdata.id]
      );

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
