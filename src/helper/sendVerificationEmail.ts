import { resend } from "@/lib/resend"
import VerificationEmailTemplate from "../../email/verifyEmail";
import { ApiResponse } from "@/types/ApiResponse";
import { success } from "zod";

export async function sendEmail({ email, username, verifycode }: any): Promise<ApiResponse> {
    try {
        console.log("signup route hit")


        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: email,
            subject: "Resend Test ",
            react: VerificationEmailTemplate({ username: username, otp: verifycode })

        });

        if (error){
            return{
                success: false,
                message: error.message
            }
        }

        return {
            success: true,
            message: "Email send successfully"
        }

    } catch (error) {
       return{
          success: false,
          message: "Something went wrong while sending the email"
       }
    }
}