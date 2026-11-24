import { text } from "@/lib/api";
import { skillMarkdown } from "@/lib/skill";

export const dynamic = "force-static";

export function GET() {
  return text(skillMarkdown(), "text/markdown");
}
