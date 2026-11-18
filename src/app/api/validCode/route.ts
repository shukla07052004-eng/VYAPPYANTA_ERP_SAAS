import Pool from "@/lib/dbconnect";


export async function POST(request: Request) {
    
    try {
        const { email, code } = await request.json()
        const decodedEmail = decodeURIComponent(email);

        console.log(email, code, "EMAIL AND CODE RECEIVED");
        if(code){
            console.log("why i can see code", code)
        }else{
            console.log("code is not reaching at us")
        }

        const user = await Pool.query(
            `SELECT * FROM users WHERE email = $1 LIMIT 1`,
            [decodedEmail]
        )

        const userdata = user.rows[0];

        if (!userdata) {
            return Response.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        const iscodeValid = userdata.verifycode.toString() === code
        const isCodeNotExpired = new Date(userdata.verifycodeexpiry) > new Date();

        if (iscodeValid && isCodeNotExpired) {
            console.log("BEFORE:", userdata.is_verified);

            userdata.is_verified = true;

            console.log("AFTER CHANGE:", userdata.is_verified);

            await Pool.query(
                `UPDATE users SET is_verified = $1 WHERE email = $2`,
                [userdata.is_verified, email]
            );

            console.log("AFTER SAVE:", userdata.is_verified);

            return Response.json(
                {
                    success: true,
                    message: "Account verified successfully",
                },
                { status: 200 }
            );
        } else if (!isCodeNotExpired) {
            return Response.json(
                {
                    success: false,
                    message:
                        'Verification code has expired. Please sign up again to get a new code.',
                },
                { status: 400 }
            );
        } else {
            return Response.json(
                {
                    success: false,
                    message:
                        'Verification is not valid',
                },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Error verifying user:', error);
        return Response.json(
            { success: false, message: 'Error verifying user' },
            { status: 500 }
        );
    }

}