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

export function mapBackendProfileToProfileView(profile, userName = "") {
  const source = profile || {};
  const budgetMin = Number(source.budgetMin);
  const budgetMax = Number(source.budgetMax);
  const cleanlinessValue =
    BACKEND_TO_CLEANLINESS[String(source.cleanliness || "").toLowerCase()] ||
    DEFAULT_ABOUT.cleanliness;
  const socialValue =
    BACKEND_TO_STUDY_SOCIAL[String(source.socialPreference || "").toLowerCase()] ||
    DEFAULT_ABOUT.studySocial;

  return {
    photoUrl: source.photoUrl || "",
    displayName: userName || "",
    bio: source.bio || source.routine || "",
    year: source.year || "",
    course: source.course || "",
    budgetMin: Number.isFinite(budgetMin) ? budgetMin : DEFAULT_HOUSING.budgetMin,
    budgetMax: Number.isFinite(budgetMax) ? budgetMax : DEFAULT_HOUSING.budgetMax,
    moveIn: source.moveIn || DEFAULT_HOUSING.moveIn,
    roomType: source.roomType || DEFAULT_HOUSING.roomType,
    area: source.area || DEFAULT_HOUSING.area,
    leaseMonths: Number(source.leaseMonths) || DEFAULT_HOUSING.leaseMonths,
    amenities: normalizeArray(source.amenities),
    notes: source.housingNotes || source.notes || "",
    schedule: inferScheduleFromWakeTime(source.wakeTime),
    noise: BACKEND_TO_NOISE[source.noise_level] || DEFAULT_ABOUT.noise,
    cleanliness: cleanlinessValue,
    studySocial: socialValue,
    smoking: boolToYesNo(Boolean(source.smoker)),
    okayWithSmoking: boolToYesNo(Boolean(source.smokersOk)),
    pets: boolToYesNo(Boolean(source.hasPets)),
    okayWithPets:
      source.petsOk === undefined
        ? DEFAULT_ABOUT.okayWithPets
        : boolToYesNo(Boolean(source.petsOk)),
    interests: normalizeArray(source.interests),
    traits: normalizeArray(source.traits),
  };
}

export function mapProfileViewToBackendProfile(viewProfile) {
  const source = viewProfile || {};
  const times = SCHEDULE_TO_TIMES[source.schedule] || SCHEDULE_TO_TIMES.normal;

  return {
    photoUrl: source.photoUrl || "",
    bio: source.bio || "",
    routine: source.bio || "",
    course: source.course || "",
    year: source.year || "",
    wakeTime: times.wakeTime,
    bedtime: times.bedtime,
    socialPreference: STUDY_SOCIAL_TO_BACKEND[source.studySocial] || "Medium",
    cleanliness: CLEANLINESS_TO_BACKEND[source.cleanliness] || "Medium",
    smoker: toBoolYesNo(source.smoking),
    smokersOk: toBoolYesNo(source.okayWithSmoking),
    hasPets: toBoolYesNo(source.pets),
    petsOk: toBoolYesNo(source.okayWithPets),
    noise_level: NOISE_TO_BACKEND[source.noise] || "moderate",
    interests: normalizeArray(source.interests),
    traits: normalizeArray(source.traits),
    cooking: normalizeArray(source.interests).includes("Cooking") ? "Sometimes" : "Never",
    budgetMin: Number(source.budgetMin) || DEFAULT_HOUSING.budgetMin,
    budgetMax: Number(source.budgetMax) || DEFAULT_HOUSING.budgetMax,
    moveIn: source.moveIn || DEFAULT_HOUSING.moveIn,
    roomType: source.roomType || DEFAULT_HOUSING.roomType,
    area: source.area || DEFAULT_HOUSING.area,
    leaseMonths: Number(source.leaseMonths) || DEFAULT_HOUSING.leaseMonths,
    amenities: normalizeArray(source.amenities),
    housingNotes: source.notes || "",
  };
}
