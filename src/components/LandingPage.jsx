import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../services/audio';
import { Users, Music, Camera, Gamepad2, Gift, Heart, ArrowRight, Play, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LandingPage({ eventInfo, onNavigate }) {
  // 0: pre-tap, 1: rocket launching on blank screen, 2: video playing, 3: revealed landing page
  const [introStage, setIntroStage] = useState(0);
  const videoRef = useRef(null);

  const triggerFireworks = () => {
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#A855F7', '#FBBF24', '#FFFFFF']
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#A855F7', '#FBBF24', '#FFFFFF']
      });
    }, 250);
  };

  const handleReveal = () => {
    setIntroStage(1); // Rocket launching on blank screen
    
    // Rocket shoots up for 1.1s, then blast and show video!
    setTimeout(() => {
      setIntroStage(2); // Reveal video and start fireworks
      triggerFireworks();
    }, 1100);
  };

  const handleVideoEnded = () => {
    setIntroStage(3); // Reveal landing page after video
  };

  const handleGetStarted = () => {
    sound.playClick();
    onNavigate('auth');
  };

  const features = [
    { icon: <Users size={24} />, title: "MEET NEW PEOPLE" },
    { icon: <Music size={24} />, title: "LIVE MUSIC & DANCE" },
    { icon: <Camera size={24} />, title: "CAPTURE EPIC MOMENTS" },
    { icon: <Gamepad2 size={24} />, title: "FUN GAMES & ACTIVITIES" },
    { icon: <Gift size={24} />, title: "EXCITING SURPRISES" },
    { icon: <Heart size={24} />, title: "UNLIMITED VIBES" }
  ];

  return (
    <>
      {/* ─── Intro Screen Overlay (Pre-tap, Rocket Launch, and Video) ─── */}
      {introStage < 3 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#030712', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: introStage === 0 ? 'pointer' : 'default' }} onClick={introStage === 0 ? handleReveal : undefined}>
          
          {introStage === 0 && (
            <div className="reveal-pulse" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--purple-main)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(107,33,168,0.5)' }}>
                <Play size={40} fill="white" style={{ marginLeft: 6 }} />
              </div>
              <h2 className="marker-font" style={{ fontSize: 32, color: 'white', letterSpacing: '2px' }}>TAP TO ENTER THE VIBE</h2>
            </div>
          )}

          {introStage === 1 && (
            <div className="rocket-container">
              <span style={{ fontSize: 60 }}>🚀</span>
            </div>
          )}

          {introStage === 2 && (
            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black' }}>
              <video 
                ref={videoRef}
                src="/intro-video.mp4" 
                autoPlay 
                playsInline
                onEnded={handleVideoEnded}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <button 
                onClick={handleVideoEnded}
                className="marker-font"
                style={{ position: 'absolute', bottom: 30, right: 30, padding: '10px 24px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: 'white', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 30, cursor: 'pointer', zIndex: 100, fontSize: 18 }}
              >
                Skip Video &rarr;
              </button>
            </div>
          )}

        </div>
      )}

      {/* ─── Main Landing Page (Reveals at stage 3) ─── */}
      <div className={`doodle-bg ${introStage === 3 ? 'reveal-animation' : ''}`} style={{ minHeight: '100vh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: introStage === 3 ? 1 : 0, transition: 'opacity 0.5s', display: introStage === 3 ? 'flex' : 'none' }}>
      
      {/* Top Banner Quotes */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ transform: 'rotate(-3deg)', background: 'var(--card-bg)', padding: '8px 16px', border: '2px solid var(--black-ink)', boxShadow: '3px 3px 0 var(--black-ink)', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
          NEW PEOPLE. NEW VIBES. NEW MEMORIES.
        </div>
        <div style={{ transform: 'rotate(2deg)', background: 'var(--card-bg)', padding: '8px 16px', border: '2px dashed var(--purple-main)', borderRadius: '50% 50% 10% 10% / 100% 100% 0 0', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--purple-main)' }}>
          YOU IN?
        </div>
      </div>

      {/* Main Title Area */}
      <div style={{ textAlign: 'center', position: 'relative', marginBottom: 60, zIndex: 10 }}>
        {/* Decorative Crown - using Tailwind for responsive positioning */}
        <div className="absolute -top-12 left-0 sm:left-4 md:left-[10%] text-4xl md:text-5xl transform -rotate-[20deg]" style={{ color: 'var(--purple-main)' }}>👑</div>
        
        <h1 className="marker-font" style={{ fontSize: 'clamp(48px, 10vw, 90px)', color: 'var(--black-ink)', lineHeight: 0.9, textTransform: 'uppercase', marginBottom: 10 }}>
          VASTEGUNA<br/><span style={{ color: 'var(--purple-main)' }}>HUIYAA</span>
        </h1>
        
        <div style={{ 
          display: 'inline-block', background: 'var(--purple-main)', color: 'white', 
          padding: '8px 24px', fontSize: 20, fontFamily: 'var(--font-display)', 
          fontWeight: 700, transform: 'rotate(-2deg)', border: '3px solid var(--black-ink)',
          boxShadow: '4px 4px 0 var(--black-ink)'
        }}>
          : FRESHERS EDITION :
        </div>
      </div>

      {/* Sticky Notes & Scrapbook Details */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 30, maxWidth: 1000, marginBottom: 60, position: 'relative' }}>
        
        <div className="paper-card" style={{ padding: 24, width: 220, transform: 'rotate(-4deg)' }}>
          <div className="tape top-center" />
          <h3 className="marker-font" style={{ fontSize: 24, lineHeight: 1.2, color: 'var(--purple-main)' }}>ONE DAY.<br/>ZERO STRESS.<br/><span style={{color:'var(--black-ink)'}}>UNLIMITED MEMORIES.</span></h3>
          <div style={{ fontSize: 30, position: 'absolute', bottom: -10, right: -10 }}>👑</div>
        </div>

        <div className="paper-card" style={{ padding: 24, width: 240, transform: 'rotate(2deg)', background: '#FEE2E2', borderStyle: 'dashed', color: '#111827' }}>
          <div className="tape top-center" />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
            "Bro, we're not just here to study, we're here to <span style={{color:'var(--purple-main)'}}>MAKE MEMORIES.</span>" 🔥
          </p>
        </div>

        <div className="paper-card" style={{ padding: 24, width: 220, transform: 'rotate(-2deg)', background: 'var(--yellow-marker)', color: '#111827' }}>
          <div className="tape top-center" />
          <h3 className="marker-font" style={{ fontSize: 22, lineHeight: 1.2 }}>Zindagi ek hi hai,<br/>par <span style={{color:'var(--purple-main)'}}>Vibes legendary</span><br/>honi chahiye! ♡</h3>
        </div>

      </div>

      {/* Coming Soon & Action */}
      <div style={{ textAlign: 'center', marginBottom: 50 }}>
        <h2 className="marker-font" style={{ fontSize: 50, color: 'var(--purple-main)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>COMING SOON</h2>
        <p style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid var(--black-ink)', display: 'inline-block', paddingBottom: 4 }}>
          PREPARE YOUR <span style={{color:'var(--purple-main)'}}>BEST OUTFIT</span> & CRAZIEST ENERGY!
        </p>
      </div>

      <button onClick={handleGetStarted} className="btn-primary" style={{ padding: '16px 40px', fontSize: 20, marginBottom: 60 }}>
        Grab Your E-Pass Now <ArrowRight style={{ display: 'inline', marginLeft: 8 }} />
      </button>

      {/* Features Icons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 40, maxWidth: 1000, marginBottom: 60 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: 120 }}>
            <div style={{ width: 60, height: 60, border: '2px solid var(--black-ink)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: 'var(--purple-main)' }}>
              {f.icon}
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{f.title}</p>
          </div>
        ))}
      </div>

      {/* ─── Sponsor Section ─── */}
      <div style={{ marginTop: 20, marginBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
        <div className="paper-card" style={{ padding: '20px 30px', transform: 'rotate(2deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15, width: '100%', maxWidth: 350 }}>
          <div className="tape top-center" style={{ width: 80, top: -12 }} />
          <p className="marker-font" style={{ fontSize: 26, color: 'var(--purple-main)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Sponsored By</p>
          <div style={{ padding: 10, background: 'white', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%', transform: 'rotate(-1deg)' }}>
            <img src="/sparsh.jpeg" alt="Sparsh Art Divine Studio" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 2 }} />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 900, textAlign: 'center', color: 'var(--black-ink)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sparsh Art<br/>Divine Studio</h3>
        </div>
      </div>

      {/* Footer Details */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, width: '100%', maxWidth: 800, borderTop: '3px dashed var(--black-ink)', paddingTop: 40, paddingBottom: 40 }}>
        
        <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'var(--purple-main)', color: 'white', padding: '4px 12px', fontWeight: 800, transform: 'rotate(-3deg)' }}>STAY TUNED 🔔</div>
          <p style={{ marginTop: 10, fontWeight: 700, fontSize: 14 }}>FOLLOW US FOR<br/>UPDATES & ANNOUNCEMENTS</p>
        </div>

        <div style={{ flex: 1, minWidth: 250, textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -30, right: 0, fontSize: 30, color: 'var(--purple-main)' }}>👑</div>
          <p className="marker-font" style={{ fontSize: 20, marginBottom: 6 }}>FOLLOW US ON INSTA:</p>
          <div style={{ background: 'var(--black-ink)', color: 'var(--paper-bg)', padding: '10px 20px', borderRadius: 8, transform: 'rotate(1deg)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>@vasteguna.club</h3>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
          <p className="marker-font" style={{ fontSize: 20, color: 'var(--purple-main)', marginBottom: 6 }}>CONTACT NO: 📞</p>
          <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>9714509181<br/>9624487630</p>
        </div>

      </div>

      <div style={{ width: '100%', textAlign: 'center', padding: '30px 16px', background: 'rgba(107,33,168,0.1)', borderTop: '2px solid var(--purple-main)', color: 'var(--purple-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <p style={{ fontWeight: 800, fontSize: 16, letterSpacing: '0.5px' }}>Let's make it the most legendary fresher's party ever! ♡</p>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--card-bg)', padding: '10px 24px', borderRadius: 30, border: '2px dashed var(--purple-main)', boxShadow: '3px 3px 0 var(--black-ink)', transform: 'rotate(-1deg)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Code & Vibes crafted by</span>
          <span className="marker-font" style={{ fontSize: 26, color: 'var(--purple-main)', transform: 'rotate(-4deg) translateY(-2px)', textShadow: '1px 1px 0 rgba(0,0,0,0.1)' }}>Meet Dave</span>
          <span className="reveal-pulse" style={{ fontSize: 20 }}>🚀</span>
        </div>
      </div>

    </div>
    </>
  );
}
