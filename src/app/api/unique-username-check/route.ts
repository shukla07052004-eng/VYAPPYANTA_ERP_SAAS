import { z } from 'zod'
import pool from "@/lib/dbconnect";


const usernameQuerySchema = z.object({
        username: z
            .string()
            .trim()
            .min(3, "Username must be at least 3 characters")
            .max(20, "Username cannot exceed 20 characters")
            .regex(
                /^[a-zA-Z0-9_]+$/,
                "Username can only contain letters, numbers and underscores"
            ),
    });


export async function POST(request: Request) {

    try {

        const body = await request.json();

        console.log("Received body:", body);

        const result = usernameQuerySchema.safeParse(body);

        console.log("Validation result:", result);

        if (!result.success) {
            const usernameErrors = z.flattenError(result.error).fieldErrors.username || []
            return Response.json(
                {
                    success: false,
                    message:
                        usernameErrors?.length > 0
                            ? usernameErrors.join(', ')
                            : 'Invalid query parameters',
                },
                {
                    status: 400
                }
            )
        }
        const { username } = result.data

        const isUserVerified = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND is_verified = true',
            [username]
        )
        console.log(isUserVerified.rows)

        if (isUserVerified.rows.length > 0) {
            return Response.json(
                {
                    success: false,
                    message: "User with this username already exist, Try with another one"
                },
                { status: 200 }
            )
        }

        return Response.json(
            {
                success: true,
                message: "Username is unique"
            },
            { status: 200 }
        )


    } catch (error) {
        console.error('Error checking username:', error);
        return Response.json(
            {
                success: false,
                message: 'Error checking username',
            },
            { status: 500 }
        );
    }
}

