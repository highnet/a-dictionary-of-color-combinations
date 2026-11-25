import { notFound } from "next/navigation";

/** Any path no route matches: render the localized not-found page. */
export default function Missing() {
  notFound();
}
