import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { beforeEach, describe, expect, it } from "vitest";
import { asStudent, quote, sql, workdir, apiUrl } from "./stu02-test-helpers.mjs";

let student: string;
let other: string;
let lecturer: string;
let course: string;
let slot: string;
let overlap: string;
let adjacent: string;
const topic = "SQL joins";
const questions = "How does LEFT JOIN preserve unmatched rows?";

async function lookup(id = slot, owner = student) {
  const result = await asStudent(owner, `public.get_request_slot(${quote(id)}::uuid)`);
  expect(result.kind, "fixture must actually be eligible before exercising a write").toBe(
    "success",
  );
  expect(result.slot.slotId).toBe(id);
  return result.slot.slotVersion as string;
}
async function request(
  id: string,
  version: string,
  owner = student,
  key = randomUUID(),
  text = topic,
  start = "",
) {
  return asStudent(
    owner,
    `public.request_consultation(${quote(id)}::uuid,${quote(version)},${quote(text)},${quote(questions)},${quote(key)}::uuid)`,
    start,
  );
}
const barrier = () =>
  `select pg_sleep(greatest(0,extract(epoch from (${quote(new Date(Date.now() + 1200).toISOString())}::timestamptz - clock_timestamp()))));`;

describe("STU-02 real PostgreSQL request invariants", () => {
  beforeEach(async () => {
    [student, other, lecturer, course, slot, overlap, adjacent] = Array.from({ length: 7 }, () =>
      randomUUID(),
    );
    await sql(`insert into auth.users(id) values (${quote(student)}),(${quote(other)}),(${quote(lecturer)});
      update public.profiles set role='lecturer' where id=${quote(lecturer)};
      insert into public.courses(id,code,name) values (${quote(course)},${quote(`STU02-${course.replaceAll("-", "").slice(0, 12).toUpperCase()}`)},'Verifier course');
      insert into public.course_lecturers(course_id,lecturer_id) values (${quote(course)},${quote(lecturer)});
      insert into public.consultation_slots(id,course_id,lecturer_id,starts_at,ends_at) values
      (${quote(slot)},${quote(course)},${quote(lecturer)},'2098-01-01 01:00Z','2098-01-01 02:00Z'),
      (${quote(overlap)},${quote(course)},${quote(lecturer)},'2098-01-01 01:30Z','2098-01-01 02:30Z'),
      (${quote(adjacent)},${quote(course)},${quote(lecturer)},'2098-01-01 02:00Z','2098-01-01 03:00Z');`);
    const identity = await asStudent(
      student,
      "jsonb_build_object('id',auth.uid(),'role',public.current_app_role())",
    );
    expect(identity).toEqual({ id: student, role: "student" });
  });

  it("[STU-02-AC19] lookup inherits canonical UTC-Z timestamp projection from SH-03-R11", async () => {
    const result = await asStudent(student, `public.get_request_slot(${quote(slot)}::uuid)`);
    expect(result.kind).toBe("success");
    expect(result.slot.startsAt).toMatch(/Z$/);
    expect(result.slot.endsAt).toMatch(/Z$/);
    expect(Object.keys(result.slot).sort()).toEqual(
      [
        "slotId",
        "courseId",
        "courseCode",
        "courseName",
        "lecturerId",
        "lecturerName",
        "startsAt",
        "endsAt",
        "slotVersion",
      ].sort(),
    );
  });

  it("[STU-02-AC5] simultaneous Students competing for one eligible slot have exactly one winner", async () => {
    const version = await lookup();
    const start = barrier();
    const results = await Promise.all([
      request(slot, version, student, randomUUID(), topic, start),
      request(slot, version, other, randomUUID(), topic, start),
    ]);
    expect(results.filter((r) => r.kind === "success")).toHaveLength(1);
    expect(results.find((r) => r.kind !== "success")).toMatchObject({
      kind: "conflict",
      reason: "slot_unavailable",
    });
    expect(
      await sql(
        `select count(*) from public.bookings where slot_id=${quote(slot)} and status='pending'`,
      ),
    ).toEqual(["1"]);
  });

  it("[STU-02-AC6] simultaneous overlapping slots serialize per Student; adjacency succeeds", async () => {
    const versions = await Promise.all([lookup(), lookup(overlap)]);
    const start = barrier();
    const results = await Promise.all([
      request(slot, versions[0], student, randomUUID(), topic, start),
      request(overlap, versions[1], student, randomUUID(), topic, start),
    ]);
    expect(results.filter((r) => r.kind === "success")).toHaveLength(1);
    expect(results.find((r) => r.kind !== "success")).toMatchObject({
      kind: "conflict",
      reason: "student_overlap",
    });
  });

  it("[STU-02-AC6] half-open adjacent intervals both succeed for the same Student", async () => {
    expect((await request(slot, await lookup())).kind).toBe("success");
    expect((await request(adjacent, await lookup(adjacent))).kind).toBe("success");
  });

  it("[STU-02-AC10] concurrent identical intents and response-loss replay return the same identity", async () => {
    const version = await lookup();
    const key = randomUUID();
    const start = barrier();
    const results = await Promise.all([
      request(slot, version, student, key, topic, start),
      request(slot, version, student, key, topic, start),
    ]);
    expect(results[0].kind).toBe("success");
    expect(results[1]).toEqual(results[0]);
    // Discard original success as if transport lost it, then replay exactly.
    expect(await request(slot, version, student, key)).toEqual(results[0]);
    expect(await request(slot, version, student, key, "Changed topic")).toMatchObject({
      kind: "conflict",
      reason: "idempotency_mismatch",
    });
    expect(
      await asStudent(other, `public.recover_consultation(${quote(key)}::uuid)`),
    ).toMatchObject({ kind: "forbidden_or_not_found" });
    expect(await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`)).toEqual([
      "1",
    ]);
  });

  it("[STU-02-AC7] [STU-02-AC11] terminal replay preserves history while a fresh intent can rebook", async () => {
    const version = await lookup();
    const key = randomUUID();
    const first = await request(slot, version, student, key);
    expect(first.kind).toBe("success");
    await sql(
      `update public.bookings set status='cancelled' where id=${quote(first.receipt.bookingId)}`,
    );
    const before = await sql(
      `select row_to_json(b)::text from public.bookings b where id=${quote(first.receipt.bookingId)}`,
    );
    expect((await request(slot, version, student, key)).receipt).toEqual({
      ...first.receipt,
      status: "cancelled",
    });
    const next = await request(slot, await lookup());
    expect(next.kind).toBe("success");
    expect(next.receipt.bookingId).not.toBe(first.receipt.bookingId);
    expect(
      await sql(
        `select row_to_json(b)::text from public.bookings b where id=${quote(first.receipt.bookingId)}`,
      ),
    ).toEqual(before);
  });

  it("[STU-02-AC12] stale reviewed times cannot silently create a reservation", async () => {
    const version = await lookup();
    await sql(
      `update public.consultation_slots set starts_at=starts_at+interval '1 day',ends_at=ends_at+interval '1 day' where id=${quote(slot)}`,
    );
    expect(await request(slot, version)).toMatchObject({
      kind: "conflict",
      reason: "slot_changed",
    });
    expect(await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`)).toEqual([
      "0",
    ]);
  });

  it.each(["past", "start-now", "course", "lecturer", "role", "assignment", "completed"])(
    "[STU-02-AC3] %s invalidates an otherwise eligible slot without insert",
    async (condition) => {
      const version = await lookup();
      const mutations: Record<string, string> = {
        past: `update public.consultation_slots set starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' where id=${quote(slot)}`,
        "start-now": `update public.consultation_slots set starts_at=clock_timestamp(),ends_at=clock_timestamp()+interval '1 hour' where id=${quote(slot)}`,
        course: `update public.courses set is_active=false where id=${quote(course)}`,
        lecturer: `update public.profiles set is_active=false where id=${quote(lecturer)}`,
        role: `update public.profiles set role='student' where id=${quote(lecturer)}`,
        assignment: `update public.course_lecturers set is_active=false where course_id=${quote(course)}`,
        completed: `insert into public.bookings(slot_id,student_id,status,topic,questions) values (${quote(slot)},${quote(other)},'completed','historic','historic')`,
      };
      await sql(mutations[condition]);
      expect(await request(slot, version)).toMatchObject({
        kind: "conflict",
        reason: "slot_unavailable",
      });
      expect(
        await sql(
          `select count(*) from public.bookings where slot_id=${quote(slot)} and status='pending'`,
        ),
      ).toEqual(["0"]);
    },
  );

  it("[STU-02-AC3] database rejects invalid ranges before they can become requestable", async () => {
    await expect(
      sql(`update public.consultation_slots set ends_at=starts_at where id=${quote(slot)}`),
    ).rejects.toThrow(/check constraint/);
    expect(await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`)).toEqual([
      "0",
    ]);
  });

  it("[STU-02-AC6] existing approved overlap blocks but disjoint requests succeed", async () => {
    const created = await request(slot, await lookup());
    expect(created.kind).toBe("success");
    await sql(
      `update public.bookings set status='approved' where id=${quote(created.receipt.bookingId)}`,
    );
    expect(await request(overlap, await lookup(overlap))).toMatchObject({
      kind: "conflict",
      reason: "student_overlap",
    });
    await sql(
      `update public.consultation_slots set starts_at=starts_at+interval '2 days',ends_at=ends_at+interval '2 days' where id=${quote(adjacent)}`,
    );
    expect((await request(adjacent, await lookup(adjacent))).kind).toBe("success");
  });

  it.each(["rejected", "completed"])(
    "[STU-02-AC7] [STU-02-AC11] %s replay preserves original identity and current status",
    async (status) => {
      const version = await lookup();
      const key = randomUUID();
      const created = await request(slot, version, student, key);
      expect(created.kind).toBe("success");
      await sql(
        `update public.bookings set status=${quote(status)},rejection_reason=${status === "rejected" ? "'Cannot attend'" : "null"} where id=${quote(created.receipt.bookingId)}`,
      );
      const before = await sql(
        `select row_to_json(b)::text from public.bookings b where id=${quote(created.receipt.bookingId)}`,
      );
      expect((await request(slot, version, student, key)).receipt).toEqual({
        ...created.receipt,
        status,
      });
      const fresh = await request(slot, version);
      expect(fresh.kind).toBe(status === "rejected" ? "success" : "conflict");
      expect(
        await sql(
          `select row_to_json(b)::text from public.bookings b where id=${quote(created.receipt.bookingId)}`,
        ),
      ).toEqual(before);
    },
  );

  it.each(["admin", "lecturer", "inactive"])(
    "[STU-02-AC8] %s cannot call any of the three request RPCs",
    async (actor) => {
      const version = await lookup();
      const key = randomUUID();
      if (actor === "inactive")
        await sql(`update public.profiles set is_active=false where id=${quote(student)}`);
      else await sql(`update public.profiles set role=${quote(actor)} where id=${quote(student)}`);
      expect(await asStudent(student, `public.get_request_slot(${quote(slot)}::uuid)`)).toEqual({
        kind: "forbidden_or_not_found",
      });
      expect(await asStudent(student, `public.recover_consultation(${quote(key)}::uuid)`)).toEqual({
        kind: "forbidden_or_not_found",
      });
      expect(await request(slot, version, student, key)).toEqual({
        kind: "forbidden_or_not_found",
      });
      expect(
        await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`),
      ).toEqual(["0"]);
    },
  );

  it("[STU-02-AC8] signed-out database role cannot execute request RPCs", async () => {
    const version = await lookup();
    for (const expression of [
      `public.get_request_slot(${quote(slot)}::uuid)`,
      `public.recover_consultation(${quote(randomUUID())}::uuid)`,
      `public.request_consultation(${quote(slot)}::uuid,${quote(version)},'Topic','Question',${quote(randomUUID())}::uuid)`,
    ]) {
      await expect(
        sql(`begin; set local role anon; select ${expression}; rollback;`),
      ).rejects.toThrow(/permission denied/);
    }
  });

  it("[STU-02-AC18] real successful and failed mutations leave ai_usage unchanged", async () => {
    const before = await sql("select count(*) from public.ai_usage");
    const version = await lookup();
    expect((await request(slot, version)).kind).toBe("success");
    expect((await request(slot, version)).kind).toBe("conflict");
    expect((await request(overlap, await lookup(overlap), student, randomUUID(), " ")).kind).toBe(
      "validation_error",
    );
    expect(await sql("select count(*) from public.ai_usage")).toEqual(before);
  });

  it.each(["course", "assignment", "lecturer"])(
    "[STU-02-AC13] concurrent %s deactivation is serialized with reservation",
    async (target) => {
      const version = await lookup();
      const mutations: Record<string, string> = {
        course: `update public.courses set is_active=false where id=${quote(course)}`,
        assignment: `update public.course_lecturers set is_active=false where course_id=${quote(course)}`,
        lecturer: `update public.profiles set is_active=false where id=${quote(lecturer)}`,
      };
      const marker = `stu02-${randomUUID()}`;
      const mutation = sql(
        `begin; set local application_name=${quote(marker)}; ${mutations[target]}; select pg_sleep(2); commit;`,
      );
      let locked = false;
      for (let n = 0; n < 20 && !locked; n++) {
        const states = await sql(
          `select count(*) from pg_stat_activity where application_name=${quote(marker)} and wait_event='PgSleep'`,
        );
        locked = states[0] === "1";
        if (!locked) await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(locked, "setup must confirm mutation holds the lock before booking starts").toBe(true);
      const result = await request(slot, version);
      await mutation;
      expect(result).toMatchObject({ kind: "conflict", reason: "slot_unavailable" });
      expect(
        await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`),
      ).toEqual(["0"]);
    },
  );

  it("[STU-02-AC13] lock wait crossing start time refuses using fresh database time", async () => {
    await sql(
      `update public.consultation_slots set starts_at=clock_timestamp()+interval '1 second',ends_at=clock_timestamp()+interval '1 hour' where id=${quote(slot)}`,
    );
    const version = await lookup();
    const marker = `stu02-${randomUUID()}`;
    const holding = sql(
      `begin; set local application_name=${quote(marker)}; select id from public.consultation_slots where id=${quote(slot)} for update; select pg_sleep(2); commit;`,
    );
    let locked = false;
    for (let n = 0; n < 20 && !locked; n++) {
      locked =
        (
          await sql(
            `select count(*) from pg_stat_activity where application_name=${quote(marker)} and wait_event='PgSleep'`,
          )
        )[0] === "1";
      if (!locked) await new Promise((resolve) => setTimeout(resolve, 25));
    }
    expect(locked).toBe(true);
    const result = await request(slot, version);
    await holding;
    expect(result).toMatchObject({ kind: "conflict", reason: "slot_unavailable" });
    expect(await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`)).toEqual([
      "0",
    ]);
  });

  it("[STU-02-AC16] database lock timeout produces definite rollback and safe retry", async () => {
    const version = await lookup();
    const key = randomUUID();
    const marker = `stu02-${randomUUID()}`;
    const holding = sql(
      `begin; set local application_name=${quote(marker)}; select id from public.consultation_slots where id=${quote(slot)} for update; select pg_sleep(6.5); commit;`,
    );
    let locked = false;
    for (let n = 0; n < 20 && !locked; n++) {
      locked =
        (
          await sql(
            `select count(*) from pg_stat_activity where application_name=${quote(marker)} and wait_event='PgSleep'`,
          )
        )[0] === "1";
      if (!locked) await new Promise((resolve) => setTimeout(resolve, 25));
    }
    expect(locked).toBe(true);
    const result = await request(slot, version, student, key);
    expect(result).toMatchObject({ kind: "temporarily_unavailable" });
    await holding;
    expect(await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`)).toEqual([
      "0",
    ]);
    expect((await request(slot, version, student, key)).kind).toBe("success");
  });

  it("[STU-02-AC16] real authenticated PostgREST enforces a total statement budget across successive locks", async () => {
    const status = JSON.parse(
      execFileSync("npx", ["supabase", "status", "--workdir", workdir, "-o", "json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
    const publicKey = status.ANON_KEY ?? status.PUBLISHABLE_KEY;
    const email = `stu02-budget-${randomUUID()}@example.test`;
    const password = "Fictional-fixture-Only-291!";
    const signup = await fetch(`${apiUrl}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: publicKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(signup.ok, "public auth fixture creation succeeds").toBe(true);
    const user = (await signup.json()).user;
    await sql(`update auth.users set email_confirmed_at=now() where id=${quote(user.id)}`);
    const signin = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: publicKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(signin.ok).toBe(true);
    const session = await signin.json();
    student = user.id;
    const headers = {
      apikey: publicKey,
      authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
    const lookupResponse = await fetch(`${apiUrl}/rest/v1/rpc/get_request_slot`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_slot_id: slot }),
    });
    expect(lookupResponse.ok, "real HTTP role lookup validates auth before timeout test").toBe(
      true,
    );
    const result = await lookupResponse.json();
    expect(result.kind).toBe("success");
    const version = result.slot.slotVersion;
    const key = randomUUID();
    const markers = Array.from({ length: 3 }, () => `stu02-budget-${randomUUID()}`);
    const holders = [
      sql(
        `begin; set local application_name=${quote(markers[0])}; select id from public.profiles where id=${quote(student)} for update; select pg_sleep(4); commit;`,
      ),
      sql(
        `begin; set local application_name=${quote(markers[1])}; select id from public.consultation_slots where id=${quote(slot)} for update; select pg_sleep(8); commit;`,
      ),
      sql(
        `begin; set local application_name=${quote(markers[2])}; select id from public.courses where id=${quote(course)} for update; select pg_sleep(12); commit;`,
      ),
    ];
    try {
      let ready = false;
      for (let n = 0; n < 20 && !ready; n++) {
        ready =
          (
            await sql(
              `select count(*) from pg_stat_activity where application_name in (${markers.map(quote).join(",")}) and wait_event='PgSleep'`,
            )
          )[0] === "3";
        if (!ready) await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(ready, "three real independent locks must be held before timing").toBe(true);
      const began = performance.now();
      const response = await fetch(`${apiUrl}/rest/v1/rpc/request_consultation`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          p_slot_id: slot,
          p_slot_version: version,
          p_topic: topic,
          p_questions: questions,
          p_idempotency_key: key,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const duration = performance.now() - began;
      const body = await response.json();
      console.info("STU02 total-budget observation", {
        elapsedMs: Math.round(duration),
        httpStatus: response.status,
        outcome: body.kind ?? body.code,
      });
      expect(duration, "top-level 10s budget, with 1s scheduling allowance").toBeLessThan(11000);
      expect(
        body.kind === "temporarily_unavailable" || body.code === "57014",
        "actual SQL cancellation must be safe and attributable",
      ).toBe(true);
      expect(
        await sql(`select count(*) from public.bookings where slot_id=${quote(slot)}`),
      ).toEqual(["0"]);
    } finally {
      await Promise.all(holders);
    }
    expect((await request(slot, version, student, key)).kind).toBe("success");
  });
});
