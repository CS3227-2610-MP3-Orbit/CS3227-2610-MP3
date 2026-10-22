"use server";

import {
  generateLecturerBriefing,
  type BriefingResult,
} from "@/features/lecturer/ai-briefing";

export async function submitLecturerBriefing(
  previousState: BriefingResult,
  formData: FormData,
): Promise<BriefingResult> {
  return generateLecturerBriefing(previousState, formData);
}
