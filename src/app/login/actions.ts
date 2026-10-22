"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export interface LoginState {
  error: string | null;
}

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  // Same message for every failure, so the form does not reveal which emails exist.
  if (error) return { error: "Incorrect email or password." };

  // The password was correct, so saying the account is deactivated reveals nothing new. Without
  // this, a deactivated user is signed in and silently bounced back to /login (ADM-01: "Signed-
  // out/inactive user: login guidance only").
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .single();
  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "This account has been deactivated. Contact an administrator." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
