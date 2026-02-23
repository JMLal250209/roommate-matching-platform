import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.jpeg";

function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const particles = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 90;
    particles.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 2 + 1.5,
    }));

    function onMouseMove(e) {
      mouse.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener("mousemove", onMouseMove);

    function dist(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const LINK_DIST = 130;
      const MOUSE_DIST = 160;
      const REPEL = 100;

      for (const p of particles.current) {
        // Mouse repulsion
        const dx = p.x - mouse.current.x;
        const dy = p.y - mouse.current.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < REPEL && d > 0) {
          const force = (REPEL - d) / REPEL;
          p.vx += (dx / d) * force * 0.4;
          p.vy += (dy / d) * force * 0.4;
        }

        // Dampen velocity
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > canvas.width) { p.x = canvas.width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > canvas.height) { p.y = canvas.height; p.vy *= -1; }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(52, 211, 153, 0.75)";
        ctx.fill();
      }

      // Draw lines between nearby particles
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const d = dist(particles.current[i], particles.current[j]);
          if (d < LINK_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles.current[i].x, particles.current[i].y);
            ctx.lineTo(particles.current[j].x, particles.current[j].y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${0.25 * (1 - d / LINK_DIST)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw lines from particle to mouse
        const dm = dist(particles.current[i], mouse.current);
        if (dm < MOUSE_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles.current[i].x, particles.current[i].y);
          ctx.lineTo(mouse.current.x, mouse.current.y);
          ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 * (1 - dm / MOUSE_DIST)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        display: "block",
      }}
    />
  );
}

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
    navigate("/landing");
  }

  function handleCancelSkip() {
    setShowSkipDialog(false);
    setShowSkipWarning(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Outfit', -apple-system, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <ParticleCanvas />

      {/* Logo */}
      <div style={{
        position: "fixed",
        top: "28px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <img src={logoImg} alt="AMAZON SHRMP logo" style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          objectFit: "cover",
        }} />
        <span style={{
          fontSize: "22px",
          fontWeight: "700",
          color: "#0f172a",
          letterSpacing: "-0.5px",
        }}>
          AMAZON SHRMP
        </span>
      </div>

      {/* Card */}
      <div style={{
        position: "relative",
        zIndex: 10,
        background: "white",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "440px",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "#0f172a",
          margin: "0 0 12px 0",
          letterSpacing: "-0.5px",
        }}>
          Create Your Profile
        </h1>
        <p style={{
          fontSize: "15px",
          color: "#64748b",
          margin: "0 0 36px 0",
          lineHeight: "1.6",
        }}>
          Help us match you with the perfect place and roommates by completing your profile.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            type="button"
            onClick={handleStartProfile}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #059669, #047857)",
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(5,150,105,0.35)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(5,150,105,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(5,150,105,0.35)";
            }}
          >
            Start Profile Setup
          </button>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#475569",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e2e8f0";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.color = "#475569";
            }}
          >
            Skip for Now
          </button>
        </div>

        <p style={{
          marginTop: "24px",
          fontSize: "13px",
          color: "#94a3b8",
        }}>
          Completing your profile helps us find better matches for housing and roommates.
        </p>
      </div>

      {/* Skip Dialog */}
      {showSkipDialog && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#ffffff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            padding: "36px",
            maxWidth: "380px",
            width: "100%",
            margin: "20px",
            textAlign: "center",
          }}>
            <h2 style={{ color: "#0f172a", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>
              Skip Profile Setup?
            </h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "28px", lineHeight: "1.6" }}>
              You can skip this step and start browsing now.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={handleSkipConfirm} style={{
                flex: 1, padding: "12px", borderRadius: "8px", border: "none",
                background: "linear-gradient(135deg, #059669, #047857)",
                color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer",
              }}>Yes, Skip</button>
              <button type="button" onClick={handleCancelSkip} style={{
                flex: 1, padding: "12px", borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#475569", fontSize: "14px", fontWeight: "600", cursor: "pointer",
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Warning */}
      {showSkipWarning && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#1e293b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            padding: "36px",
            maxWidth: "380px",
            width: "100%",
            margin: "20px",
            textAlign: "center",
          }}>
            <h2 style={{ color: "white", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>
              Important Notice
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "28px", lineHeight: "1.6" }}>
              If you want to make connections with people and actually be grouped
              with people, you should complete your profile. This lets us see who
              and where is a good fit for you.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={handleStartProfile} style={{
                flex: 1, padding: "12px", borderRadius: "8px", border: "none",
                background: "linear-gradient(135deg, #059669, #047857)",
                color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer",
              }}>Complete Profile</button>
              <button type="button" onClick={handleSkipAnyway} style={{
                flex: 1, padding: "12px", borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.75)", fontSize: "14px", fontWeight: "600", cursor: "pointer",
              }}>Skip Anyway</button>
            </div>
          </div>
        </div>
      )}

      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}
