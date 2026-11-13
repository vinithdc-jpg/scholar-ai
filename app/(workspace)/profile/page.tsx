"use client";

import {
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  BadgeCheck,
  Check,
  GraduationCap,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { ProgressBar, Surface } from "@/components/ui";
import { syncUserProfile } from "@/lib/auth";
import { auth } from "@/lib/firebase";

type ProfileForm = {
  date_of_birth: string;
  state: string;
  district: string;
  category: string;
  gender: string;
  education_level: string;
  course: string;
  institution: string;
  academic_year: string;
  family_income: string;
  percentage: string;
};

type StudentProfile = {
  date_of_birth: string | null;
  state: string | null;
  district: string | null;
  category: string | null;
  gender: string | null;
  education_level: string | null;
  course: string | null;
  institution: string | null;
  academic_year: string | null;
  family_income: number | string | null;
  percentage: number | string | null;
};

type StudentProfilePayload = {
  [K in keyof ProfileForm]: K extends "family_income" | "percentage"
    ? number | null
    : string | null;
};

const emptyProfile: ProfileForm = {
  date_of_birth: "",
  state: "",
  district: "",
  category: "",
  gender: "",
  education_level: "",
  course: "",
  institution: "",
  academic_year: "",
  family_income: "",
  percentage: "",
};

const inputClassName =
  "workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a] outline-none focus:border-[#a5b4fc] disabled:cursor-not-allowed disabled:opacity-60";

function toProfileForm(profile: StudentProfile | null): ProfileForm {
  return {
    date_of_birth: profile?.date_of_birth?.slice(0, 10) ?? "",
    state: profile?.state ?? "",
    district: profile?.district ?? "",
    category: profile?.category ?? "",
    gender: profile?.gender ?? "",
    education_level: profile?.education_level ?? "",
    course: profile?.course ?? "",
    institution: profile?.institution ?? "",
    academic_year: profile?.academic_year ?? "",
    family_income:
      profile?.family_income === null || profile?.family_income === undefined
        ? ""
        : String(profile.family_income),
    percentage:
      profile?.percentage === null || profile?.percentage === undefined
        ? ""
        : String(profile.percentage),
  };
}

async function requestStudentProfile(
  user: User,
  method: "GET" | "PUT",
  payload?: StudentProfilePayload,
): Promise<StudentProfile | null> {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/students/profile", {
    method,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
    cache: "no-store",
  });
  const result = (await response.json()) as {
    profile?: StudentProfile | null;
    error?: string;
    details?: { path: string; message: string }[];
  };

  if (!response.ok) {
    const details = result.details
      ?.map(({ path, message }) => `${path || "profile"}: ${message}`)
      .join("; ");
    throw new Error(
      [result.error ?? "Unable to load your student profile.", details]
        .filter(Boolean)
        .join(" "),
    );
  }

  return result.profile ?? null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function toOptionalNumber(value: string, label: string) {
  if (!value.trim()) return null;

  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Enter a valid ${label}.`);
  }
  return number;
}

export default function ProfilePage() {
  const [account, setAccount] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameNeedsSync, setNameNeedsSync] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    let requestId = 0;

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        const currentRequestId = ++requestId;
        if (!active) return;

        setAccount(user);
        const [givenName = "", ...familyNameParts] = (
          user?.displayName?.trim() ?? ""
        ).split(/\s+/);
        setFirstName(givenName);
        setLastName(familyNameParts.join(" "));
        setNameNeedsSync(false);
        setProfile({ ...emptyProfile });
        setSaved(false);
        setErrorMessage("");
        setIsLoaded(false);

        if (!user) {
          setIsLoading(false);
          setErrorMessage("Sign in to view and edit your profile.");
          return;
        }

        setIsLoading(true);
        void requestStudentProfile(user, "GET")
          .then((result) => {
            if (!active || currentRequestId !== requestId) return;
            setProfile(toProfileForm(result));
            setIsLoaded(true);
          })
          .catch((error: unknown) => {
            if (!active || currentRequestId !== requestId) return;
            setErrorMessage(getErrorMessage(error));
          })
          .finally(() => {
            if (active && currentRequestId === requestId) {
              setIsLoading(false);
            }
          });
      },
      (error) => {
        if (!active) return;
        setIsLoading(false);
        setErrorMessage(getErrorMessage(error));
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  function updateField<Field extends keyof ProfileForm>(
    field: Field,
    value: string,
  ) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setErrorMessage("");
  }

  function updateName(value: string, field: "first" | "last") {
    if (field === "first") {
      setFirstName(value);
    } else {
      setLastName(value);
    }
    setSaved(false);
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || !isLoaded) return;

    setIsSaving(true);
    setSaved(false);
    setErrorMessage("");
    let nameUpdated = false;

    try {
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const updatedDisplayName = [trimmedFirstName, trimmedLastName]
        .filter(Boolean)
        .join(" ");
      const nameChanged =
        updatedDisplayName !== (account.displayName?.trim() ?? "");
      const shouldSyncName = nameChanged || nameNeedsSync;
      if (!trimmedFirstName) {
        throw new Error("First name is required.");
      }
      if (updatedDisplayName.length > 255) {
        throw new Error("Your name must be 255 characters or fewer.");
      }

      const familyIncome = toOptionalNumber(
        profile.family_income,
        "family income",
      );
      const percentage = toOptionalNumber(profile.percentage, "percentage");

      if (familyIncome !== null && familyIncome < 0) {
        throw new Error("Family income cannot be negative.");
      }
      if (percentage !== null && (percentage < 0 || percentage > 100)) {
        throw new Error("Percentage must be between 0 and 100.");
      }

      const payload: StudentProfilePayload = {
        date_of_birth: profile.date_of_birth || null,
        state: profile.state.trim() || null,
        district: profile.district.trim() || null,
        category: profile.category.trim() || null,
        gender: profile.gender.trim() || null,
        education_level: profile.education_level.trim() || null,
        course: profile.course.trim() || null,
        institution: profile.institution.trim() || null,
        academic_year: profile.academic_year.trim() || null,
        family_income: familyIncome,
        percentage,
      };

      if (nameChanged) {
        await updateProfile(account, { displayName: updatedDisplayName });
        nameUpdated = true;
        setNameNeedsSync(true);
      }
      if (shouldSyncName) {
        await account.getIdToken(true);
        await syncUserProfile(account);
        setNameNeedsSync(false);
      }

      const updatedProfile = await requestStudentProfile(
        account,
        "PUT",
        payload,
      );
      if (!updatedProfile) {
        throw new Error("The server did not return the saved profile.");
      }

      setProfile(toProfileForm(updatedProfile));
      setSaved(true);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(
        nameUpdated || nameNeedsSync
          ? `Your name was updated, but the rest of your profile could not be saved: ${message}`
          : message,
      );
    } finally {
      setIsSaving(false);
    }
  }

  const filledFields = Object.values(profile).filter(
    (value) => value.trim().length > 0,
  ).length;
  const profileStrength = Math.round(
    (filledFields / Object.keys(profile).length) * 100,
  );
  const displayName = [firstName.trim(), lastName.trim()]
    .filter(Boolean)
    .join(" ");
  const formDisabled = !isLoaded || isSaving;
  const checklist = [
    ["Basic information", Boolean(profile.date_of_birth && profile.gender)],
    [
      "Education details",
      Boolean(
        profile.education_level &&
          profile.institution &&
          profile.academic_year,
      ),
    ],
    ["Academic interests", Boolean(profile.course)],
    ["Location", Boolean(profile.state && profile.district)],
  ] as const;

  return (
    <div className="mx-auto max-w-250">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6366f1]">
          Your details, your direction
        </p>
        <h1 className="mt-1 text-[27px] font-extrabold tracking-tighter text-[#0f172a] dark:text-white sm:text-[31px]">
          My profile
        </h1>
        <p className="mt-2 text-[12px] text-[#858c9e]">
          A little more about you helps us find more relevant opportunities.
        </p>
      </div>

      {isLoading && (
        <p className="mt-5 text-[12px] text-[#777f93]" role="status">
          Loading your profile…
        </p>
      )}
      {errorMessage && (
        <p
          className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[270px_1fr]">
        <aside className="space-y-4">
          <Surface className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-2xl bg-linear-to-br from-[#6366f1] to-[#312e81] text-[16px] font-bold text-white">
                {displayName
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("") || <UserRound size={22} />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-[#0f172a] dark:text-white">
                  {displayName || "Your account"}
                </p>
                <p className="mt-1 truncate text-[10px] text-[#9198a9]">
                  {account?.email ?? ""}
                </p>
              </div>
            </div>
            <div className="mt-5 border-t border-[#ddd6fe] pt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-[#777f93]">
                  Profile strength
                </p>
                <p className="text-[10px] font-bold text-[#6366f1]">
                  {profileStrength}%
                </p>
              </div>
              <ProgressBar value={profileStrength} />
              <p className="mt-2 text-[9px] leading-4 text-[#969cad]">
                Complete your student details to improve your matches.
              </p>
            </div>
          </Surface>

          <Surface className="p-4">
            <h2 className="text-[11px] font-bold text-[#464d63] dark:text-white">
              Profile checklist
            </h2>
            <div className="mt-3 space-y-3">
              {checklist.map(([item, complete]) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-[10px] text-[#778094]"
                >
                  <span
                    className={`grid size-4 place-items-center rounded-full ${complete ? "bg-[#eef2ff] text-[#312e81]" : "border border-[#ddd6fe] text-transparent"}`}
                  >
                    {complete && <Check size={10} />}
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </Surface>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Surface className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#e0e7ff] text-[#6366f1]">
                <UserRound size={16} />
              </span>
              <div>
                <h2 className="text-[13px] font-bold text-[#0f172a] dark:text-white">
                  Personal information
                </h2>
                <p className="mt-0.5 text-[9px] text-[#959cad]">
                  Name changes are saved to your Firebase account.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  First name
                </span>
                <input
                  value={firstName}
                  required
                  maxLength={255}
                  disabled={formDisabled}
                  autoComplete="given-name"
                  onChange={(event) =>
                    updateName(event.target.value, "first")
                  }
                  className={inputClassName}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Last name
                </span>
                <input
                  value={lastName}
                  maxLength={255}
                  disabled={formDisabled}
                  autoComplete="family-name"
                  onChange={(event) =>
                    updateName(event.target.value, "last")
                  }
                  className={inputClassName}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Email address
                </span>
                <input
                  value={account?.email ?? ""}
                  type="email"
                  readOnly
                  autoComplete="email"
                  className={`${inputClassName} read-only:bg-slate-50`}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Date of birth
                </span>
                <input
                  value={profile.date_of_birth}
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  disabled={formDisabled}
                  onChange={(event) =>
                    updateField("date_of_birth", event.target.value)
                  }
                  className={inputClassName}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Gender
                </span>
                <input
                  value={profile.gender}
                  maxLength={80}
                  disabled={formDisabled}
                  onChange={(event) =>
                    updateField("gender", event.target.value)
                  }
                  placeholder="Optional"
                  className={inputClassName}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Category
                </span>
                <input
                  value={profile.category}
                  maxLength={80}
                  disabled={formDisabled}
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                  placeholder="Optional"
                  className={inputClassName}
                />
              </label>
            </div>
          </Surface>

          <Surface className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#fef3c7] text-[#f59e0b]">
                <MapPin size={16} />
              </span>
              <div>
                <h2 className="text-[13px] font-bold text-[#0f172a] dark:text-white">
                  Location
                </h2>
                <p className="mt-0.5 text-[9px] text-[#959cad]">
                  Used to find opportunities available in your area.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  State
                </span>
                <input
                  value={profile.state}
                  maxLength={120}
                  disabled={formDisabled}
                  onChange={(event) => updateField("state", event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  District
                </span>
                <input
                  value={profile.district}
                  maxLength={120}
                  disabled={formDisabled}
                  onChange={(event) =>
                    updateField("district", event.target.value)
                  }
                  className={inputClassName}
                />
              </label>
            </div>
          </Surface>

          <Surface className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#fef3c7] text-[#f59e0b]">
                <GraduationCap size={16} />
              </span>
              <div>
                <h2 className="text-[13px] font-bold text-[#0f172a] dark:text-white">
                  Education
                </h2>
                <p className="mt-0.5 text-[9px] text-[#959cad]">
                  Tell us about your academic path.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Education level
                </span>
                <input
                  value={profile.education_level}
                  list="education-level-options"
                  maxLength={120}
                  disabled={formDisabled}
                  onChange={(event) =>
                    updateField("education_level", event.target.value)
                  }
                  className={inputClassName}
                />
                <datalist id="education-level-options">
                  <option value="High school" />
                  <option value="Undergraduate" />
                  <option value="Graduate" />
                  <option value="Doctoral" />
                  <option value="Trade or vocational" />
                </datalist>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Field of study
                </span>
                <input
                  value={profile.course}
                  list="course-options"
                  maxLength={255}
                  disabled={formDisabled}
                  onChange={(event) => updateField("course", event.target.value)}
                  className={inputClassName}
                />
                <datalist id="course-options">
                  <option value="Computer Science" />
                  <option value="Engineering" />
                  <option value="Business" />
                  <option value="Education" />
                  <option value="Health Sciences" />
                  <option value="Arts & Humanities" />
                </datalist>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  School or institution
                </span>
                <input
                  value={profile.institution}
                  maxLength={255}
                  disabled={formDisabled}
                  onChange={(event) =>
                    updateField("institution", event.target.value)
                  }
                  className={inputClassName}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Academic year
                </span>
                <input
                  value={profile.academic_year}
                  maxLength={32}
                  placeholder="e.g. 2026-2027"
                  disabled={formDisabled}
                  onChange={(event) =>
                    updateField("academic_year", event.target.value)
                  }
                  className={inputClassName}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Annual family income
                </span>
                <input
                  value={profile.family_income}
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={formDisabled}
                  onChange={(event) =>
                    updateField("family_income", event.target.value)
                  }
                  className={inputClassName}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#666e81]">
                  Academic percentage
                </span>
                <input
                  value={profile.percentage}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={formDisabled}
                  onChange={(event) =>
                    updateField("percentage", event.target.value)
                  }
                  className={inputClassName}
                />
              </label>
            </div>
          </Surface>

          <Surface className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="flex items-center gap-2 text-[10px] text-[#8990a2]">
              <BadgeCheck size={14} className="text-[#312e81]" />
              Your information helps personalize your recommendations.
            </p>
            <button
              type="submit"
              disabled={formDisabled}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-[10px] font-bold text-white hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={13} />
              {isSaving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <p
                role="status"
                className="w-full text-right text-[10px] font-semibold text-[#312e81]"
              >
                Your profile changes are saved.
              </p>
            )}
          </Surface>
        </form>
      </div>
    </div>
  );
}
