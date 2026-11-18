import Pool from "@/lib/dbconnect";
import { NextRequest, NextResponse } from "next/server"
import { signupVerifySchema } from '@/schemas/signupverify'
import bcrpt from "bcrypt"
import { sendEmail } from "@/helper/sendVerificationEmail";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        console.log("BODY:", body);
        console.log("BODY EMAIL:", body);

        const result = signupVerifySchema.safeParse(body);

        console.log("RESULT:", result);
        console.log("RESULT SUCCESS:", result.success);

        if (!result.success) {
            return NextResponse.json({
                success: false,
                message: result.error.issues[0].message
            })

        }

        const { email, username, password } = result.data

        const existingUser = await Pool.query(
            `SELECT * FROM users WHERE email = $1 LIMIT 1`,
            [email]
        )

        const existingUserByEmail = existingUser.rows[0];


        if (existingUserByEmail) {
            if (existingUserByEmail.is_verified) {
                return NextResponse.json({
                    success: false,
                    message: "User Verification Completed Successfully: User Verified"
                })
            } else {
                const hashedPassword = await bcrpt.hash(password, 10)
                const verifycodeexpiry = new Date(Date.now() + 3600000);
                const verifycode = Math.floor(100000 + Math.random() * 900000).toString();
                

                await Pool.query(
                    `UPDATE users SET password=$1, verifycode=$2, verifycodeexpiry=$3 WHERE email = $4`,
                    [hashedPassword, verifycode, verifycodeexpiry, email]
                );

                await sendEmail({ email, username, verifycode })

            }
        } else {
            const hashedPassword = await bcrpt.hash(password, 10)
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1);
                    const verifycode = Math.floor(100000 + Math.random() * 900000).toString();

            const newUser = await Pool.query(
                `INSERT INTO users (username, email, password, is_verified, verifycode, verifycodeexpiry) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [
                    username,
                    email,
                    hashedPassword,
                    false,
                    verifycode,
                    expiryDate
                ]
            )
            console.log("USER CREATED:", newUser);

            // send verification code

            const emailResponse = await sendEmail({ email, username, verifycode })

            if (!emailResponse.success) {
                return NextResponse.json(
                    {
                        success: false,
                        message: emailResponse.message,
                    }
                );
            }


        }
        return NextResponse.json(
            {
                success: true,
                message: 'User registered successfully. Please verify your account.',
            }
        );

    } catch (error) {
        console.error('Error registering user:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error registering user',
            }
        );
    }
}































// export const runtime = "nodejs";

// import { connect } from "@/lib/dbconnect";
// import { User } from "@/models/userModel"
// import { NextRequest, NextResponse } from "next/server";
// import crypto, { verify } from "crypto";
// import { sendEmail } from "@/helper/resend"
// import { Resend } from 'resend';


// const resend = new Resend(process.env.RESEND_API_KEY);
// export async function POST(request: NextRequest) {
//     try {
//         await connect()
//         const { email, username } = await request.json()

//         console.log("EMAIL RECEIVED:", JSON.stringify(email));
//         console.log("EMAIL Username:", JSON.stringify(username));

//         if (!(email || username)) {
//             return NextResponse.json(
//                 { message: "email or username not found not found" },
//                 { status: 404 }
//             );
//         }


//         const normalizedEmail = email.trim().toLowerCase();
//         const normalizedUsername= username.trim().toLowerCase();

//         const user = await User.findOne({
//             $or: [
//                 { username: normalizedUsername },
//                 { email: normalizedEmail }
//             ]
//         })

//         if (!user) {
//             return NextResponse.json(
//                 {
//                     success: false,
//                     message: "User not found"
//                 },
//                 { status: 404 }
//             );
//         }

//         // generating a token and hashing it
//         const resetToken = crypto.randomBytes(32).toString("hex");
//         const hashedToken = crypto
//             .createHash("sha256")
//             .update(resetToken)
//             .digest("hex");

//         user.Token = hashedToken
//         user.TokenExpiry = new Date(Date.now() + 360000)


//         const savedUser = await user.save()

//         await sendEmail({ email, emailType: "verify", userId: savedUser._id, Token: savedUser.Token, TokenExpiry: savedUser.TokenExpiry })

//         return NextResponse.json({
//             message: "Email verified sucessfull now hear on role of frontend and database start",
//             success: true,
//             savedUser
//         })


//     } catch (error) {
//         console.log(error, "failed to complete forget password task")
//         return Response.json({ error: String(error) }, { status: 500 });
//     }
// }
