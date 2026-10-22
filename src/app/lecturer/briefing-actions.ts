"use server";

import { redirect } from "next/navigation";

import { generateLecturerBriefing } from "@/features/lecturer/ai-briefing";

export async function submitLecturerBriefing(formData: FormData): Promise<void> {
  const result = await generateLecturerBriefing(formData);
  const params = new URLSearchParams({
    briefing: result.kind,
    ...(result.kind === "error" ? { message: result.message } : {}),
  });
  redirect(`/lecturer?${params.toString()}`);
}
