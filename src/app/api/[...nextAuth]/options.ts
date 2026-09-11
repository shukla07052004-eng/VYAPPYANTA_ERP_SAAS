import NextAuth from 'next-auth';
import Credentials from "next-auth/providers/credentials";
import { User } from "@/models/userModel";
import connectDB from '@/lib/dbconnect';
import { Loginverify } from '@/schemas/loginverify';
import bcrypt from "bcrypt"
import GoogleProvider from "next-auth/providers/google";

export const { handlers, auth, signIn,signOut } = NextAuth({
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
                await connectDB();
                try {
                    const { identifier, password } = await Loginverify.parseAsync(credentials)

                    const user = await User.findOne({
                        $or: [
                            { email: identifier },
                            { username: identifier }
                        ]
                    })
                    if (!user) {
                        throw new Error('No user found with this email');
                    }
                    if (!user.isVerified) {
                        throw new Error('Please verify your account before logging in');
                    }
                    const ispasswordCorrect = await bcrypt.compare(
                        password,
                        user.password
                    )

                    if (ispasswordCorrect) {
                        return {
                            id: user._id.toString(),
                            _id: user._id.toString(),
                            email: user.email,
                            name: user.username,
                            username: user.username,
                            isVerified: user.isVerified,
                            isAcceptingMessages: user.isAcceptingMessages,
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
                console.log("Google user:", user);
                console.log("Google account:", account);

                await connectDB();

                const existingUser = await User.findOne({
                    email: user.email
                });

                console.log("Existing user:", existingUser);


                if (!existingUser) {
                    const createdUser = await User.create({
                        username: user.name || user.email!.split("@")[0],
                        email: user.email,
                        isVerified: true,
                        verifyCode: null,
                        verifyCodeExpiry: null
                    });

                    console.log("Created user:", createdUser);
                }

                return true;
            } catch (error) {
                console.error("GOOGLE SIGNIN ERROR:", error);
                return false;
            }
        },

        async jwt({ token, user }: any) {
            if (user) {
                token._id = user._id?.toString();
                token.isVerified = user.isVerified;
                token.isAcceptingMessages = user.isAcceptingMessages;
                token.username = user.username;
                token.email = user.email;
            }

            return token
        },
        async session({ session, token }: any) {
            if (token) {
                session._id = token._id;
                session.isVerified = token.isVerified;
                session.isAcceptingMessages = token.isAcceptingMessages;
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
