import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateVacancyForm } from "./CreateVacancyForm";

export default async function CreateVacancyPage() {
  // ── Auth check — server-side ───────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <CreateVacancyForm employerId={user.id} />;
}
