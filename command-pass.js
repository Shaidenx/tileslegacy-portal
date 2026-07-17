/* =========================================================
   TILES LEGACY COMMAND PASS
   Season 1: Dawn of Survival
========================================================= */

const SUPABASE_URL =
  "https://pucwtnzzmlnoviiwijtq.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_8n03gOCffWC9ihQQ7lb2Mg_KVNTls8S";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (id) => document.getElementById(id);

const elements = {
  loginLink: $("loginLink"),
  jumpToRewards: $("jumpToRewards"),

  progressTitle: $("progressTitle"),
  sessionStatus: $("sessionStatus"),
  loggedOutMessage: $("loggedOutMessage"),
  playerProgressDetails: $("playerProgressDetails"),
  playerProgressBarWrap: $("playerProgressBarWrap"),
  playerProgressBar: $("playerProgressBar"),

  passType: $("passType"),
  passLevel: $("passLevel"),
  passXp: $("passXp"),
  prestigeLevel: $("prestigeLevel"),

  rewardsSection: $("rewardsSection"),
  commandPassLoading: $("commandPassLoading"),
  commandPassRewards: $("commandPassRewards"),
  commandPassEmpty: $("commandPassEmpty"),

  rewardModal: $("rewardModal"),
  closeRewardModal: $("closeRewardModal"),
  modalRewardArt: $("modalRewardArt"),
  modalRewardLevel: $("modalRewardLevel"),
  modalRewardName: $("modalRewardName"),
  modalRewardRarity: $("modalRewardRarity"),
  modalRewardDescription: $("modalRewardDescription"),
  modalRewardFlavor: $("modalRewardFlavor"),
  modalRewardAction: $("modalRewardAction")
};

const state = {
  user: null,
  pass: {
    level: 1,
    xp: 0,
    prestige: 0,
    elite: false,
    claimedRewards: []
  },
  rewards: [],
  selectedReward: null
};

const fallbackIcons = {
  avatar: "👤",
  frame: "🖼️",
  badge: "🏅",
  title: "🏷️",
  background: "🌄",
  theme: "🎨",
  currency: "🪙",
  xp: "⭐",
  crate: "🎁",
  consumable: "🧰",
  boost: "⚡"
};

/* =========================================================
   STARTUP
========================================================= */

document.addEventListener("DOMContentLoaded", initializePage);

async function initializePage() {
  bindPageEvents();

  await loadRewards();
  await loadCurrentSession();

  db.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user || null;

    if (state.user) {
      await loadPlayerPass(state.user.id);
    } else {
      resetPlayerPass();
    }

    updateSessionDisplay();
    renderRewards();
  });
}

/* =========================================================
   PAGE EVENTS
========================================================= */

function bindPageEvents() {
  elements.jumpToRewards?.addEventListener("click", () => {
    elements.rewardsSection?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  elements.closeRewardModal?.addEventListener(
    "click",
    closeRewardModal
  );

  elements.rewardModal?.addEventListener("click", (event) => {
    if (event.target === elements.rewardModal) {
      closeRewardModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeRewardModal();
    }
  });

  elements.modalRewardAction?.addEventListener(
    "click",
    handleModalAction
  );
}

/* =========================================================
   AUTHENTICATION
========================================================= */

async function loadCurrentSession() {
  const {
    data: { session },
    error
  } = await db.auth.getSession();

  if (error) {
    console.error("Session error:", error);
  }

  state.user = session?.user || null;

  if (state.user) {
    await loadPlayerPass(state.user.id);
  } else {
    resetPlayerPass();
  }

  updateSessionDisplay();
  renderRewards();
}

function updateSessionDisplay() {
  if (!state.user) {
    elements.progressTitle.textContent =
      "Public Season Preview";

    elements.sessionStatus.textContent =
      "Not logged in";

    elements.sessionStatus.classList.remove("logged-in");
    elements.sessionStatus.classList.add("logged-out");

    elements.loggedOutMessage.classList.remove("hidden");
    elements.playerProgressDetails.classList.add("hidden");
    elements.playerProgressBarWrap.classList.add("hidden");

    elements.loginLink.textContent = "Commander Login";
    elements.loginLink.href = "index.html";

    return;
  }

  const commanderName =
    state.user.user_metadata?.commander_name ||
    state.user.email?.split("@")[0] ||
    "Commander";

  elements.progressTitle.textContent =
    `${commanderName}'s Progress`;

  elements.sessionStatus.textContent =
    "Commander authenticated";

  elements.sessionStatus.classList.remove("logged-out");
  elements.sessionStatus.classList.add("logged-in");

  elements.loggedOutMessage.classList.add("hidden");
  elements.playerProgressDetails.classList.remove("hidden");
  elements.playerProgressBarWrap.classList.remove("hidden");

  elements.loginLink.textContent = "Open Commander Portal";
  elements.loginLink.href = "index.html";

  updateProgressDisplay();
}

/* =========================================================
   PLAYER COMMAND PASS
========================================================= */

async function loadPlayerPass(userId) {
  const { data, error } = await db
    .from("command_pass")
    .select(
      `
      pass_level,
      pass_xp,
      prestige_level,
      elite,
      claimed_rewards
      `
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Command Pass progress error:", error);
    resetPlayerPass();
    return;
  }

  if (!data) {
    resetPlayerPass();
    return;
  }

  state.pass.level =
    Number(data.pass_level) || 1;

  state.pass.xp =
    Number(data.pass_xp) || 0;

  state.pass.prestige =
    Number(data.prestige_level) || 0;

  state.pass.elite =
    Boolean(data.elite);

  state.pass.claimedRewards =
    normalizeClaimedRewards(data.claimed_rewards);

  updateProgressDisplay();
}

function resetPlayerPass() {
  state.pass = {
    level: 1,
    xp: 0,
    prestige: 0,
    elite: false,
    claimedRewards: []
  };
}

function normalizeClaimedRewards(value) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (
    value &&
    typeof value === "object" &&
    Array.isArray(value.rewards)
  ) {
    return value.rewards.map(String);
  }

  return [];
}

function updateProgressDisplay() {
  const currentLevel = Math.max(
    1,
    Math.min(50, state.pass.level)
  );

  const xpPerLevel = 100;
  const currentLevelXp =
    state.pass.xp % xpPerLevel;

  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      (currentLevelXp / xpPerLevel) * 100
    )
  );

  elements.passType.textContent =
    state.pass.elite ? "Elite Pass" : "Free Pass";

  elements.passLevel.textContent =
    currentLevel.toLocaleString();

  elements.passXp.textContent =
    state.pass.xp.toLocaleString();

  elements.prestigeLevel.textContent =
    state.pass.prestige.toLocaleString();

  elements.playerProgressBar.style.width =
    `${progressPercent}%`;
}

/* =========================================================
   LOAD REWARDS
========================================================= */

async function loadRewards() {
  showRewardsLoading();

  const { data, error } = await db
    .from("command_pass_rewards")
    .select("*")
    .eq("season_key", "season-1")
    .order("reward_level", {
      ascending: true
    })
    .order("sort_order", {
      ascending: true,
      nullsFirst: false
    });

  hideRewardsLoading();

  if (error) {
    console.error("Command Pass rewards error:", error);
    showRewardsEmpty();
    return;
  }

  state.rewards = Array.isArray(data) ? data : [];

  if (!state.rewards.length) {
    showRewardsEmpty();
    return;
  }

  renderRewards();
}

function showRewardsLoading() {
  elements.commandPassLoading?.classList.remove("hidden");
  elements.commandPassEmpty?.classList.add("hidden");

  if (elements.commandPassRewards) {
    elements.commandPassRewards.innerHTML = "";
  }
}

function hideRewardsLoading() {
  elements.commandPassLoading?.classList.add("hidden");
}

function showRewardsEmpty() {
  elements.commandPassEmpty?.classList.remove("hidden");
}

/* =========================================================
   RENDER REWARDS
========================================================= */

function renderRewards() {
  const container = elements.commandPassRewards;

  if (!container || !state.rewards.length) {
    return;
  }

  container.innerHTML = "";

  state.rewards.forEach((reward) => {
    const card = createRewardCard(reward);
    container.appendChild(card);
  });
}

function createRewardCard(reward) {
  const card = document.createElement("button");

  card.type = "button";
  card.className =
    `pass-card ${sanitizeClassName(reward.rarity)}`;

  card.dataset.track = reward.reward_track;
  card.dataset.rewardId = reward.id;

  const rewardState = getRewardState(reward);

  card.classList.add(rewardState);

  const image =
    reward.image_url ||
    reward.icon_url ||
    "";

  const fallbackIcon =
    fallbackIcons[reward.item_type] || "🎁";

  card.innerHTML = `
    <div class="pass-level">
      LV ${escapeHtml(reward.reward_level)}
    </div>

    <div class="pass-track">
      ${escapeHtml(
        String(reward.reward_track || "").toUpperCase()
      )}
    </div>

    <div class="pass-reward-art">
      ${
        image
          ? `
            <img
              src="${escapeAttribute(image)}"
              alt="${escapeAttribute(reward.item_name)}"
              loading="lazy"
            >
          `
          : `
            <span class="pass-fallback-icon">
              ${fallbackIcon}
            </span>
          `
      }
    </div>

    <div class="pass-name">
      ${escapeHtml(reward.item_name)}
    </div>

    <div class="pass-rarity">
      ${escapeHtml(reward.rarity)}
    </div>

    <div class="pass-type">
      ${escapeHtml(reward.item_type)}
    </div>
  `;

  card.addEventListener("click", () => {
    openRewardModal(reward);
  });

  return card;
}

function getRewardState(reward) {
  if (!state.user) {
    return "preview";
  }

  const rewardKey = getRewardKey(reward);

  if (
    state.pass.claimedRewards.includes(rewardKey)
  ) {
    return "claimed";
  }

  if (
    Number(reward.reward_level) >
    Number(state.pass.level)
  ) {
    return "locked";
  }

  if (
    reward.reward_track === "elite" &&
    !state.pass.elite
  ) {
    return "locked";
  }

  return "claimable";
}

function getRewardKey(reward) {
  return `${reward.reward_level}:${reward.reward_track}`;
}

/* =========================================================
   REWARD MODAL
========================================================= */

function openRewardModal(reward) {
  state.selectedReward = reward;

  const rewardImage =
    reward.preview_url ||
    reward.animation_url ||
    reward.image_url ||
    reward.icon_url ||
    "";

  const fallbackIcon =
    fallbackIcons[reward.item_type] || "🎁";

  elements.modalRewardArt.innerHTML =
    rewardImage
      ? `
        <img
          src="${escapeAttribute(rewardImage)}"
          alt="${escapeAttribute(reward.item_name)}"
        >
      `
      : `
        <span class="pass-fallback-icon">
          ${fallbackIcon}
        </span>
      `;

  elements.modalRewardLevel.textContent =
    `Level ${reward.reward_level} • ` +
    `${String(reward.reward_track).toUpperCase()} TRACK`;

  elements.modalRewardName.textContent =
    reward.item_name || "Command Pass Reward";

  elements.modalRewardRarity.textContent =
    `${reward.rarity || "common"} ${reward.item_type || "reward"}`;

  elements.modalRewardDescription.textContent =
    reward.description ||
    "A Season 1 Command Pass reward.";

  elements.modalRewardFlavor.textContent =
    reward.flavor_text || "";

  elements.modalRewardFlavor.classList.toggle(
    "hidden",
    !reward.flavor_text
  );

  configureModalAction(reward);

  elements.rewardModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeRewardModal() {
  elements.rewardModal?.classList.add("hidden");
  document.body.style.overflow = "";
  state.selectedReward = null;
}

function configureModalAction(reward) {
  const button = elements.modalRewardAction;

  button.disabled = false;
  button.dataset.action = "";

  if (!state.user) {
    button.textContent = "Log In to Claim";
    button.dataset.action = "login";
    return;
  }

  const rewardKey = getRewardKey(reward);

  if (
    state.pass.claimedRewards.includes(rewardKey)
  ) {
    button.textContent = "Already Claimed";
    button.disabled = true;
    return;
  }

  if (
    Number(reward.reward_level) >
    Number(state.pass.level)
  ) {
    button.textContent =
      `Unlocks at Level ${reward.reward_level}`;

    button.disabled = true;
    return;
  }

  if (
    reward.reward_track === "elite" &&
    !state.pass.elite
  ) {
    button.textContent = "Elite Pass Required";
    button.disabled = true;
    return;
  }

  button.textContent = "Claim Reward";
  button.dataset.action = "claim";
}

/* =========================================================
   MODAL ACTION
========================================================= */

function handleModalAction() {
  const action =
    elements.modalRewardAction?.dataset.action;

  if (action === "login") {
    window.location.href = "index.html";
    return;
  }

  if (action === "claim") {
    showClaimSystemMessage();
  }
}

function showClaimSystemMessage() {
  const button = elements.modalRewardAction;

  button.textContent =
    "Claim System Being Activated";

  button.disabled = true;

  window.setTimeout(() => {
    if (!state.selectedReward) {
      return;
    }

    configureModalAction(state.selectedReward);
  }, 2200);
}

/* =========================================================
   HELPERS
========================================================= */

function sanitizeClassName(value) {
  return String(value || "common")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
