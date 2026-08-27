/**
 * Hand-maintained to match supabase/migrations/*.sql.
 *
 * Regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
 */

export type RedirectRoute = {
  id: string;
  owner_id: string;
  slug: string;
  slug_lower: string;
  business_name: string;
  destination_url: string;
  maps_url: string | null;
  notes: string | null;
  active: boolean;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
};

type RedirectRouteInsert = {
  id?: string;
  owner_id: string;
  slug: string;
  business_name: string;
  destination_url: string;
  maps_url?: string | null;
  notes?: string | null;
  active?: boolean;
};

type RedirectRouteUpdate = Partial<
  Omit<RedirectRouteInsert, "owner_id"> & {
    scan_count: number;
    last_scanned_at: string | null;
  }
>;

export type Database = {
  public: {
    Tables: {
      redirect_routes: {
        Row: RedirectRoute;
        Insert: RedirectRouteInsert;
        Update: RedirectRouteUpdate;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      increment_scan_count: {
        Args: { p_slug: string };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
