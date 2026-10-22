"use server";

import {
  generateLecturerBriefing,
  type BriefingResult,
} from "@/features/lecturer/ai-briefing";

export async function submitLecturerBriefing(formData: FormData): Promise<BriefingResult> {
  return generateLecturerBriefing({ kind: "idle" }, formData);
}
