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
    Get a profile field from user, handling both nested and flat structures
    
    Args:
        user: User dict (may have nested 'profile' or flat structure)
        field: Field name to retrieve
        default: Default value if not found
    
    Returns:
        Field value or default
    """
    # Try nested structure first
    if "profile" in user and isinstance(user["profile"], dict):
        return user["profile"].get(field, default)
    
    # Fall back to flat structure
    return user.get(field, default)


def extract_personality_traits(profile: Dict) -> Dict:
    """
    Extract personality traits from user profile
    Used for animal archetype assignment
    """
    # Determine schedule based on wake/bedtime
    wake_time = profile.get("wakeTime", "07:30")
    
    wake_hour = int(wake_time.split(":")[0])
    
    if wake_hour <= 7:
        schedule = "early"
    elif wake_hour >= 10:
        schedule = "late"
    else:
        schedule = "flexible"
    
    # Map social preference
    social_pref = profile.get("socialPreference", "Medium").lower()
    social_mapping = {
        "low": "low",
        "medium": "medium",
        "high": "high"
    }
    social_level = social_mapping.get(social_pref, "medium")
    
    # Map cleanliness
    cleanliness = profile.get("cleanliness", "Medium").lower()
    clean_mapping = {
        "low": "messy",
        "medium": "medium",
        "high": "tidy"
    }
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
        "social_level": social_level
    }


def assign_animal_archetype(profile: Dict) -> str:
    """
    Assign an animal archetype based on user personality traits
    This happens at signup and is permanent
    """
    personality_traits = extract_personality_traits(profile)
    
    schedule = personality_traits.get("schedule", "flexible")
    noise = personality_traits.get("noise_level", "moderate")
    clean = personality_traits.get("cleanliness", "medium")
    social = personality_traits.get("social_level", "medium")
    
    # Scoring system for each animal
    scores = {}
    # Check how similar a user is to every animal
    for animal, profile_data in ANIMAL_PROFILES.items():
        score = 0
        traits = profile_data["traits"]
        
        # Match schedule (weight: 3)
        if traits["schedule"] == schedule:
            score += 3
        elif traits["schedule"] == "flexible" or schedule == "flexible":
            score += 1
        
        # Match noise level (weight: 2)
        if traits["noise_level"] == noise:
            score += 2
        elif abs(_noise_to_num(traits["noise_level"]) - _noise_to_num(noise)) == 1:
            score += 1
        
        # Match cleanliness (weight: 2)
        if traits["cleanliness"] == clean:
            score += 2
        elif abs(_clean_to_num(traits["cleanliness"]) - _clean_to_num(clean)) == 1:
            score += 1
        
        # Match social level (weight: 2)
        if traits["social_level"] == social:
            score += 2
        elif abs(_social_to_num(traits["social_level"]) - _social_to_num(social)) == 1:
            score += 1
        
        scores[animal] = score
    
    # Return the animal with the highest score
    best_animal = max(scores, key=scores.get)
    return best_animal


def _noise_to_num(noise: str) -> int:
    mapping = {"quiet": 0, "moderate": 1, "loud": 2}
    return mapping.get(noise, 1)


def _clean_to_num(clean: str) -> int:
    mapping = {"messy": 0, "medium": 1, "tidy": 2}
    return mapping.get(clean, 1)


def _social_to_num(social: str) -> int:
    mapping = {"low": 0, "medium": 1, "high": 2}
    return mapping.get(social, 1)


def apply_hard_filters(user: Dict, candidates: List[Dict]) -> List[Dict]:
    """
    Apply hard compatibility filters (must pass to be compatible)
    NOTE: Budget is NOT checked here - removed from compatibility logic
    """
    filtered = []
    
    for candidate in candidates:
        # Skip self
        if candidate.get("userId") == user.get("userId"):
            continue
        
        # Smoking compatibility (HARD FILTER)
        user_smokes = get_profile_field(user, "smoker", False)
        cand_smokes = get_profile_field(candidate, "smoker", False)
        user_smokes_ok = get_profile_field(user, "smokersOk", False)
        cand_smokes_ok = get_profile_field(candidate, "smokersOk", False)
        
        # If user smokes but candidate doesn't accept smokers -> INCOMPATIBLE
        if user_smokes and not cand_smokes_ok:
            continue
        
        # If candidate smokes but user doesn't accept smokers -> INCOMPATIBLE
        if cand_smokes and not user_smokes_ok:
            continue
        
        # Pets compatibility (HARD FILTER)
        user_has_pets = get_profile_field(user, "hasPets", False)
        cand_has_pets = get_profile_field(candidate, "hasPets", False)
        user_pets_ok = get_profile_field(user, "petsOk", True)
        cand_pets_ok = get_profile_field(candidate, "petsOk", True)
        
        # If user has pets but candidate doesn't accept pets -> INCOMPATIBLE
        if user_has_pets and not cand_pets_ok:
            continue
        
        # If candidate has pets but user doesn't accept pets -> INCOMPATIBLE
        if cand_has_pets and not user_pets_ok:
            continue
        
        # Gender preference (HARD FILTER)
        user_gender = get_profile_field(user, "gender", "Prefer not to say")
        cand_gender = get_profile_field(candidate, "gender", "Prefer not to say")
        user_gender_pref = get_profile_field(user, "genderPreference", "Any")
        cand_gender_pref = get_profile_field(candidate, "genderPreference", "Any")
        
        # Check if user's preference matches candidate's gender
        if user_gender_pref != "Any" and cand_gender != "Prefer not to say":
            if user_gender_pref != cand_gender:
                continue
        
        # Check if candidate's preference matches user's gender
        if cand_gender_pref != "Any" and user_gender != "Prefer not to say":
            if cand_gender_pref != user_gender:
                continue
        
        # Passed all hard filters
        filtered.append(candidate)
    
    return filtered


def calculate_compatibility_score(user: Dict, candidate: Dict, max_score: float = 100.0) -> float:
    """
    Calculate detailed compatibility score between two users
    
    NOTE: 
    - Animal archetype already filtered (they wouldn't be here if incompatible)
    - Budget is NOT included in scoring
    """
    score = 0
    
    # Personality traits compatibility (50 points - increased to redistribute animal points)
    personality_score = 0
    
    # Cleanliness match (20 points - increased)
    user_clean = get_profile_field(user, "cleanliness", "Medium").lower()
    cand_clean = get_profile_field(candidate, "cleanliness", "Medium").lower()
    clean_match = _calculate_trait_match(
        user_clean,
        cand_clean,
        ["low", "medium", "high"]
    )
    personality_score += clean_match * 20
    
    # Social level compatibility (20 points - increased)
    user_social = get_profile_field(user, "socialPreference", "Medium").lower()
    cand_social = get_profile_field(candidate, "socialPreference", "Medium").lower()
    social_match = _calculate_trait_match(
        user_social,
        cand_social,
        ["low", "medium", "high"]
    )
    personality_score += social_match * 20
    
    # Noise tolerance (10 points)
    user_noise = get_profile_field(user, "noise_level", "moderate").lower()
    cand_noise = get_profile_field(candidate, "noise_level", "moderate").lower()
    noise_match = _calculate_trait_match(
        user_noise,
        cand_noise,
        ["quiet", "moderate", "loud"]
    )
    personality_score += noise_match * 10
    
    score += personality_score
    
    # Lifestyle compatibility (30 points)
    lifestyle_score = 0
    
    # Wake/sleep schedule compatibility (15 points)
    user_wake = get_profile_field(user, "wakeTime", "07:30")
    cand_wake = get_profile_field(candidate, "wakeTime", "07:30")
    user_bed = get_profile_field(user, "bedtime", "23:30")
    cand_bed = get_profile_field(candidate, "bedtime", "23:30")
    
    try:
        user_wake_hour = int(user_wake.split(":")[0])
        cand_wake_hour = int(cand_wake.split(":")[0])
        wake_diff = abs(user_wake_hour - cand_wake_hour)
        
        user_bed_hour = int(user_bed.split(":")[0])
        cand_bed_hour = int(cand_bed.split(":")[0])
        bed_diff = abs(user_bed_hour - cand_bed_hour)
        
        # Similar schedules get higher scores
        if wake_diff <= 1 and bed_diff <= 1:
            lifestyle_score += 15
        elif wake_diff <= 2 and bed_diff <= 2:
            lifestyle_score += 10
        else:
            lifestyle_score += 5
    except:
        lifestyle_score += 7  # Neutral if parsing fails
    
    # Cooking habits (5 points)
    user_cooking = get_profile_field(user, "cooking", "Sometimes").lower()
    cand_cooking = get_profile_field(candidate, "cooking", "Sometimes").lower()
    
    cooking_levels = ["never", "rarely", "sometimes", "often"]
    cooking_match = _calculate_trait_match(user_cooking, cand_cooking, cooking_levels)
    lifestyle_score += cooking_match * 5
    
    # Routine similarity (10 points)
    user_routine = get_profile_field(user, "routine", "").lower()
    cand_routine = get_profile_field(candidate, "routine", "").lower()
    
    # Simple keyword matching for routine similarity
    if user_routine and cand_routine:
        user_words = set(user_routine.split())
        cand_words = set(cand_routine.split())
        common_words = user_words & cand_words
        if len(user_words) > 0 and len(cand_words) > 0:
            routine_similarity = len(common_words) / max(len(user_words), len(cand_words))
            lifestyle_score += routine_similarity * 10
        else:
            lifestyle_score += 5
    else:
        lifestyle_score += 5
    
    score += lifestyle_score
    
    # Academic compatibility (10 points) - if applicable
    academic_score = 0
    
    # Year similarity (5 points)
    user_year = get_profile_field(user, "year", "")
    cand_year = get_profile_field(candidate, "year", "")
    
    if user_year and cand_year:
        try:
            year_diff = abs(int(user_year) - int(cand_year))
            if year_diff == 0:
                academic_score += 5
            elif year_diff == 1:
                academic_score += 3
            else:
                academic_score += 1
        except:
            academic_score += 2
    
    # Course similarity (5 points)
    user_course = get_profile_field(user, "course", "").lower()
    cand_course = get_profile_field(candidate, "course", "").lower()
    
    if user_course and cand_course:
        # Check for exact match or similar fields
        if user_course == cand_course:
            academic_score += 5
        elif any(word in cand_course for word in user_course.split()):
            academic_score += 3
        else:
            academic_score += 1
    
    score += academic_score
    
    # Age similarity (10 points) - redistributed from animal archetype
    age_score = 0
    user_age = get_profile_field(user, "age")
    cand_age = get_profile_field(candidate, "age")
    
    if user_age and cand_age:
        try:
            age_diff = abs(int(user_age) - int(cand_age))
            if age_diff <= 3:
                age_score += 10
            elif age_diff <= 5:
                age_score += 7
            elif age_diff <= 10:
                age_score += 4
            else:
                age_score += 2
        except:
            age_score += 5  # Neutral if parsing fails
    else:
        age_score += 5  # Neutral if not provided
    
    score += age_score
    
    # NOTE: Budget scoring REMOVED - not part of compatibility
    # Users can negotiate rent splits after matching
    # NOTE: Animal archetype REMOVED from scoring - already used as filter
    
    return min(score, max_score)


def _calculate_trait_match(trait1: str, trait2: str, scale: List[str]) -> float:
    """
    Calculate how well two traits match on a given scale
    Returns value between 0.0 and 1.0
    """
    if not trait1 or not trait2:
        return 0.5  # Neutral if not specified
    
    if trait1 == trait2:
        return 1.0
    
    try:
        idx1 = scale.index(trait1)
        idx2 = scale.index(trait2)
        diff = abs(idx1 - idx2)
        max_diff = len(scale) - 1
        return 1.0 - (diff / max_diff)
    except ValueError:
        return 0.5  # If trait not in scale, return neutral


def find_matches_for_property(
    user: Dict,
    interested_users: List[Dict],
) -> List[Dict]:
    """
    Find best matches for a user from users interested in the SAME property
    This is the core matching function - only matches people interested in the same house
    
    Args:
        user: The user requesting matches
        interested_users: Other users who registered interest in the same property
    
    Returns:
        List of scored matches, sorted by compatibility
    """
    # Ensure user has animal archetype
    if not user.get("animal_archetype"):
        user["animal_archetype"] = assign_animal_archetype(user)
    
    # Ensure all interested users have animal archetypes
    for interested_user in interested_users:
        if not interested_user.get("animal_archetype"):
            interested_user["animal_archetype"] = assign_animal_archetype(interested_user)
    
    # Get user's compatible animal types
    user_animal = user.get("animal_archetype", "panda")
    compatible_animals = COMPATIBLE_ANIMALS.get(user_animal, [user_animal])
    
    # STEP 1: Filter by animal compatibility
    animal_compatible = [
        u for u in interested_users
        if u.get("animal_archetype") in compatible_animals
    ]
    
    # STEP 2: Apply hard filters (smoking, pets, gender)
    hard_filtered = apply_hard_filters(user, animal_compatible)
    
    # STEP 3: Calculate detailed compatibility scores
    scored_matches = []
    for candidate in hard_filtered:
        score = calculate_compatibility_score(user, candidate)
        
        # Build match result
        match_info = {
            "userId": candidate.get("userId"),
            "name": candidate.get("name", "Unknown"),
            "email": candidate.get("email", ""),
            "animal_archetype": candidate.get("animal_archetype"),
            "compatibility_score": score,
            # Include relevant profile details
            "age": get_profile_field(candidate, "age"),
            "gender": get_profile_field(candidate, "gender"),
            "course": get_profile_field(candidate, "course", ""),
            "year": get_profile_field(candidate, "year", ""),
            "cleanliness": get_profile_field(candidate, "cleanliness"),
            "socialPreference": get_profile_field(candidate, "socialPreference"),
        }
        
        scored_matches.append(match_info)
    
    # STEP 4: Sort by compatibility score (descending)
    scored_matches.sort(key=lambda x: x["compatibility_score"], reverse=True)
    
    return scored_matches


def check_group_compatibility(
    users: List[Dict], 
    min_compatibility_threshold: float = 60.0
) -> Tuple[bool, float]:
    """
    Check if a group of users is mutually compatible
    Returns: (is_compatible, average_compatibility_score)
    """
    if len(users) < 2:
        return False, 0.0
    
    # Calculate average pairwise compatibility
    total_score = 0
    comparisons = 0
    
    for i in range(len(users)):
        for j in range(i + 1, len(users)):
            score = calculate_compatibility_score(users[i], users[j])
            total_score += score
            comparisons += 1
    
    avg_score = total_score / comparisons if comparisons > 0 else 0
    
    return avg_score >= min_compatibility_threshold, avg_score


def find_best_group(
    interested_users: List[Dict], 
    group_size: int,
    min_compatibility_threshold: float = 60.0
) -> Tuple[bool, List[Dict], float]:
    """
    Find the best mutually compatible group of users for a property
    Tests all possible combinations to find the group with highest average compatibility
    
    Returns: (match_found, best_group, best_avg_score)
    """
    if len(interested_users) < group_size:
        return False, [], 0.0
    
    best_avg_score = 0
    best_group = []
    
    # Try all possible combinations of users
    for group in combinations(interested_users, group_size):
        is_compatible, avg_score = check_group_compatibility(list(group), min_compatibility_threshold)
        
        if avg_score > best_avg_score:
            best_avg_score = avg_score
            best_group = list(group)
    
    # Check if best group meets threshold
    if best_avg_score >= min_compatibility_threshold:
        return True, best_group, best_avg_score
    else:
        return False, [], best_avg_score


def check_property_match_complete(
    interested_users: List[Dict],
    required_roommates: int,
    min_compatibility_threshold: float = 60.0
) -> Tuple[bool, List[Dict]]:
    """
    Check if a property has enough compatible users to form a complete match
    Returns: (is_complete, best_group)
    """
    # Need at least required_roommates users
    if len(interested_users) < required_roommates:
        return False, []
    
    # Ensure all users have animal archetypes
    for user in interested_users:
        if not user.get("animal_archetype"):
            user["animal_archetype"] = assign_animal_archetype(user)
    
    # Find best compatible group
    match_found, best_group, avg_score = find_best_group(
        interested_users,
        required_roommates,
        min_compatibility_threshold
    )
    
    return match_found, best_group