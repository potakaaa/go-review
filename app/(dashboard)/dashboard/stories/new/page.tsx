import { StoryForm } from "../story-form";
import { ButtonLink } from "@/components/ui";
import { requirePermission } from "@/lib/permissions";
export const metadata = { title: "Add shop story" };
export default async function NewStoryPage() {
  await requirePermission("stories", "manage");
  return <div className="mx-auto max-w-2xl"><ButtonLink href="/dashboard/stories" variant="ghost">← Shop stories</ButtonLink><h1 className="display-heading my-8 text-4xl">A story worth sharing.</h1><StoryForm /></div>;
}
