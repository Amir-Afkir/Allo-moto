"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type ImageState = "keep" | "replace" | "remove";

export function OpsVehicleImageField({
  initialValue,
  vehicleLabel,
}: {
  initialValue: string;
  vehicleLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imageState, setImageState] = useState<ImageState>("keep");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearPendingSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setPendingFileName("");
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Selectionnez uniquement une image.");
      event.target.value = "";
      return;
    }

    clearPendingSelection();
    setPreviewUrl(URL.createObjectURL(file));
    setPendingFileName(file.name);
    setImageState("replace");
  }

  function handleRemoveOrReset() {
    if (imageState === "replace") {
      clearPendingSelection();
      setImageState("keep");
      return;
    }

    if (imageState === "remove") {
      setImageState("keep");
      setError(null);
      return;
    }

    if (initialValue) {
      clearPendingSelection();
      setImageState("remove");
      return;
    }

    clearPendingSelection();
    setImageState("keep");
  }

  const previewSource =
    imageState === "replace"
      ? (previewUrl ?? "")
      : imageState === "remove"
        ? ""
        : initialValue;
  const hasPreview = Boolean(previewSource);
  const showResetButton = imageState === "replace" || imageState === "remove";
  const showRemoveButton =
    !showResetButton && Boolean(initialValue);

  return (
    <div className="space-y-3">
      <input type="hidden" name="primaryImageState" value={imageState} />

      <input
        ref={inputRef}
        type="file"
        name="primaryImageFile"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-pill border border-border/60 bg-surface/72 px-4 py-2 text-sm font-semibold text-foreground/74 transition-colors hover:bg-surface hover:text-foreground"
        >
          {hasPreview || initialValue
            ? "Changer l'image"
            : "Importer une image"}
        </button>

        {showRemoveButton ? (
          <button
            type="button"
            onClick={handleRemoveOrReset}
            className="rounded-pill border border-border/60 bg-surface/72 px-4 py-2 text-sm font-semibold text-foreground/74 transition-colors hover:bg-surface hover:text-foreground"
          >
            Supprimer l&apos;image
          </button>
        ) : null}

        {showResetButton ? (
          <button
            type="button"
            onClick={handleRemoveOrReset}
            className="rounded-pill border border-border/60 bg-surface/72 px-4 py-2 text-sm font-semibold text-foreground/74 transition-colors hover:bg-surface hover:text-foreground"
          >
            Annuler le changement
          </button>
        ) : null}

        <span className="text-sm text-muted-foreground">
          {imageState === "replace"
            ? "Nouvelle image prete. Enregistrez pour l'appliquer."
            : imageState === "remove"
              ? "Suppression en attente. Enregistrez pour confirmer."
              : initialValue
                ? "Image active."
                : "Aucune image importee."}
        </span>
      </div>

      {pendingFileName ? (
        <p className="text-sm text-muted-foreground">{pendingFileName}</p>
      ) : null}

      {error ? <p className="text-sm text-error">{error}</p> : null}

      {hasPreview ? (
        <div className="space-y-2">
          <Image
            src={previewSource}
            alt={vehicleLabel}
            width={160}
            height={112}
            unoptimized={imageState === "replace"}
            className="h-28 w-40 rounded-card border border-border/60 object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}
