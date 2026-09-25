import { FlashToast, type FlashTone } from "@/components/feedback";

/**
 * Server-side entry point for a redirect outcome. A fresh id per render
 * remounts the toast, so saving the same page twice announces both saves.
 */
export function Flash({
  tone = "success",
  title,
  description,
  params,
}: {
  tone?: FlashTone;
  title: string;
  description?: string;
  /** The query parameters that carried this outcome; removed once shown. */
  params: readonly string[];
}) {
  const flashId = crypto.randomUUID();
  return (
    <FlashToast
      key={flashId}
      flashId={flashId}
      tone={tone}
      title={title}
      description={description}
      params={params}
    />
  );
}
