import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAdminAction } from "@/app/_features/ops/actions/ops-actions";
import { isAdminAuthenticated } from "@/app/_features/ops/lib/auth";
import { Badge } from "@/app/_shared/ui/Badge";
import { Button } from "@/app/_shared/ui/Button";
import { Input } from "@/app/_shared/ui/Input";
import { Label } from "@/app/_shared/ui/Label";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion admin",
  description: "Acces prive a la gestion flotte et reservations.",
};

export default async function OpsLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await isAdminAuthenticated()) {
    redirect("/ops");
  }

  const resolvedSearchParams = await searchParams;
  const error =
    (Array.isArray(resolvedSearchParams?.error)
      ? resolvedSearchParams?.error[0]
      : resolvedSearchParams?.error) ?? null;

  return (
    <main className="app-shell -mt-[var(--chrome-offset)] py-12">
      <section className="section-shell">
        <div className="mx-auto max-w-xl section-band p-6 sm:p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="outline">Espace admin</Badge>
              <div className="space-y-2">
                <h1 className="heading-1 text-foreground">Connexion privee</h1>
                <p className="body-copy text-muted-foreground">
                  Accedez a la flotte, aux demandes de reservation et aux
                  indisponibilites depuis une interface simple.
                </p>
              </div>
            </div>

            {error === "invalid" ? (
              <div className="border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-foreground/80">
                Identifiant ou mot de passe incorrect.
              </div>
            ) : null}

            <form action={loginAdminAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="ops-username">Identifiant</Label>
                <Input id="ops-username" name="username" autoComplete="username" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ops-password">Mot de passe</Label>
                <Input
                  id="ops-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                />
              </div>

              <Button
                as="button"
                type="submit"
                ariaLabel="Se connecter a l'espace admin"
                variant="accent"
                size="lg"
              >
                Ouvrir l&apos;espace admin
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
