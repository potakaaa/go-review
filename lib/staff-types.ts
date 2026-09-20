import type {
  RouteAccessLevel,
  StaffRole,
  StaffSection,
} from "@/lib/database.types";

export const STAFF_SECTIONS: Array<{
  id: StaffSection;
  label: string;
  description: string;
}> = [
  { id: "routes", label: "Routes", description: "QR links and printed-card records" },
  { id: "analytics", label: "Analytics", description: "Scan counts and usage rankings" },
  { id: "convert", label: "Convert", description: "Google Maps review-link conversion" },
  { id: "stories", label: "Shop Stories", description: "Website story content and photos" },
  { id: "orders", label: "Orders", description: "Customer inquiries and order status" },
  { id: "staff", label: "Staff", description: "Other staff accounts and permissions" },
];

export type StaffMember = {
  user_id: string;
  email: string | null;
  role: StaffRole;
  active: boolean;
  must_change_password: boolean;
  /** null means access is limited to the routes listed in staff_route_access. */
  all_routes_access: RouteAccessLevel | null;
  created_at: string;
  created_by: string | null;
};

export type StaffPermissionRow = {
  section: StaffSection;
  can_view: boolean;
  can_manage: boolean;
};

export type StaffRouteAccessRow = {
  route_id: string;
  access_level: RouteAccessLevel;
};

export type StaffRouteOption = {
  id: string;
  business_name: string;
  slug: string;
  publication_status: "draft" | "published";
  /** Only shown to tell apart two routes that share a business name. */
  destination_url: string;
  created_at: string;
};

/** An existing account offered as a starting point in the access picker. */
export type StaffAccessPreset = {
  user_id: string;
  email: string | null;
  role: StaffRole;
  all_routes_access: RouteAccessLevel | null;
  access: StaffRouteAccessRow[];
};
