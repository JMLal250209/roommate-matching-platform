import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// The idea of this page is once you sign up and create a username and password you be lead to this page. 
// A pop up says that you can skip this step and start browsing now. 
// If you do this a pop up says that if you want to make connections with people and actually be grouped 
// with people you should do this as it lets us see who and where is a good fit for you

export default function CreateProfile() {
  const navigate = useNavigate();
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  function handleStartProfile() {
    navigate("/profile/housing");
  }

  function handleSkip() {
    setShowSkipDialog(true);
  }

  function handleSkipConfirm() {
    setShowSkipDialog(false);
    setShowSkipWarning(true);
  }

  function handleSkipAnyway() {
    setShowSkipWarning(false);
    navigate("/profile/view");
  }

  function handleCancelSkip() {
    setShowSkipDialog(false);
    setShowSkipWarning(false);
  }

  return (
    <div className="container">
      <div className="card">
        <div className="cardHeader">
          <h1 className="h1">Create Your Profile</h1>
          <p className="sub">
            Help us match you with the perfect place and roommates by completing your profile.
          </p>
        </div>

        <div className="cardBody">
          <div className="row" style={{ gap: 12 }}>
            <button 
              type="button" 
              className="btn btnPrimary" 
              onClick={handleStartProfile}
            >
              Start Profile Setup
            </button>
            <button 
              type="button" 
              className="btn btnSecondary" 
              onClick={handleSkip}
            >
              Skip for Now
            </button>
          </div>

          <div className="divider"></div>

          <p className="sub" style={{ margin: 0 }}>
            Completing your profile helps us find better matches for housing and roommates.
          </p>
        </div>
      </div>

      {/* Skip Dialog */}
      {showSkipDialog && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: 400, margin: 20 }}>
            <div className="cardHeader">
              <h2 className="h2">Skip Profile Setup?</h2>
              <p className="sub">
                You can skip this step and start browsing now.
              </p>
            </div>
            <div className="cardBody">
              <div className="row" style={{ gap: 12 }}>
                <button 
                  type="button" 
                  className="btn btnPrimary" 
                  onClick={handleSkipConfirm}
                >
                  Yes, Skip
                </button>
                <button 
                  type="button" 
                  className="btn btnSecondary" 
                  onClick={handleCancelSkip}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Skip Warning */}
      {showSkipWarning && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: 400, margin: 20 }}>
            <div className="cardHeader">
              <h2 className="h2">Important Notice</h2>
              <p className="sub">
                If you want to make connections with people and actually be grouped 
                with people, you should complete your profile. This lets us see who 
                and where is a good fit for you.
              </p>
            </div>
            <div className="cardBody">
              <div className="row" style={{ gap: 12 }}>
                <button 
                  type="button" 
                  className="btn btnPrimary" 
                  onClick={handleStartProfile}
                >
                  Complete Profile
                </button>
                <button 
                  type="button" 
                  className="btn btnSecondary" 
                  onClick={handleSkipAnyway}
                >
                  Skip Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
