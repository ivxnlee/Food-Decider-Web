import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: todos } = await supabase.from("todos").select();

  return (
    <main>
      <h1>Welcome</h1>
      <p>Your app description here.</p>
      <Link href="/login">Log in</Link>
      <Link href="/signup">Sign up</Link>

      <ul>
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </main>
  );
}
