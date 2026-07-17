"use strict";

/* =========================================================
   TILES LEGACY COMMANDER DASHBOARD
   COMPLETE DASHBOARD.JS
========================================================= */


/* =========================================================
   SUPABASE CONNECTION
========================================================= */

const SUPABASE_URL =
  "https://pucwtnzzmlnoviiwijtq.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_8n03gOCffWC9ihQQ7lb2Mg_KVNTls8S";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================================
   DASHBOARD ELEMENTS
========================================================= */

const dashboardElements = {
  loading: document.getElementById("dashboardLoading"),
  loginRequired: document.getElementById("loginRequired"),
  interface: document.getElementById("dashboardInterface"),

  logoutButton: document.getElementById("logoutButton"),

  commanderName: document.getElementById("commanderName"),
  commanderDisplayName:
    document.getElementById("commanderDisplayName"),
  commanderInitial:
    document.getElementById("commanderInitial"),
  commanderTitle:
    document.getElementById("commanderTitle"),
  commanderAvatar:
    document.getElementById("commanderAvatar"),

  commanderPassLevel:
    document.getElementById("commanderPassLevel"),

  summaryPassLevel:
    document.getElementById("summaryPassLevel"),
  summaryPassType:
    document.getElementById("summaryPassType"),
  summaryPassTypeSecondary:
    document.getElementById("summaryPassTypeSecondary"),

  summaryCollectionCount:
    document.getElementById("summaryCollectionCount"),
  collectionCountLarge:
    document.getElementById("collectionCountLarge"),

  summaryAchievementCount:
    document.getElementById("summaryAchievementCount"),
  summaryAchievementPoints:
    document.getElementById("summaryAchievementPoints"),
  achievementCountLarge:
    document.getElementById("achievementCountLarge"),
  achievementPointsLarge:
    document.getElementById("achievementPointsLarge"),

  summaryPrestigeLevel:
    document.getElementById("summaryPrestigeLevel"),

  passLevelNumber:
    document.getElementById("passLevelNumber"),
  passXpText:
    document.getElementById("passXpText"),
  passProgressPercent:
    document.getElementById("passProgressPercent"),
  passProgressTrack:
    document.getElementById("passProgressTrack"),
  passProgressBar:
    document.getElementById("passProgressBar"),
  nextRewardText:
    document.getElementById("nextRewardText"),

  dailyXpAvailable:
    document.getElementById("dailyXpAvailable"),
  missionsList:
    document.getElementById("missionsList"),
  missionsEmpty:
    document.getElementById("missionsEmpty"),

  recentRewardArt:
    document.getElementById("recentRewardArt"),
  recentRewardType:
    document.getElementById("recentRewardType"),
  recentRewardName:
    document.getElementById("recentRewardName"),
  recentRewardSource:
    document.getElementById("recentRewardSource"),

  viewCollectionButton:
    document.getElementById("viewCollectionButton"),
  quickCollectionButton:
    document.getElementById("quickCollectionButton"),

  viewAchievementsButton:
    document.getElementById("viewAchievementsButton"),
  quickAchievementsButton:
    document.getElementById("quickAchievementsButton"),

  modal: document.getElementById("dashboardModal"),
  modalBackdrop:
    document.getElementById("dashboardModalBackdrop"),
  modalClose:
    document.getElementById("closeDashboardModal"),
  modalAction:
    document.getElementById("dashboardModalAction"),
  modalIcon:
    document.getElementById("dashboardModalIcon"),
  modalTitle:
    document.getElementById("dashboardModalTitle"),
  modalMessage:
    document.getElementById("dashboardModalMessage")
};


/* =========================================================
   BASIC HELPERS
========================================================= */

function setText(element, value) {
  if (!element) return;

  element.textContent =
    value === undefined || value === null
      ? ""
      : String(value);
}

function getFirstValue(source, keys, fallback = null) {
  if (!source) return fallback;

  for (const key of keys) {
    const value = source[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return fallback;
}

function clamp(value, minimum, maximum) {
  const number = Number(value) || 0;

  return Math.min(
    Math.max(number, minimum),
    maximum
  );
}

function createInitial(name) {
  const safeName = String(name || "Commander").trim();

  return safeName
    ? safeName.charAt(0).toUpperCase()
    : "C";
}


/* =========================================================
   PAGE STATE CONTROL
========================================================= */

function hideElement(element) {
  if (!element) return;

  element.hidden = true;
  element.classList.add("hidden");
  element.style.display = "none";
}

function showElement(element) {
  if (!element) return;

  element.hidden = false;
  element.classList.remove("hidden");
  element.style.removeProperty("display");
}

function hideAllDashboardStates() {
  hideElement(dashboardElements.loading);
  hideElement(dashboardElements.loginRequired);
  hideElement(dashboardElements.interface);
}

function showLoadingState() {
  hideAllDashboardStates();
  showElement(dashboardElements.loading);

  if (dashboardElements.logoutButton) {
    dashboardElements.logoutButton.hidden = true;
  }
}

function showLoginState() {
  hideAllDashboardStates();
  showElement(dashboardElements.loginRequired);

  if (dashboardElements.logoutButton) {
    dashboardElements.logoutButton.hidden = true;
  }
}

function showAuthenticatedState() {
  hideAllDashboardStates();
  showElement(dashboardElements.interface);

  if (dashboardElements.logoutButton) {
    dashboardElements.logoutButton.hidden = false;
  }
}


/* =========================================================
   COMMANDER PROFILE
========================================================= */

async function loadCommanderProfile(user) {
  let profile = null;

  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("Profile load warning:", error.message);
    } else {
      profile = data;
    }
  } catch (error) {
    console.warn("Profile request failed:", error);
  }

  const metadata = user.user_metadata || {};

  const commanderName = getFirstValue(
    profile,
    [
      "commander_name",
      "display_name",
      "username",
      "full_name",
      "name"
    ],
    getFirstValue(
      metadata,
      [
        "commander_name",
        "display_name",
        "username",
        "full_name",
        "name"
      ],
      "Commander"
    )
  );

  const commanderTitle = getFirstValue(
    profile,
    [
      "equipped_title",
      "commander_title",
      "title"
    ],
    "Survivor"
  );

  const avatarUrl = getFirstValue(
    profile,
    [
      "avatar_url",
      "profile_image_url",
      "profile_image",
      "image_url"
    ],
    getFirstValue(
      metadata,
      [
        "avatar_url",
        "picture"
      ],
      null
    )
  );

  renderCommanderProfile({
    commanderName,
    commanderTitle,
    avatarUrl
  });
}

function renderCommanderProfile({
  commanderName,
  commanderTitle,
  avatarUrl
}) {
  const safeName = commanderName || "Commander";
  const safeTitle = commanderTitle || "Survivor";

  setText(
    dashboardElements.commanderName,
    safeName
  );

  setText(
    dashboardElements.commanderDisplayName,
    safeName
  );

  setText(
    dashboardElements.commanderTitle,
    safeTitle
  );

  setText(
    dashboardElements.commanderInitial,
    createInitial(safeName)
  );

  if (
    dashboardElements.commanderAvatar &&
    avatarUrl
  ) {
    const avatarContainer =
      dashboardElements.commanderAvatar;

    avatarContainer.innerHTML = "";

    const image = document.createElement("img");

    image.src = String(avatarUrl);
    image.alt = `${safeName} avatar`;
    image.loading = "lazy";

    image.addEventListener("error", () => {
      avatarContainer.innerHTML = "";

      const initial = document.createElement("span");

      initial.id = "commanderInitial";
      initial.textContent = createInitial(safeName);

      avatarContainer.appendChild(initial);

      dashboardElements.commanderInitial = initial;
    });

    avatarContainer.appendChild(image);
  }
}


/* =========================================================
   COMMAND PASS
========================================================= */

async function loadCommandPass() {
  let commandPass = null;

  try {
    const { data, error } = await supabaseClient
      .from("command_pass")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(
        "Command Pass load warning:",
        error.message
      );
    } else {
      commandPass = data;
    }
  } catch (error) {
    console.warn(
      "Command Pass request failed:",
      error
    );
  }

  const level = Number(
    getFirstValue(
      commandPass,
      [
        "current_level",
        "pass_level",
        "level"
      ],
      1
    )
  );

  const currentXp = Number(
    getFirstValue(
      commandPass,
      [
        "current_xp",
        "season_xp",
        "xp"
      ],
      0
    )
  );

  const requiredXp = Number(
    getFirstValue(
      commandPass,
      [
        "xp_required",
        "required_xp",
        "next_level_xp"
      ],
      100
    )
  );

  const passType = getFirstValue(
    commandPass,
    [
      "pass_type",
      "track_name",
      "track",
      "tier"
    ],
    "Free Pass"
  );

  const prestigeLevel = Number(
    getFirstValue(
      commandPass,
      [
        "prestige_level",
        "prestige"
      ],
      0
    )
  );

  renderCommandPass({
    level,
    currentXp,
    requiredXp,
    passType,
    prestigeLevel
  });
}

function renderCommandPass({
  level,
  currentXp,
  requiredXp,
  passType,
  prestigeLevel
}) {
  const safeRequiredXp =
    requiredXp > 0 ? requiredXp : 100;

  const progressPercent = clamp(
    Math.round(
      (currentXp / safeRequiredXp) * 100
    ),
    0,
    100
  );

  const remainingXp = Math.max(
    safeRequiredXp - currentXp,
    0
  );

  setText(
    dashboardElements.commanderPassLevel,
    `Level ${level}`
  );

  setText(
    dashboardElements.summaryPassLevel,
    `Level ${level}`
  );

  setText(
    dashboardElements.summaryPassType,
    passType
  );

  setText(
    dashboardElements.summaryPassTypeSecondary,
    passType
  );

  setText(
    dashboardElements.summaryPrestigeLevel,
    `Level ${prestigeLevel}`
  );

  setText(
    dashboardElements.passLevelNumber,
    level
  );

  setText(
    dashboardElements.passXpText,
    `${currentXp} / ${safeRequiredXp} XP`
  );

  setText(
    dashboardElements.passProgressPercent,
    `${progressPercent}%`
  );

  if (dashboardElements.passProgressBar) {
    dashboardElements.passProgressBar.style.width =
      `${progressPercent}%`;
  }

  if (dashboardElements.passProgressTrack) {
    dashboardElements.passProgressTrack.setAttribute(
      "aria-valuenow",
      String(progressPercent)
    );
  }

  if (progressPercent >= 100) {
    setText(
      dashboardElements.nextRewardText,
      "Your next Command Pass reward is ready."
    );
  } else {
    setText(
      dashboardElements.nextRewardText,
      `${remainingXp} XP until your next reward.`
    );
  }
}


/* =========================================================
   COLLECTION
========================================================= */

async function loadCollection() {
  let collectionCount = 0;

  try {
    const { count, error } = await supabaseClient
      .from("inventory")
      .select("*", {
        count: "exact",
        head: true
      });

    if (error) {
      console.warn(
        "Inventory count warning:",
        error.message
      );
    } else {
      collectionCount = count || 0;
    }
  } catch (error) {
    console.warn(
      "Inventory request failed:",
      error
    );
  }

  setText(
    dashboardElements.summaryCollectionCount,
    `${collectionCount} ${
      collectionCount === 1 ? "Item" : "Items"
    }`
  );

  setText(
    dashboardElements.collectionCountLarge,
    collectionCount
  );
}


/* =========================================================
   ACHIEVEMENTS
========================================================= */

function loadAchievements() {
  const unlockedCount = 0;
  const totalPoints = 0;

  setText(
    dashboardElements.summaryAchievementCount,
    `${unlockedCount} Unlocked`
  );

  setText(
    dashboardElements.summaryAchievementPoints,
    `${totalPoints} Points`
  );

  setText(
    dashboardElements.achievementCountLarge,
    unlockedCount
  );

  setText(
    dashboardElements.achievementPointsLarge,
    totalPoints
  );
}


/* =========================================================
   DAILY MISSIONS
========================================================= */

function loadDailyMissions() {
  if (dashboardElements.missionsList) {
    dashboardElements.missionsList.innerHTML = "";
  }

  setText(
    dashboardElements.dailyXpAvailable,
    "0 XP"
  );

  showElement(dashboardElements.missionsEmpty);
}


/* =========================================================
   RECENT REWARD
========================================================= */

function loadRecentReward() {
  setText(
    dashboardElements.recentRewardArt,
    "🎁"
  );

  setText(
    dashboardElements.recentRewardType,
    "No reward collected"
  );

  setText(
    dashboardElements.recentRewardName,
    "Your first reward is waiting"
  );

  setText(
    dashboardElements.recentRewardSource,
    "Progress through the Command Pass and complete missions to begin building your collection."
  );
}


/* =========================================================
   MODAL
========================================================= */

function openDashboardModal({
  icon = "⚔️",
  title = "Feature Coming Soon",
  message =
    "This Tiles Legacy feature is currently being activated."
} = {}) {
  setText(
    dashboardElements.modalIcon,
    icon
  );

  setText(
    dashboardElements.modalTitle,
    title
  );

  setText(
    dashboardElements.modalMessage,
    message
  );

  showElement(dashboardElements.modal);

  document.body.style.overflow = "hidden";
}

function closeDashboardModal() {
  hideElement(dashboardElements.modal);

  document.body.style.removeProperty("overflow");
}

function connectModalControls() {
  const collectionButtons = [
    dashboardElements.viewCollectionButton,
    dashboardElements.quickCollectionButton
  ];

  for (const button of collectionButtons) {
    if (!button) continue;

    button.addEventListener("click", () => {
      openDashboardModal({
        icon: "🎒",
        title: "Collection Coming Soon",
        message:
          "Your Commander Collection will contain permanent avatars, frames, badges, titles, and seasonal rewards."
      });
    });
  }

  const achievementButtons = [
    dashboardElements.viewAchievementsButton,
    dashboardElements.quickAchievementsButton
  ];

  for (const button of achievementButtons) {
    if (!button) continue;

    button.addEventListener("click", () => {
      openDashboardModal({
        icon: "🏆",
        title: "Achievements Coming Soon",
        message:
          "Your Legacy achievements, milestones, and achievement points will appear here when the achievement system launches."
      });
    });
  }

  dashboardElements.modalClose?.addEventListener(
    "click",
    closeDashboardModal
  );

  dashboardElements.modalAction?.addEventListener(
    "click",
    closeDashboardModal
  );

  dashboardElements.modalBackdrop?.addEventListener(
    "click",
    closeDashboardModal
  );

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeDashboardModal();
    }
  });
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutCommander() {
  const button = dashboardElements.logoutButton;

  if (button) {
    button.disabled = true;
    button.textContent = "Logging Out...";
  }

  try {
    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    window.location.replace("index.html");
  } catch (error) {
    console.error("Logout failed:", error);

    if (button) {
      button.disabled = false;
      button.textContent = "Log Out";
    }

    openDashboardModal({
      icon: "⚠️",
      title: "Logout Failed",
      message:
        "The Legacy Command Network could not complete your logout request. Please try again."
    });
  }
}


/* =========================================================
   AUTHENTICATED DASHBOARD
========================================================= */

async function loadAuthenticatedDashboard(user) {
  await loadCommanderProfile(user);

  showAuthenticatedState();

  await Promise.allSettled([
    loadCommandPass(),
    loadCollection()
  ]);

  loadAchievements();
  loadDailyMissions();
  loadRecentReward();
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeDashboard() {
  hideElement(dashboardElements.modal);
  showLoadingState();

  connectModalControls();

  dashboardElements.logoutButton?.addEventListener(
    "click",
    logoutCommander
  );

  try {
    const {
      data,
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    const session = data?.session;

    if (!session?.user) {
      showLoginState();
      return;
    }

    await loadAuthenticatedDashboard(
      session.user
    );
  } catch (error) {
    console.error(
      "Dashboard initialization failed:",
      error
    );

    showLoginState();
  }
}


/* =========================================================
   AUTH STATE CHANGES
========================================================= */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      showLoginState();
      return;
    }

    if (event === "SIGNED_IN") {
      showLoadingState();

      await loadAuthenticatedDashboard(
        session.user
      );
    }
  }
);


/* =========================================================
   START DASHBOARD
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeDashboard
);
