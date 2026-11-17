    import { z } from "zod";

    export const signupVerifySchema = z.object({
        username: z
            .string()
            .trim()
            .min(3, "Username must be at least 3 characters")
            .max(20, "Username cannot exceed 20 characters")
            .regex(
                /^[a-zA-Z0-9_]+$/,
                "Username can only contain letters, numbers and underscores"
            ),

        email: z
            .string()
            .trim()
            .toLowerCase()
            .email("Please enter a valid email"),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(64, "Password cannot exceed 64 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(
                /[^A-Za-z0-9]/,
                "Password must contain at least one special character"
            )
    });