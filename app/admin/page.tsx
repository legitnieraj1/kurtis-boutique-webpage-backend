import { redirect } from "next/navigation";

// Send /admin straight to the login screen. It used to redirect to
// /admin/dashboard and let the client-side guard bounce unauthenticated
// visitors onward, which meant two redirects and a blank screen first.
// The login page forwards already-signed-in admins to the dashboard.
export default function AdminRoot() {
    redirect("/admin/login");
}
