import { generateSlug } from "@/lib/slug";

/** Seven readable random characters form the shared prefix for one print run. */
export const BATCH_KEY_LENGTH = 7;
export const BATCH_MIN_SIZE = 2;
export const BATCH_MAX_SIZE = 100;
export const BATCH_KEY_PATTERN = new RegExp(
  `^[A-Za-z0-9]{${BATCH_KEY_LENGTH}}$`,
);

export function generateBatchKey(): string {
  return generateSlug(BATCH_KEY_LENGTH);
}

/** `akfiuex` + `3` -> `akfiuex-3`. */
export function batchSlug(batchKey: string, position: number): string {
  return `${batchKey}-${position}`;
}

export function batchZipFileName(batchKey: string): string {
  return `review-routes-${batchKey}.zip`;
}
