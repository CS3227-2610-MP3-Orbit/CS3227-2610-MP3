#!/usr/bin/env node
// Seeds fictional sample data so testers can try every role without setting it up by hand.
//
//   node workflow/scripts/seed-sample-data.mjs <local|dev|prod>
//
// dev/prod read <DEV|PROD>_SUPABASE_URL and <DEV|PROD>_SUPABASE_SECRET_KEY from .env.secrets
// (override with SECRETS_FILE). local reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from
// the environment (see tests/integration/local-supabase-env.mjs). The accounts must already exist:
// LECTURER_EMAIL and STUDENT_EMAIL default to the User Guide test accounts.
//
// Safe to run again: it only adds what is missing. Courses, assignments and announcements are
// matched by code or title, sample bookings by topic, and open slots are topped up to OPEN_SLOTS
// future slots. It never edits or deletes existing rows. The service-role client bypasses the
// app's role checks, so the schedule below follows the same rules itself: slots start at least
// a day ahead (except the one past slot that shows a completed booking) and never overlap.

import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const ENVIRONMENTS = { dev: "DEV", prod: "PROD" };
const DEFAULT_ACCOUNTS = {
  local: { lecturer: "demo-lecturer@localhost.test", student: "demo-student@localhost.test" },
  dev: { lecturer: "lecturer@example.com", student: "student@example.com" },
  prod: { lecturer: "lecturer@example.com", student: "student@example.com" },
};
const OPEN_SLOTS = 6;
const SLOT_MINUTES = 30;
const SGT_OFFSET_HOURS = 8;

const COURSES = [
  { code: "CS3227", name: "Agentic Software Engineering" },
  { code: "CS2103", name: "Software Engineering" },
];

const ANNOUNCEMENTS = [
  {
    kind: "guideline",
    title: "Preparing for a consultation",
    body: "Add your questions when you request a slot and bring any code or notes you want to discuss. Cancel at least a day ahead if you can no longer attend.",
  },
  {
    kind: "announcement",
    title: "Extra consultation slots this week",
    body: "Lecturers have added extra slots ahead of the project deadline. Book early, as slots are first come, first served.",
  },
];

// [days from today (SGT), start hour (SGT), course code]: candidates for open slots, used in order.
const OPEN_SLOT_SCHEDULE = [
  [2, 10, "CS3227"],
  [3, 14, "CS2103"],
  [5, 11, "CS3227"],
  [7, 15, "CS3227"],
  [9, 10, "CS2103"],
  [12, 16, "CS3227"],
  [14, 11, "CS2103"],
  [16, 14, "CS3227"],
  [19, 10, "CS3227"],
  [21, 15, "CS2103"],
];

// One booking per status; a past approved booking is shown as completed.
const SAMPLE_BOOKINGS = [
  {
    day: 4,
    hour: 9,
    course: "CS3227",
    status: "pending",
    topic: "Sample: feedback on my project specification",
    questions: "Is my acceptance criteria list precise enough to write tests from?",
  },
  {
    day: 6,
    hour: 9,
    course: "CS3227",
    status: "approved",
    topic: "Sample: reviewing my agent handoff notes",
    questions: "Which fields should a handoff note always include?",
  },
  {
    day: 8,
    hour: 9,
    course: "CS2103",
    status: "rejected",
    topic: "Sample: help with the week 5 quiz",
    questions: "Can we go through the quiz answers?",
    rejectionReason:
      "Quiz answers are covered in the tutorial. Please book again for project questions.",
  },
  {
    day: -2,
    hour: 10,
    course: "CS3227",
    status: "approved",
    topic: "Sample: completed consultation on test design",
    questions: "How do I test intent rather than wording?",
  },
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Reads KEY=value lines, ignoring comments and surrounding whitespace. */
function readSecrets(file) {
  const entries = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).trim()]);
  return Object.fromEntries(entries);
}

function connectionFor(environment) {
  if (environment === "local") {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      secretKey: process.env.SUPABASE_SECRET_KEY,
      missing: "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required for local",
    };
  }
  const prefix = ENVIRONMENTS[environment];
  const secrets = readSecrets(process.env.SECRETS_FILE ?? ".env.secrets");
  return {
    url: secrets[`${prefix}_SUPABASE_URL`],
    secretKey: secrets[`${prefix}_SUPABASE_SECRET_KEY`],
    missing: `${prefix}_SUPABASE_URL and ${prefix}_SUPABASE_SECRET_KEY are required`,
  };
}

/** A slot window `days` after today's Singapore date, starting at `hour` SGT. */
function sgtWindow(days, hour) {
  const sgtNow = new Date(Date.now() + SGT_OFFSET_HOURS * 3_600_000);
  const start = new Date(
    Date.UTC(
      sgtNow.getUTCFullYear(),
      sgtNow.getUTCMonth(),
      sgtNow.getUTCDate() + days,
      hour - SGT_OFFSET_HOURS,
    ),
  );
  return { start, end: new Date(start.getTime() + SLOT_MINUTES * 60_000) };
}

function overlaps(slot, window) {
  return new Date(slot.starts_at) < window.end && new Date(slot.ends_at) > window.start;
}

function check(error, action) {
  if (error) fail(`could not ${action}: ${error.message}`);
}

async function userIdByEmail(supabase, email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    check(error, "list users");
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user.id;
    if (data.users.length < 1000) fail(`no account for ${email}; create it with create-user.mjs`);
  }
}

async function activeProfile(supabase, id, role, email) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", id)
    .single();
  check(error, `read the profile of ${email}`);
  if (data.role !== role || !data.is_active) fail(`${email} must be an active ${role}`);
}

const [environment] = process.argv.slice(2);
if (!(environment in DEFAULT_ACCOUNTS)) fail("usage: seed-sample-data.mjs <local|dev|prod>");

const { url, secretKey, missing } = connectionFor(environment);
if (!url || !secretKey) fail(missing);

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const lecturerEmail = (
  process.env.LECTURER_EMAIL ?? DEFAULT_ACCOUNTS[environment].lecturer
).toLowerCase();
const studentEmail = (
  process.env.STUDENT_EMAIL ?? DEFAULT_ACCOUNTS[environment].student
).toLowerCase();
const created = { courses: 0, assignments: 0, announcements: 0, slots: 0, bookings: 0 };

const lecturerId = await userIdByEmail(supabase, lecturerEmail);
const studentId = await userIdByEmail(supabase, studentEmail);
await activeProfile(supabase, lecturerId, "lecturer", lecturerEmail);
await activeProfile(supabase, studentId, "student", studentEmail);

const { data: admin, error: adminError } = await supabase
  .from("profiles")
  .select("id")
  .eq("role", "admin")
  .eq("is_active", true)
  .order("created_at")
  .limit(1)
  .maybeSingle();
check(adminError, "find an administrator");
if (!admin) fail("no active administrator to author the announcements");

// Courses, matched case-insensitively by code like the unique index.
const courseIds = {};
for (const course of COURSES) {
  const { data: existing, error } = await supabase
    .from("courses")
    .select("id, is_active")
    .ilike("code", course.code)
    .maybeSingle();
  check(error, `look up ${course.code}`);
  if (existing && !existing.is_active) fail(`${course.code} exists but is deactivated`);
  if (existing) {
    courseIds[course.code] = existing.id;
    continue;
  }
  const { data: inserted, error: insertError } = await supabase
    .from("courses")
    .insert(course)
    .select("id")
    .single();
  check(insertError, `create ${course.code}`);
  courseIds[course.code] = inserted.id;
  created.courses += 1;
}

for (const courseId of Object.values(courseIds)) {
  const { data: assignment, error } = await supabase
    .from("course_lecturers")
    .select("id")
    .eq("course_id", courseId)
    .eq("lecturer_id", lecturerId)
    .eq("is_active", true)
    .maybeSingle();
  check(error, "look up a course assignment");
  if (assignment) continue;
  const { error: insertError } = await supabase
    .from("course_lecturers")
    .insert({ course_id: courseId, lecturer_id: lecturerId });
  check(insertError, "assign the lecturer to a course");
  created.assignments += 1;
}

for (const announcement of ANNOUNCEMENTS) {
  const { data: existing, error } = await supabase
    .from("announcements")
    .select("id")
    .eq("title", announcement.title)
    .limit(1);
  check(error, `look up "${announcement.title}"`);
  if (existing.length) continue;
  const { error: insertError } = await supabase.from("announcements").insert({
    ...announcement,
    is_published: true,
    created_by: admin.id,
    updated_by: admin.id,
  });
  check(insertError, `publish "${announcement.title}"`);
  created.announcements += 1;
}

const { data: slots, error: slotsError } = await supabase
  .from("consultation_slots")
  .select("id, starts_at, ends_at, is_active")
  .eq("lecturer_id", lecturerId);
check(slotsError, "read the lecturer's slots");
const activeSlots = slots.filter((slot) => slot.is_active);

async function createSlot(courseCode, window) {
  const { data, error } = await supabase
    .from("consultation_slots")
    .insert({
      lecturer_id: lecturerId,
      course_id: courseIds[courseCode],
      starts_at: window.start.toISOString(),
      ends_at: window.end.toISOString(),
    })
    .select("id, starts_at, ends_at, is_active")
    .single();
  check(error, "create a slot");
  activeSlots.push(data);
  created.slots += 1;
  return data.id;
}

// Sample bookings, each on its own slot, matched by topic so a rerun does not repeat them.
for (const sample of SAMPLE_BOOKINGS) {
  const { data: existing, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("student_id", studentId)
    .eq("topic", sample.topic)
    .limit(1);
  check(error, `look up "${sample.topic}"`);
  if (existing.length) continue;
  const window = sgtWindow(sample.day, sample.hour);
  if (activeSlots.some((slot) => overlaps(slot, window))) continue;
  const slotId = await createSlot(sample.course, window);
  const { error: insertError } = await supabase.from("bookings").insert({
    slot_id: slotId,
    student_id: studentId,
    status: sample.status,
    topic: sample.topic,
    questions: sample.questions,
    rejection_reason: sample.rejectionReason ?? null,
  });
  check(insertError, `create "${sample.topic}"`);
  created.bookings += 1;
}

// Top up open future slots. A slot is open when no pending or approved booking holds it.
const heldIds = new Set();
if (activeSlots.length) {
  const { data: held, error: heldError } = await supabase
    .from("bookings")
    .select("slot_id")
    .in(
      "slot_id",
      activeSlots.map((slot) => slot.id),
    )
    .in("status", ["pending", "approved"]);
  check(heldError, "read held slots");
  for (const booking of held) heldIds.add(booking.slot_id);
}
let openSlots = activeSlots.filter(
  (slot) => new Date(slot.starts_at) > new Date() && !heldIds.has(slot.id),
).length;
for (const [day, hour, course] of OPEN_SLOT_SCHEDULE) {
  if (openSlots >= OPEN_SLOTS) break;
  const window = sgtWindow(day, hour);
  if (activeSlots.some((slot) => overlaps(slot, window))) continue;
  await createSlot(course, window);
  openSlots += 1;
}

console.log(
  `seeded ${environment}: ${created.courses} courses, ${created.assignments} assignments, ` +
    `${created.announcements} announcements, ${created.slots} slots, ${created.bookings} bookings ` +
    `(${openSlots} open future slots for ${lecturerEmail})`,
);
