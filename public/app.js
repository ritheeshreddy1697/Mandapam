const languageSelect = document.getElementById("languageSelect");
const profileTrigger = document.getElementById("profileTrigger");
const profileDropdown = document.getElementById("profileDropdown");
const profileMenu = document.getElementById("profileMenu");
const tabsContainer = document.getElementById("dashboardTabs");
const contentPanels = Array.from(document.querySelectorAll(".content-panel"));

const translations = {
  en: {
    title: "Dashboard",
    subtitle:
      "Comprehensive soil analysis and fertilizer recommendations powered by real-time data and ML"
  },
  hi: {
    title: "डैशबोर्ड",
    subtitle:
      "रियल-टाइम डेटा और एमएल आधारित समग्र मिट्टी विश्लेषण और उर्वरक सुझाव"
  },
  te: {
    title: "డాష్‌బోర్డ్",
    subtitle:
      "రియల్ టైమ్ డేటా మరియు ఎంఎల్ ఆధారిత సమగ్ర మట్టి విశ్లేషణ మరియు ఎరువు సూచనలు"
  }
};

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  });
}

function severityClass(status) {
  const normalized = status.toLowerCase();

  if (normalized.includes("poor")) {
    return "severity-pill severity-pill--poor";
  }

  if (normalized.includes("moderate")) {
    return "severity-pill severity-pill--warning";
  }

  return "severity-pill severity-pill--good";
}

function createOption(language) {
  const option = document.createElement("option");
  option.value = language.code;
  option.textContent = language.label;
  return option;
}

function createTabButton(tab, isActive) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `tab-button${isActive ? " is-active" : ""}`;
  button.dataset.tab = tab.key;
  button.textContent = tab.label;
  return button;
}

function createSoilCard(item) {
  const card = document.createElement("article");
  card.className = `soil-card tone-${item.tone}`;

  const label = document.createElement("span");
  const value = document.createElement("strong");

  label.textContent = item.label;
  value.textContent = item.unit ? `${item.value} ${item.unit}` : item.value;

  card.append(label, value);
  return card;
}

function createRecommendationCard(item) {
  const card = document.createElement("article");
  card.className = "recommendation-card";

  const header = document.createElement("div");
  header.className = "recommendation-card__header";

  const title = document.createElement("h4");
  const badge = document.createElement("span");
  const detail = document.createElement("p");
  const facts = document.createElement("div");
  const note = document.createElement("small");
  const costGrid = document.createElement("div");

  title.textContent = item.title;
  badge.textContent = item.priority;
  badge.className = `priority-badge priority-${item.priority.toLowerCase()}`;
  detail.textContent = item.detail;
  facts.className = "recommendation-facts";
  note.className = "recommendation-note";
  note.textContent = item.note || "";
  costGrid.className = "recommendation-cost-grid";

  header.append(title, badge);
  card.append(header, detail);

  [
    ["Fertilizer", item.fertilizer],
    ["Nutrient Content", item.nutrientContent],
    ["Price Range", item.priceRange],
    ["Application Rate", item.applicationRate]
  ].forEach(([label, value]) => {
    if (!value) {
      return;
    }

    const fact = document.createElement("div");
    const factLabel = document.createElement("span");
    const factValue = document.createElement("strong");

    fact.className = "recommendation-fact";
    factLabel.textContent = label;
    factValue.textContent = value;

    fact.append(factLabel, factValue);
    facts.appendChild(fact);
  });

  if (facts.children.length > 0) {
    card.appendChild(facts);
  }

  if (item.note) {
    card.appendChild(note);
  }

  if (item.costSummary) {
    [
      ["Estimated Cost", item.costSummary.estimated],
      ["Total Cost", item.costSummary.total]
    ].forEach(([label, value]) => {
      const costItem = document.createElement("div");
      const costLabel = document.createElement("span");
      const costValue = document.createElement("strong");

      costItem.className = "recommendation-cost";
      costLabel.textContent = label;
      costValue.textContent = value;

      costItem.append(costLabel, costValue);
      costGrid.appendChild(costItem);
    });

    card.appendChild(costGrid);
  }

  return card;
}

function createRecommendationColumn(title, items) {
  const column = document.createElement("section");
  column.className = "recommendation-column";

  const heading = document.createElement("h4");
  const list = document.createElement("div");

  heading.className = "column-title";
  heading.textContent = title;
  list.className = "column-list";

  items.forEach((item) => {
    list.appendChild(createRecommendationCard(item));
  });

  column.append(heading, list);
  return column;
}

function createRecommendationTableRow(item) {
  const row = document.createElement("tr");

  [
    item.nutrient,
    item.currentValue,
    item.thresholdValues,
    item.band
  ].forEach((value, index) => {
    const cell = document.createElement(index === 0 ? "th" : "td");
    if (index === 0) {
      cell.scope = "row";
    }
    cell.textContent = value;
    row.appendChild(cell);
  });

  return row;
}

function createSensorCard(item) {
  const card = document.createElement("article");
  card.className = `sensor-card tone-${item.tone}`;

  const label = document.createElement("span");
  const value = document.createElement("strong");
  const meta = document.createElement("small");

  label.textContent = item.label;
  value.textContent = item.value;
  meta.textContent = item.change;

  card.append(label, value, meta);
  return card;
}

function createFeedRow(item) {
  const row = document.createElement("article");
  row.className = "feed-row";

  const time = document.createElement("span");
  const text = document.createElement("p");

  time.textContent = item.time;
  text.textContent = item.detail;

  row.append(time, text);
  return row;
}

function setActiveTab(tabKey) {
  const buttons = tabsContainer.querySelectorAll(".tab-button");

  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabKey);
  });

  contentPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === tabKey);
  });
}

function updatePageLanguage(languageCode, site) {
  const translation = translations[languageCode] || translations.en;
  document.documentElement.lang = languageCode;
  document.getElementById("pageTitle").textContent = translation.title || site.title;
  document.getElementById("pageSubtitle").textContent =
    translation.subtitle || site.subtitle;
}

function populateTabs(tabs, activeTab) {
  tabsContainer.innerHTML = "";

  tabs.forEach((tab) => {
    const button = createTabButton(tab, tab.key === activeTab);
    button.addEventListener("click", () => {
      setActiveTab(tab.key);
    });
    tabsContainer.appendChild(button);
  });
}

async function loadDashboard() {
  const [siteResponse, dashboardResponse] = await Promise.all([
    fetch("/api/site-data"),
    fetch("/api/dashboard")
  ]);

  const site = await siteResponse.json();
  const dashboard = await dashboardResponse.json();

  document.getElementById("brandName").textContent = site.brand;
  document.getElementById("profileName").textContent = site.profile.name;
  document.getElementById("profileFarm").textContent = site.profile.farm;
  document.getElementById("profileRoleExpanded").textContent = site.profile.role;
  document.getElementById("overviewTitle").textContent = dashboard.overview.title;
  document.getElementById("recommendationSummary").textContent =
    dashboard.recommendations.summary;

  languageSelect.innerHTML = "";
  site.languages.forEach((language) => {
    languageSelect.appendChild(createOption(language));
  });

  languageSelect.value = site.selectedLanguage || site.languages[0].code;
  updatePageLanguage(languageSelect.value, site);

  populateTabs(dashboard.tabs, dashboard.activeTab);
  setActiveTab(dashboard.activeTab);

  document.getElementById("reportTimestamp").textContent = formatDateTime(
    dashboard.overview.timestamp
  );
  document.getElementById("updatedAt").textContent = `Updated ${formatDateTime(
    dashboard.realtime.updatedAt
  )}`;

  const soilStatus = document.getElementById("soilStatus");
  soilStatus.textContent = dashboard.overview.status;
  soilStatus.className = severityClass(dashboard.overview.status);

  document.getElementById("soilHeading").textContent =
    dashboard.overview.soilHealth.label;
  document.getElementById("soilMessage").textContent =
    dashboard.overview.soilHealth.message;
  document.getElementById("soilScore").textContent =
    `${dashboard.overview.soilHealth.score}%`;
  document.getElementById("soilTrend").textContent =
    dashboard.overview.soilHealth.support;
  document.getElementById("soilProgress").style.width =
    `${dashboard.overview.soilHealth.progress}%`;

  const soilDataList = document.getElementById("soilDataList");
  soilDataList.innerHTML = "";
  dashboard.overview.soilData.forEach((item) => {
    soilDataList.appendChild(createSoilCard(item));
  });

  const recommendationColumns = document.getElementById("recommendationColumns");
  const recommendationTableBody = document.getElementById("recommendationTableBody");
  recommendationTableBody.innerHTML = "";
  dashboard.recommendations.tableRows.forEach((item) => {
    recommendationTableBody.appendChild(createRecommendationTableRow(item));
  });

  recommendationColumns.innerHTML = "";
  recommendationColumns.appendChild(
    createRecommendationColumn(
      "Organic Fertilizers",
      dashboard.recommendations.organic
    )
  );
  recommendationColumns.appendChild(
    createRecommendationColumn(
      "Inorganic Fertilizers",
      dashboard.recommendations.inorganic
    )
  );

  const realtimeList = document.getElementById("realtimeList");
  realtimeList.innerHTML = "";
  dashboard.realtime.metrics.forEach((item) => {
    realtimeList.appendChild(createSensorCard(item));
  });

  const sensorFeed = document.getElementById("sensorFeed");
  sensorFeed.innerHTML = "";
  dashboard.realtime.feed.forEach((item) => {
    sensorFeed.appendChild(createFeedRow(item));
  });

  languageSelect.addEventListener("change", async (event) => {
    const selectedLanguage = event.target.value;
    updatePageLanguage(selectedLanguage, site);

    try {
      await fetch("/api/preferences/language", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ language: selectedLanguage })
      });
    } catch (error) {
      console.error("Unable to save language preference.", error);
    }
  });
}

profileTrigger.addEventListener("click", () => {
  const isOpen = !profileDropdown.classList.contains("hidden");
  profileDropdown.classList.toggle("hidden", isOpen);
  profileTrigger.setAttribute("aria-expanded", String(!isOpen));
});

document.addEventListener("click", (event) => {
  if (!profileMenu.contains(event.target)) {
    profileDropdown.classList.add("hidden");
    profileTrigger.setAttribute("aria-expanded", "false");
  }
});

loadDashboard().catch(() => {
  document.body.innerHTML =
    '<main style="padding: 48px; font-family: Avenir Next, Segoe UI, Trebuchet MS, sans-serif;"><h1>Unable to load the AgriCure dashboard.</h1><p>Please make sure the backend server is running and refresh the page.</p></main>';
});
