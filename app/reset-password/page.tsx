"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PasswordStrengthMeter,
  defaultRequirements,
} from "@/components/strength-meter";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [submitDisabled, setSubmitDisabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidSession, setIsValidSession] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true); // ← guard
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login"); // kick them out
      } else {
        setIsValidSession(true);
      }
      setChecking(false);
    };
    checkSession();
  }, [router, supabase]);

  useEffect(() => {
    const isPasswordValid = defaultRequirements.every((requirement) =>
      requirement.validator(password),
    );

    setSubmitDisabled(!isPasswordValid);
  }, [password]);

  const handleUpdate = async () => {
    const isPasswordValid = defaultRequirements.every((requirement) =>
      requirement.validator(password),
    );

    if (!isPasswordValid) {
      console.error("Password does not meet requirements");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    } else {
      toast.success("Password updated!");
      router.push("/login");
    }
  };

  if (checking) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "lab(2.75381% 0 0)" }}
      >
        <div className="w-full max-w-md bg-black dark:bg-black rounded-lg shadow-lg p-8 text-center text-white">
          <p>Verifying session...</p>
        </div>
      </main>
    );
  }

  if (!isValidSession) return null; // already redirecting

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "lab(2.75381% 0 0)" }}
    >
      <div className="w-full max-w-md">
        <div className="bg-black dark:bg-black rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-white dark:text-white">
            Set New Password
          </h1>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white dark:text-white mb-2">
                New password
              </label>
              <PasswordStrengthMeter
                placeholder="Enter your password"
                value={password}
                onValueChange={(value) => setPassword(value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white dark:text-white mb-2">
                Confirm password
              </label>
              <Input
                type="password"
                placeholder="Confirm your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full mb-2"
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={submitDisabled || isLoading}
              onClick={handleUpdate}
              className="w-full"
            >
              Update Password
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
