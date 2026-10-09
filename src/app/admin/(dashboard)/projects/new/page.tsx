import { redirect } from "next/navigation";

// Projects are created from their own area (Land or Apartment).
export default function Page() {
  redirect("/admin/projects");
}
