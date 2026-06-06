"use client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Page() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check query params (PKCE flow)
    const queryParams = new URLSearchParams(window.location.search);

    // Check hash params (implicit flow / error redirects)
    const hashParams = new URLSearchParams(
      window.location.hash.replace("#", ""),
    );

    const errorCode =
      queryParams.get("error_code") || hashParams.get("error_code");

    if (errorCode === "otp_expired") {
      toast.error("Link Expired", {
        description:
          "Your confirmation link has expired. Please sign up again.",
      });
    }
  }, [mounted, searchParams]);

  return (
    <main className="flex justify-center">
      <div className="w-4/5 min-h-screen flex flex-col items-center justify-center ">
        <span className="text-8xl">Food Decider</span>
        <span className="text-3xl">
          Can't decide your next meal? Let fate (and flavor) choose for you 🍜✨
        </span>
        <div>
          <Button asChild variant="outline" className="mr-2 w-40 h-15 text-3xl">
            <Link href="/login">Log in</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-40 h-15 text-3xl !bg-red-600 hover:!bg-red-500"
          >
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
