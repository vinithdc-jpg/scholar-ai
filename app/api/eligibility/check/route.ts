import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError, readJson } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

const schema = z.object({
  scholarship_id: z.number().int().positive(),
  profile: z.record(z.string(), z.unknown()).optional(),
});

function matches(actual: unknown, operator: string, expected: unknown) {
  const value = actual as string | number | undefined | null;
  switch (operator) {
    case "equals":
      return value === expected;
    case "not_equals":
      return value !== expected;
    case "greater_than":
      return (
        typeof value === "number" &&
        typeof expected === "number" &&
        value > expected
      );
    case "greater_than_or_equal":
      return (
        typeof value === "number" &&
        typeof expected === "number" &&
        value >= expected
      );
    case "less_than":
      return (
        typeof value === "number" &&
        typeof expected === "number" &&
        value < expected
      );
    case "less_than_or_equal":
      return (
        typeof value === "number" &&
        typeof expected === "number" &&
        value <= expected
      );
    case "in":
      return Array.isArray(expected) && expected.includes(value);
    case "not_in":
      return Array.isArray(expected) && !expected.includes(value);
    default:
      return false;
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const parsed = await readJson(request, schema);
  if (parsed.response) return parsed.response;

  try {
    const pool = getDatabasePool();
    const [scholarship, profile] = await Promise.all([
      pool.query(
        `SELECT id, name, official_source_url FROM scholarships
         WHERE id = $1 AND status = 'published' AND verification_status = 'verified'`,
        [parsed.data.scholarship_id],
      ),
      parsed.data.profile
        ? Promise.resolve({ rows: [parsed.data.profile], rowCount: 1 })
        : pool.query("SELECT * FROM student_profiles WHERE user_id = $1", [
            auth.user.id,
          ]),
    ]);

    if (!scholarship.rowCount) {
      return NextResponse.json(
        { error: "Scholarship not found." },
        { status: 404 },
      );
    }
    if (!profile.rowCount) {
      return NextResponse.json(
        {
          result: "more_information_required",
          missing_information: ["student profile"],
        },
        { status: 200 },
      );
    }

    const rules = await pool.query(
      "SELECT rule_field, operator, expected_value, is_mandatory, description FROM scholarship_eligibility WHERE scholarship_id = $1",
      [parsed.data.scholarship_id],
    );
    const student = profile.rows[0] as Record<string, unknown>;
    const outcomes = rules.rows.map((rule) => {
      const expected = rule.expected_value as unknown;
      const actual = student[rule.rule_field];
      return {
        field: rule.rule_field,
        description: rule.description,
        mandatory: rule.is_mandatory,
        matched:
          actual == null ? null : matches(actual, rule.operator, expected),
      };
    });
    const missing = outcomes.filter((item) => item.matched === null);
    const failed = outcomes.filter(
      (item) => item.matched === false && item.mandatory,
    );
    return NextResponse.json({
      result: failed.length
        ? "not_eligible"
        : missing.length
          ? "more_information_required"
          : "potentially_eligible",
      matched_conditions: outcomes.filter((item) => item.matched === true),
      failed_conditions: outcomes.filter((item) => item.matched === false),
      missing_information: missing.map((item) => item.field),
      source_url: scholarship.rows[0].official_source_url,
    });
  } catch (error) {
    return databaseError("Unable to check scholarship eligibility.", error);
  }
}
