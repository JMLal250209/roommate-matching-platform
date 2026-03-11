import { ANIMAL_PROFILES } from "./animalArchetypes.js";

const NAME_SETS = {
  owl: ["Noah", "Priya", "Ethan", "Ava"],
  dog: ["Liam", "Maya", "Ben", "Sofia"],
  cat: ["Chloe", "Sam", "Ruby", "Mason"],
  panda: ["Emma", "Leo", "Nia", "Jack"],
  wolf: ["Kai", "Iris", "Zane", "Mila"],
  turtle: ["Holly", "Owen", "Grace", "Finn"],
  fox: ["Riley", "Casey", "Morgan", "Jordan"],
  rabbit: ["Luca", "Hana", "Nora", "Eli"],
};

const COURSES = [
  "Computer Science, 2nd Year",
  "Business, 3rd Year",
  "Biomedical Science, 1st Year",
  "Mechanical Engineering, Final Year",
];

const INTEREST_SETS = [
  ["Gaming", "Tech", "Coffee"],
  ["Reading", "Hiking", "Cooking"],
  ["Gym", "Films", "Travel"],
  ["Music", "Sports", "Societies"],
];

const TRAIT_SETS = [
  ["Good communicator", "Neat kitchen person", "Studious weekdays, social weekends"],
  ["Friendly but respects space", "Minimalist / clutter-free", "Headphones for music"],
  ["Flexible, calm, low conflict", "Guest-friendly (with notice)", "Late schedule, quiet, tidy"],
  ["Social, group-oriented, energetic", "Quiet, independent, tidy", "Likes shared meals sometimes"],
];

const HOUSING_SETS = [
  {
    budgetMin: 550,
    budgetMax: 900,
    moveIn: "next_month",
    roomType: "single",
    area: "city",
    leaseMonths: 12,
    amenities: ["Near campus", "Bills included", "Washing machine"],
    notes: "Happy with a tidy shared kitchen and occasional group dinner.",
  },
  {
    budgetMin: 500,
    budgetMax: 850,
    moveIn: "flexible",
    roomType: "shared",
    area: "either",
    leaseMonths: 9,
    amenities: ["Near public transport", "Quiet area", "Bike storage"],
    notes: "Prefer calm evenings during weekdays and low-noise nights.",
  },
  {
    budgetMin: 650,
    budgetMax: 1050,
    moveIn: "asap",
    roomType: "studio",
    area: "suburbs",
    leaseMonths: 6,
    amenities: ["Parking", "Dishwasher", "Garden / outdoor space"],
    notes: "Can move quickly if commute and lease terms are right.",
  },
  {
    budgetMin: 600,
    budgetMax: 980,
    moveIn: "this_month",
    roomType: "any",
    area: "city",
    leaseMonths: 10,
    amenities: ["Ensuite bathroom", "Near campus", "Accessible / step-free"],
    notes: "Open to most setups as long as everyone communicates clearly.",
  },
];

const ABOUT_STYLE = {
  owl: { schedule: "late", noise: "quiet", cleanliness: "very_clean", studySocial: "mostly_study" },
  dog: { schedule: "normal", noise: "lively", cleanliness: "average", studySocial: "often_out" },
  cat: { schedule: "normal", noise: "quiet", cleanliness: "very_clean", studySocial: "balanced" },
  panda: { schedule: "normal", noise: "neutral", cleanliness: "average", studySocial: "balanced" },
  wolf: { schedule: "late", noise: "lively", cleanliness: "average", studySocial: "often_out" },
  turtle: { schedule: "early", noise: "quiet", cleanliness: "very_clean", studySocial: "mostly_study" },
  fox: { schedule: "normal", noise: "neutral", cleanliness: "average", studySocial: "balanced" },
  rabbit: { schedule: "early", noise: "quiet", cleanliness: "very_clean", studySocial: "mostly_study" },
};

export function getFellowAnimalProfiles(animal = "panda") {
  const safeAnimal = ANIMAL_PROFILES[animal] ? animal : "panda";
  const names = NAME_SETS[safeAnimal] || NAME_SETS.panda;
  const about = ABOUT_STYLE[safeAnimal] || ABOUT_STYLE.panda;

  return names.map((displayName, idx) => {
    const housing = HOUSING_SETS[idx % HOUSING_SETS.length];

    return {
      id: `${safeAnimal}-${idx + 1}`,
      animal: safeAnimal,
      displayName,
      course: COURSES[idx % COURSES.length],
      bio: `${displayName} is a ${ANIMAL_PROFILES[safeAnimal].label.toLowerCase()}-type housemate who values respectful shared living and clear communication.`,
      interests: INTEREST_SETS[idx % INTEREST_SETS.length],
      traits: TRAIT_SETS[idx % TRAIT_SETS.length],
      smoking: idx % 3 === 0 ? "sometimes" : "no",
      okayWithSmoking: idx % 2 === 0 ? "no" : "yes",
      pets: idx % 3 === 1 ? "yes" : "no",
      okayWithPets: "yes",
      photoUrl: ANIMAL_PROFILES[safeAnimal].image,
      ...about,
      ...housing,
    };
  });
}

export function getFellowProfileById(animal = "panda", profileId = "") {
  return getFellowAnimalProfiles(animal).find((profile) => profile.id === profileId) || null;
}
