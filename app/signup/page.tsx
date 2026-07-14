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
import { Toggle } from "@/components/ui/toggle";
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
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function SignUpPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [halal, setHalal] = useState<boolean>(false);
  const [vegan, setVegan] = useState<boolean>(false);
  const [vegetarian, setVegetarian] = useState<boolean>(false);
  const [submitDisabled, setSubmitDisabled] = useState<boolean>(true);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [showAccountExistsModal, setShowAccountExistsModal] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

    if (password !== confirm) {
      toast.error("Passwords do not match");
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

    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          city: city,
          dietary_restrictions: dietaryRestrictions,
          halal: halal,
          vegan: vegan,
          vegetarian: vegetarian,
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
      setShowEmailModal(true);
    }
    setIsLoading(false);
  };

  return (
    <main className="bg-blue-100 dark:bg-[lab(2.75381%_0_0)] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-sky-100 dark:bg-black rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-slate-800 dark:text-white">
            Sign Up
          </h1>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-white mb-2">
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
              <label className="block text-sm font-medium text-slate-800 dark:text-white mb-2">
                Password
              </label>
              <PasswordStrengthMeter
                placeholder="Enter your password"
                value={password}
                onValueChange={(value) => setPassword(value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-white mb-2">
                Confirm password
              </label>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-white mb-2">
                City
              </label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Singapore">Singapore</SelectItem>
                  <SelectItem value="Kuala Lumpur">Kuala Lumpur</SelectItem>
                  <SelectItem value="Bangkok">Bangkok</SelectItem>
                  <SelectItem value="Tokyo">Tokyo</SelectItem>
                  <SelectItem value="Seoul">Seoul</SelectItem>
                  <SelectItem value="Hong Kong">Hong Kong</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-white mb-2">
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
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-slate-800 dark:text-white w-24">
                Halal Only?
              </label>
              <Toggle
                pressed={halal}
                onPressedChange={setHalal}
                className="flex-1 h-10 justify-center data-[state=on]:bg-sky-700 data-[state=off]:bg-slate-700 hover:data-[state=off]:bg-slate-600 text-white hover:text-white"
              >
                {halal ? "Yes" : "No"}
              </Toggle>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-slate-800 dark:text-white w-24">
                Vegan?
              </label>
              <Toggle
                pressed={vegan}
                onPressedChange={setVegan}
                className="flex-1 h-10 justify-center data-[state=on]:bg-sky-700 data-[state=off]:bg-slate-700 hover:data-[state=off]:bg-slate-600 text-white hover:text-white"
              >
                {vegan ? "Yes" : "No"}
              </Toggle>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-slate-800 dark:text-white w-24">
                Vegetarian?
              </label>
              <Toggle
                pressed={vegetarian}
                onPressedChange={setVegetarian}
                className="flex-1 h-10 justify-center data-[state=on]:bg-sky-700 data-[state=off]:bg-slate-700 hover:data-[state=off]:bg-slate-600 text-white hover:text-white"
              >
                {vegetarian ? "Yes" : "No"}
              </Toggle>
            </div>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={submitDisabled || isLoading}
              className="w-full mt-6 h-10 text-base bg-sky-700 hover:bg-sky-800 text-white dark:bg-sky-700 dark:hover:bg-sky-800 dark:text-white"
            >
              {isLoading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
          <p className="text-center text-slate-600 dark:text-slate-300 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-slate-800 dark:text-white hover:underline font-medium"
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
