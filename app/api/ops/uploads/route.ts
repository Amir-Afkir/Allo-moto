import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/app/_features/ops/lib/auth";
import {
  removeVehicleImage,
  replaceVehicleImage,
} from "@/app/_features/ops/lib/image-upload";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");
  const upload = formData.get("file");
  const slugHint = formData.get("slugHint");
  const currentSrc = formData.get("currentSrc");

  if (intent === "remove") {
    await removeVehicleImage({
      slugHint: typeof slugHint === "string" ? slugHint : "",
      currentSrc: typeof currentSrc === "string" ? currentSrc : "",
    });

    return NextResponse.json({ src: null });
  }

  if (!(upload instanceof File) || upload.size === 0) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  if (!upload.type.startsWith("image/")) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  }

  const src = await replaceVehicleImage({
    file: upload,
    slugHint: typeof slugHint === "string" ? slugHint : "",
    currentSrc: typeof currentSrc === "string" ? currentSrc : "",
  });

  return NextResponse.json({ src });
}
