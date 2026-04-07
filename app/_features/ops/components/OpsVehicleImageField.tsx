"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export function OpsVehicleImageField({
  initialValue,
  slugHint = "",
  vehicleLabel,
}: {
  initialValue: string;
  slugHint?: string;
  vehicleLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(initialValue);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("intent", "upload");
      formData.append("file", file);
      formData.append("slugHint", slugHint);
      formData.append("currentSrc", value);

      const response = await fetch("/api/ops/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("upload");
      }

      const data = (await response.json()) as { src?: string };
      if (!data.src) {
        throw new Error("upload");
      }

      setValue(data.src);
    } catch {
      setError("L'image n'a pas pu etre importee.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleRemoveImage() {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("intent", "remove");
      formData.append("slugHint", slugHint);
      formData.append("currentSrc", value);

      const response = await fetch("/api/ops/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("remove");
      }

      setValue("");
    } catch {
      setError("L'image n'a pas pu etre supprimee.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="primaryImage" value={value} />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-pill border border-border/60 bg-surface/72 px-4 py-2 text-sm font-semibold text-foreground/74 transition-colors hover:bg-surface hover:text-foreground"
          disabled={isUploading}
        >
          {isUploading
            ? "Traitement..."
            : value
              ? "Modifier l'image"
              : "Importer une image"}
        </button>

        {value ? (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="rounded-pill border border-border/60 bg-surface/72 px-4 py-2 text-sm font-semibold text-foreground/74 transition-colors hover:bg-surface hover:text-foreground"
            disabled={isUploading}
          >
            Supprimer l&apos;image
          </button>
        ) : null}

        {value ? (
          <span className="text-sm text-muted-foreground">Image importee.</span>
        ) : (
          <span className="text-sm text-muted-foreground">Aucune image importee.</span>
        )}
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      {value ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{value}</p>
          <Image
            src={value}
            alt={vehicleLabel}
            width={160}
            height={112}
            className="h-28 w-40 rounded-card border border-border/60 object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}
