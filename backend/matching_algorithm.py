from typing import Dict, List, Tuple
from datetime import datetime, timezone
from itertools import combinations

# Animal compatibility mapping
COMPATIBLE_ANIMALS = {
    "owl": ["owl", "cat", "panda", "fox"],
    "dog": ["dog", "wolf", "fox", "panda"],
    "cat": ["cat", "owl", "turtle", "rabbit", "panda"],
    "panda": ["owl", "dog", "cat", "wolf", "turtle", "fox", "rabbit"],
    "wolf": ["wolf", "dog", "fox", "panda"],
    "turtle": ["turtle", "cat", "rabbit", "fox"],
    "fox": ["owl", "dog", "cat", "panda", "wolf", "turtle", "rabbit"],
    "rabbit": ["rabbit", "turtle", "cat", "panda"]
}

# Animal profiles and their characteristics
ANIMAL_PROFILES = {
    "owl": {
        "description": "Late schedule, quiet, tidy",
        "traits": {
            "schedule": "late",
            "noise_level": "quiet",
            "cleanliness": "tidy",
            "social_level": "low"
        }
    },
    "dog": {
        "description": "Social, flexible schedule, medium tidy",
        "traits": {
            "schedule": "flexible",
            "noise_level": "moderate",
            "cleanliness": "medium",
            "social_level": "high"
        }
    },
    "cat": {
        "description": "Quiet, independent, tidy",
        "traits": {
            "schedule": "flexible",
            "noise_level": "quiet",
            "cleanliness": "tidy",
            "social_level": "medium"
        }
    },
    "panda": {
        "description": "Flexible, calm, low conflict",
        "traits": {
            "schedule": "flexible",
            "noise_level": "quiet",
            "cleanliness": "medium",
            "social_level": "medium"
        }
    },
    "wolf": {
        "description": "Social, group-oriented, energetic",
        "traits": {
            "schedule": "flexible",
            "noise_level": "loud",
            "cleanliness": "medium",
            "social_level": "high"
        }
    },
    "turtle": {
        "description": "Early riser, quiet, routine-based",
        "traits": {
            "schedule": "early",
            "noise_level": "quiet",
            "cleanliness": "tidy",
            "social_level": "low"
        }
    },
    "fox": {
        "description": "Adaptable, medium social",
        "traits": {
            "schedule": "flexible",
            "noise_level": "moderate",
            "cleanliness": "medium",
            "social_level": "medium"
        }
    },
    "rabbit": {
        "description": "Quiet, clean, low-noise",
        "traits": {
            "schedule": "early",
            "noise_level": "quiet",
            "cleanliness": "tidy",
            "social_level": "low"
        }
    }
}


def get_profile_field(user: Dict, field: str, default=None):
    """
    Get a profile field from user, handling both nested and flat structures.
    """
    if "profile" in user and isinstance(user["profile"], dict):
        return user["profile"].get(field, default)
    return user.get(field, default)


def extract_personality_traits(profile: Dict) -> Dict:
    """Extract personality traits from user profile for animal archetype assignment."""
    wake_time = profile.get("wakeTime", "07:30")
    wake_hour = int(wake_time.split(":")[0])

    if wake_hour <= 7:
        schedule = "early"
    elif wake_hour >= 10:
        schedule = "late"
    else:
        schedule = "flexible"

    social_pref = profile.get("socialPreference", "Medium").lower()
    social_mapping = {"low": "low", "medium": "medium", "high": "high"}
    social_level = social_mapping.get(social_pref, "medium")

    cleanliness = profile.get("cleanliness", "Medium").lower()
    clean_mapping = {"low": "messy", "medium": "medium", "high": "tidy"}
    cleanliness_level = clean_mapping.get(cleanliness, "medium")

    if social_level == "high":
        noise_level = "loud"
    elif social_level == "low" or cleanliness_level == "tidy":
        noise_level = "quiet"
    else:
        noise_level = "moderate"

    return {
        "schedule": schedule,
        "noise_level": noise_level,
        "cleanliness": cleanliness_level,
        "social_level": social_level,
    }


def assign_animal_archetype(profile: Dict) -> str:
    """Assign an animal archetype based on user personality traits."""
    personality_traits = extract_personality_traits(profile)

    schedule = personality_traits.get("schedule", "flexible")
    noise    = personality_traits.get("noise_level", "moderate")
    clean    = personality_traits.get("cleanliness", "medium")
    social   = personality_traits.get("social_level", "medium")

    scores = {}
    for animal, profile_data in ANIMAL_PROFILES.items():
        score = 0
        traits = profile_data["traits"]

        if traits["schedule"] == schedule:
            score += 3
        elif traits["schedule"] == "flexible" or schedule == "flexible":
            score += 1

        if traits["noise_level"] == noise:
            score += 2
        elif abs(_noise_to_num(traits["noise_level"]) - _noise_to_num(noise)) == 1:
            score += 1

        if traits["cleanliness"] == clean:
            score += 2
        elif abs(_clean_to_num(traits["cleanliness"]) - _clean_to_num(clean)) == 1:
            score += 1

        if traits["social_level"] == social:
            score += 2
        elif abs(_social_to_num(traits["social_level"]) - _social_to_num(social)) == 1:
            score += 1

        scores[animal] = score

    return max(scores, key=scores.get)


def _noise_to_num(noise: str) -> int:
    return {"quiet": 0, "moderate": 1, "loud": 2}.get(noise, 1)


def _clean_to_num(clean: str) -> int:
    return {"messy": 0, "medium": 1, "tidy": 2}.get(clean, 1)


def _social_to_num(social: str) -> int:
    return {"low": 0, "medium": 1, "high": 2}.get(social, 1)


def apply_hard_filters(user: Dict, candidates: List[Dict]) -> List[Dict]:
    """
    Apply hard compatibility filters — smoking, pets, gender preference.
    These are binary deal-breakers that cannot be compensated by score.
    Animal archetype is NOT a hard filter (see calculate_compatibility_score).
    """
    filtered = []

    for candidate in candidates:
        if candidate.get("userId") == user.get("userId"):
            continue

        # Smoking
        user_smokes    = get_profile_field(user, "smoker", False)
        cand_smokes    = get_profile_field(candidate, "smoker", False)
        user_smokes_ok = get_profile_field(user, "smokersOk", False)
        cand_smokes_ok = get_profile_field(candidate, "smokersOk", False)

        if user_smokes and not cand_smokes_ok:
            continue
        if cand_smokes and not user_smokes_ok:
            continue

        # Pets
        user_has_pets = get_profile_field(user, "hasPets", False)
        cand_has_pets = get_profile_field(candidate, "hasPets", False)
        user_pets_ok  = get_profile_field(user, "petsOk", True)
        cand_pets_ok  = get_profile_field(candidate, "petsOk", True)

        if user_has_pets and not cand_pets_ok:
            continue
        if cand_has_pets and not user_pets_ok:
            continue

        # Gender preference
        user_gender      = get_profile_field(user, "gender", "Prefer not to say")
        cand_gender      = get_profile_field(candidate, "gender", "Prefer not to say")
        user_gender_pref = get_profile_field(user, "genderPreference", "Any")
        cand_gender_pref = get_profile_field(candidate, "genderPreference", "Any")

        if user_gender_pref != "Any" and cand_gender != "Prefer not to say":
            if user_gender_pref != cand_gender:
                continue
        if cand_gender_pref != "Any" and user_gender != "Prefer not to say":
            if cand_gender_pref != user_gender:
                continue

        filtered.append(candidate)

    return filtered


def calculate_compatibility_score(user: Dict, candidate: Dict, max_score: float = 100.0) -> float:
    """
    Calculate compatibility score between two users (0–100).

    Scoring breakdown (100 pts total):
      - Animal archetype compatibility : 10 pts  ← scored, not filtered
      - Personality traits             : 40 pts
      - Lifestyle                      : 30 pts
      - Academic                       : 10 pts
      - Age similarity                 : 10 pts
    """
    score = 0

    # ── Animal archetype compatibility (10 pts) ─────────────────────────────
    # Moved from a hard filter to a score contribution so that users with
    # borderline-compatible animals still appear in results rather than
    # disappearing entirely. A compatible pair gets full marks; an
    # incompatible pair gets 0 — which will naturally push them below the
    # 60-point threshold without hiding them from the results list.
    user_animal = user.get("animal_archetype", "panda")
    cand_animal = candidate.get("animal_archetype", "panda")
    compatible_animals = COMPATIBLE_ANIMALS.get(user_animal, [])
    score += 10 if cand_animal in compatible_animals else 0

    # ── Personality traits (40 pts) ──────────────────────────────────────────

    # Cleanliness (16 pts)
    user_clean = get_profile_field(user, "cleanliness", "Medium").lower()
    cand_clean = get_profile_field(candidate, "cleanliness", "Medium").lower()
    score += _calculate_trait_match(user_clean, cand_clean, ["low", "medium", "high"]) * 16

    # Social level (16 pts)
    user_social = get_profile_field(user, "socialPreference", "Medium").lower()
    cand_social = get_profile_field(candidate, "socialPreference", "Medium").lower()
    score += _calculate_trait_match(user_social, cand_social, ["low", "medium", "high"]) * 16

    # Noise tolerance (8 pts)
    user_noise = get_profile_field(user, "noise_level", "moderate").lower()
    cand_noise = get_profile_field(candidate, "noise_level", "moderate").lower()
    score += _calculate_trait_match(user_noise, cand_noise, ["quiet", "moderate", "loud"]) * 8

    # ── Lifestyle (30 pts) ───────────────────────────────────────────────────

    # Wake/sleep schedule (15 pts)
    user_wake = get_profile_field(user, "wakeTime", "07:30")
    cand_wake = get_profile_field(candidate, "wakeTime", "07:30")
    user_bed  = get_profile_field(user, "bedtime", "23:30")
    cand_bed  = get_profile_field(candidate, "bedtime", "23:30")

    try:
        wake_diff = abs(int(user_wake.split(":")[0]) - int(cand_wake.split(":")[0]))
        bed_diff  = abs(int(user_bed.split(":")[0])  - int(cand_bed.split(":")[0]))
        if wake_diff <= 1 and bed_diff <= 1:
            score += 15
        elif wake_diff <= 2 and bed_diff <= 2:
            score += 10
        else:
            score += 5
    except (ValueError, AttributeError):
        score += 7

    # Cooking habits (5 pts)
    user_cooking = get_profile_field(user, "cooking", "Sometimes").lower()
    cand_cooking = get_profile_field(candidate, "cooking", "Sometimes").lower()
    score += _calculate_trait_match(user_cooking, cand_cooking, ["never", "rarely", "sometimes", "often"]) * 5

    # Routine similarity (10 pts)
    user_routine = get_profile_field(user, "routine", "").lower()
    cand_routine = get_profile_field(candidate, "routine", "").lower()

    if user_routine and cand_routine:
        user_words = set(user_routine.split())
        cand_words = set(cand_routine.split())
        if user_words and cand_words:
            similarity = len(user_words & cand_words) / max(len(user_words), len(cand_words))
            score += similarity * 10
        else:
            score += 5
    else:
        score += 5

    # ── Academic compatibility (10 pts) ─────────────────────────────────────

    # Year similarity (5 pts)
    user_year = get_profile_field(user, "year", "")
    cand_year = get_profile_field(candidate, "year", "")

    if user_year and cand_year:
        try:
            year_diff = abs(int(user_year) - int(cand_year))
            score += 5 if year_diff == 0 else (3 if year_diff == 1 else 1)
        except (ValueError, TypeError):
            score += 2
    else:
        score += 2  # neutral — not provided

    # Course similarity (5 pts)
    user_course = get_profile_field(user, "course", "").lower()
    cand_course = get_profile_field(candidate, "course", "").lower()

    if user_course and cand_course:
        if user_course == cand_course:
            score += 5
        elif any(word in cand_course for word in user_course.split()):
            score += 3
        else:
            score += 1

    # ── Age similarity (10 pts) ──────────────────────────────────────────────
    user_age = get_profile_field(user, "age")
    cand_age = get_profile_field(candidate, "age")

    if user_age and cand_age:
        try:
            age_diff = abs(int(user_age) - int(cand_age))
            if age_diff <= 3:
                score += 10
            elif age_diff <= 5:
                score += 7
            elif age_diff <= 10:
                score += 4
            else:
                score += 2
        except (ValueError, TypeError):
            score += 5
    else:
        score += 5  # neutral — not provided

    return min(score, max_score)


def _calculate_trait_match(trait1: str, trait2: str, scale: List[str]) -> float:
    """
    Calculate how well two traits match on a given scale.
    Returns a value between 0.0 (opposite ends) and 1.0 (exact match).
    """
    if not trait1 or not trait2:
        return 0.5

    if trait1 == trait2:
        return 1.0

    try:
        idx1 = scale.index(trait1)
        idx2 = scale.index(trait2)
        return 1.0 - (abs(idx1 - idx2) / (len(scale) - 1))
    except ValueError:
        return 0.5


def find_matches_for_property(
    user: Dict,
    interested_users: List[Dict],
) -> List[Dict]:
    """
    Find and score all other interested users against the requesting user.

    Pipeline:
      1. Ensure animal archetypes are assigned
      2. Apply hard filters (smoking, pets, gender) — binary deal-breakers only
      3. Score every candidate that passes — animal compatibility contributes
         10 pts to the score rather than being a hard filter, so borderline
         pairs appear in results rather than silently disappearing
      4. Sort by score descending

    Args:
        user            : The user requesting matches
        interested_users: Other users interested in the same property

    Returns:
        List of scored match dicts, sorted by compatibility_score descending
    """
    # Ensure archetypes exist
    if not user.get("animal_archetype"):
        user["animal_archetype"] = assign_animal_archetype(user)
    for u in interested_users:
        if not u.get("animal_archetype"):
            u["animal_archetype"] = assign_animal_archetype(u)

    hard_filtered = apply_hard_filters(user, interested_users)

    scored_matches = []
    for candidate in hard_filtered:
        score = calculate_compatibility_score(user, candidate)

        scored_matches.append({
            "userId":            candidate.get("userId"),
            "name":              candidate.get("name", "Unknown"),
            "email":             candidate.get("email", ""),
            "animal_archetype":  candidate.get("animal_archetype"),
            "compatibility_score": round(score, 2),
            "age":               get_profile_field(candidate, "age"),
            "gender":            get_profile_field(candidate, "gender"),
            "course":            get_profile_field(candidate, "course", ""),
            "year":              get_profile_field(candidate, "year", ""),
            "cleanliness":       get_profile_field(candidate, "cleanliness"),
            "socialPreference":  get_profile_field(candidate, "socialPreference"),
        })

    scored_matches.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return scored_matches


def check_group_compatibility(
    users: List[Dict],
    min_compatibility_threshold: float = 60.0
) -> Tuple[bool, float]:
    """
    Check if a group of users is mutually compatible via average pairwise score.
    Returns: (is_compatible, average_compatibility_score)
    """
    if len(users) < 2:
        return False, 0.0

    scores = [
        calculate_compatibility_score(users[i], users[j])
        for i in range(len(users))
        for j in range(i + 1, len(users))
    ]

    avg_score = sum(scores) / len(scores)
    return avg_score >= min_compatibility_threshold, avg_score


def find_best_group(
    interested_users: List[Dict],
    group_size: int,
    min_compatibility_threshold: float = 60.0
) -> Tuple[bool, List[Dict], float]:
    """
    Find the best mutually compatible group of `group_size` from interested_users.
    Tests all combinations and returns the one with the highest average score.

    Returns: (match_found, best_group, best_avg_score)
    """
    if len(interested_users) < group_size:
        return False, [], 0.0

    best_avg_score = 0.0
    best_group: List[Dict] = []

    for group in combinations(interested_users, group_size):
        _, avg_score = check_group_compatibility(list(group), min_compatibility_threshold)
        if avg_score > best_avg_score:
            best_avg_score = avg_score
            best_group = list(group)

    if best_avg_score >= min_compatibility_threshold:
        return True, best_group, best_avg_score

    return False, [], best_avg_score


def check_property_match_complete(
    interested_users: List[Dict],
    required_roommates: int,
    min_compatibility_threshold: float = 60.0
) -> Tuple[bool, List[Dict]]:
    """
    Check if a property has enough compatible users to form a complete match.
    Returns: (is_complete, best_group)
    """
    if len(interested_users) < required_roommates:
        return False, []

    for user in interested_users:
        if not user.get("animal_archetype"):
            user["animal_archetype"] = assign_animal_archetype(user)

    match_found, best_group, _ = find_best_group(
        interested_users,
        required_roommates,
        min_compatibility_threshold,
    )

    return match_found, best_group