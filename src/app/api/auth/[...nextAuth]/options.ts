import NextAuth from 'next-auth';
import Credentials from "next-auth/providers/credentials";
import pool from "@/lib/dbconnect";
import { Loginverify } from '@/schemas/loginverify';
import bcrypt from "bcrypt"
import GoogleProvider from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: process.env.NEXT_AUTH_SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            // "I want to allow users to authenticate using credentials that I provide."
            // These lines Only tells AUTH.js that "My application has a credentials-based login provider."
            credentials: {
                identifier: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: any): Promise<any> {
                // This function is called when a user attempts to log in using the credentials provider.
                // You can implement your own logic here to verify the user's credentials.
                // For example, you can check the provided email and password against your database.
                try {
                    const { identifier, password } = await Loginverify.parseAsync(credentials)

                    const user = await pool.query(
                        `SELECT * FROM users 
                        WHERE email = $1 OR username = $2
                        LIMIT 1`,
                        [identifier, identifier]
                    )
                    if (!user.rows[0]) {
                        throw new Error('No user found with this email');
                    }
                    if (!user.rows[0]?.is_verified) {
                        throw new Error('Please verify your account before logging in');
                    }
                    if (!user.rows[0].password) {
                        throw new Error("Please login using Google");
                    }
                    const ispasswordCorrect = await bcrypt.compare(
                        password,
                        user.rows[0].password
                    )

                    if (ispasswordCorrect) {
                        return {
                            id: user.rows[0].id.toString(),
                            _id: user.rows[0].id.toString(),
                            email: user.rows[0].email,
                            name: user.rows[0].username,
                            username: user.rows[0].username,
                            isVerified: user.rows[0].is_verified,
                        }
                    } else {
                        throw new Error('Incorrect password');
                    }



                } catch (err: any) {
                    console.error(err);
                    throw new Error(err.message);
                }


            }
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            try {
                if (account?.provider !== "google") {
                    return true;
                }

                if (!user.email) {
                    return false;
                }

                const existingUser = await pool.query(
                    `SELECT id FROM users WHERE email = $1`,
                    [user.email]
                );

                if (existingUser.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO users (email, is_verified)
                 VALUES ($1, $2)`,
                        [user.email, true]
                    );
                }

                return true;
            } catch (error) {
                console.error("GOOGLE SIGNIN ERROR:", error);
                return false;
            }
        },

        async jwt({ token, user, account }: any) {

            if (user && account?.provider === "credentials") {

                token._id = user.id.toString();
                token.email = user.email;
                token.username = user.username;
                token.isVerified = user.isVerified;

            }

            if (user && account?.provider === "google") {

                const result = await pool.query(
                    `SELECT id, email, username, is_verified
             FROM users
             WHERE email = $1`,
                    [user.email]
                );

                const dbUser = result.rows[0];

                if (!dbUser) {
                    throw new Error("Google user not found in database");
                }

                token._id = dbUser.id.toString();
                token.email = dbUser.email;
                token.username = dbUser.username;
                token.isVerified = dbUser.is_verified;
            }

            return token;
        },
        async session({ session, token }: any) {
            if (token) {
                session.id = token.id;
                session.isVerified = token.isVerified;
                session.username = token.username;
                session.email = token.email as string;
            }

            return session
        }
    },
    session: {
        strategy: "jwt"
    },
    pages: {
        signIn: "/sign-in",
    }
});
