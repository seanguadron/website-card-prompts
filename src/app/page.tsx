import { redirect } from "next/navigation";
import { TOOL_REGISTRY } from "@/lib/tool-registry";

export default function HomePage() {
  redirect(TOOL_REGISTRY["prompt-builder"].href);
}
