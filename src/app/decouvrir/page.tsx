import { redirect } from "next/navigation";

/**
 * Découvrir a pris la racine. Cette adresse a pu partir dans des partages,
 * elle ne doit pas tomber en 404.
 */
export default function DecouvrirPage() {
  redirect("/");
}
