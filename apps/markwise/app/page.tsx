import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { DynamicScreen } from "@/components/screen";

export default function Page() {
  return (
    <DynamicScreen>
      <Gate />
    </DynamicScreen>
  );
}

async function Gate() {
  await connection();
  const user = await requirePageUser();
  redirect(user.onboarded ? "/home" : "/onboarding");
  return null;
}
