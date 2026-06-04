"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PasswordStrengthMeter,
  defaultRequirements,
} from "@/components/strength-meter";
import { createClient } from "@/utils/supabase/client";
import * as Sentry from "@sentry/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailSend02Icon, UserAccountIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAccountExistsModal, setShowAccountExistsModal] = useState(false);
  const router = useRouter();

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    const isPasswordValid = defaultRequirements.every((requirement) =>
      requirement.validator(password),
    );

    setSubmitDisabled(!isPasswordValid || !isValidEmail(email) || !city);
  }, [password, email, city]);

  const allergyOptions = [
    "Shellfish",
    "Peanuts",
    "Fish",
    "Dairy",
    "Eggs",
    "Wheat",
    "Pork",
    "Beef",
    "Chicken",
    "Lamb",
  ];

  const handleAllergyChange = (allergy: string, checked: boolean) => {
    if (checked) {
      setDietaryRestrictions([...dietaryRestrictions, allergy]);
    } else {
      setDietaryRestrictions(
        dietaryRestrictions.filter((item) => item !== allergy),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    const isPasswordValid = defaultRequirements.every((requirement) =>
      requirement.validator(password),
    );

    if (!isPasswordValid) {
      console.error("Password does not meet requirements");
      return;
    }

    if (!isValidEmail(email)) {
      console.error("Invalid email format");
      return;
    }

    if (!city) {
      console.error("City is required");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          city: city,
          dietary_restrictions: dietaryRestrictions,
        },
      },
    });
    if (error) {
      console.error("Error signing up:", error.message);
      Sentry.captureException(error, { extra: { context: "Signup Error" } });
    } else if (data && data.user) {
      if (data.user.identities) {
        if (data.user.identities.length > 0) {
          // Account already created but pending email confirmation - resend the confirmation email
          supabase.auth.resend({ email, type: "signup" });
          setShowEmailModal(true);
        } else {
          // Account already exists. Redirect user to login page
          setShowAccountExistsModal(true);
        }
      }
    } else {
      console.log("Signup data", data);
      setShowEmailModal(true);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "lab(2.75381% 0 0)" }}
    >
      <div className="w-full max-w-md">
        <div className="bg-black dark:bg-black rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-white dark:text-white">
            Sign Up
          </h1>
          <div className="space-y-5">
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
              <PasswordStrengthMeter
                placeholder="Enter your password"
                value={password}
                onValueChange={(value) => setPassword(value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white dark:text-white mb-2">
                City
              </label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="singapore">Singapore</SelectItem>
                  <SelectItem value="kualalumpur">Kuala Lumpur</SelectItem>
                  <SelectItem value="bangkok">Bangkok</SelectItem>
                  <SelectItem value="tokyo">Tokyo</SelectItem>
                  <SelectItem value="seoul">Seoul</SelectItem>
                  <SelectItem value="hongkong">Hong Kong</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white dark:text-white mb-2">
                Food Exceptions
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {dietaryRestrictions.length === 0
                      ? "Select dietary restrictions..."
                      : `${dietaryRestrictions.length} selected`}
                    <span className="ml-2">▼</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {allergyOptions.map((allergy) => (
                    <div
                      key={allergy}
                      className="flex items-center space-x-2 px-2 py-1.5 cursor-pointer rounded-md hover:bg-foreground/10"
                      onClick={() =>
                        handleAllergyChange(
                          allergy,
                          !dietaryRestrictions.includes(allergy),
                        )
                      }
                    >
                      <Checkbox
                        id={allergy}
                        checked={dietaryRestrictions.includes(allergy)}
                        onCheckedChange={(checked) =>
                          handleAllergyChange(allergy, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={allergy}
                        className="text-sm cursor-pointer flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAllergyChange(
                            allergy,
                            !dietaryRestrictions.includes(allergy),
                          );
                        }}
                      >
                        {allergy}
                      </label>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={submitDisabled}
              className="w-full mt-6 h-10 text-base bg-sky-700 hover:bg-sky-800 text-white dark:bg-sky-700 dark:hover:bg-sky-800 dark:text-white"
            >
              Create Account
            </Button>
          </div>
          <p className="text-center text-slate-300 dark:text-slate-300 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-white dark:text-white hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Email Verification Modal */}
      <Modal
        open={showEmailModal}
        icon={
          <HugeiconsIcon
            icon={MailSend02Icon}
            className="w-8 h-8 text-green-500"
            strokeWidth={2}
          />
        }
        title="Check Your Email"
        description={`We've sent a verification link to ${email}. Please check your inbox and click the link to verify your account.`}
        action={{
          label: "Go to Login",
          onClick: () => {
            router.push("/login");
          },
        }}
      />

      {/* Account already exists modal */}
      <Modal
        open={showAccountExistsModal}
        icon={
          <HugeiconsIcon
            icon={UserAccountIcon}
            className="w-8 h-8 text-red-500"
            strokeWidth={2}
          />
        }
        title="Account Already Exists"
        description="An account with this email address already exists. Please log in instead."
        action={{
          label: "Go to Login",
          onClick: () => {
            router.push("/login");
          },
        }}
      />
    </main>
  );
}
