import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FLASH_COOKIE, serializeFlash } from "@/lib/admin/flashCookie";

// For server actions that finish by returning to a list page: the
// success message is shown there by the dashboard toaster
// (src/components/admin/AdminToaster.tsx). Like redirect(), never
// returns.
export async function redirectWithFlash(path: string, message: string): Promise<never> {
  (await cookies()).set(FLASH_COOKIE, serializeFlash({ tone: "success", message }), {
    path: "/admin",
    maxAge: 60,
    sameSite: "lax",
    // Read and cleared by client JS, and holds nothing sensitive.
    httpOnly: false,
  });
  redirect(path);
}
