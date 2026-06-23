"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { Modal } from "@/components/modal";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      if (error.message === "Invalid login credentials") {
        toast.error("Login Error", {
          description:
            "An error occurred while trying to log in. Please check your credentials and try again.",
        });
      } else {
        console.error("Error logging in:", error, error.message);
        Sentry.captureException(error, { extra: { context: "Login Error" } });
      }
      setIsLoading(false);
    } else {
      toast.success("Logged in successfully!");
      router.push("/");
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error("Error", { description: "Please enter your email address." });
      return;
    }

    setIsResetting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });

    if (error) {
      console.error("Error resetting password:", error);
      Sentry.captureException(error, { extra: { context: "Password Reset" } });
      toast.error("Error", {
        description: "Failed to send reset email. Please try again.",
      });
    } else {
      toast.success("Check your email", {
        description: "We've sent you a password reset link.",
      });
      setShowResetModal(false);
      setResetEmail("");
    }
    setIsResetting(false);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "lab(2.75381% 0 0)" }}
    >
      <div className="w-full max-w-md">
        <div className="bg-black dark:bg-black rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-white dark:text-white">
            Log In
          </h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white dark:text-white mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white dark:text-white mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Logging In...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="text-sm text-white/70 hover:text-white underline"
            >
              Forgot password?
            </button>
          </div>
          <p className="mt-6 text-center text-white dark:text-white">
            Don't have an account?{" "}
            <Link href="/signup" className="underline hover:text-gray-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <Modal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-yellow-500"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        }
        iconBgColor="bg-yellow-500/20"
        title="Reset Password"
        description={
          <div>
            <p className="mb-4">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
            <Input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handlePasswordReset();
                }
              }}
            />
          </div>
        }
        action={{
          label: isResetting ? "Sending..." : "Send Reset Link",
          onClick: handlePasswordReset,
          className: "w-full",
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setShowResetModal(false),
        }}
      />
    </main>
  );
}
