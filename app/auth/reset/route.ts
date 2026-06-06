import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// This route handles the OAuth callback from Supabase when a password
// reset flow is initiated. It exchanges the incoming authorization code
// for a valid session and redirects the user to the reset password page.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // If a code was provided by Supabase, attempt to exchange it for a session.
  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Exchange the authorization code for a Supabase auth session.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    // If the exchange succeeds, send the user to the reset password page.
    if (!error) {
      return NextResponse.redirect(new URL("/reset-password", request.url));
    }
  }

  // If no code was present or the exchange failed, redirect to the home page.
  return NextResponse.redirect(new URL("/", request.url));
}
