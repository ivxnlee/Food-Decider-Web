"use client";
import { useState } from "react";
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
import { PasswordStrengthMeter } from "@/components/strength-meter";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [foodExceptions, setFoodExceptions] = useState<string[]>([]);

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
      setFoodExceptions([...foodExceptions, allergy]);
    } else {
      setFoodExceptions(foodExceptions.filter((item) => item !== allergy));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call your auth API here
    console.log({ email, password, city, foodExceptions });
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
                    {foodExceptions.length === 0
                      ? "Select exceptions..."
                      : `${foodExceptions.length} selected`}
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
                          !foodExceptions.includes(allergy),
                        )
                      }
                    >
                      <Checkbox
                        id={allergy}
                        checked={foodExceptions.includes(allergy)}
                        onCheckedChange={(checked) =>
                          handleAllergyChange(allergy, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={allergy}
                        className="text-sm cursor-pointer flex-1"
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
              className="w-full mt-6 h-10 text-base bg-sky-700 hover:bg-sky-800 text-white dark:bg-sky-700 dark:hover:bg-sky-800 dark:text-white"
            >
              Create Account
            </Button>
          </form>
          <p className="text-center text-slate-300 dark:text-slate-300 mt-6">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-white dark:text-white hover:underline font-medium"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
