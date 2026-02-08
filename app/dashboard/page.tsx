import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
                <h1 className="text-6xl font-bold">
                    Welcome to{" "}
                    <span className="text-blue-600">
                        Dashboard!
                    </span>
                </h1>

                <p className="mt-3 text-2xl">
                    You are logged in as {user.email}
                </p>

                <div className="mt-6">
                    <form action="/auth/signout" method="post">
                        <button className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">
                            Sign out
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
