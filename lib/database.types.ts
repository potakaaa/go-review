export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StaffRole = "admin" | "superadmin";
export type StaffSection =
  | "routes"
  | "analytics"
  | "convert"
  | "stories"
  | "staff";
export type RouteAccessLevel = "view" | "manage";

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
  publication_status: "draft" | "published";
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
  publication_status?: "draft" | "published";
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
      is_password_change_required: {
        Args: Record<never, never>;
        Returns: boolean;
      };
      get_my_staff_profile: {
        Args: Record<never, never>;
        Returns: Array<{
          user_id: string;
          role: StaffRole;
          must_change_password: boolean;
        }>;
      };
      get_my_staff_permissions: {
        Args: Record<never, never>;
        Returns: Array<{
          section: StaffSection;
          can_view: boolean;
          can_manage: boolean;
        }>;
      };
      complete_password_change: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      admin_list_staff: {
        Args: Record<never, never>;
        Returns: Array<{
          user_id: string;
          email: string | null;
          role: StaffRole;
          active: boolean;
          must_change_password: boolean;
          created_at: string;
          created_by: string | null;
        }>;
      };
      admin_list_staff_permissions: {
        Args: { p_user_id: string };
        Returns: Array<{
          section: StaffSection;
          can_view: boolean;
          can_manage: boolean;
        }>;
      };
      admin_list_route_access: {
        Args: { p_user_id: string };
        Returns: Array<{
          route_id: string;
          access_level: RouteAccessLevel;
        }>;
      };
      admin_register_staff: {
        Args: {
          p_user_id: string;
          p_role: StaffRole;
          p_permissions?: Json;
          p_route_access?: Json;
        };
        Returns: boolean;
      };
      admin_update_staff: {
        Args: {
          p_user_id: string;
          p_role: StaffRole;
          p_active: boolean;
          p_permissions?: Json;
          p_route_access?: Json;
        };
        Returns: boolean;
      };
      admin_mark_password_change_required: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      batch_update_routes: {
        Args: {
          p_route_ids: string[];
          p_business_names: string[];
          p_destination_url: string;
          p_maps_url: string | null;
        };
        Returns: number;
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
