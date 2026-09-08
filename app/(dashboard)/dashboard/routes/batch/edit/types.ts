import type { NamedRoute } from "@/lib/batch-edit";

export type BatchEditRoute = NamedRoute & {
  slug: string;
  active: boolean;
  locked: boolean;
  scan_count: number;
};
