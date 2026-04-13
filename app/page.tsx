import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: todos } = await supabase.from("todos").select();

  return (
    <main className="flex justify-center">
      <div className="w-4/5 min-h-screen flex flex-col items-center justify-center ">
        <span className="text-8xl">Food Decider</span>
        <span className="text-3xl">
          Can't decide your next meal? Let fate (and flavor) choose for you 🍜✨
        </span>
        <div>
          <Button variant="outline" className="mr-2 w-40 h-15 text-3xl">
            <Link href="/login">Log in</Link>
          </Button>
          <Button
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
