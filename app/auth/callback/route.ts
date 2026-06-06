import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// This route handles the Supabase OAuth callback after sign-in.
// It exchanges the authorization code for a session and then redirects
// the user to the dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // If Supabase returned an authorization code, create a server-side
  // Supabase client with the request cookies and exchange the code
  // for a valid auth session.
  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect the user to the dashboard regardless of whether the exchange
  // succeeded or not. Error handling can be added if needed.
  return NextResponse.redirect(`${origin}/dashboard`);
}
