import type { NamedRoute } from "@/lib/batch-edit";
import type { RoutePlatform } from "@/lib/platforms";

export type BatchEditRoute = NamedRoute & {
  slug: string;
  active: boolean;
  locked: boolean;
  scan_count: number;
  platform: RoutePlatform;
};
