"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { requirePermission } from "@/lib/permissions";
import {
  QrTooLongError,
  encodeQrContent,
  fieldsProblem,
  qrFieldsSchema,
  qrMatrix,
  qrStyleSchema,
  styleProblem,
} from "@/lib/static-qr";

export type QrFormState = { error?: string };
export type QrChangeResult = { ok: true } | { ok: false; message: string };

function parseJson(value: FormDataEntryValue | null): unknown {
  try {
    return typeof value === "string" ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

/** Saves a design to the library. A failure stays on the form with the design intact. */
export async function saveQrCode(_state: QrFormState, form: FormData): Promise<QrFormState> {
  try {
    return await save(form);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[qr-codes] save_failed", error);
    return { error: "The QR code could not be saved. Refresh the page and try again." };
  }
}

async function save(form: FormData): Promise<QrFormState> {
  const { supabase } = await requirePermission("routes", "manage");

  const rawId = form.get("id");
  const id = rawId ? z.uuid().safeParse(rawId) : null;
  if (id && !id.success) return { error: "Invalid QR code." };

  const label = String(form.get("label") ?? "").trim();
  if (!label) return { error: "Give this QR code a name so you can find it later." };
  if (label.length > 120) return { error: "Keep the name under 120 characters." };

  const fields = qrFieldsSchema.safeParse(parseJson(form.get("fields")));
  if (!fields.success) return { error: fields.error.issues[0]?.message ?? "Check the QR code details." };
  const fieldError = fieldsProblem(fields.data);
  if (fieldError) return { error: fieldError };

  const style = qrStyleSchema.safeParse(parseJson(form.get("style")));
  if (!style.success) return { error: "That style could not be read. Pick a preset and try again." };
  const styleError = styleProblem(style.data);
  if (styleError) return { error: styleError };

  // Recomputed here rather than trusted from the browser: what is stored is
  // exactly what the fields encode.
  const content = encodeQrContent(fields.data);
  try {
    qrMatrix(content, style.data.errorCorrection);
  } catch (error) {
    if (error instanceof QrTooLongError) return { error: error.message };
    throw error;
  }

  const values = {
    label,
    kind: fields.data.kind,
    fields: fields.data,
    content,
    style: style.data,
    updated_at: new Date().toISOString(),
  };

  const result = id
    ? await supabase.from("static_qr_codes").update(values).eq("id", id.data).select("id")
    : await supabase.from("static_qr_codes").insert(values).select("id");

  if (result.error) {
    console.error("[qr-codes] write_failed", { code: result.error.code });
    return { error: "The QR code could not be saved. Check your connection and try again." };
  }
  // RLS hides the row rather than failing the statement.
  if (!result.data?.length) return { error: "You have view-only access to QR codes." };

  revalidatePath("/dashboard/qr-codes");
  redirect(`/dashboard/qr-codes?saved=${id ? "updated" : "created"}`);
}

export async function toggleQrStar(formData: FormData): Promise<QrChangeResult> {
  const { supabase } = await requirePermission("routes", "manage");
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Invalid QR code." };
  const starred = formData.get("starred") === "true";

  const { data, error } = await supabase
    .from("static_qr_codes")
    .update({ starred })
    .eq("id", id.data)
    .select("id");
  if (error || !data?.length) {
    return { ok: false, message: "Could not update this QR code. Refresh and try again." };
  }
  revalidatePath("/dashboard/qr-codes");
  return { ok: true };
}

/**
 * Deleting only forgets the design. Printed copies keep working forever --
 * the payload lives in the pattern, not on our server.
 */
export async function deleteQrCode(formData: FormData): Promise<QrChangeResult> {
  const { supabase } = await requirePermission("routes", "manage");
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Invalid QR code." };

  const { data, error } = await supabase.from("static_qr_codes").delete().eq("id", id.data).select("id");
  if (error || !data?.length) {
    return { ok: false, message: "Could not delete this QR code. Refresh and try again." };
  }
  revalidatePath("/dashboard/qr-codes");
  redirect("/dashboard/qr-codes?saved=deleted");
}
