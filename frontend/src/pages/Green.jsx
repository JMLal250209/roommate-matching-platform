import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpeg';

/* ── Animated counter that counts up when triggered ─────────────────── */
function AnimatedCounter({ value, suffix = '', prefix = '', decimals = 0, triggered, duration = 2000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!triggered) return;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;
      setCount(decimals ? parseFloat(current.toFixed(decimals)) : Math.floor(current));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [triggered, value, duration, decimals]);

  return (
    <span>{prefix}{decimals ? count.toFixed(decimals) : count.toLocaleString()}{suffix}</span>
  );
}

/* ── Animated horizontal bar ─────────────────────────────────────────── */
function AnimatedBar({ percentage, color, delay = 0, triggered, label, value }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>{label}</span>
        <span style={{ fontSize: '14px', fontWeight: '700', color }}>{value}</span>
      </div>
      <div style={{ height: '14px', background: '#e2e8f0', borderRadius: '7px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: triggered ? `${percentage}%` : '0%',
          background: color,
          borderRadius: '7px',
          transition: `width 1.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        }} />
      </div>
    </div>
  );
}

/* ── Stat card ────────────────────────────────────────────────────────── */
function StatCard({ label, sub, color, icon, triggered, countValue, decimals, suffix, prefix }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '32px 24px',
      textAlign: 'center',
      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      border: `2px solid ${color}20`,
      flex: 1,
      minWidth: '180px',
    }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '36px', fontWeight: '800', color, letterSpacing: '-1px', lineHeight: 1, marginBottom: '8px' }}>
        {triggered
          ? <AnimatedCounter value={countValue} decimals={decimals} suffix={suffix} prefix={prefix} triggered={triggered} />
          : <span>{prefix}0{suffix}</span>}
      </div>
      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>{sub}</div>}
    </div>
  );
}

/* ── Comparison row for infrastructure table ─────────────────────────── */
function CompareRow({ label, ai, ours, better }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '16px',
      padding: '16px 0',
      borderBottom: '1px solid #e2e8f0',
      alignItems: 'center',
    }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>{label}</div>
      <div style={{
        fontSize: '14px', fontWeight: '600', color: '#dc2626',
        background: '#fef2f2', padding: '8px 12px', borderRadius: '8px', textAlign: 'center',
      }}>{ai}</div>
      <div style={{
        fontSize: '14px', fontWeight: '700', color: '#059669',
        background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', textAlign: 'center',
        border: better ? '2px solid #059669' : 'none',
      }}>{ours}</div>
    </div>
  );
}

export default function GreenPage() {
  const navigate = useNavigate();

  /* Intersection observer targets */
  const statsRef = useRef(null);
  const barsRef  = useRef(null);

  const [statsVisible, setStatsVisible] = useState(false);
  const [barsVisible,  setBarsVisible]  = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target === statsRef.current && entry.isIntersecting) setStatsVisible(true);
        if (entry.target === barsRef.current  && entry.isIntersecting) setBarsVisible(true);
      });
    }, { threshold: 0.25 });

    if (statsRef.current) observer.observe(statsRef.current);
    if (barsRef.current)  observer.observe(barsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: "'Outfit', -apple-system, sans-serif" }}>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '16px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
               onClick={() => navigate('/landing')}>
            <img src={logoImg} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.5px' }}>
              AMAZON SHRMP
            </span>
          </div>
          <button
            onClick={() => navigate('/landing')}
            style={{
              background: 'none', border: '1.5px solid #e2e8f0', borderRadius: '8px',
              padding: '8px 16px', fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            ← Back to Listings
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 40px' }}>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#dcfce7', color: '#15803d',
            padding: '8px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: '700',
            marginBottom: '24px', letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            <span>🌿</span> Green Computing Initiative
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: '800', color: '#0f172a',
            letterSpacing: '-2px', lineHeight: '1.1', margin: '0 0 24px 0',
          }}>
            Algorithm Over AI.<br />
            <span style={{ color: '#059669' }}>97.5% Less Carbon.</span>
          </h1>

          <p style={{
            fontSize: '18px', color: '#475569', maxWidth: '680px', margin: '0 auto 40px',
            lineHeight: '1.7',
          }}>
            We made a deliberate choice to reject conventional AI-powered matching in favour of
            an energy-efficient algorithmic solution — reducing our platform's carbon footprint
            from <strong style={{ color: '#dc2626' }}>1,074 kg CO₂</strong> to just{' '}
            <strong style={{ color: '#059669' }}>27.1 kg CO₂</strong> per year.
          </p>

          {/* Badge row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {[
              { icon: '⚡', text: '97.5% Carbon Reduction' },
              { icon: '🖥️', text: '84% Less Infrastructure Energy' },
              { icon: '⏱️', text: 'Sub-100ms Matching' },
              { icon: '🌍', text: 'Green AI Principles' },
            ].map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'white', border: '1.5px solid #d1fae5',
                borderRadius: '999px', padding: '10px 20px',
                fontSize: '14px', fontWeight: '600', color: '#065f46',
                boxShadow: '0 2px 8px rgba(5,150,105,0.1)',
              }}>
                <span>{b.icon}</span> {b.text}
              </div>
            ))}
          </div>
        </div>

        {/* ── The Decision ───────────────────────────────────────────────── */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '48px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '60px',
          borderLeft: '6px solid #059669',
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
            🧠 Why We Chose Algorithm Over AI
          </h2>
          <p style={{ fontSize: '16px', color: '#475569', lineHeight: '1.8', marginBottom: '20px', margin: '0 0 20px 0' }}>
            Our project specification gave us flexibility in our technical approach, describing
            "a platform that uses AI to match students based on lifestyle preferences, academic schedules,
            and personal interests." Rather than following the path of least resistance, our team made a
            deliberate decision to prioritise environmental sustainability.
          </p>
          <p style={{ fontSize: '16px', color: '#475569', lineHeight: '1.8', margin: '0' }}>
            We developed a more energy-efficient algorithmic solution that profiles student
            characteristics and matches them using a sorting algorithm. This aligns with the principles
            of <strong style={{ color: '#059669' }}>Green AI</strong> — which advocates for reducing
            the computational and environmental costs of AI systems by treating efficiency alongside
            accuracy as a key evaluation metric{' '}
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>(Schwartz et al., 2020)</span>.
          </p>
        </div>

        {/* ── Animated Key Stats ─────────────────────────────────────────── */}
        <div ref={statsRef} style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '28px', fontWeight: '700', color: '#0f172a',
            textAlign: 'center', marginBottom: '8px',
          }}>
            Annual Impact (10,000 Students · 2,000 Listings)
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '15px', marginBottom: '40px' }}>
            Projected operations over one year
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
            <StatCard
              icon="🌡️" label="Carbon Reduction" suffix="%" decimals={1}
              countValue={97.5} color="#059669" triggered={statsVisible}
              sub="Less CO₂ than AI-powered matching"
            />
            <StatCard
              icon="⚡" label="AI System Energy" suffix=" kWh" decimals={1}
              countValue={3580.4} color="#dc2626" triggered={statsVisible}
              sub="Annual energy consumption"
            />
            <StatCard
              icon="🌿" label="Our CO₂ Emissions" suffix=" kg" decimals={1}
              countValue={27.1} color="#059669" triggered={statsVisible}
              sub="Per year — our algorithm approach"
            />
            <StatCard
              icon="☁️" label="AI CO₂ Emissions" suffix=" kg" decimals={0}
              countValue={1074} color="#dc2626" triggered={statsVisible}
              sub="Would have been produced annually"
            />
          </div>
        </div>

        {/* ── Comparison Bars ────────────────────────────────────────────── */}
        <div ref={barsRef} style={{
          background: 'white', borderRadius: '20px', padding: '48px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '60px',
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            📊 Carbon Emissions Comparison
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '40px' }}>
            Annual CO₂ output — AI approach vs our algorithmic solution
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <AnimatedBar
              label="🤖 AI-Powered Matching" value="1,074 kg CO₂ / year"
              percentage={100} color="#dc2626" delay={0} triggered={barsVisible}
            />
            <AnimatedBar
              label="🌿 Our Algorithm Approach" value="27.1 kg CO₂ / year"
              percentage={2.5} color="#059669" delay={0.3} triggered={barsVisible}
            />
          </div>

          {/* Divider */}
          <div style={{ margin: '40px 0', borderTop: '1px solid #e2e8f0' }} />

          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            ⚙️ Infrastructure Energy Use
          </h3>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '28px' }}>
            Compute energy consumed annually by each approach
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <AnimatedBar
              label="🤖 AI Infrastructure (2× t3.medium, 24/7)" value="350.4 kWh / year"
              percentage={100} color="#f97316" delay={0} triggered={barsVisible}
            />
            <AnimatedBar
              label="🌿 Our Infrastructure (1× t3.small, 12 hrs/day)" value="43.8 kWh / year"
              percentage={12.5} color="#059669" delay={0.3} triggered={barsVisible}
            />
          </div>

          <div style={{
            marginTop: '32px', background: '#f0fdf4', borderRadius: '12px',
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{ fontSize: '28px' }}>🏆</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#065f46' }}>
                84% reduction in infrastructure energy
              </div>
              <div style={{ fontSize: '14px', color: '#16a34a', marginTop: '2px' }}>
                Our pre-computed compatibility matrix eliminates the need for GPU instances, vector
                databases, and associated cooling infrastructure.
              </div>
            </div>
          </div>
        </div>

        {/* ── Real World Equivalencies ───────────────────────────────────── */}
        <div style={{
          background: '#0f172a', borderRadius: '24px', padding: '56px 48px',
          marginBottom: '60px', position: 'relative', overflow: 'hidden',
        }}>
          {/* decorative blur blobs */}
          <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '260px', height: '260px', background: 'rgba(124,58,237,0.15)', borderRadius: '50%', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '260px', height: '260px', background: 'rgba(8,145,178,0.15)', borderRadius: '50%', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '200px', height: '200px', background: 'rgba(217,119,6,0.1)', borderRadius: '50%', filter: 'blur(60px)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
              1,074 kg CO₂ — made tangible
            </p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: '800', color: 'white', textAlign: 'center', marginBottom: '52px', letterSpacing: '-0.5px' }}>
              The AI cost, in real terms
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
              {/* Card 1 */}
              <div style={{ padding: '32px 24px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '56px', marginBottom: '20px', lineHeight: 1 }}>🚗</div>
                <div style={{ fontSize: 'clamp(48px, 5vw, 72px)', fontWeight: '900', color: '#a78bfa', lineHeight: 1, letterSpacing: '-2px' }}>
                  ×5
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', margin: '12px 0 6px' }}>
                  Dublin → Paris
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>return trips by car</div>
              </div>

              {/* Card 2 */}
              <div style={{ padding: '32px 24px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '56px', marginBottom: '20px', lineHeight: 1 }}>📧</div>
                <div style={{ fontSize: 'clamp(48px, 5vw, 72px)', fontWeight: '900', color: '#38bdf8', lineHeight: 1, letterSpacing: '-2px' }}>
                  104M
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', margin: '12px 0 6px' }}>
                  Emails sent
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>≈ 10g CO₂ each</div>
              </div>

              {/* Card 3 */}
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: '20px', lineHeight: 1 }}>💡</div>
                <div style={{ fontSize: 'clamp(48px, 5vw, 72px)', fontWeight: '900', color: '#fbbf24', lineHeight: 1, letterSpacing: '-2px' }}>
                  223
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', margin: '12px 0 6px' }}>
                  Days lit
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>200W bulb, non-stop</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Infrastructure Comparison Table ────────────────────────────── */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '48px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '60px',
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            🏗️ Infrastructure Comparison
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '36px' }}>
            Architectural differences between AI-powered and algorithm-based matching
          </p>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px', marginBottom: '8px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Resource
            </div>
            <div style={{
              fontSize: '13px', fontWeight: '700', color: '#dc2626',
              textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center',
              display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
            }}>
              🤖 AI Approach
            </div>
            <div style={{
              fontSize: '13px', fontWeight: '700', color: '#059669',
              textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center',
              display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
            }}>
              🌿 Our Algorithm
            </div>
          </div>

          <CompareRow label="EC2 Instance Type"   ai="2× t3.medium (24/7)"       ours="1× t3.small (12 hrs/day)" better />
          <CompareRow label="Annual Compute Energy" ai="350.4 kWh"                ours="43.8 kWh" better />
          <CompareRow label="GPU Instances"        ai="Required for inference"    ours="Not needed" better />
          <CompareRow label="Vector Database"      ai="Required"                  ours="Not needed" better />
          <CompareRow label="Cooling Infrastructure" ai="Required"                ours="Minimal" better />
          <CompareRow label="Annual CO₂"           ai="1,074 kg"                 ours="27.1 kg" better />
          <CompareRow label="Query Latency"        ai="Variable (model inference)" ours="< 100ms" better />
          <CompareRow label="Cost Overhead"        ai="High (GPU + AI APIs)"     ours="Low" better />

          <div style={{
            marginTop: '32px', background: '#f0fdf4', borderRadius: '12px',
            padding: '20px 24px',
          }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#065f46', marginBottom: '6px' }}>
              ⚡ Result: Sub-100ms Matching with a Fraction of the Resources
            </div>
            <div style={{ fontSize: '14px', color: '#16a34a', lineHeight: '1.6' }}>
              Our pre-computed compatibility matrix delivers fast, accurate matching while eliminating
              the resource overhead of AI model serving — proving that environmental responsibility
              and technical performance are complementary objectives.
            </div>
          </div>
        </div>

        {/* ── CO₂ Savings Visual ─────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          borderRadius: '20px', padding: '60px 48px',
          textAlign: 'center', color: 'white', marginBottom: '60px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(5,150,105,0.35)',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', top: '-80px', right: '-80px',
            width: '300px', height: '300px', background: 'rgba(255,255,255,0.07)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', left: '-60px',
            width: '220px', height: '220px', background: 'rgba(255,255,255,0.07)',
            borderRadius: '50%',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌿</div>
            <div style={{ fontSize: 'clamp(64px, 10vw, 100px)', fontWeight: '900', letterSpacing: '-3px', lineHeight: 1 }}>
              1,046.9 kg
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', opacity: 0.9, margin: '12px 0 20px' }}>
              CO₂ saved every single year
            </div>
            <div style={{ fontSize: '16px', opacity: 0.8, maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
              The difference between 1,074 kg and 27.1 kg — the environmental cost we avoided
              by choosing algorithmic matching over AI.
            </div>
          </div>
        </div>

        {/* ── Reference ──────────────────────────────────────────────────── */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '32px 40px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)', borderLeft: '4px solid #cbd5e1',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#475569', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📚 Reference
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.8', margin: 0 }}>
            Schwartz, R., Dodge, J., Smith, N. A., &amp; Etzioni, O. (2020).{' '}
            <em>Green AI.</em> <em>Communications of the ACM, 63</em>(12), 54–63.{' '}
            <a
              href="https://doi.org/10.1145/3381831"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#059669', fontWeight: '600', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              https://doi.org/10.1145/3381831
            </a>
          </p>
        </div>
      </div>

      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}
