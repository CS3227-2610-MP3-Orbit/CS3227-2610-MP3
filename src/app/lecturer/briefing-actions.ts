"use server";

import {
  generateLecturerBriefing,
} from "@/features/lecturer/ai-briefing";

export async function submitLecturerBriefing(formData: FormData): Promise<void> {
  await generateLecturerBriefing({ kind: "idle" }, formData);
}
