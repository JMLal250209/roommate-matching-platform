from typing import Dict, List, Tuple
from itertools import combinations

COMPATIBLE_ANIMALS = {
    "owl":    ["owl", "cat", "panda", "fox"],
    "dog":    ["dog", "wolf", "fox", "panda"],
    "cat":    ["cat", "owl", "turtle", "rabbit", "panda"],
    "panda":  ["panda", "owl", "dog", "cat", "wolf", "turtle", "fox", "rabbit"],
    "wolf":   ["wolf", "dog", "fox", "panda"],
    "turtle": ["turtle", "cat", "rabbit", "fox"],
    "fox":    ["fox", "owl", "dog", "cat", "panda", "wolf", "turtle", "rabbit"],
    "rabbit": ["rabbit", "turtle", "cat", "panda"],
}

# Animal archetypes defined using the same vocabulary DynamoDB stores
ANIMAL_PROFILES = {
    "owl": {
        "description":      "Late schedule, quiet, tidy",
        "wakeHour":         10,
        "noise_level":      "quiet",
        "cleanliness":      "High",
        "socialPreference": "Low",
    },
    "dog": {
        "description":      "Social, flexible, easygoing",
        "wakeHour":         8,
        "noise_level":      "loud",
        "cleanliness":      "Medium",
        "socialPreference": "High",
    },
    "cat": {
        "description":      "Quiet, independent, tidy",
        "wakeHour":         8,
        "noise_level":      "quiet",
        "cleanliness":      "High",
        "socialPreference": "Low",
    },
    "panda": {
        "description":      "Flexible, calm, balanced",
        "wakeHour":         8,
        "noise_level":      "moderate",
        "cleanliness":      "Medium",
        "socialPreference": "Medium",
    },
    "wolf": {
        "description":      "Social, energetic, night owl",
        "wakeHour":         10,
        "noise_level":      "loud",
        "cleanliness":      "Low",
        "socialPreference": "High",
    },
    "turtle": {
        "description":      "Early riser, quiet, routine-based",
        "wakeHour":         6,
        "noise_level":      "quiet",
        "cleanliness":      "High",
        "socialPreference": "Low",
    },
    "fox": {
        "description":      "Adaptable, moderately social",
        "wakeHour":         8,
        "noise_level":      "moderate",
        "cleanliness":      "Medium",
        "socialPreference": "Medium",
    },
    "rabbit": {
        "description":      "Early riser, quiet, clean",
        "wakeHour":         6,
        "noise_level":      "quiet",
        "cleanliness":      "High",
        "socialPreference": "Low",
    },
}

# Ordinal scales matching DynamoDB vocabulary
NOISE_SCALE       = ["quiet", "moderate", "loud"]
CLEANLINESS_SCALE = ["Low", "Medium", "High"]
SOCIAL_SCALE      = ["Low", "Medium", "High"]


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def get_profile_field(user: Dict, field: str, default=None):
    """Read from user.profile if nested, else directly from user."""
    if "profile" in user and isinstance(user["profile"], dict):
        return user["profile"].get(field, default)
    return user.get(field, default)


def _wake_hour(user: Dict) -> int:
    """Parse wakeTime string → int hour, defaulting to 8."""
    wake = get_profile_field(user, "wakeTime", "08:00") or "08:00"
    try:
        return int(wake.split(":")[0])
    except (ValueError, AttributeError):
        return 8


def _schedule_bucket(wake_hour: int) -> str:
    if wake_hour <= 7:
        return "early"
    if wake_hour >= 10:
        return "late"
    return "normal"


def _scale_score(val1: str, val2: str, scale: List[str]) -> float:
    """1.0 exact match, linear decay by distance.
    1.0 when both missing (identical unknown → assume compatible).
    0.5 when only one side is missing (can't compare)."""
    if not val1 and not val2:
        return 1.0   # both unset → treat as identical
    if not val1 or not val2:
        return 0.5   # one side unknown → neutral
    try:
        i1, i2 = scale.index(val1), scale.index(val2)
        return 1.0 - abs(i1 - i2) / (len(scale) - 1)
    except ValueError:
        return 0.5


def _interests_overlap(a: List[str], b: List[str]) -> float:
    """Jaccard similarity (0–1). Neutral 0.5 when both empty."""
    sa, sb = set(a or []), set(b or [])
    if not sa and not sb:
        return 0.5
    if not sa or not sb:
        return 0.25
    return len(sa & sb) / len(sa | sb)


def _budget_overlap(min_a: int, max_a: int, min_b: int, max_b: int) -> float:
    """Proportional budget overlap (0–1). 0 if ranges don't touch."""
    lo = max(min_a, min_b)
    hi = min(max_a, max_b)
    if hi < lo:
        return 0.0
    span = max(max_a, max_b) - min(min_a, min_b)
    return (hi - lo) / span if span else 1.0


# ---------------------------------------------------------------------------
# ARCHETYPE ASSIGNMENT  (reads real DynamoDB field names/values)
# ---------------------------------------------------------------------------

def assign_animal_archetype(user: Dict) -> str:
    """
    Assign an animal archetype from the profile fields DynamoDB actually stores:
      wakeTime (e.g. "07:30"), noise_level, cleanliness, socialPreference.

    The user arg can be either a flat dict (profile fields at top level)
    or a nested dict with a "profile" key — get_profile_field handles both.
    """
    wake_hour = _wake_hour(user)
    noise     = (get_profile_field(user, "noise_level",      "") or "").lower()
    clean     = (get_profile_field(user, "cleanliness",      "") or "").capitalize()
    social    = (get_profile_field(user, "socialPreference", "") or "").capitalize()

    scores: Dict[str, float] = {}
    for animal, ap in ANIMAL_PROFILES.items():
        s = 0.0

        # Schedule (weight 3)
        hour_diff = abs(wake_hour - ap["wakeHour"])
        if _schedule_bucket(wake_hour) == _schedule_bucket(ap["wakeHour"]):
            s += 3.0
        elif hour_diff <= 2:
            s += 1.5

        # Noise (weight 2)
        s += _scale_score(noise, ap["noise_level"], NOISE_SCALE) * 2

        # Cleanliness (weight 2)
        s += _scale_score(clean, ap["cleanliness"], CLEANLINESS_SCALE) * 2

        # Social (weight 1)
        s += _scale_score(social, ap["socialPreference"], SOCIAL_SCALE) * 1

        scores[animal] = s

    return max(scores, key=scores.get)


# ---------------------------------------------------------------------------
# HARD FILTERS
# ---------------------------------------------------------------------------

def apply_hard_filters(user: Dict, candidates: List[Dict]) -> List[Dict]:
    """
    Remove candidates with irreconcilable deal-breakers.
    Reads the bool fields DynamoDB stores: smoker, smokersOk, hasPets, petsOk.
    """
    user_smokes      = bool(get_profile_field(user, "smoker",           False))
    user_smokes_ok   = bool(get_profile_field(user, "smokersOk",        False))
    user_has_pets    = bool(get_profile_field(user, "hasPets",          False))
    user_pets_ok     = bool(get_profile_field(user, "petsOk",           True))
    user_gender      = get_profile_field(user, "gender",                "Prefer not to say")
    user_gender_pref = get_profile_field(user, "genderPreference",      "Any")

    filtered = []
    for candidate in candidates:
        if candidate.get("userId") == user.get("userId"):
            continue

        cand_smokes      = bool(get_profile_field(candidate, "smoker",      False))
        cand_smokes_ok   = bool(get_profile_field(candidate, "smokersOk",   False))
        cand_has_pets    = bool(get_profile_field(candidate, "hasPets",     False))
        cand_pets_ok     = bool(get_profile_field(candidate, "petsOk",      True))
        cand_gender      = get_profile_field(candidate, "gender",           "Prefer not to say")
        cand_gender_pref = get_profile_field(candidate, "genderPreference", "Any")

        if user_smokes and not cand_smokes_ok:
            continue
        if cand_smokes and not user_smokes_ok:
            continue
        if user_has_pets and not cand_pets_ok:
            continue
        if cand_has_pets and not user_pets_ok:
            continue
        if user_gender_pref != "Any" and cand_gender != "Prefer not to say":
            if user_gender_pref != cand_gender:
                continue
        if cand_gender_pref != "Any" and user_gender != "Prefer not to say":
            if cand_gender_pref != user_gender:
                continue

        filtered.append(candidate)

    return filtered


# ---------------------------------------------------------------------------
# COMPATIBILITY SCORING
# ---------------------------------------------------------------------------
#
#  Dimension                    Pts   Notes
#  ───────────────────────────  ───   ──────────────────────────────
#  Animal archetype              10   0 incompatible / 10 compatible
#  Cleanliness                   18   ordinal ["Low","Medium","High"]
#  Noise preference              16   ordinal ["quiet","moderate","loud"]
#  Sleep schedule                16   wake-hour proximity
#  Social preference             10   ordinal ["Low","Medium","High"]
#  Shared interests (Jaccard)    10
#  Budget overlap                10
#  Course / year similarity       6
#  Age similarity                 4
#  ───────────────────────────  ───
#  TOTAL                        100

def calculate_compatibility_score(user: Dict, candidate: Dict, max_score: float = 100.0) -> float:
    score = 0.0

    # Animal archetype (10 pts)
    u_animal = user.get("animal_archetype")      or assign_animal_archetype(user)
    c_animal = candidate.get("animal_archetype") or assign_animal_archetype(candidate)
    score += 10 if c_animal in COMPATIBLE_ANIMALS.get(u_animal, []) else 0

    # Cleanliness (18 pts)
    u_clean = (get_profile_field(user,      "cleanliness", "") or "").capitalize()
    c_clean = (get_profile_field(candidate, "cleanliness", "") or "").capitalize()
    score += _scale_score(u_clean, c_clean, CLEANLINESS_SCALE) * 18

    # Noise (16 pts)
    u_noise = (get_profile_field(user,      "noise_level", "") or "").lower()
    c_noise = (get_profile_field(candidate, "noise_level", "") or "").lower()
    score += _scale_score(u_noise, c_noise, NOISE_SCALE) * 16

    # Schedule / wake time (16 pts)
    diff = abs(_wake_hour(user) - _wake_hour(candidate))
    score += 16 if diff == 0 else (13 if diff <= 1 else (9 if diff <= 2 else (5 if diff <= 3 else 0)))

    # Social preference (10 pts)
    u_social = (get_profile_field(user,      "socialPreference", "") or "").capitalize()
    c_social = (get_profile_field(candidate, "socialPreference", "") or "").capitalize()
    score += _scale_score(u_social, c_social, SOCIAL_SCALE) * 10

    # Shared interests (10 pts)
    score += _interests_overlap(
        get_profile_field(user,      "interests", []) or [],
        get_profile_field(candidate, "interests", []) or [],
    ) * 10

    # Budget overlap (10 pts)
    u_min = int(get_profile_field(user,      "budgetMin", 0) or 0)
    u_max = int(get_profile_field(user,      "budgetMax", 0) or 0)
    c_min = int(get_profile_field(candidate, "budgetMin", 0) or 0)
    c_max = int(get_profile_field(candidate, "budgetMax", 0) or 0)
    score += (_budget_overlap(u_min, u_max, c_min, c_max) * 10
              if u_max > u_min and c_max > c_min else 5)

    # Academic similarity (6 pts)
    u_course = (get_profile_field(user,      "course", "") or "").lower().strip()
    c_course = (get_profile_field(candidate, "course", "") or "").lower().strip()
    if u_course and c_course:
        if u_course == c_course:
            score += 4
        elif any(w in c_course for w in u_course.split() if len(w) > 2):
            score += 2
    else:
        score += 2

    u_year = get_profile_field(user,      "year", "")
    c_year = get_profile_field(candidate, "year", "")
    if u_year and c_year:
        try:
            yd = abs(int(u_year) - int(c_year))
            score += 2 if yd == 0 else (1 if yd == 1 else 0)
        except (ValueError, TypeError):
            score += 1
    else:
        score += 1

    # Age similarity (4 pts)
    u_age = get_profile_field(user,      "age")
    c_age = get_profile_field(candidate, "age")
    if u_age and c_age:
        try:
            ad = abs(int(u_age) - int(c_age))
            score += 4 if ad <= 3 else (2 if ad <= 6 else 0)
        except (ValueError, TypeError):
            score += 2
    else:
        score += 2

    return min(round(score, 2), max_score)


# ---------------------------------------------------------------------------
# SCORE BREAKDOWN  (for "why you matched" UI cards)
# ---------------------------------------------------------------------------

def get_score_breakdown(user: Dict, candidate: Dict) -> Dict:
    u_animal = user.get("animal_archetype")      or assign_animal_archetype(user)
    c_animal = candidate.get("animal_archetype") or assign_animal_archetype(candidate)
    animal_score = 10 if c_animal in COMPATIBLE_ANIMALS.get(u_animal, []) else 0

    u_clean = (get_profile_field(user,      "cleanliness", "") or "").capitalize()
    c_clean = (get_profile_field(candidate, "cleanliness", "") or "").capitalize()
    clean_score = _scale_score(u_clean, c_clean, CLEANLINESS_SCALE) * 18

    u_noise = (get_profile_field(user,      "noise_level", "") or "").lower()
    c_noise = (get_profile_field(candidate, "noise_level", "") or "").lower()
    noise_score = _scale_score(u_noise, c_noise, NOISE_SCALE) * 16

    diff           = abs(_wake_hour(user) - _wake_hour(candidate))
    schedule_score = 16 if diff == 0 else (13 if diff <= 1 else (9 if diff <= 2 else (5 if diff <= 3 else 0)))

    u_social = (get_profile_field(user,      "socialPreference", "") or "").capitalize()
    c_social = (get_profile_field(candidate, "socialPreference", "") or "").capitalize()
    social_score = _scale_score(u_social, c_social, SOCIAL_SCALE) * 10

    interest_score = _interests_overlap(
        get_profile_field(user,      "interests", []) or [],
        get_profile_field(candidate, "interests", []) or [],
    ) * 10

    u_min = int(get_profile_field(user,      "budgetMin", 0) or 0)
    u_max = int(get_profile_field(user,      "budgetMax", 0) or 0)
    c_min = int(get_profile_field(candidate, "budgetMin", 0) or 0)
    c_max = int(get_profile_field(candidate, "budgetMax", 0) or 0)
    budget_score = (_budget_overlap(u_min, u_max, c_min, c_max) * 10
                    if u_max > u_min and c_max > c_min else 5)

    u_course = (get_profile_field(user,      "course", "") or "").lower().strip()
    c_course = (get_profile_field(candidate, "course", "") or "").lower().strip()
    if u_course and c_course:
        course_score = 4 if u_course == c_course else (2 if any(w in c_course for w in u_course.split() if len(w) > 2) else 0)
    else:
        course_score = 2

    u_year = get_profile_field(user,      "year", "")
    c_year = get_profile_field(candidate, "year", "")
    try:
        yd         = abs(int(u_year) - int(c_year)) if (u_year and c_year) else None
        year_score = (2 if yd == 0 else (1 if yd == 1 else 0)) if yd is not None else 1
    except (ValueError, TypeError):
        year_score = 1

    u_age = get_profile_field(user, "age")
    c_age = get_profile_field(candidate, "age")
    try:
        ad        = abs(int(u_age) - int(c_age)) if (u_age and c_age) else None
        age_score = (4 if ad <= 3 else (2 if ad <= 6 else 0)) if ad is not None else 2
    except (ValueError, TypeError):
        age_score = 2

    total = min(
        animal_score + clean_score + noise_score + schedule_score +
        social_score + interest_score + budget_score +
        course_score + year_score + age_score,
        100.0,
    )

    return {
        "total":            round(total, 2),
        "animalArchetype":  animal_score,
        "cleanliness":      round(clean_score, 2),
        "noise":            round(noise_score, 2),
        "schedule":         round(schedule_score, 2),
        "socialPreference": round(social_score, 2),
        "interests":        round(interest_score, 2),
        "budget":           round(budget_score, 2),
        "academic":         course_score + year_score,
        "age":              age_score,
    }


# ---------------------------------------------------------------------------
# MATCH FINDING
# ---------------------------------------------------------------------------

def find_matches_for_property(user: Dict, interested_users: List[Dict]) -> List[Dict]:
    if not user.get("animal_archetype"):
        user["animal_archetype"] = assign_animal_archetype(user)
    for u in interested_users:
        if not u.get("animal_archetype"):
            u["animal_archetype"] = assign_animal_archetype(u)

    scored = []
    for candidate in apply_hard_filters(user, interested_users):
        breakdown = get_score_breakdown(user, candidate)
        scored.append({
            "userId":              candidate.get("userId"),
            "name":                candidate.get("name", "Unknown"),
            "email":               candidate.get("email", ""),
            "animal_archetype":    candidate.get("animal_archetype"),
            "compatibility_score": breakdown["total"],
            "scoreBreakdown":      breakdown,
            "course":              get_profile_field(candidate, "course", ""),
            "year":                get_profile_field(candidate, "year", ""),
            "cleanliness":         get_profile_field(candidate, "cleanliness"),
            "noise_level":         get_profile_field(candidate, "noise_level"),
            "wakeTime":            get_profile_field(candidate, "wakeTime"),
            "socialPreference":    get_profile_field(candidate, "socialPreference"),
            "interests":           get_profile_field(candidate, "interests", []),
            "budgetMin":           get_profile_field(candidate, "budgetMin"),
            "budgetMax":           get_profile_field(candidate, "budgetMax"),
        })

    scored.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return scored


# ---------------------------------------------------------------------------
# GROUP COMPATIBILITY
# ---------------------------------------------------------------------------

def check_group_compatibility(users: List[Dict], min_threshold: float = 60.0) -> Tuple[bool, float]:
    if len(users) < 2:
        return False, 0.0
    scores = [
        calculate_compatibility_score(users[i], users[j])
        for i in range(len(users))
        for j in range(i + 1, len(users))
    ]
    avg = sum(scores) / len(scores)
    return avg >= min_threshold, avg


def find_best_group(
    interested_users: List[Dict],
    group_size: int,
    min_threshold: float = 60.0,
) -> Tuple[bool, List[Dict], float]:
    if len(interested_users) < group_size:
        return False, [], 0.0
    best_avg, best_group = 0.0, []
    for group in combinations(interested_users, group_size):
        _, avg = check_group_compatibility(list(group), min_threshold)
        if avg > best_avg:
            best_avg, best_group = avg, list(group)
    return (True, best_group, best_avg) if best_avg >= min_threshold else (False, [], best_avg)


def check_property_match_complete(
    interested_users: List[Dict],
    required_roommates: int,
    min_threshold: float = 60.0,
) -> Tuple[bool, List[Dict]]:
    if len(interested_users) < required_roommates:
        return False, []
    for u in interested_users:
        if not u.get("animal_archetype"):
            u["animal_archetype"] = assign_animal_archetype(u)
    match_found, best_group, _ = find_best_group(interested_users, required_roommates, min_threshold)
    return match_found, best_group