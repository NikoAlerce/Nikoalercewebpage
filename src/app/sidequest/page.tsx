import { redirect } from "next/navigation";

// Sidequest is now a sub-category of "Art on Tezos" — keep the old URL working.
export default function SideQuestPage() {
  redirect("/art-on-tezos?tab=sidequest");
}
