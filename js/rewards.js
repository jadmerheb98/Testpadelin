(function () {
  const API_BASE = "https://solitary-morning-9ea4.padelin-lb.workers.dev";
  const DEMO_REWARDS = [
    {
      id: "rental-hour",
      title: "Free Rental Hour",
      description: "Enjoy one free court rental hour on your next booking.",
      pointsNeeded: 60,
      image: "⏱️",
      category: "court",
      badge: "Popular"
    },
    {
      id: "training-session",
      title: "Free Training Session",
      description: "Redeem a complimentary coaching session to sharpen your game.",
      pointsNeeded: 150,
      image: "🏅",
      category: "training",
      badge: "Premium"
    },
    {
      id: "free-racket",
      title: "Free Racket Use",
      description: "Get complimentary racket use for one session at the club.",
      pointsNeeded: 90,
      image: "🎾",
      category: "gear",
      badge: "Club Pick"
    },
    {
      id: "balls-pack",
      title: "Free Balls Pack",
      description: "Collect a fresh pack of balls for your next match.",
      pointsNeeded: 45,
      image: "🟡",
      category: "gear",
      badge: "Quick Unlock"
    },
    {
      id: "drink-voucher",
      title: "Drink Voucher",
      description: "Redeem a complimentary sports drink after your session.",
      pointsNeeded: 35,
      image: "🥤",
      category: "club",
      badge: "Easy Win"
    },
    {
      id: "member-guest-pass",
      title: "Guest Pass",
      description: "Invite one guest for a complimentary club experience.",
      pointsNeeded: 110,
      image: "🎟️",
      category: "club",
      badge: "Special"
    }
  ];

  const profileUserName = document.getElementById("profileUserName");
  const profilePoints = document.getElementById("profilePoints");
  const rewardsGrid = document.getElementById("rewardsGrid");

  const progressRewardName = document.getElementById("progressRewardName");
  const progressRewardValue = document.getElementById("progressRewardValue");
  const progressFill = document.getElementById("progressFill");
  const closestRewardText = document.getElementById("closestRewardText");

  const filterButtons = document.querySelectorAll("[data-filter]");

  const redeemModal = document.getElementById("redeemModal");
  const redeemModalBackdrop = document.getElementById("redeemModalBackdrop");
  const redeemModalCopy = document.getElementById("redeemModalCopy");
  const redeemModalDoneBtn = document.getElementById("redeemModalDoneBtn");
  const redeemModalCloseBtn = document.getElementById("redeemModalCloseBtn");

  const user = readCurrentUser();
  let currentPoints = readCurrentPoints();
  let currentFilter = "all";
  let redeemedRewards = readRedeemedRewards();

  renderProfile();
renderClosestReward();
renderRewards();

syncBookingPoints();

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
      renderRewards();
    });
  });

  if (redeemModalDoneBtn) redeemModalDoneBtn.addEventListener("click", closeRedeemModal);
  if (redeemModalCloseBtn) redeemModalCloseBtn.addEventListener("click", closeRedeemModal);
  if (redeemModalBackdrop) redeemModalBackdrop.addEventListener("click", closeRedeemModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeRedeemModal();
  });

  function readCurrentUser() {
    try {
      const raw = localStorage.getItem("padelinUser");
      if (!raw) return { name: "Player", email: "" };
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || parsed.email || "Player",
        email: parsed.email || ""
      };
    } catch {
      return { name: "Player", email: "" };
    }
  }

  function readCurrentPoints() {
    const stored = localStorage.getItem("padelinRewardPoints");
    if (stored && !Number.isNaN(Number(stored))) {
      return Number(stored);
    }

    const fallback = localStorage.getItem("padelinPoints");
    if (fallback && !Number.isNaN(Number(fallback))) {
      return Number(fallback);
    }

    return 124;
  }

  function readRedeemedRewards() {
    try {
      const raw = localStorage.getItem("padelinRedeemedRewards");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveRedeemedRewards() {
    localStorage.setItem("padelinRedeemedRewards", JSON.stringify(redeemedRewards));
  }

  function renderProfile() {
    if (profileUserName) profileUserName.textContent = user.name;
    if (profilePoints) profilePoints.textContent = String(currentPoints);
  }

  function getClosestReward() {
    const lockedRewards = DEMO_REWARDS
      .filter((reward) => !redeemedRewards.includes(reward.id))
      .sort((a, b) => a.pointsNeeded - b.pointsNeeded);

    const readyReward = lockedRewards.find((reward) => currentPoints >= reward.pointsNeeded);
    if (readyReward) return readyReward;

    return lockedRewards[0] || DEMO_REWARDS[0];
  }

  function renderClosestReward() {
    const reward = getClosestReward();
    if (!reward) return;

    const percentage = Math.min(100, Math.round((currentPoints / reward.pointsNeeded) * 100));

    if (progressRewardName) progressRewardName.textContent = reward.title;
    if (progressRewardValue) progressRewardValue.textContent = `${currentPoints} / ${reward.pointsNeeded} pts`;
    if (progressFill) progressFill.style.width = `${percentage}%`;

    if (closestRewardText) {
      if (currentPoints >= reward.pointsNeeded) {
        closestRewardText.textContent = `${reward.title} is ready to redeem right now.`;
      } else {
        const remaining = reward.pointsNeeded - currentPoints;
        closestRewardText.textContent = `Only ${remaining} more points to unlock ${reward.title}.`;
      }
    }
  }

  function getFilteredRewards() {
    const base = DEMO_REWARDS.map((reward) => {
      const isRedeemed = redeemedRewards.includes(reward.id);
      const isReady = currentPoints >= reward.pointsNeeded && !isRedeemed;
      const remaining = Math.max(0, reward.pointsNeeded - currentPoints);

      return {
        ...reward,
        isRedeemed,
        isReady,
        remaining
      };
    });

    if (currentFilter === "ready") {
      return base.filter((reward) => reward.isReady);
    }

    if (currentFilter === "locked") {
      return base.filter((reward) => !reward.isReady && !reward.isRedeemed);
    }

    return base;
  }

  function renderRewards() {
    if (!rewardsGrid) return;

    const rewards = getFilteredRewards();

    rewardsGrid.innerHTML = rewards.map((reward) => {
      const stateHtml = reward.isRedeemed
        ? `<span class="reward-state ready">Redeemed</span>`
        : reward.isReady
          ? `<span class="reward-state ready">Ready now</span>`
          : `<span class="reward-state locked">${reward.remaining} pts left</span>`;

      const actionHtml = reward.isRedeemed
        ? `<button type="button" class="reward-btn secondary" disabled>Already redeemed</button>`
        : reward.isReady
          ? `<button type="button" class="reward-btn primary" data-redeem-id="${reward.id}">Redeem reward</button>`
          : `<button type="button" class="reward-btn primary" disabled>Need ${reward.pointsNeeded} points</button>`;

      const note = reward.isRedeemed
        ? `This reward was already redeemed.`
        : reward.isReady
          ? `You have enough points to claim this reward.`
          : `Collect ${reward.remaining} more points to unlock it.`;

      return `
        <article class="reward-card">
          <div class="reward-image-wrap">
            <div class="reward-badge">${reward.badge}</div>
            <div class="reward-image" aria-hidden="true">${reward.image}</div>
          </div>

          <div class="reward-body">
            <div class="reward-top">
              <h3 class="reward-title">${reward.title}</h3>
              <div class="reward-points-pill">${reward.pointsNeeded} pts</div>
            </div>

            <p class="reward-desc">${reward.description}</p>

            <div class="reward-meta">
              <div class="reward-meta-left">
                <span class="reward-meta-label">Status</span>
                <span class="reward-meta-value">${reward.isReady ? "Available now" : reward.isRedeemed ? "Already claimed" : "Keep playing"}</span>
              </div>
              ${stateHtml}
            </div>

            <div class="reward-actions">
              ${actionHtml}
              <div class="reward-note">${note}</div>
            </div>
          </div>
        </article>
      `;
    }).join("");

    rewardsGrid.querySelectorAll("[data-redeem-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const rewardId = btn.dataset.redeemId;
        redeemReward(rewardId);
      });
    });
  }

  function redeemReward(rewardId) {
    const reward = DEMO_REWARDS.find((item) => item.id === rewardId);
    if (!reward) return;

    if (redeemedRewards.includes(reward.id)) return;
    if (currentPoints < reward.pointsNeeded) return;

    redeemedRewards.push(reward.id);
    saveRedeemedRewards();
    renderClosestReward();
    renderRewards();

    openRedeemModal(reward);
  }

  function openRedeemModal(reward) {
    if (!redeemModal || !redeemModalBackdrop) return;

    if (redeemModalCopy) {
      redeemModalCopy.textContent = `${reward.title} has been marked as redeemed. Show this at reception to claim it.`;
    }

    redeemModal.classList.add("is-open");
    redeemModalBackdrop.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeRedeemModal() {
    if (!redeemModal || !redeemModalBackdrop) return;
    redeemModal.classList.remove("is-open");
    redeemModalBackdrop.classList.remove("is-open");
    document.body.style.overflow = "";
  }

async function syncBookingPoints() {
  try {

    const userRaw = localStorage.getItem("padelinUser");
    if (!userRaw) return;

    const user = JSON.parse(userRaw);

    const response = await fetch(`${API_BASE}/account/claim-booking-points`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uid: user.uid || "",
        email: user.email || "",
        phone: user.phone || ""
      })
    });

    const result = await response.json();

    if (!result.ok) return;

    if (result.earnedPoints > 0) {

      currentPoints += result.earnedPoints;

      localStorage.setItem("padelinRewardPoints", currentPoints);

      renderProfile();

    }

  } catch (err) {
    console.error("Points sync failed", err);
  }
}
})();
