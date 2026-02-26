import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getProperty,
  getUserMatchForProperty,
  registerPropertyInterest,
} from '../lib/propertiesApi';

const DEFAULT_PROPERTY = {
  propertyId: "prop_001",
  title: "Sunlit 4BR Near Campus",
  address: "Trinity College Dublin, College Green, Dublin 2",
  city: "Dublin",
  rent_per_month: 1200,
  required_roommates: 3,
  bedrooms: 4,
  bathrooms: 2,
  description:
    "Spacious 4-bedroom house just minutes from campus. Recently renovated with modern appliances, high-speed fiber internet, and a large backyard perfect for study sessions or weekend hangouts. The house has great natural light and is located in a quiet, safe neighborhood with easy access to public transportation.",
  amenities: [
    "WiFi",
    "Laundry",
    "Air Conditioning",
    "Furnished",
    "Dishwasher",
    "Microwave",
    "Coffee Maker",
    "Backyard",
    "Bike Storage",
    "Study Room",
    "Parking",
    "Gym",
  ],
  available_from: "2024-09-01",
  pets_allowed: true,
  smoking_allowed: false,
  status: "available",
  images: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
  ],
  landlord: {
    name: "Sarah Johnson",
    rating: 4.8,
    properties: 12,
    verified: true,
  },
  roommates: {
    matchScore: 87,
    count: 3,
    profiles: [
      { name: "Alex", major: "Computer Science", year: "3rd Year", matchAnimal: "🦉 Owl", compatibility: 92 },
      { name: "Maya", major: "Biology", year: "2nd Year", matchAnimal: "🐼 Panda", compatibility: 85 },
      { name: "Jordan", major: "Engineering", year: "Final Year", matchAnimal: "🐼 Panda", compatibility: 84 },
    ],
  },
  nearbyPlaces: [
    { name: "Trinity College Dublin", distance: "0.3 mi", time: "6 min walk" },
    { name: "Tesco Express", distance: "0.5 mi", time: "10 min walk" },
    { name: "Pearse Street Library", distance: "0.4 mi", time: "8 min walk" },
    { name: "Trinity Sports Centre", distance: "0.6 mi", time: "12 min walk" },
  ],
};

const ANIMAL_EMOJI = {
  owl: "🦉",
  dog: "🐶",
  cat: "🐱",
  panda: "🐼",
  wolf: "🐺",
  turtle: "🐢",
  fox: "🦊",
  rabbit: "🐰",
};

function toCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "N/A";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatAnimalTag(animalArchetype) {
  if (!animalArchetype) return "🐼 Panda";
  const normalized = String(animalArchetype).toLowerCase();
  const emoji = ANIMAL_EMOJI[normalized] || "🐾";
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return `${emoji} ${label}`;
}

function normalizeProperty(rawProperty, fallback = {}) {
  const source = rawProperty || {};
  const imageUrls = [];

  if (Array.isArray(source.image_urls)) {
    imageUrls.push(...source.image_urls);
  }
  if (Array.isArray(source.images)) {
    imageUrls.push(...source.images);
  }
  if (typeof source.image === "string" && source.image.trim()) {
    imageUrls.push(source.image.trim());
  }

  const cleanImages = [...new Set(imageUrls.filter((image) => typeof image === "string" && image.trim()))];
  const fallbackImages = Array.isArray(fallback.images) ? fallback.images : DEFAULT_PROPERTY.images;

  return {
    ...DEFAULT_PROPERTY,
    ...fallback,
    ...source,
    title: source.title || fallback.title || DEFAULT_PROPERTY.title,
    address: source.address || fallback.address || DEFAULT_PROPERTY.address,
    city: source.city || fallback.city || DEFAULT_PROPERTY.city,
    description: source.description || fallback.description || DEFAULT_PROPERTY.description,
    amenities: Array.isArray(source.amenities)
      ? source.amenities
      : Array.isArray(fallback.amenities)
        ? fallback.amenities
        : DEFAULT_PROPERTY.amenities,
    images: cleanImages.length > 0 ? cleanImages : fallbackImages,
    rent_per_month: Number(source.rent_per_month ?? fallback.rent_per_month ?? DEFAULT_PROPERTY.rent_per_month),
    required_roommates: Number(
      source.required_roommates ?? fallback.required_roommates ?? DEFAULT_PROPERTY.required_roommates
    ),
    nearbyPlaces: Array.isArray(source.nearbyPlaces)
      ? source.nearbyPlaces
      : Array.isArray(fallback.nearbyPlaces)
        ? fallback.nearbyPlaces
        : DEFAULT_PROPERTY.nearbyPlaces,
    landlord: source.landlord || fallback.landlord || DEFAULT_PROPERTY.landlord,
    roommates: source.roommates || fallback.roommates || DEFAULT_PROPERTY.roommates,
  };
}

export default function PropertyDetails() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { state } = useLocation();
  const { propertyId } = useParams();
  const house = state?.house;
  const resolvedPropertyId = propertyId || house?.propertyId || house?.id || "";
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [property, setProperty] = useState(() => normalizeProperty(house || {}));
  const [matchData, setMatchData] = useState(null);
  const [loadingProperty, setLoadingProperty] = useState(Boolean(resolvedPropertyId));
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [isInterested, setIsInterested] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProperty() {
      if (!resolvedPropertyId) {
        setLoadingProperty(false);
        return;
      }

      setLoadingProperty(true);
      setLoadError("");

      try {
        const fetchedProperty = await getProperty(resolvedPropertyId);
        if (!isMounted) return;

        if (!fetchedProperty) {
          setLoadError("Property not found.");
          return;
        }

        setProperty((current) => normalizeProperty(fetchedProperty, current));
      } catch (err) {
        if (!isMounted) return;
        if (err?.code === "SESSION_EXPIRED") {
          signOut("Session expired. Please sign in again.");
          return;
        }
        setLoadError(err?.message || "Unable to load property details.");
      } finally {
        if (isMounted) {
          setLoadingProperty(false);
        }
      }
    }

    loadProperty();

    return () => {
      isMounted = false;
    };
  }, [resolvedPropertyId, signOut]);

  useEffect(() => {
    let isMounted = true;

    async function loadMatches() {
      if (!user?.userId || !resolvedPropertyId) {
        setMatchData(null);
        setIsInterested(false);
        return;
      }

      setLoadingMatch(true);

      try {
        const matches = await getUserMatchForProperty(user.userId, resolvedPropertyId);
        if (!isMounted) return;

        setMatchData(matches);
        setIsInterested(true);
      } catch (err) {
        if (!isMounted) return;
        if (err?.code === "SESSION_EXPIRED") {
          signOut("Session expired. Please sign in again.");
          return;
        }
        setMatchData(null);
        setIsInterested(false);
      } finally {
        if (isMounted) {
          setLoadingMatch(false);
        }
      }
    }

    loadMatches();

    return () => {
      isMounted = false;
    };
  }, [resolvedPropertyId, signOut, user?.userId]);

  // Map amenities to display format with icons
  const amenityIcons = {
    "WiFi": "📶", "Laundry": "🧺", "Air Conditioning": "❄️", "Furnished": "🛋️",
    "Dishwasher": "🍽️", "Microwave": "📻", "Coffee Maker": "☕", "Backyard": "🌳",
    "Bike Storage": "🚲", "Study Room": "📚", "Parking": "🚗", "Gym": "💪"
  };
  
  const displayAmenities = property.amenities.map(amenity => ({
    name: amenity,
    icon: amenityIcons[amenity] || "✓"
  }));

  const fallbackRoommates = Array.isArray(property.roommates?.profiles)
    ? property.roommates.profiles
    : [];
  const compatibleMatches = Array.isArray(matchData?.matches?.compatible)
    ? matchData.matches.compatible
    : [];
  const matchedRoommates = compatibleMatches.length > 0
    ? compatibleMatches.map((match) => ({
      name: match?.name || "Unknown",
      major: match?.course || "Course unavailable",
      year: match?.year || "Year unavailable",
      matchAnimal: formatAnimalTag(match?.animal_archetype),
      compatibility: Number(match?.compatibility_score) || 0,
    }))
    : fallbackRoommates;
  const roommateCount = Number.isFinite(Number(matchData?.compatibleCount))
    ? Number(matchData.compatibleCount)
    : matchedRoommates.length;

  // Use the landing page image as the first image if available
  const baseImages = Array.isArray(property.images) && property.images.length > 0
    ? property.images
    : DEFAULT_PROPERTY.images;
  const displayImages = house?.image
    ? [house.image, ...baseImages.filter(img => img !== house.image)]
    : baseImages;

  const availableFromLabel = property.available_from
    ? new Date(property.available_from).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : "TBA";

  const handleRegisterInterest = async () => {
    if (!resolvedPropertyId || isInterested || submittingInterest) return;

    setActionError("");
    setSubmittingInterest(true);

    try {
      await registerPropertyInterest(
        resolvedPropertyId,
        `${toCurrency(property.rent_per_month)}/month`
      );
      setIsInterested(true);

      if (user?.userId) {
        const refreshedMatches = await getUserMatchForProperty(user.userId, resolvedPropertyId);
        setMatchData(refreshedMatches);
      }
    } catch (err) {
      if (err?.code === "SESSION_EXPIRED") {
        signOut("Session expired. Please sign in again.");
        return;
      }
      setActionError(err?.message || "Unable to register interest.");
    } finally {
      setSubmittingInterest(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: "'Outfit', -apple-system, sans-serif"
    }}>
      {/* Header Bar */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#0f172a',
            margin: 0,
            letterSpacing: '-0.5px'
          }}>
            Amazon SHRMP
          </h1>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #059669',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.borderColor = '#047857';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = '#059669';
          }}>
            <img 
              src="https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=100&h=100&fit=crop" 
              alt="User profile"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        </div>
      </div>

      {(loadingProperty || loadError || actionError) && (
        <div style={{
          maxWidth: '1400px',
          margin: '16px auto 0',
          padding: '0 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {loadingProperty && (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '14px',
              color: '#475569',
            }}>
              Loading latest property details...
            </div>
          )}
          {loadError && (
            <div style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '14px',
              color: '#be123c',
            }}>
              {loadError}
            </div>
          )}
          {actionError && (
            <div style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '14px',
              color: '#be123c',
            }}>
              {actionError}
            </div>
          )}
        </div>
      )}

      {/* Hero Section */}
      <div style={{
        background: 'white',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '40px 40px 40px'
        }}>
          {/* Back Button */}
          <button onClick={() => navigate('/landing')} style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            color: '#475569',
            cursor: 'pointer',
            marginBottom: '30px',
            padding: '8px 16px 8px 8px',
            borderRadius: '20px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.transform = 'translateX(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.transform = 'translateX(0)';
          }}>
            <span style={{ fontSize: '20px' }}>←</span>
            Back to listings
          </button>

          {/* Main Image Gallery */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '12px',
            height: '520px',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <div style={{
              gridRow: 'span 2',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer'
            }}>
              <img 
                src={displayImages[0]} 
                alt="Main view"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>
            {displayImages.slice(1, 5).map((img, idx) => (
              <div key={idx} style={{
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer'
              }}>
                <img 
                  src={img} 
                  alt={`View ${idx + 2}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
                {idx === 3 && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    +{displayImages.length - 5} more
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '40px'
      }}>
        {/* Left Column - Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Property Header */}
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '20px'
            }}>
              <div>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: '#0f172a',
                  margin: '0 0 12px 0',
                  letterSpacing: '-0.5px'
                }}>
                  {property.title}
                </h1>
                <p style={{
                  fontSize: '16px',
                  color: '#64748b',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>📍</span> {property.address}
                </p>
              </div>
              <button style={{
                background: 'none',
                border: '2px solid #e2e8f0',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ff6b6b';
                e.currentTarget.style.borderColor = '#ff6b6b';
                e.currentTarget.innerHTML = '❤️';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.innerHTML = '🤍';
              }}>
                🤍
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              padding: '24px 0',
              borderTop: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0'
            }}>
              {[
                { label: 'Bedrooms', value: property.bedrooms, icon: '🛏️' },
                { label: 'Bathrooms', value: property.bathrooms, icon: '🚿' },
                { label: 'Roommates', value: property.required_roommates, icon: '👥' }
              ].map((item, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              paddingTop: '20px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: property.pets_allowed ? '#d3f9d8' : '#ffe8cc',
                color: property.pets_allowed ? '#2b8a3e' : '#e67700',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{property.pets_allowed ? '🐕' : '🚫'}</span>
                {property.pets_allowed ? 'Pets Allowed' : 'No Pets'}
              </div>
              <div style={{
                background: property.smoking_allowed ? '#ffe8cc' : '#d3f9d8',
                color: property.smoking_allowed ? '#e67700' : '#2b8a3e',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{property.smoking_allowed ? '🚬' : '🚭'}</span>
                {property.smoking_allowed ? 'Smoking Allowed' : 'No Smoking'}
              </div>
            </div>

            <div style={{ paddingTop: '24px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '12px'
              }}>
                About this place
              </h3>
              <p style={{
                fontSize: '16px',
                lineHeight: '1.7',
                color: '#475569',
                margin: 0
              }}>
                {property.description}
              </p>
            </div>
          </div>

          {/* Roommate Matches */}
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            padding: '40px',
            borderRadius: '16px',
            color: 'white',
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              filter: 'blur(40px)'
            }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  Your Roommate Matches
                </h2>
              </div>

              <p style={{
                fontSize: '16px',
                opacity: 0.95,
                marginBottom: '32px',
                lineHeight: '1.6'
              }}>
                {loadingMatch
                  ? "Checking compatibility..."
                  : isInterested
                    ? `You currently have ${roommateCount} compatible matches for this property.`
                    : "Register interest to see compatible roommate matches for this property."}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {matchedRoommates.map((roommate, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '20px',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid rgba(255,255,255,0.2)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${['#ff6b6b', '#4ecdc4', '#45b7d1'][idx % 3]} 0%, ${['#ff8787', '#5ee7df', '#5bc8de'][idx % 3]} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: '700',
                        color: 'white'
                      }}>
                        {roommate.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                          {roommate.name}
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                          {roommate.major} • {roommate.year}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.3)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {roommate.matchAnimal}
                    </div>
                  </div>
                ))}
              </div>

              <button style={{
                marginTop: '24px',
                width: '100%',
                background: 'white',
                color: '#059669',
                border: 'none',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                View All Matches
              </button>
            </div>
          </div>

          {/* Amenities */}
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '24px'
            }}>
              Amenities
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px'
            }}>
              {displayAmenities.slice(0, showAllAmenities ? undefined : 8).map((amenity, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}>
                  <span style={{ fontSize: '24px' }}>{amenity.icon}</span>
                  <span style={{ fontSize: '16px', color: '#475569', fontWeight: '500' }}>
                    {amenity.name}
                  </span>
                </div>
              ))}
            </div>
            {displayAmenities.length > 8 && (
              <button 
                onClick={() => setShowAllAmenities(!showAllAmenities)}
                style={{
                  marginTop: '20px',
                  background: 'none',
                  border: '2px solid #e2e8f0',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#475569';
                  e.currentTarget.style.background = '#475569';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#475569';
                }}>
                {showAllAmenities ? 'Show Less' : `Show All ${displayAmenities.length} Amenities`}
              </button>
            )}
          </div>

          {/* Nearby Places */}
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '24px'
            }}>
              Nearby
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {property.nearbyPlaces.map((place, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                      {place.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      {place.distance} • {place.time}
                    </div>
                  </div>
                  <div style={{
                    background: '#059669',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#047857';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#059669';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    Directions
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Booking Card & Landlord */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Booking Card */}
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <span style={{
                fontSize: '42px',
                fontWeight: '700',
                color: '#0f172a',
                letterSpacing: '-1px'
              }}>
                {`${toCurrency(property.rent_per_month)} / month`}
              </span>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Available From
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                {availableFromLabel}
              </div>
            </div>

            <button
              onClick={handleRegisterInterest}
              disabled={isInterested || submittingInterest}
              style={{
              width: '100%',
              background: isInterested ? '#dcfce7' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: isInterested ? '#065f46' : 'white',
              border: isInterested ? '2px solid #059669' : 'none',
              padding: '18px',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              boxShadow: isInterested ? '0 4px 12px rgba(5, 150, 105, 0.2)' : '0 4px 12px rgba(5, 150, 105, 0.3)',
              opacity: submittingInterest ? 0.8 : 1,
              cursor: isInterested || submittingInterest ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (isInterested || submittingInterest) return;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = isInterested ? '0 8px 20px rgba(5, 150, 105, 0.3)' : '0 8px 20px rgba(5, 150, 105, 0.4)';
            }}
            onMouseLeave={(e) => {
              if (isInterested || submittingInterest) return;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isInterested ? '0 4px 12px rgba(5, 150, 105, 0.2)' : '0 4px 12px rgba(5, 150, 105, 0.3)';
            }}>
              {isInterested
                ? 'Interest Registered ✓'
                : submittingInterest
                  ? 'Registering...'
                  : 'Register Interest'}
            </button>
          </div>

          {/* Landlord Info */}
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#0f172a',
              marginBottom: '20px'
            }}>
              Hosted by
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: '700',
                color: 'white'
              }}>
                {property.landlord.name.charAt(0)}
              </div>
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#0f172a',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {property.landlord.name}
                  {property.landlord.verified && (
                    <span style={{
                      background: '#20c997',
                      color: 'white',
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: '600'
                    }}>
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  ⭐ {property.landlord.rating} • {property.landlord.properties} properties
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Outfit font */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" 
        rel="stylesheet"
      />
    </div>
  );
}
