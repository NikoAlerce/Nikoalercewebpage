import { redirect } from "next/navigation";

// Works is now a sub-category of "Art on Tezos" — keep the old URL working.
export default function WorksPage() {
  redirect("/art-on-tezos?tab=works");
}
