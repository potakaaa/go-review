import { redirect } from "next/navigation";

/** No marketing surface: the root is just a doorway to the admin tool. */
export default function Home() {
  redirect("/dashboard");
}
