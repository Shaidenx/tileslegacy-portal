/* =========================================================
   TILES LEGACY COMMANDER DASHBOARD
========================================================= */

const SUPABASE_URL =
  "https://pucwtnzzmlnoviiwijtq.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_8n03gOCffWC9ihQQ7lb2Mg_KVNTls8S";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* =========================================================
   PAGE ELEMENTS
========================================================= */

const elements = {
  loading: document.getElementById("dashboardLoading"),
  loginRequired: document.getElementById("loginRequired"),
  interface: document.getElementById("dashboardInterface"),

  commanderName: document.getElementById("commanderName"),
  commanderDisplayName: document.getElementById(
    "commanderDisplayName"
  ),
  commanderInitial: document.getElementById("commanderInitial"),
  commanderTitle: document.getElementById("commanderTitle"),
  commanderAvatar: document.getElementById("commanderAvatar"),

  commanderPassLevel: document.getElementById(
    "commanderPassLevel"
  ),
  summaryPassLevel: document.getElementById("summaryPassLevel"),
  summaryPassType: document.getElementById("summaryPassType"),

  summaryCollectionCount: document.getElementById(
    "summaryCollectionCount"
  ),
  collectionCountLarge: document.getElementById(
    "collectionCountLarge"
  ),

  summaryAchievementCount: document.getElementById(
    "summaryAchievementCount"
  ),
  summaryAchievementPoints: document.getElementById(
    "summaryAchievementPoints"
  ),
  achievementCountLarge: document.getElementById(
    "achievementCountLarge"
  ),
  achievementPointsLarge: document.getElementById(
    "achievementPointsLarge"
  ),

  summaryPrestigeLevel: document.getElementById(
    "summaryPrestigeLevel"
  ),

  passLevelNumber: document.getElementById("passLevelNumber"),
  passXpText: document.getElementById("passXpText"),
  passProgressPercent: document.getElementById(
    "passProgressPercent"
  ),
  passProgressTrack: document.getElementById(
    "passProgressTrack"
  ),
  passProgressBar: document.getElementById("passProgressBar"),
  nextRewardText: document.getElementById("nextRewardText"),

  missionsList: document.getElementById("missionsList"),
  missionsEmpty: document.getElementById("missionsEmpty"),
  dailyXpAvailable: document.getElementById("dailyXpAvailable"),

  recentRewardArt: document.getElementById("recentRewardArt"),
  recentRewardType: document.getElementById("recentRewardType"),
  recentRewardName: document.getElementById("recentRewardName"),
  recentRewardSource: document.getElementById(
    "recentRewardSource"
  ),

  logoutButton: document.getElementById("logoutButton"),

  viewCollectionButton: document.getElementById(
    "viewCollectionButton"
  ),
  quickCollectionButton: document.getElementById(
    "quickCollectionButton"
  ),
  viewAchievementsButton: document.getElementById(
    "viewAchievementsButton"
  ),
  quickAchievementsButton: document.getElementById(
    "quickAchievementsButton"
  ),

  modal: document.getElementById("dashboardModal"),
  modalIcon: document.getElementById("dashboardModalIcon"),
  modalTitle: document.getElementById("dashboardModalTitle"),
  modalMessage: document.getElementById(
    "dashboardModalMessage"
  ),
  modalClose: document.getElementById("closeDashboardModal"),
  modalAction: document.getElementById("dashboardModalAction")
};

/* =========================================================
   DASHBOARD STATE
========================================================= */

const dashboardState = {
  user: null,
  profile: null,
  commanderProfile: null,
  commandPass: null,
  missions: [],
  completedMissionKeys: new Set(),
  inventory: [],
  achievements: []
};

/* =========================================================
   GENERAL HELPERS
========================================================= */

function showElement(element) {
  if (element) {
    element.classList.remove("hidden");
  }
}

function hideElement(element) {
  if (element) {
    element.classList.add("hidden");
  }
}

function safeText(value, fallback = "") {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value).trim();
}

function getFirstValue(object, keys, fallback = null) {
  if (!object) {
    return fallback;
  }

  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(object, key) &&
      object[key] !== null &&
      object[key] !== undefined &&
      object[key] !== ""
    ) {
      return object[key];
    }
  }

  return fallback;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatItemType(value) {
  const raw = safeText(value, "Reward");

  return raw
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTodayDateString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getUserDisplayName() {
  const profileName = getFirstValue(
    dashboardState.commanderProfile,
    [
      "commander_name",
      "display_name",
      "username",
      "name"
    ]
  );

  const accountName = getFirstValue(
    dashboardState.profile,
    [
      "commander_name",
      "display_name",
      "username",
      "full_name",
      "name"
    ]
  );

  const metadataName = getFirstValue(
    dashboardState.user?.user_metadata,
    [
      "commander_name",
      "display_name",
      "username",
      "full_name",
      "name"
    ]
  );

  const emailName =
    dashboardState.user?.email?.split("@")[0] || "Commander";

  return safeText(
    profileName || accountName || metadataName || emailName,
    "Commander"
  );
}

function getCommanderTitle() {
  return safeText(
    getFirstValue(
      dashboardState.commanderProfile,
      ["equipped_title", "title", "commander_title"]
    ) ||
      getFirstValue(
        dashboardState.profile,
        ["equipped_title", "title", "commander_title"]
      ),
    "Survivor"
  );
}

function getAvatarUrl() {
  return safeText(
    getFirstValue(
      dashboardState.commanderProfile,
      [
        "avatar_url",
        "profile_image_url",
        "image_url",
        "avatar"
      ]
    ) ||
      getFirstValue(
        dashboardState.profile,
        [
          "avatar_url",
          "profile_image_url",
          "image_url",
          "avatar"
        ]
      ) ||
      getFirstValue(
        dashboardState.user?.user_metadata,
        ["avatar_url", "picture"]
      ),
    ""
  );
}

/* =========================================================
   MODAL
========================================================= */

function openModal({
  icon = "⚔️",
  title = "Tiles Legacy",
  message = "This feature is coming soon."
} = {}) {
  elements.modalIcon.textContent = icon;
  elements.modalTitle.textContent = title;
  elements.modalMessage.textContent = message;

  showElement(elements.modal);
}

function closeModal() {
  hideElement(elements.modal);
}

elements.modalClose?.addEventListener("click", closeModal);
elements.modalAction?.addEventListener("click", closeModal);

elements.modal?.addEventListener("click", (event) => {
  if (event.target === elements.modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

/* =========================================================
   SAFE SUPABASE QUERIES
========================================================= */

async function getSingleUserRow(tableName, userId) {
  const possibleColumns = [
    "user_id",
    "profile_id",
    "owner_id",
    "id"
  ];

  for (const column of possibleColumns) {
    const result = await db
      .from(tableName)
      .select("*")
      .eq(column, userId)
      .maybeSingle();

    if (!result.error) {
      return result.data;
    }

    const errorMessage = result.error.message || "";

    const missingColumn =
      errorMessage.includes("column") ||
      errorMessage.includes("does not exist");

    if (!missingColumn) {
      console.warn(
        `Unable to load ${tableName}:`,
        result.error
      );

      return null;
    }
  }

  return null;
}

async function getUserRows(tableName, userId) {
  const possibleColumns = [
    "user_id",
    "profile_id",
    "owner_id"
  ];

  for (const column of possibleColumns) {
    const result = await db
      .from(tableName)
      .select("*")
      .eq(column, userId);

    if (!result.error) {
      return result.data || [];
    }

    const errorMessage = result.error.message || "";

    const missingColumn =
      errorMessage.includes("column") ||
      errorMessage.includes("does not exist");

    if (!missingColumn) {
      console.warn(
        `Unable to load ${tableName}:`,
        result.error
      );

      return [];
    }
  }

  return [];
}

/* =========================================================
   LOAD ACCOUNT DATA
========================================================= */

async function loadProfiles(userId) {
  const [profile, commanderProfile] = await Promise.all([
    getSingleUserRow("profiles", userId),
    getSingleUserRow("commander_profiles", userId)
  ]);

  dashboardState.profile = profile;
  dashboardState.commanderProfile = commanderProfile;
}

async function loadCommandPass(userId) {
  dashboardState.commandPass =
    await getSingleUserRow("command_pass", userId);
}

async function loadInventory(userId) {
  dashboardState.inventory = await getUserRows(
    "inventory",
    userId
  );
}

async function loadPlayerAchievements(userId) {
  dashboardState.achievements = await getUserRows(
    "player_achievements",
    userId
  );
}

/* =========================================================
   DAILY MISSIONS
========================================================= */

async function loadDailyMissions(userId) {
  const missionResult = await db
    .from("daily_missions")
    .select("*")
    .order("sort_order", { ascending: true });

  if (missionResult.error) {
    console.error(
      "Unable to load daily missions:",
      missionResult.error
    );

    dashboardState.missions = [];
    return;
  }

  dashboardState.missions = missionResult.data || [];

  const progressRows = await getUserRows(
    "player_daily_missions",
    userId
  );

  const today = getTodayDateString();

  const todaysProgress = progressRows.filter((row) => {
    const progressDate = getFirstValue(row, [
      "mission_date",
      "completed_date",
      "date",
      "day"
    ]);

    if (!progressDate) {
      return true;
    }

    return String(progressDate).slice(0, 10) === today;
  });

  dashboardState.completedMissionKeys = new Set();

  todaysProgress.forEach((row) => {
    const completed = getFirstValue(
      row,
      [
        "completed",
        "is_completed",
        "claimed",
        "is_claimed"
      ],
      true
    );

    if (completed === false) {
      return;
    }

    const missionKey = getFirstValue(row, [
      "mission_key",
      "daily_mission_key",
      "key"
    ]);

    const missionId = getFirstValue(row, [
      "mission_id",
      "daily_mission_id"
    ]);

    if (missionKey) {
      dashboardState.completedMissionKeys.add(
        String(missionKey)
      );
    }

    if (missionId) {
      dashboardState.completedMissionKeys.add(
        String(missionId)
      );
    }
  });
}

/* =========================================================
   COMMAND PASS CALCULATIONS
========================================================= */

function getPassLevel() {
  const directLevel = Number(
    getFirstValue(
      dashboardState.commandPass,
      [
        "current_level",
        "pass_level",
        "level",
        "reward_level"
      ],
      1
    )
  );

  if (
    Number.isFinite(directLevel) &&
    directLevel > 0
  ) {
    return Math.floor(directLevel);
  }

  const totalXp = getTotalPassXp();

  return Math.floor(totalXp / 100) + 1;
}

function getTotalPassXp() {
  const xp = Number(
    getFirstValue(
      dashboardState.commandPass,
      [
        "total_xp",
        "current_xp",
        "xp",
        "season_xp",
        "pass_xp"
      ],
      0
    )
  );

  return Number.isFinite(xp) ? Math.max(0, xp) : 0;
}

function getXpWithinCurrentLevel() {
  const pass = dashboardState.commandPass;

  const explicitCurrentXp = getFirstValue(pass, [
    "level_xp",
    "xp_in_level",
    "current_level_xp"
  ]);

  if (explicitCurrentXp !== null) {
    const value = Number(explicitCurrentXp);

    return Number.isFinite(value)
      ? Math.max(0, value)
      : 0;
  }

  const totalXp = getTotalPassXp();

  return totalXp % 100;
}

function getXpRequiredForLevel() {
  const required = Number(
    getFirstValue(
      dashboardState.commandPass,
      [
        "xp_required",
        "xp_to_next_level",
        "level_xp_required"
      ],
      100
    )
  );

  return Number.isFinite(required) && required > 0
    ? required
    : 100;
}

function hasPremiumPass() {
  return Boolean(
    getFirstValue(
      dashboardState.commandPass,
      [
        "premium_unlocked",
        "has_premium",
        "premium",
        "is_premium"
      ],
      false
    )
  );
}

/* =========================================================
   RENDER COMMANDER
========================================================= */

function renderCommanderIdentity() {
  const displayName = getUserDisplayName();
  const title = getCommanderTitle();
  const initial =
    displayName.charAt(0).toUpperCase() || "C";
  const avatarUrl = getAvatarUrl();

  elements.commanderName.textContent = displayName;
  elements.commanderDisplayName.textContent = displayName;
  elements.commanderTitle.textContent = title;
  elements.commanderInitial.textContent = initial;

  if (avatarUrl) {
    elements.commanderAvatar.innerHTML = "";

    const image = document.createElement("img");
    image.src = avatarUrl;
    image.alt = `${displayName} commander avatar`;

    image.addEventListener("error", () => {
      elements.commanderAvatar.innerHTML =
        `<span>${escapeHtml(initial)}</span>`;
    });

    elements.commanderAvatar.appendChild(image);
  }
}

/* =========================================================
   RENDER COMMAND PASS
========================================================= */

async function getNextReward(level) {
  const result = await db
    .from("command_pass_rewards")
    .select("*")
    .gt("reward_level", level)
    .order("reward_level", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    console.warn(
      "Unable to load next reward:",
      result.error
    );

    return null;
  }

  return result.data;
}

async function renderCommandPass() {
  const level = getPassLevel();
  const currentXp = getXpWithinCurrentLevel();
  const requiredXp = getXpRequiredForLevel();

  const percentage = Math.min(
    100,
    Math.max(
      0,
      Math.round((currentXp / requiredXp) * 100)
    )
  );

  elements.commanderPassLevel.textContent =
    `Level ${level}`;

  elements.summaryPassLevel.textContent =
    `Level ${level}`;

  elements.summaryPassType.textContent =
    hasPremiumPass() ? "Premium Pass" : "Free Pass";

  elements.passLevelNumber.textContent = String(level);

  elements.passXpText.textContent =
    `${currentXp} / ${requiredXp} XP`;

  elements.passProgressPercent.textContent =
    `${percentage}%`;

  elements.passProgressTrack.setAttribute(
    "aria-valuenow",
    String(percentage)
  );

  elements.passProgressBar.style.width =
    `${percentage}%`;

  const nextReward = await getNextReward(level);

  if (nextReward) {
    const rewardName = safeText(
      getFirstValue(nextReward, [
        "item_name",
        "reward_name",
        "name"
      ]),
      "mystery reward"
    );

    const rewardLevel = getFirstValue(
      nextReward,
      ["reward_level", "level"],
      level + 1
    );

    elements.nextRewardText.textContent =
      `Next reward: ${rewardName} at Level ${rewardLevel}.`;
  } else if (level >= 50) {
    elements.nextRewardText.textContent =
      "You have reached the end of the Season 1 Command Pass.";
  } else {
    elements.nextRewardText.textContent =
      "Earn XP to unlock your next Command Pass reward.";
  }
}

/* =========================================================
   RENDER COLLECTION
========================================================= */

function renderCollection() {
  const count = dashboardState.inventory.length;

  elements.summaryCollectionCount.textContent =
    `${count} ${count === 1 ? "Item" : "Items"}`;

  elements.collectionCountLarge.textContent =
    String(count);
}

/* =========================================================
   RENDER ACHIEVEMENTS
========================================================= */

function renderAchievements() {
  const unlockedAchievements =
    dashboardState.achievements.filter((row) => {
      const unlocked = getFirstValue(
        row,
        [
          "unlocked",
          "is_unlocked",
          "completed",
          "is_completed"
        ],
        true
      );

      return unlocked !== false;
    });

  const count = unlockedAchievements.length;

  const points = unlockedAchievements.reduce(
    (total, row) => {
      const rowPoints = Number(
        getFirstValue(
          row,
          [
            "points",
            "achievement_points",
            "point_value"
          ],
          0
        )
      );

      return total +
        (Number.isFinite(rowPoints) ? rowPoints : 0);
    },
    0
  );

  elements.summaryAchievementCount.textContent =
    `${count} Unlocked`;

  elements.summaryAchievementPoints.textContent =
    `${points} Points`;

  elements.achievementCountLarge.textContent =
    String(count);

  elements.achievementPointsLarge.textContent =
    String(points);

  const prestigeLevel = Math.floor(points / 500);

  elements.summaryPrestigeLevel.textContent =
    `Level ${prestigeLevel}`;
}

/* =========================================================
   RENDER DAILY MISSIONS
========================================================= */

function getMissionIcon(missionKey) {
  const icons = {
    daily_login: "📡",
    read_guide: "📖",
    redeem_code: "🎟️",
    visit_blog: "📰",
    daily_trivia: "🧠"
  };

  return icons[missionKey] || "⚔️";
}

function isMissionCompleted(mission) {
  const missionKey = getFirstValue(
    mission,
    ["mission_key", "key"]
  );

  const missionId = getFirstValue(mission, [
    "id",
    "mission_id"
  ]);

  return (
    dashboardState.completedMissionKeys.has(
      String(missionKey)
    ) ||
    dashboardState.completedMissionKeys.has(
      String(missionId)
    )
  );
}

function renderDailyMissions() {
  elements.missionsList.innerHTML = "";

  if (dashboardState.missions.length === 0) {
    showElement(elements.missionsEmpty);
    elements.dailyXpAvailable.textContent = "0 XP";
    return;
  }

  hideElement(elements.missionsEmpty);

  let availableXp = 0;

  dashboardState.missions.forEach((mission) => {
    const missionKey = safeText(
      getFirstValue(mission, [
        "mission_key",
        "key"
      ]),
      "mission"
    );

    const title = safeText(
      getFirstValue(mission, [
        "title",
        "mission_title",
        "name"
      ]),
      "Daily Mission"
    );

    const description = safeText(
      getFirstValue(mission, [
        "description",
        "mission_description"
      ]),
      "Complete this daily operation."
    );

    const xpReward = Number(
      getFirstValue(
      
