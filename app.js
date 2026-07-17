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
  status: $("statusMessage"),

  authSection: $("authSection"),
  dashboardSection: $("dashboardSection"),

  commanderName: $("commanderName"),
  email: $("email"),
  password: $("password"),

  loginButton: $("loginButton"),
  signupButton: $("signupButton"),
  logoutButton: $("logoutButton"),

  commanderDisplayName: $("commanderDisplayName"),
  legacyId: $("legacyId"),
  commanderLevel: $("commanderLevel"),
  commanderXp: $("commanderXp"),
  nextLevelXp: $("nextLevelXp"),
  xpProgressBar: $("xpProgressBar"),

  commanderAvatar: $("commanderAvatar"),
  avatarPlaceholder: $("avatarPlaceholder"),

  profileLegacyId: $("profileLegacyId"),
  profileLevel: $("profileLevel"),
  profileXp: $("profileXp"),

  inventoryGrid: $("inventoryGrid"),
  emptyInventory: $("emptyInventory"),
  inventoryCount: $("inventoryCount"),
  itemsOwned: $("itemsOwned"),

  passType: $("passType"),
  passLevel: $("passLevel"),
  passXp: $("passXp"),
  prestigeLevel: $("prestigeLevel"),
  passProgressBar: $("passProgressBar"),

  claimRewardButton: $("claimRewardButton"),
  dailyRewardText: $("dailyRewardText"),

  redeemCode: $("redeemCode"),
  redeemButton: $("redeemButton"),
  redeemMessage: $("redeemMessage"),

  publicProfileToggle: $("publicProfileToggle"),
  saveSettingsButton: $("saveSettingsButton")
};

let currentUser = null;
let currentProfile = null;
let inventoryItems = [];
let activeInventoryFilter = "all";

function setStatus(message, type = "neutral") {
  elements.status.textContent = message;

  const colors = {
    neutral: "#aaa6b4",
    success: "#6ee7a7",
    warning: "#f2d995",
    error: "#ff8a8a"
  };

  elements.status.style.color =
    colors[type] || colors.neutral;
}

function setInlineMessage(element, message, type = "neutral") {
  if (!element) return;

  element.textContent = message;

  const colors = {
    neutral: "#aaa6b4",
    success: "#6ee7a7",
    warning: "#f2d995",
    error: "#ff8a8a"
  };

  element.style.color =
    colors[type] || colors.neutral;
}

function showLoggedOutView() {
  currentUser = null;
  currentProfile = null;
  inventoryItems = [];

  elements.authSection.classList.remove("hidden");
  elements.dashboardSection.classList.add("hidden");

  setStatus("Legacy portal ready.", "success");
}

function showDashboardView() {
  elements.authSection.classList.add("hidden");
  elements.dashboardSection.classList.remove("hidden");
}

function setButtonLoading(button, loading, normalText, loadingText) {
  button.disabled = loading;
  button.textContent = loading ? loadingText : normalText;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function calculateLevelProgress(level, xp) {
  const safeLevel = Math.max(1, Number(level) || 1);
  const safeXp = Math.max(0, Number(xp) || 0);

  const xpNeeded = safeLevel * 100;
  const progress = Math.min(
    100,
    Math.max(0, (safeXp / xpNeeded) * 100)
  );

  return {
    xpNeeded,
    progress
  };
}

function getInventoryIcon(type) {
  const icons = {
    avatar: "👤",
    frame: "🖼️",
    badge: "🎖️",
    title: "🏷️",
    background: "🌌",
    theme: "🎨",
    consumable: "📦",
    special: "⭐"
  };

  return icons[type] || "🎁";
}

function normalizeRarity(rarity) {
  const value = String(rarity || "common").toLowerCase();

  const allowed = [
    "common",
    "rare",
    "epic",
    "legendary"
  ];

  return allowed.includes(value) ? value : "common";
}

function openPanel(panelId) {
  document
    .querySelectorAll(".content-panel")
    .forEach((panel) => {
      panel.classList.add("hidden");
    });

  document
    .querySelectorAll(".feature-card")
    .forEach((button) => {
      button.classList.remove("active");
    });

  const panel = $(panelId);

  if (panel) {
    panel.classList.remove("hidden");
  }

  const matchingButton = document.querySelector(
    `.feature-card[data-section="${panelId}"]`
  );

  if (matchingButton) {
    matchingButton.classList.add("active");
  }
}

function updateProfileDisplay(profile) {
  const commanderName =
    profile.commander_name || "Unknown Commander";

  const legacyId =
    profile.legacy_id || "Not Assigned";

  const level =
    Number(profile.commander_level) || 1;

  const xp =
    Number(profile.commander_xp) || 0;

  const { xpNeeded, progress } =
    calculateLevelProgress(level, xp);

  elements.commanderDisplayName.textContent =
    commanderName;

  elements.legacyId.textContent =
    legacyId;

  elements.commanderLevel.textContent =
    level.toLocaleString();

  elements.commanderXp.textContent =
    xp.toLocaleString();

  elements.nextLevelXp.textContent =
    xpNeeded.toLocaleString();

  elements.xpProgressBar.style.width =
    `${progress}%`;

  elements.profileLegacyId.textContent =
    legacyId;

  elements.profileLevel.textContent =
    level.toLocaleString();

  elements.profileXp.textContent =
    xp.toLocaleString();

  elements.publicProfileToggle.checked =
    profile.is_public !== false;

  const avatarUrl =
    profile.avatar_url || "";

  if (avatarUrl) {
    elements.commanderAvatar.src = avatarUrl;
    elements.commanderAvatar.classList.remove("hidden");
    elements.avatarPlaceholder.classList.add("hidden");
  } else {
    elements.commanderAvatar.removeAttribute("src");
    elements.commanderAvatar.classList.add("hidden");
    elements.avatarPlaceholder.classList.remove("hidden");

    const initials = commanderName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

    elements.avatarPlaceholder.textContent =
      initials || "TL";
  }
}

function renderInventory() {
  const filteredItems =
    activeInventoryFilter === "all"
      ? inventoryItems
      : inventoryItems.filter(
          (item) =>
            String(item.item_type).toLowerCase() ===
            activeInventoryFilter
        );

  elements.inventoryGrid.innerHTML = "";

  elements.inventoryCount.textContent =
    `${inventoryItems.length} ${
      inventoryItems.length === 1 ? "Item" : "Items"
    }`;

  elements.itemsOwned.textContent =
    inventoryItems.length.toLocaleString();

  if (filteredItems.length === 0) {
    elements.emptyInventory.classList.remove("hidden");
    return;
  }

  elements.emptyInventory.classList.add("hidden");

  filteredItems.forEach((item) => {
    const type =
      String(item.item_type || "special").toLowerCase();

    const rarity =
      normalizeRarity(item.rarity);

    const card =
      document.createElement("article");

    card.className =
      `inventory-item rarity-${rarity}`;

    card.innerHTML = `
      <div class="inventory-icon">
        ${getInventoryIcon(type)}
      </div>

      <h3>
        ${escapeHtml(item.item_name || "Unknown Item")}
      </h3>

      <p>
        ${escapeHtml(type)} · ${escapeHtml(rarity)}
      </p>
    `;

    elements.inventoryGrid.appendChild(card);
  });
}

async function loadProfile(userId) {
  const { data, error } = await db
    .from("profiles")
    .select(`
      id,
      legacy_id,
      commander_name,
      avatar_url,
      commander_xp,
      commander_level,
      is_public
    `)
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(
      `Profile could not be loaded: ${error.message}`
    );
  }

  currentProfile = data;
  updateProfileDisplay(data);
}

async function loadInventory(userId) {
  const { data, error } = await db
    .from("inventory")
    .select(`
      id,
      item_type,
      item_id,
      item_name,
      rarity,
      source,
      acquired_at
    `)
    .eq("user_id", userId)
    .order("acquired_at", {
      ascending: false
    });

  if (error) {
    console.error("Inventory error:", error.message);
    inventoryItems = [];
  } else {
    inventoryItems = data || [];
  }

  renderInventory();
}

async function loadCommandPass(userId) {
  const { data, error } = await db
    .from("command_pass")
    .select(`
      season_id,
      pass_xp,
      pass_level,
      prestige_level,
      elite
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Command Pass error:", error.message);
    return;
  }

  if (!data) {
    elements.passLevel.textContent = "1";
    elements.passXp.textContent = "0";
    elements.prestigeLevel.textContent = "0";
    elements.passType.textContent = "Free Pass";
    elements.passProgressBar.style.width = "0%";
    return;
  }

  const passLevel =
    Number(data.pass_level) || 1;

  const passXp =
    Number(data.pass_xp) || 0;

  const prestige =
    Number(data.prestige_level) || 0;

  const xpNeeded =
    Math.max(100, passLevel * 100);

  const progress =
    Math.min(100, (passXp / xpNeeded) * 100);

  elements.passLevel.textContent =
    passLevel.toLocaleString();

  elements.passXp.textContent =
    passXp.toLocaleString();

  elements.prestigeLevel.textContent =
    prestige.toLocaleString();

  elements.passType.textContent =
    data.elite ? "Elite Pass" : "Free Pass";

  elements.passProgressBar.style.width =
    `${progress}%`;
}

async function loadDashboard(user) {
  currentUser = user;

  showDashboardView();
  setStatus("Loading Commander records...", "neutral");

  try {
    await Promise.all([
    loadProfile(user.id),
    loadInventory(user.id),
    loadCommandPass(user.id),
    loadCommandPassRewards()
]);

    openPanel("profilePanel");

    setStatus(
      "Commander records loaded successfully.",
      "success"
    );
  } catch (error) {
    console.error(error);

    setStatus(
      error.message || "The dashboard could not be loaded.",
      "error"
    );
  }
}

async function login() {
  const email =
    elements.email.value.trim();

  const password =
    elements.password.value;

  if (!email || !password) {
    setStatus(
      "Enter your email and password.",
      "warning"
    );
    return;
  }

  setButtonLoading(
    elements.loginButton,
    true,
    "Log In",
    "Logging In..."
  );

  const { data, error } =
    await db.auth.signInWithPassword({
      email,
      password
    });

  setButtonLoading(
    elements.loginButton,
    false,
    "Log In",
    "Logging In..."
  );

  if (error) {
    setStatus(error.message, "error");
    return;
  }

  if (data.user) {
    await loadDashboard(data.user);
  }
}

async function signup() {
  const commanderName =
    elements.commanderName.value.trim();

  const email =
    elements.email.value.trim();

  const password =
    elements.password.value;

  if (!commanderName || !email || !password) {
    setStatus(
      "Enter a Commander name, email and password.",
      "warning"
    );
    return;
  }

  if (password.length < 6) {
    setStatus(
      "Password must contain at least 6 characters.",
      "warning"
    );
    return;
  }

  setButtonLoading(
    elements.signupButton,
    true,
    "Create New Legacy ID",
    "Creating Legacy ID..."
  );

  const { error } =
    await db.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          "https://shaidenx.github.io/tileslegacy-portal/",
        data: {
          commander_name: commanderName
        }
      }
    });

  setButtonLoading(
    elements.signupButton,
    false,
    "Create New Legacy ID",
    "Creating Legacy ID..."
  );

  if (error) {
    setStatus(error.message, "error");
    return;
  }

  setStatus(
    "Legacy ID created. Check your email to verify your account.",
    "success"
  );
}

async function logout() {
  setButtonLoading(
    elements.logoutButton,
    true,
    "Log Out",
    "Logging Out..."
  );

  const { error } =
    await db.auth.signOut();

  setButtonLoading(
    elements.logoutButton,
    false,
    "Log Out",
    "Logging Out..."
  );

  if (error) {
    setStatus(error.message, "error");
    return;
  }

  elements.password.value = "";
  showLoggedOutView();
}

async function saveSettings() {
  if (!currentUser) {
    setStatus(
      "Your session is no longer active.",
      "error"
    );
    return;
  }

  setButtonLoading(
    elements.saveSettingsButton,
    true,
    "Save Settings",
    "Saving..."
  );

  const isPublic =
    elements.publicProfileToggle.checked;

  const { error } = await db
    .from("profiles")
    .update({
      is_public: isPublic,
      updated_at: new Date().toISOString()
    })
    .eq("id", currentUser.id);

  setButtonLoading(
    elements.saveSettingsButton,
    false,
    "Save Settings",
    "Saving..."
  );

  if (error) {
    setStatus(
      `Settings could not be saved: ${error.message}`,
      "error"
    );
    return;
  }

  if (currentProfile) {
    currentProfile.is_public = isPublic;
  }

  setStatus(
    "Commander settings saved.",
    "success"
  );
}

function claimDailyReward() {
  elements.dailyRewardText.textContent =
    "Daily rewards will activate when the reward system is connected.";

  setStatus(
    "Daily Reward system is coming soon.",
    "warning"
  );
}

function redeemRewardCode() {
  const code =
    elements.redeemCode.value.trim();

  if (!code) {
    setInlineMessage(
      elements.redeemMessage,
      "Enter a reward code.",
      "warning"
    );
    return;
  }

  setInlineMessage(
    elements.redeemMessage,
    "Reward codes will activate when the redemption database is connected.",
    "warning"
  );
}

function bindNavigation() {
  document
    .querySelectorAll(".feature-card")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openPanel(button.dataset.section);
      });
    });
}

function bindInventoryFilters() {
  document
    .querySelectorAll(".filter-button")
    .forEach((button) => {
      button.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-button")
          .forEach((filterButton) => {
            filterButton.classList.remove("active");
          });

        button.classList.add("active");

        activeInventoryFilter =
          button.dataset.filter || "all";

        renderInventory();
      });
    });
}

async function checkCurrentSession() {
  setStatus("Loading secure portal...", "neutral");

  const { data, error } =
    await db.auth.getSession();

  if (error) {
    setStatus(error.message, "error");
    showLoggedOutView();
    return;
  }

  if (data.session?.user) {
    await loadDashboard(data.session.user);
  } else {
    showLoggedOutView();
  }
}

elements.loginButton.addEventListener(
  "click",
  login
);

elements.signupButton.addEventListener(
  "click",
  signup
);

elements.logoutButton.addEventListener(
  "click",
  logout
);

elements.saveSettingsButton.addEventListener(
  "click",
  saveSettings
);

elements.claimRewardButton.addEventListener(
  "click",
  claimDailyReward
);

elements.redeemButton.addEventListener(
  "click",
  redeemRewardCode
);

elements.password.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter") {
      login();
    }
  }
);

elements.redeemCode.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter") {
      redeemRewardCode();
    }
  }
);

db.auth.onAuthStateChange(
  async (event, session) => {
    if (event === "SIGNED_OUT") {
      showLoggedOutView();
    }

    if (
      event === "SIGNED_IN" &&
      session?.user &&
      session.user.id !== currentUser?.id
    ) {
      await loadDashboard(session.user);
    }
  }
);

bindNavigation();
bindInventoryFilters();
checkCurrentSession();
async function loadCommandPassRewards() {

    const loading = document.getElementById("commandPassLoading");
    const container = document.getElementById("commandPassRewards");
    const empty = document.getElementById("commandPassEmpty");

    if (!container) return;

    loading.classList.remove("hidden");
    empty.classList.add("hidden");
    container.innerHTML = "";

    const { data, error } = await db
        .from("command_pass_rewards")
        .select("*")
        .eq("season_key", "season-1")
        .order("reward_level");

    loading.classList.add("hidden");

    if (error) {
        console.error(error);
        empty.classList.remove("hidden");
        return;
    }

    data.forEach(reward => {

        const card = document.createElement("div");

        card.className = `pass-card ${reward.rarity}`;
      
const rewardImage =
    reward.image_url ||
    reward.icon_url ||
    "";

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

const fallbackIcon =
    fallbackIcons[reward.item_type] || "🎁";

card.innerHTML = `
    <div class="pass-level">
        LV ${reward.reward_level}
    </div>

    <div class="pass-track">
        ${reward.reward_track.toUpperCase()}
    </div>

    <div class="pass-reward-art">
        ${
            rewardImage
                ? `<img
                    src="${rewardImage}"
                    alt="${reward.item_name}"
                    loading="lazy"
                  >`
                : `<span class="pass-fallback-icon">
                    ${fallbackIcon}
                  </span>`
        }
    </div>

    <div class="pass-name">
        ${reward.item_name}
    </div>

    <div class="pass-rarity">
        ${reward.rarity}
    </div>

    <div class="pass-type">
        ${reward.item_type}
    </div>
`;
  

        container.appendChild(card);

    });

}
