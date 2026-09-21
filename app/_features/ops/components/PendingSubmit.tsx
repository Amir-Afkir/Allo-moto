"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@/app/_shared/ui/Button";

export function PendingSubmit() {
  const { pending } = useFormStatus();
  return <Button as="button" type="submit" ariaLabel="Enregistrer le vehicule"
    variant="accent" size="lg" disabled={pending}>
    {pending ? "Enregistrement…" : "Enregistrer"}
  </Button>;
}
