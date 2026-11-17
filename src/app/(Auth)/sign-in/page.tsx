"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
    inputClass,
    buttonClass,
    errorBoxClass,
} from "../../../Style/fromStyles";
import AuthCard from "@/Style/AuthCard";
import { ShootingStars } from "@/components/customCss/shooting-stars";
import { StarsBackground } from "@/components/customCss/stars-background";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    IconBrandGoogle,
} from "@tabler/icons-react";
import { LayoutTextFlip } from "@/components/customCss/layout-text-flip";
import { motion } from "motion/react";


export default function LoginForm() {
    const router = useRouter();

    const [identifier, setIdentifier] = useState(""); // email OR username
    const [password, setPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activePage, setActivePage] = useState<"sign-in" | "processing">("sign-in");

    function validate(): string | null {
        if (identifier.trim().length === 0) {
            return "Please enter your email or username.";
        }
        if (password.length === 0) {
            return "Please enter your password.";
        }
        return null;
    }

    async function handleSubmit(e: any) {
        e.preventDefault();
        setError(null);

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);

        // redirect: false lets us handle success/error ourselves instead of
        // Auth.js doing a full page redirect.
        const result = await signIn("credentials", {
            identifier,
            password,
            redirect: false,
        });

        setIsLoading(false);

        if (!result || result.error) {
            // Auth.js returns a generic "CredentialsSignin" error string by
            // default for failed credential checks — show a friendly message.
            setError("Invalid email/username or password.");
            return;
        }

        router.push("/dashboard");
    }

    // async function handleGoogleLogin() {
    //     try {
    //         setError(null);
    //         setActivePage("processing");

    //         const result = await signIn("google", {
    //             redirect: false,
    //         });

    //         if (result?.error) {
    //             setActivePage("sign-in");
    //             setError("Google login failed. Please try again.");
    //             return;
    //         }

    //         if (result?.ok) {
    //             router.push("/dashboard");
    //         }
    //     } catch (error) {
    //         console.error(error);
    //         setActivePage("sign-in");
    //         setError("Google login failed. Please try again.");
    //     }
    // }

    return (
        <AuthCard title="Login your Account" subtitle="Get started in a few seconds">
            <div className="pointer-events-none absolute inset-0">
                <ShootingStars />
                <StarsBackground />
            </div>
            <div className="relative michroma-regular z-10 mt-4 mx-auto w-full max-w-lg rounded-2xl bg-white p-4 shadow-input md:p-8 dark:bg-black">


                {activePage === "sign-in" && (
                    <div>

                        <motion.div className="relative mx-4 my-2 flex flex-col items-center justify-center gap-2 text-center sm:mx-0 sm:mb-0 sm:flex-row">
                            <LayoutTextFlip
                                text="Welcome to "
                                words={["Our-App", "Easy", "Beautiful", "handy"]}
                            />
                        </motion.div>
                        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            {error && <div className={errorBoxClass}>{error}</div>}

                            <div className="mb-4 flex w-full min-w-sm flex-col items-center justify-center space-y-2 md:flex-row md:space-y-0 md:space-x-2">


                                <LabelInputContainer>
                                    <Input
                                        id="identifier"
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="Email or Username"

                                        disabled={isLoading}
                                        autoComplete="username"
                                        required
                                    />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        className="group/btn relative cursor-pointer block h-10 w-full ounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                                        type="submit"
                                    >
                                        Sign In &rarr;
                                        <BottomGradient />
                                    </button>

                                </LabelInputContainer>
                            </div>

                            <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
                            <div className="flex flex-col space-y-4">
                                <button
                                    className="group/btn shadow-input cursor-pointer relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
                                    type="button"
                                    onClick={()=> signIn("google",{
                                        callbackUrl: "/dashboard"
                                    })}
                                >
                                    <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />

                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                        Continue with Google
                                    </span>

                                    <BottomGradient />
                                </button>
                            </div>
                                <p className="text-center mt-2 text-sm text-slate-500">
                                    Don&apos;t have an account?{" "}
                                    <Link href="/sign-up" className="font-medium text-indigo-600 hover:text-indigo-500">
                                        Sign up
                                    </Link>
                                    <br />
                                    <Link href="/forget-password" className="font-medium text-sm text-cian-600 hover:text-indigo-500">
                                        Forget-Password
                                    </Link>
                                </p>



                        </form>
                    </div>
                )}
                {activePage === "processing" && (
                    <div className="min-h-[100] flex items-center justify-center bg-white">
                        <div className="flex flex-col items-center gap-6">
                            {/* Google-style loader */}
                            <div className="relative h-12 w-12">
                                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />

                                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500" />
                            </div>

                            <div className="text-center">
                                <p className="text-lg font-medium text-gray-700">
                                    Loading...
                                </p>

                                <p className="mt-1 text-sm text-gray-400">
                                    Please wait while we prepare everything
                                </p>
                            </div>
                        </div>
                    </div>

                )}


            </div>
        </AuthCard>
    );
}

const BottomGradient = () => {
    return (
        <>
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
        </>
    );
};
const LabelInputContainer = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("flex min-w-sm flex-col space-y-2", className)}>
            {children}
        </div>
    );
};