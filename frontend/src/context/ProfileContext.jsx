import { createContext, useContext, useState } from "react";

const defaultProfile = {
  // Housing (ProfileHousingRequirements)
  budgetMin: 400,
  budgetMax: 900,
  moveIn: "flexible",
  roomType: "any",
  area: "either",
  leaseMonths: 9,
  amenities: [],
  notes: "",

  // About (ProfileAboutYou)
  displayName: "",
  course: "",
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
  animalArchetype: "panda",

  // Optional (ProfileView)
  photoUrl: "",
};

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(defaultProfile);

  function updateProfile(partial) {
    setProfile((prev) => ({ ...prev, ...partial }));
  }

  function setHousing(data) {
    setProfile((prev) => ({ ...prev, ...data }));
  }

  function setAbout(data) {
    setProfile((prev) => ({ ...prev, ...data }));
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, setHousing, setAbout }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
