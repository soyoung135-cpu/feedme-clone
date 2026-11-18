import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { ProfileForm } from "@/components/profile-form";
import { createClient } from "@/lib/server";

export default async function SettingsPage() {
  const supabase = await createClient();

  // 세션 사용자 값이 아니라 서버에서 검증한 클레임으로 판단한다.
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", data.claims.sub)
    .single();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">설정</h1>
        <LogoutButton />
      </div>
      <p className="text-sm text-muted-foreground">{data.claims.email}</p>
      <ProfileForm initialName={profile?.display_name ?? ""} userId={data.claims.sub} />
    </main>
  );
}
