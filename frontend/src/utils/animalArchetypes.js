export const ANIMAL_PROFILES = {
  owl: {
    emoji: "\u{1F989}",
    label: "Owl",
    description: "Late schedule, quiet, tidy",
    traits: { schedule: "late", noise: "quiet", clean: "tidy", social: "low" },
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  dog: {
    emoji: "\u{1F415}",
    label: "Dog",
    description: "Social, flexible schedule, medium tidy",
    traits: { schedule: "flexible", noise: "moderate", clean: "medium", social: "high" },
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
  },
  cat: {
    emoji: "\u{1F431}",
    label: "Cat",
    description: "Quiet, independent, tidy",
    traits: { schedule: "flexible", noise: "quiet", clean: "tidy", social: "medium" },
    image:
      "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=1200&q=80",
  },
  panda: {
    emoji: "\u{1F43C}",
    label: "Panda",
    description: "Flexible, calm, low conflict",
    traits: { schedule: "flexible", noise: "quiet", clean: "medium", social: "medium" },
    image:
      "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=1200&q=80",
  },
  wolf: {
    emoji: "\u{1F43A}",
    label: "Wolf",
    description: "Social, group-oriented, energetic",
    traits: { schedule: "flexible", noise: "loud", clean: "medium", social: "high" },
    image:
      "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1200&q=80",
  },
  turtle: {
    emoji: "\u{1F422}",
    label: "Turtle",
    description: "Early riser, quiet, routine-based",
    traits: { schedule: "early", noise: "quiet", clean: "tidy", social: "low" },
    image:
      "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=1200&q=80",
  },
  fox: {
    emoji: "\u{1F98A}",
    label: "Fox",
    description: "Adaptable, medium social",
    traits: { schedule: "flexible", noise: "moderate", clean: "medium", social: "medium" },
    image:
      "https://images.unsplash.com/photo-1474511017892-55f68d5f9d42?auto=format&fit=crop&w=1200&q=80",
  },
  rabbit: {
    emoji: "\u{1F430}",
    label: "Rabbit",
    description: "Quiet, clean, low-noise",
    traits: { schedule: "early", noise: "quiet", clean: "tidy", social: "low" },
    image:
      "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=1200&q=80",
  },
};

export const ANIMAL_PLURALS = {
  owl: "Owls",
  dog: "Dogs",
  cat: "Cats",
  panda: "Pandas",
  wolf: "Wolves",
  turtle: "Turtles",
  fox: "Foxes",
  rabbit: "Rabbits",
};

const NOISE_NUM = { quiet: 0, moderate: 1, loud: 2 };
const CLEAN_NUM = { messy: 0, medium: 1, tidy: 2 };
const SOCIAL_NUM = { low: 0, medium: 1, high: 2 };

export function mapProfileTraits(profile = {}) {
  const scheduleMap = { early: "early", normal: "flexible", late: "late" };
  const schedule = scheduleMap[profile.schedule] || "flexible";

  const socialMap = { mostly_study: "low", balanced: "medium", often_out: "high" };
  const social = socialMap[profile.studySocial] || "medium";

  const cleanMap = { very_clean: "tidy", average: "medium", casual: "messy" };
  const clean = cleanMap[profile.cleanliness] || "medium";

  let noise;
  if (social === "high") noise = "loud";
  else if (social === "low" || clean === "tidy") noise = "quiet";
  else noise = "moderate";

  return { schedule, noise, clean, social };
}

export function assignAnimal(profile = {}) {
  const user = mapProfileTraits(profile);
  const scores = {};

  for (const [animal, data] of Object.entries(ANIMAL_PROFILES)) {
    let score = 0;
    const t = data.traits;

    if (t.schedule === user.schedule) score += 3;
    else if (t.schedule === "flexible" || user.schedule === "flexible") score += 1;

    if (t.noise === user.noise) score += 2;
    else if (Math.abs((NOISE_NUM[t.noise] ?? 1) - (NOISE_NUM[user.noise] ?? 1)) === 1) score += 1;

    if (t.clean === user.clean) score += 2;
    else if (Math.abs((CLEAN_NUM[t.clean] ?? 1) - (CLEAN_NUM[user.clean] ?? 1)) === 1) score += 1;

    if (t.social === user.social) score += 2;
    else if (Math.abs((SOCIAL_NUM[t.social] ?? 1) - (SOCIAL_NUM[user.social] ?? 1)) === 1) score += 1;

    scores[animal] = score;
  }

  return Object.entries(scores).reduce((best, [animal, score]) => {
    return score > best[1] ? [animal, score] : best;
  }, ["panda", -1])[0];
}

export function getAnimalLabel(animal) {
  return ANIMAL_PROFILES[animal]?.label || "Panda";
}

export function getAnimalPluralLabel(animal) {
  return ANIMAL_PLURALS[animal] || `${getAnimalLabel(animal)}s`;
}
