const DEFAULT_HOUSING = {
  budgetMin: 400,
  budgetMax: 900,
  moveIn: "flexible",
  roomType: "any",
  area: "either",
  leaseMonths: 9,
  amenities: [],
  notes: "",
};

const DEFAULT_ABOUT = {
  displayName: "",
  course: "",
  year: "",
  schedule: "normal",
  noise: "neutral",
  cleanliness: "average",
  studySocial: "balanced",
  smoking: "no",
  okayWithSmoking: "no",
  pets: "no",
  okayWithPets: "yes",
  interests: [],
  traits: [],
  bio: "",
};

const SCHEDULE_TO_TIMES = {
  early: { wakeTime: "06:30", bedtime: "22:30" },
  normal: { wakeTime: "07:30", bedtime: "23:30" },
  late: { wakeTime: "10:00", bedtime: "01:00" },
};

const NOISE_TO_BACKEND = {
  quiet: "quiet",
  neutral: "moderate",
  lively: "loud",
};

const BACKEND_TO_NOISE = {
  quiet: "quiet",
  moderate: "neutral",
  loud: "lively",
};

const CLEANLINESS_TO_BACKEND = {
  very_clean: "High",
  average: "Medium",
  casual: "Low",
};

const BACKEND_TO_CLEANLINESS = {
  high: "very_clean",
  medium: "average",
  low: "casual",
};

const STUDY_SOCIAL_TO_BACKEND = {
  mostly_study: "Low",
  balanced: "Medium",
  often_out: "High",
};

const BACKEND_TO_STUDY_SOCIAL = {
  low: "mostly_study",
  medium: "balanced",
  high: "often_out",
};

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toBoolYesNo(value) {
  return value === "yes" || value === "sometimes";
}

function boolToYesNo(value, truthy = "yes", falsy = "no") {
  return value ? truthy : falsy;
}

function parseBudgetString(value) {
  const matches = String(value || "").match(/\d+/g);
  if (!matches || matches.length === 0) {
    return { budgetMin: undefined, budgetMax: undefined };
  }

  if (matches.length === 1) {
    const parsed = Number(matches[0]);
    return { budgetMin: parsed, budgetMax: parsed };
  }

  return {
    budgetMin: Number(matches[0]),
    budgetMax: Number(matches[1]),
  };
}

function inferScheduleFromWakeTime(wakeTime) {
  if (!wakeTime || typeof wakeTime !== "string") {
    return DEFAULT_ABOUT.schedule;
  }

  const hour = Number(wakeTime.split(":")[0]);
  if (Number.isNaN(hour)) return DEFAULT_ABOUT.schedule;

  if (hour <= 7) return "early";
  if (hour >= 10) return "late";
  return "normal";
}

export function createDefaultProfileDraft() {
  return {
    housing: { ...DEFAULT_HOUSING },
    about: { ...DEFAULT_ABOUT },
  };
}

export function mapFormToProfilePayload(draft) {
  const housing = { ...DEFAULT_HOUSING, ...(draft?.housing || {}) };
  const about = { ...DEFAULT_ABOUT, ...(draft?.about || {}) };

  const times = SCHEDULE_TO_TIMES[about.schedule] || SCHEDULE_TO_TIMES.normal;

  const profile = {
    course: about.course?.trim() || "",
    year: about.year?.trim() || "",
    wakeTime: times.wakeTime,
    bedtime: times.bedtime,
    socialPreference: STUDY_SOCIAL_TO_BACKEND[about.studySocial] || "Medium",
    cleanliness: CLEANLINESS_TO_BACKEND[about.cleanliness] || "Medium",
    smoker: toBoolYesNo(about.smoking),
    smokersOk: toBoolYesNo(about.okayWithSmoking),
    hasPets: toBoolYesNo(about.pets),
    petsOk: toBoolYesNo(about.okayWithPets),
    noise_level: NOISE_TO_BACKEND[about.noise] || "moderate",
    interests: normalizeArray(about.interests),
    traits: normalizeArray(about.traits),
    bio: about.bio?.trim() || "",
    routine: about.bio?.trim() || "",
    cooking: normalizeArray(about.interests).includes("Cooking") ? "Sometimes" : "Never",
    budgetMin: Number(housing.budgetMin) || DEFAULT_HOUSING.budgetMin,
    budgetMax: Number(housing.budgetMax) || DEFAULT_HOUSING.budgetMax,
    moveIn: housing.moveIn || DEFAULT_HOUSING.moveIn,
    roomType: housing.roomType || DEFAULT_HOUSING.roomType,
    area: housing.area || DEFAULT_HOUSING.area,
    leaseMonths: Number(housing.leaseMonths) || DEFAULT_HOUSING.leaseMonths,
    amenities: normalizeArray(housing.amenities),
    housingNotes: housing.notes?.trim() || "",
  };

  return {
    name: about.displayName?.trim() || "",
    profile,
  };
}

export function mapBackendProfileToDraft(profile, userName = "") {
  const source = profile || {};

  const budgetMin = Number(source.budgetMin);
  const budgetMax = Number(source.budgetMax);

  return {
    housing: {
      budgetMin: Number.isFinite(budgetMin) ? budgetMin : DEFAULT_HOUSING.budgetMin,
      budgetMax: Number.isFinite(budgetMax) ? budgetMax : DEFAULT_HOUSING.budgetMax,
      moveIn: source.moveIn || DEFAULT_HOUSING.moveIn,
      roomType: source.roomType || DEFAULT_HOUSING.roomType,
      area: source.area || DEFAULT_HOUSING.area,
      leaseMonths: Number(source.leaseMonths) || DEFAULT_HOUSING.leaseMonths,
      amenities: normalizeArray(source.amenities),
      notes: source.housingNotes || "",
    },
    about: {
      displayName: userName || "",
      course: source.course || "",
      year: source.year || "",
      schedule: inferScheduleFromWakeTime(source.wakeTime),
      noise: BACKEND_TO_NOISE[source.noise_level] || DEFAULT_ABOUT.noise,
      cleanliness:
        BACKEND_TO_CLEANLINESS[String(source.cleanliness || "").toLowerCase()] ||
        DEFAULT_ABOUT.cleanliness,
      studySocial:
        BACKEND_TO_STUDY_SOCIAL[String(source.socialPreference || "").toLowerCase()] ||
        DEFAULT_ABOUT.studySocial,
      smoking: boolToYesNo(Boolean(source.smoker)),
      okayWithSmoking: boolToYesNo(Boolean(source.smokersOk)),
      pets: boolToYesNo(Boolean(source.hasPets)),
      okayWithPets: boolToYesNo(Boolean(source.petsOk)),
      interests: normalizeArray(source.interests),
      traits: normalizeArray(source.traits),
      bio: source.bio || source.routine || "",
    },
  };
}

export function mapBackendProfileToProfileView(profile) {
  const source = profile || {};

  const budgetMin = source.budgetMin;
  const budgetMax = source.budgetMax;
  const budget =
    budgetMin !== undefined && budgetMax !== undefined
      ? `EUR ${budgetMin}-${budgetMax}/month`
      : "EUR 900/month";

  return {
    photoUrl: source.photoUrl || "",
    bio: source.bio || "I enjoy fun but also do need to study.",
    year: source.year || "2",
    course: source.course || "",
    budget,
    location: source.area || "City centre / suburbs",
    moveInDate: source.moveInDate || "",
    leaseLength: source.leaseMonths ? `${source.leaseMonths} months` : "6-12 months",
    smokersOk: Boolean(source.smokersOk),
    petsOk: source.petsOk === undefined ? true : Boolean(source.petsOk),
    quietHours: source.quietHours || "23:00 - 07:00",
    socialPreference: source.socialPreference || "Medium",
    routine: source.routine || "",
    cleanliness: source.cleanliness || "Medium",
    cooking: source.cooking || "Sometimes",
    bedtime: source.bedtime || "23:30",
    wakeTime: source.wakeTime || "07:30",
    notes: source.housingNotes || source.notes || "",
  };
}

export function mapProfileViewToBackendProfile(viewProfile) {
  const budget = parseBudgetString(viewProfile?.budget);
  const leaseMonthsMatch = String(viewProfile?.leaseLength || "").match(/\d+/);

  return {
    photoUrl: viewProfile?.photoUrl || "",
    bio: viewProfile?.bio || "",
    course: viewProfile?.course || "",
    year: viewProfile?.year || "",
    budgetMin: budget.budgetMin,
    budgetMax: budget.budgetMax,
    area: viewProfile?.location || "",
    moveInDate: viewProfile?.moveInDate || "",
    leaseMonths: leaseMonthsMatch ? Number(leaseMonthsMatch[0]) : undefined,
    smokersOk: Boolean(viewProfile?.smokersOk),
    petsOk: Boolean(viewProfile?.petsOk),
    quietHours: viewProfile?.quietHours || "",
    socialPreference: viewProfile?.socialPreference || "Medium",
    routine: viewProfile?.routine || "",
    cleanliness: viewProfile?.cleanliness || "Medium",
    cooking: viewProfile?.cooking || "Sometimes",
    bedtime: viewProfile?.bedtime || "23:30",
    wakeTime: viewProfile?.wakeTime || "07:30",
    housingNotes: viewProfile?.notes || "",
    notes: viewProfile?.notes || "",
  };
}
