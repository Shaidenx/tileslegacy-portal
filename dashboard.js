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

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_8n03gOCffWC9ihQQ7lb2Mg_KVNTls8S";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   PAGE ELEMENTS
========================================================= */

const elements = {
  loading: document.getElementById("dashboardLoading"),
  loginRequired: document.getElementById("loginRequired"),
  dashboard: document.getElementById("dashboardInterface"),

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

  modal:
    document.getElementById("dashboardModal"),
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
   VISIBILITY CONTROL
========================================================= */

function hideElement(element) {
  if (element) {
    element.classList.add("hidden");
  }
}

function showElement(element) {
  if (element) {
    element.classList.remove("hidden");
  }
}

function hideEveryState() {
  hideElement(elements.loading);
  hideElement(elements.loginRequired);
  hideElement(elements.dashboard);
  hideElement(elements.modal);
}

function showLoadingState() {
  hideEveryState();
  showElement(elements.loading);
}

function showLoginState() {
  hideEveryState();
  showElement(elements.loginRequired);
}

function showDashboardState() {
  hideEveryState();
  showElement(elements.dashboard);
}


/* =========================================================
   SAFE VALUE HELPERS
========================================================= */

function firstAvailable(object, fields, fallback = null) {
  if (!object) {
    return fallback;
  }

  for (const field of fields) {
    const value = object[field];

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

function setText(element, value) {
  if (element) {
    element.textContent = String(value);
  }
}

function createCommanderInitial(name) {
  const cleanedName = String(name || "Commander").trim();

  if (!cleanedName) {
    return "C";
  }

  return cleanedName.charAt(0).toUpperCase();
}

function clamp(number, minimum, maximum) {
  return Math.min(
    Math.max(Number(number) || 0, minimum),
    maximum
  );
}


/* =========================================================
   PROFILE
========================================================= */

async function loadCommanderProfile(user) {
  let profile = null;

  try {
    const response = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (response.error) {
      console.warn(
        "Profile could not be loaded:",
        response.error.message
      );
    } else {
      profile = response.data;
    }
  } catch (error) {
    console.warn("Profile request failed:", error);
  }

  const metadata = user.user_metadata || {};

  const commanderName = firstAvailable(
    profile,
    [
      "commander_name",
      "display_name",
      "username",
      "name"
    ],
    firstAvailable(
      metadata,
      [
        "commander_name",
        "display_name",
        "username",
        "name",
        "full_name"
      ],
      "Commander"
    )
  );

  const commanderTitle = firstAvailable(
    profile,
    [
      "commander_title",
      "equipped_title",
      "title"
    ],
    "Survivor"
  );

  const avatarUrl = firstAvailable(
    profile,
    [
      "avatar_url",
      "profile_image",
      "image_url"
    ],
    firstAvailable(
      metadata,
      ["avatar_url", "picture"],
      null
    )
  );

  updateCommanderIdentity({
    name: commanderName,
    title: commanderTitle,
    avatarUrl
  });

  return profile;
}

function updateCommanderIdentity({
  name,
  title,
  avatarUrl
}) {
  const safeName = name || "Commander";
  const safeTitle = title || "Survivor";

  setText(elements.commanderName, safeName);
  setText(elements.commanderDisplayName, safeName);
  setText(elements.commanderTitle, safeTitle);
  setText(
    elements.commanderInitial,
    createCommanderInitial(safeName)
  );

  if (elements.commanderAvatar && avatarUrl) {
    const safeUrl = String(avatarUrl);

    elements.commanderAvatar.innerHTML = "";

    const image = document.createElement("img");
    image.src = safeUrl;
    image.alt = `${safeName} commander avatar`;
    image.loading = "lazy";

    image.addEventListener("error", () => {
      elements.commanderAvatar.innerHTML = "";

      const initial = document.createElement("span");
      initial.id = "commanderInitial";
      initial.textContent =
        createCommanderInitial(safeName);

      elements.commanderAvatar.appendChild(initial);
      elements.commanderInitial = initial;
    });

    elements.commanderAvatar.appendChild(image);
  }
}


/* =========================================================
   COMMAND PASS
========================================================= */

async function loadCommandPass(user) {
  let passRecord = null;

  const possibleTables = [
    "command_pass_progress",
    "command_passes",
    "command_pass"
  ];

  for (const tableName of possibleTables) {
    try {
      const response = await supabaseClient
        .from(tableName)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!response.error && response.data) {
        passRecord = response.data;
        break;
      }
    } catch (error) {
      console.warn(
        `Could not check ${tableName}:`,
        error
      );
    }
  }

  const level = Number(
    firstAvailable(
      passRecord,
      ["level", "pass_level", "current_level"],
      1
    )
  );

  const currentXp = Number(
    firstAvailable(
      passRecord,
      ["xp", "current_xp", "season_xp"],
      0
    )
  );

  const requiredXp = Number(
    firstAvailable(
      passRecord,
      [
        "xp_required",
        "next_level_xp",
        "required_xp"
      ],
      100
    )
  );

  const passType = firstAvailable(
    passRecord,
    ["pass_type", "track", "tier"],
    "Free Pass"
  );

  const prestige = Number(
    firstAvailable(
      passRecord,
      ["prestige_level", "prestige"],
      0
    )
  );

  updateCommandPass({
    level,
    currentXp,
    requiredXp,
    passType,
    prestige
  });
}

function updateCommandPass({
  level,
  currentXp,
  requiredXp,
  passType,
  prestige
}) {
  const safeRequiredXp =
    requiredXp > 0 ? requiredXp : 100;

  const percentage = clamp(
    Math.round(
      (currentXp / safeRequiredXp) * 100
    ),
    0,
    100
  );

  setText(
    elements.commanderPassLevel,
    `Level ${level}`
  );

  setText(
    elements.summaryPassLevel,
    `Level ${level}`
  );

  setText(
    elements.summaryPassType,
    passType
  );

  setText(
    elements.summaryPassTypeSecondary,
    passType
  );

  setText(
    elements.passLevelNumber,
    level
  );

  setText(
    elements.passXpText,
    `${currentXp} / ${safeRequiredXp} XP`
  );

  setText(
    elements.passProgressPercent,
    `${percentage}%`
  );

  setText(
    elements.summaryPrestigeLevel,
    `Level ${prestige}`
  );

  if (elements.passProgressBar) {
    elements.passProgressBar.style.width =
      `${percentage}%`;
  }

  if (elements.passProgressTrack) {
    elements.passProgressTrack.setAttribute(
      "aria-valuenow",
      String(percentage)
    );
  }

  setText(
    elements.nextRewardText,
    percentage >= 100
      ? "Your next Command Pass reward is ready."
      : `${safeRequiredXp - currentXp} XP until your next reward.`
  );
}


/* =========================================================
   COLLECTION
========================================================= */

async function loadCollection(user) {
  let count = 0;

  const possibleTables = [
    "inventory",
    "user_inventory",
    "collections"
  ];

  for (const tableName of possibleTables) {
    try {
      const response = await supabaseClient
        .from(tableName)
        .select("*", {
          count: "exact",
          head: true
        })
        .eq("user_id", user.id);

      if (!response.error) {
        count = response.count || 0;
        break;
      }
    } catch (error) {
      console.warn(
        `Could not count ${tableName}:`,
        error
      );
    }
  }

  setText(
    elements.summaryCollectionCount,
    `${count} ${count === 1 ? "Item" : "Items"}`
  );

  setText(elements.collectionCountLarge, count);
}


/* =========================================================
   ACHIEVEMENTS
========================================================= */

async function loadAchievements(user) {
  let achievements = [];

  const possibleTables = [
    "user_achievements",
    "achievements_unlocked",
    "commander_achievements"
  ];

  for (const tableName of possibleTables) {
    try {
      const response = await supabaseClient
        .from(tableName)
        .select("*")
        .eq("user_id", user.id);

      if (
        !response.error &&
        Array.isArray(response.data)
      ) {
        achievements = response.data;
        break;
      }
    } catch (error) {
      console.warn(
        `Could not load ${tableName}:`,
        error
      );
    }
  }

  const unlockedCount = achievements.length;

  const achievementPoints =
    achievements.reduce((total, achievement) => {
      const points = Number(
        firstAvailable(
          achievement,
          ["points", "achievement_points"],
          0
        )
      );

      return total + points;
    }, 0);

  setText(
    elements.summaryAchievementCount,
    `${unlockedCount} Unlocked`
  );

  setText(
    elements.summaryAchievementPoints,
    `${achievementPoints} Points`
  );

  setText(
    elements.achievementCountLarge,
    unlockedCount
  );

  setText(
    elements.achievementPointsLarge,
    achievementPoints
  );
}


/* =========================================================
   MISSIONS
========================================================= */

function showEmptyMissions() {
  if (elements.missionsList) {
    elements.missionsList.innerHTML = "";
  }

  setText(elements.dailyXpAvailable, "0 XP");
  showElement(elements.missionsEmpty);
}

async function loadMissions(user) {
  let missions = [];

  const possibleTables = [
    "daily_missions",
    "user_missions",
    "missions"
  ];

  for (const tableName of possibleTables) {
    try {
      const response = await supabaseClient
        .from(tableName)
        .select("*")
        .eq("user_id", user.id);

      if (
        !response.error &&
        Array.isArray(response.data) &&
        response.data.length
      ) {
        missions = response.data;
        break;
      }
    } catch (error) {
      console.warn(
        `Could not load ${tableName}:`,
        error
      );
    }
  }

  if (!missions.length) {
    showEmptyMissions();
    return;
  }

  hideElement(elements.missionsEmpty);
  elements.missionsList.innerHTML = "";

  let totalXp = 0;

  missions.forEach((mission) => {
    const title = firstAvailable(
      mission,
      ["title", "mission_name", "name"],
      "Legacy Mission"
    );

    const description = firstAvailable(
      mission,
      ["description", "details"],
      "Complete this mission to earn Command Pass XP."
    );

    const xpReward = Number(
      firstAvailable(
        mission,
        ["xp_reward", "reward_xp", "xp"],
        0
      )
    );

    totalXp += xpReward;

    const missionCard =
      document.createElement("article");

    missionCard.className = "mission-card";

    missionCard.innerHTML = `
      <div>
        <h3></h3>
        <p></p>
      </div>

      <strong class="mission-xp"></strong>
    `;

    missionCard.querySelector("h3").textContent =
      title;

    missionCard.querySelector("p").textContent =
      description;

    missionCard.querySelector(
      ".mission-xp"
    ).textContent = `+${xpReward} XP`;

    elements.missionsList.appendChild(missionCard);
  });

  setText(
    elements.dailyXpAvailable,
    `${totalXp} XP`
  );
}


/* =========================================================
   RECENT REWARD
========================================================= */

function loadRecentReward() {
  setText(
    elements.recentRewardType,
    "No reward collected"
  );

  setText(
    elements.recentRewardName,
    "Your first reward is waiting"
  );

  setText(
    elements.recentRewardSource,
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
  setText(elements.modalIcon, icon);
  setText(elements.modalTitle, title);
  setText(elements.modalMessage, message);

  showElement(elements.modal);

  document.body.style.overflow = "hidden";
}

function closeDashboardModal() {
  hideElement(elements.modal);
  document.body.style.overflow = "";
}

function connectFeatureButtons() {
  const collectionButtons = [
    elements.viewCollectionButton,
    elements.quickCollectionButton
  ];

  collectionButtons.forEach((button) => {
    button?.addEventListener("click", () => {
      openDashboardModal({
        icon: "🎒",
        title: "Collection Coming Soon",
        message:
          "The Commander Collection is being prepared. Your avatars, frames, badges, titles, and permanent rewards will appear here."
      });
    });
  });

  const achievementButtons = [
    elements.viewAchievementsButton,
    elements.quickAchievementsButton
  ];

  achievementButtons.forEach((button) => {
    button?.addEventListener("click", () => {
      openDashboardModal({
        icon: "🏆",
        title: "Achievements Coming Soon",
        message:
          "The Legacy Achievement system is being activated. Your milestones, points, and permanent accomplishments will appear here."
      });
    });
  });

  elements.modalClose?.addEventListener(
    "click",
    closeDashboardModal
  );

  elements.modalAction?.addEventListener(
    "click",
    closeDashboardModal
  );

  elements.modalBackdrop?.addEventListener(
    "click",
    closeDashboardModal
  );

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !elements.modal?.classList.contains("hidden")
    ) {
      closeDashboardModal();
    }
  });
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutCommander() {
  if (!elements.logoutButton) {
    return;
  }

  const originalText =
    elements.logoutButton.textContent;

  elements.logoutButton.disabled = true;
  elements.logoutButton.textContent =
    "Logging Out...";

  try {
    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout failed:", error);

    elements.logoutButton.disabled = false;
    elements.logoutButton.textContent =
      originalText;

    openDashboardModal({
      icon: "⚠️",
      title: "Logout Failed",
      message:
        "The Commander Network could not complete the logout request. Please try again."
    });
  }
}


/* =========================================================
   DASHBOARD INITIALIZATION
========================================================= */

async function initializeDashboard() {
  showLoadingState();
  connectFeatureButtons();

  elements.logoutButton?.addEventListener(
    "click",
    logoutCommander
  );

  try {
    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session?.user) {
      showLoginState();
      return;
    }

    const user = session.user;

    await loadCommanderProfile(user);

    showDashboardState();

    await Promise.allSettled([
      loadCommandPass(user),
      loadCollection(user),
      loadAchievements(user),
      loadMissions(user)
    ]);

    loadRecentReward();
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
  (event, session) => {
    if (
      event === "SIGNED_OUT" ||
      !session
    ) {
      showLoginState();
    }
  }
);


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeDashboard
);
