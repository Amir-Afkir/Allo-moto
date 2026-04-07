import { redirect } from "next/navigation";
import { requireAdminSession } from "@/app/_features/ops/lib/auth";

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  await requireAdminSession();
  redirect("/ops/fleet");
}
