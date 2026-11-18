export type ScholarshipTextInput = {
  name?: string | null;
  provider?: string | null;
  description?: string | null;
  scholarship_type?: string | null;
  education_levels?: Array<string | null | undefined>;
  eligible_courses?: Array<string | null | undefined>;
  eligible_states?: Array<string | null | undefined>;
  benefits?: Array<string | null | undefined>;
  amount?: number | null;
  income_limit?: number | null;
  application_start_date?: string | null;
  application_deadline?: string | null;
  official_application_url?: string | null;
  official_source_url?: string | null;
  source_url?: string | null;
  academic_year?: string | null;
};

function sanitizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").replace(/[\u0000-\u001F\u007F]+/g, "").trim() ?? "";
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatList(value: Array<string | null | undefined> | null | undefined) {
  const clean = (value ?? []).map((item) => sanitizeText(item)).filter(Boolean);
  return clean.join(", ");
}

export function normalizeScholarshipText(input: ScholarshipTextInput): string {
  const sentences: string[] = [];

  const name = sanitizeText(input.name);
  const provider = sanitizeText(input.provider);
  if (name && provider) {
    sentences.push(`${name} is offered by ${provider}.`);
  } else if (name) {
    sentences.push(`${name}.`);
  }

  const description = sanitizeText(input.description);
  if (description) {
    sentences.push(`Description: ${description}.`);
  }

  const scholarshipType = sanitizeText(input.scholarship_type);
  if (scholarshipType) {
    sentences.push(`Scholarship type: ${scholarshipType}.`);
  }

  const educationLevels = formatList(input.education_levels);
  if (educationLevels) {
    sentences.push(`Eligible education levels: ${educationLevels}.`);
  }

  const eligibleCourses = formatList(input.eligible_courses);
  if (eligibleCourses) {
    sentences.push(`Eligible courses: ${eligibleCourses}.`);
  }

  const eligibleStates = formatList(input.eligible_states);
  if (eligibleStates) {
    sentences.push(`Eligible states: ${eligibleStates}.`);
  }

  const benefits = formatList(input.benefits);
  if (benefits) {
    sentences.push(`Scholarship benefits: ${benefits}.`);
  }

  const amount = formatCurrency(input.amount);
  if (amount) {
    sentences.push(`Award amount: ${amount}.`);
  }

  const incomeLimit = formatCurrency(input.income_limit);
  if (incomeLimit) {
    sentences.push(`Maximum household income: ${incomeLimit}.`);
  }

  const applicationStart = formatDate(input.application_start_date);
  if (applicationStart) {
    sentences.push(`Application opens: ${applicationStart}.`);
  }

  const applicationDeadline = formatDate(input.application_deadline);
  if (applicationDeadline) {
    sentences.push(`Application deadline: ${applicationDeadline}.`);
  }

  const academicYear = sanitizeText(input.academic_year);
  if (academicYear) {
    sentences.push(`Academic year: ${academicYear}.`);
  }

  const officialSourceUrl = sanitizeText(input.official_source_url);
  if (officialSourceUrl) {
    sentences.push(`Source: ${officialSourceUrl}.`);
  }

  return sentences.join(" ").trim();
}
