(function () {
  const coaches = {
    "karim-haddad": {
      name: "Karim Haddad",
      badge: "🔥 Top Coach",
      kicker: "PADELIN COMPETITIVE",
      role: "Competitive Coach",
      certification: "ITF Certified Coach",
      price: "$40",
      experience: "8 Years",
      image: "assets/img/coaches/karim-haddad.jpg",
      about:
        "Karim delivers high-energy sessions built around competitive rhythm, sharper decision-making, and reliable match habits. His coaching style is direct, polished, and ideal for players who want to raise their level with structure.",
      focus: [
        "Competitive match preparation",
        "Shot selection and consistency",
        "Footwork and court positioning",
        "Pressure-based live drills"
      ],
      sessionStyle:
        "Structured, premium, and performance-focused sessions with a clean progression from technical work into live play.",
      bestFor:
        "Intermediate and competitive players who want more control, sharper patterns, and stronger decision-making.",
      reason:
        "Players book Karim for his pace, clarity, and premium competitive coaching feel."
    },

    "maya-khoury": {
      name: "Maya Khoury",
      badge: "⭐ Most Booked",
      kicker: "PADELIN PERFORMANCE",
      role: "Performance Coach",
      certification: "Padel Pro Certified",
      price: "$38",
      experience: "7 Years",
      image: "assets/img/coaches/maya-khoury.jpg",
      about:
        "Maya blends technical precision with calm, confidence-building coaching. Her sessions help players improve mechanics while making the game feel simpler, cleaner, and more repeatable under real match conditions.",
      focus: [
        "Stroke refinement",
        "Confidence and consistency",
        "Transition play",
        "Game-reading fundamentals"
      ],
      sessionStyle:
        "Smooth, detail-focused sessions with compact coaching points and polished progression.",
      bestFor:
        "Players who want technical improvement, stronger confidence, and better all-around court awareness.",
      reason:
        "Players return to Maya for her clarity, calm coaching energy, and highly repeatable training structure."
    },

    "nicolas-saad": {
      name: "Nicolas Saad",
      badge: "🎯 Popular Coach",
      kicker: "PADELIN TACTICAL",
      role: "Tactical Coach",
      certification: "International Padel Certified",
      price: "$36",
      experience: "6 Years",
      image: "assets/img/coaches/nicolas-saad.jpg",
      about:
        "Nicolas focuses on smart padel: positioning, patterns, anticipation, and game awareness. His sessions are ideal for players who want to stop reacting late and start understanding the court at a higher level.",
      focus: [
        "Tactical court positioning",
        "Defensive decision-making",
        "Building points with intention",
        "Partner communication"
      ],
      sessionStyle:
        "Compact, smart, and highly practical sessions centered on reading the game and playing with more intention.",
      bestFor:
        "Players who already play regularly and want smarter movement, better choices, and stronger match IQ.",
      reason:
        "Players choose Nicolas for his tactical lens and his ability to make padel feel more organized."
    },

    "jad-khoury": {
      name: "Jad Khoury",
      badge: "👑 Head Coach",
      kicker: "PADELIN ELITE",
      role: "Head Coach",
      certification: "High Performance Coach",
      price: "$50",
      experience: "10 Years",
      image: "assets/img/coaches/jad-khoury.jpg",
      about:
        "Jad leads high-level training with a premium, performance-first approach. His sessions are built for ambitious players who want a stronger competitive identity, sharper habits, and more disciplined execution.",
      focus: [
        "Tournament preparation",
        "High-performance live drills",
        "Advanced offensive patterns",
        "Match intensity and discipline"
      ],
      sessionStyle:
        "Elite, demanding, and highly structured sessions designed around progression, pressure, and performance.",
      bestFor:
        "Advanced players and serious competitors preparing for stronger match environments.",
      reason:
        "Players book Jad for elite-level standards, sharp feedback, and a more serious performance environment."
    }
  };

  const fallbackSlug = "karim-haddad";
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("coach");
  const coach = coaches[slug] || coaches[fallbackSlug];

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const imageEl = document.getElementById("coachImage");
  if (imageEl) {
    imageEl.src = coach.image;
    imageEl.alt = `${coach.name} coach portrait`;
  }

  setText("coachBadge", coach.badge);
  setText("coachKicker", coach.kicker);
  setText("coachName", coach.name);
  setText("coachRole", coach.role);
  setText("coachRoleMini", coach.role);
  setText("coachCertification", coach.certification);
  setText("coachPrice", coach.price);
  setText("coachExperience", coach.experience);
  setText("coachAbout", coach.about);
  setText("coachSessionStyle", coach.sessionStyle);
  setText("coachBestFor", coach.bestFor);
  setText("coachReason", coach.reason);

  const focusList = document.getElementById("coachFocusList");
  if (focusList) {
    focusList.innerHTML = coach.focus.map(item => `<li>${item}</li>`).join("");
  }

  document.title = `${coach.name} | Coach Profile | PADELIN`;

  const bookLink = document.getElementById("coachBookLink");
  if (bookLink) {
    bookLink.href = `reservation.html?coach=${slug || fallbackSlug}`;
  }
})();
