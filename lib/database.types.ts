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
  batch_key: string | null;
  batch_position: number | null;
  business_name: string;
  destination_url: string;
  maps_url: string | null;
  notes: string | null;
  active: boolean;
  locked: boolean;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
};

type RedirectRouteInsert = {
  id?: string;
  owner_id: string;
  slug: string;
  batch_key?: string | null;
  batch_position?: number | null;
  business_name: string;
  destination_url: string;
  maps_url?: string | null;
  notes?: string | null;
  active?: boolean;
  locked?: boolean;
};

type RedirectRouteUpdate = Partial<
  Omit<RedirectRouteInsert, "owner_id"> & {
    scan_count: number;
    last_scanned_at: string | null;
  }
>;

export type ShopStory = {
  id: string;
  shop_name: string;
  caption: string;
  alt_text: string;
  image_path: string | null;
  installed_on: string | null;
  before_count: number | null;
  after_count: number | null;
  before_date: string | null;
  after_date: string | null;
  source_url: string | null;
  display_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      shop_stories: {
        Row: ShopStory;
        Insert: Omit<ShopStory, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<ShopStory, "id" | "created_at">>;
        Relationships: [];
      };
      redirect_routes: {
        Row: RedirectRoute;
        Insert: RedirectRouteInsert;
        Update: RedirectRouteUpdate;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_active_staff: {
        Args: Record<never, never>;
        Returns: boolean;
      };
      resolve_redirect: {
        Args: { p_slug: string };
        Returns: Array<{
          route_state: "active" | "inactive";
          destination_url: string | null;
        }>;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
