export type Scholarship = {
  id: string;
  name: string;
  provider: string;
  amount: string;
  deadline: string;
  daysLeft: number;
  category: string;
  match?: number;
  description: string;
  color: string;
  initials: string;
  eligibility: string[];
  benefits: string[];
  documents: string[];
  officialApplicationUrl?: string;
  officialSourceUrl?: string;
  location?: string;
  isCommunitySubmitted?: boolean;
};

export const scholarships: Scholarship[] = [
  {
    id: "bright-futures",
    name: "Bright Futures Fellowship",
    provider: "The Horizon Foundation",
    amount: "$12,000",
    deadline: "Nov 23, 2026",
    daysLeft: 12,
    category: "Undergraduate",
    match: 98,
    description:
      "A year-round award for curious, community-minded students building a brighter future through education.",
    color: "from-[#059669] to-[#059669]",
    initials: "HF",
    eligibility: ["Undergraduate student", "GPA of 3.2 or higher", "Demonstrated community involvement"],
    benefits: ["Up to $12,000 in tuition support", "Mentorship with industry leaders", "Renewable for up to 4 years"],
    documents: ["Academic transcript", "Personal statement", "One letter of recommendation"],
  },
  {
    id: "stem-leaders",
    name: "Future STEM Leaders Award",
    provider: "Northstar Education",
    amount: "$8,500",
    deadline: "Dec 05, 2026",
    daysLeft: 24,
    category: "STEM",
    match: 94,
    description:
      "Supporting the next generation of problem-solvers in science, technology, engineering, and math.",
    color: "from-[#047857] to-[#059669]",
    initials: "NE",
    eligibility: ["Enrolled in a STEM program", "Minimum GPA of 3.0", "US resident or citizen"],
    benefits: ["$8,500 one-time award", "Career development workshops", "Access to an alumni network"],
    documents: ["Current transcript", "Proof of enrollment", "Short essay on a STEM challenge"],
  },
  {
    id: "community-impact",
    name: "Community Impact Scholarship",
    provider: "Goodwell Partners",
    amount: "$5,000",
    deadline: "Dec 18, 2026",
    daysLeft: 37,
    category: "Community",
    match: 89,
    description:
      "For students who turn their care for their community into real, lasting change.",
    color: "from-[#334155] to-[#0f172a]",
    initials: "GP",
    eligibility: ["Enrolled at an accredited college", "At least 100 volunteer hours", "All fields of study welcome"],
    benefits: ["$5,000 toward education expenses", "Featured community project", "Service leadership cohort"],
    documents: ["Service-hour record", "Project summary", "Educator reference"],
  },
  {
    id: "first-generation",
    name: "First Generation Scholars Fund",
    provider: "Open Path Initiative",
    amount: "$10,000",
    deadline: "Jan 04, 2027",
    daysLeft: 54,
    category: "First-generation",
    match: 86,
    description:
      "Making the path to a degree more accessible for first-generation college students.",
    color: "from-[#64748b] to-[#334155]",
    initials: "OP",
    eligibility: ["First in immediate family to attend college", "Full-time undergraduate", "Financial need considered"],
    benefits: ["Up to $10,000 per academic year", "Peer support community", "Renewable funding"],
    documents: ["Financial aid summary", "Enrollment confirmation", "Personal essay"],
  },
];

export const applications = [
  { id: "bright-futures", title: "Bright Futures Fellowship", provider: "The Horizon Foundation", status: "In progress", progress: 68, date: "Nov 23, 2026", tone: "blue" as const },
  { id: "stem-leaders", title: "Future STEM Leaders Award", provider: "Northstar Education", status: "Submitted", progress: 100, date: "Dec 05, 2026", tone: "green" as const },
  { id: "community-impact", title: "Community Impact Scholarship", provider: "Goodwell Partners", status: "Draft", progress: 32, date: "Dec 18, 2026", tone: "amber" as const },
];

export const upcomingDeadlines = [
  { title: "Bright Futures Fellowship", date: "Nov 23", color: "bg-[#f2a64a]" },
  { title: "Future STEM Leaders", date: "Dec 05", color: "bg-[#059669]" },
  { title: "Community Impact", date: "Dec 18", color: "bg-[#059669]" },
];
