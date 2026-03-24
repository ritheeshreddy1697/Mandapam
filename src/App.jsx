import { startTransition, useEffect, useRef, useState } from "react";
import {
  PRIMARY_CROP_OPTIONS,
  VEGETABLE_CROP_OPTIONS,
  getCropProfile,
  isVegetableCropKey
} from "./lib/crops";
import {
  buildCropSpecificTableRows,
  buildCropSpecificRecommendations,
  buildEnvironmentSegments,
  buildNpkTrendSeries,
  buildPredictedCropSections,
  buildPredictedCropSuggestions,
  buildRealtimeCardSets,
  buildToolWorkspaceModel,
  buildWeatherSnapshot,
  buildWeatherTrendSeries,
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatTimeOnly,
  metricStatusTone,
  priorityTone,
  severityTone
} from "./lib/dashboard";

const NAV_ITEMS = [
  {
    path: "/",
    label: "Overview"
  },
  {
    path: "/recommendations",
    label: "Recommendations"
  },
  {
    path: "/sensor-data",
    label: "Sensor Data"
  }
];

const FALLBACK_UI_TEXT = {
  welcomePrefix: "Welcome,",
  farmProfileLabel: "Farm Profile",
  manageAccountLabel: "Manage account",
  recommendationTableTitle: "Nutrient Table",
  recommendationTableHeaders: {
    nutrient: "Nutrient",
    currentValue: "Current Value",
    thresholdValues: "Threshold Values",
    band: "Band"
  },
  recommendationColumnTitles: {
    organic: "Organic Fertilizers",
    inorganic: "Inorganic Fertilizers"
  },
  chat: {
    launcherTitle: "Ask AgriCure AI",
    launcherSubtitle: "Field copilot",
    eyebrow: "Field Assistant",
    title: "AgriCure AI",
    subtitle: "Ask about soil health, fertilizer choices, or sensor trends.",
    assistantLabel: "AgriCure AI",
    userLabel: "You",
    statusLabel: "Status",
    quickActions: {
      soilSummaryLabel: "Soil summary",
      soilSummaryPrompt: "Summarize the current soil health in simple words.",
      fertilizerHelpLabel: "Fertilizer help",
      fertilizerHelpPrompt: "What fertilizer should I prioritize right now?",
      sensorInsightsLabel: "Sensor insights",
      sensorInsightsPrompt: "What do the latest sensor readings suggest?"
    },
    inputPlaceholder: "Type your question...",
    sendLabel: "Send",
    micStartLabel: "Start voice",
    micStopLabel: "Stop voice",
    micUnsupportedLabel: "Voice input is not supported in this browser.",
    micListeningLabel: "Listening in selected language...",
    micIdleLabel: "Voice chat ready",
    welcomeMessage:
      "I can explain the dashboard, summarize soil health, and help interpret fertilizer or sensor data.",
    thinkingMessage: "Thinking through your farm data..."
  },
  recommendationWorkspace: {
    toolExplorerTitle: "Explore Smart Agriculture Tools",
    toolExplorerSubtitle:
      "Select a feature to continue with AI-powered farming solutions",
    cropSelection: {
      title: "Select Crop",
      subtitle:
        "Choose a crop to unlock fertilizer recommendation and the rest of the planning tools.",
      primaryPlaceholder: "Choose crop",
      vegetableOption: "Vegetables",
      vegetablePlaceholder: "Select vegetable",
      suggestedTitle: "Suggested Crops",
      suggestedSubtitle: "Predicted crops from the current soil and sensor values.",
      selectedTitle: "Selected Crop Economics",
      estimatedCostLabel: "Estimated cost to grow",
      marketPriceLabel: "Market price",
      familyLabel: "Crop family",
      predictedTag: "Predicted fit",
      unlockTitle: "Smart Agriculture Tools",
      unlockSubtitle:
        "Fertilizer recommendation and the rest of the tools unlock after crop selection.",
      lockedMessage:
        "Select any crop to unlock fertilizer recommendation and the remaining tools.",
      unlockedMessagePrefix: "Tools unlocked for",
      summaryPrefix: "Selected crop"
    },
    thresholdLabels: {
      low: "Low",
      medium: "Optimal",
      high: "High",
      optimal: "Optimal",
      target: "Target"
    },
    tools: [],
    fertilizer: {
      badge: "ML-Powered",
      title: "Fertilizer Recommendation",
      subtitle:
        "Select your farm and get ML-powered fertilizer recommendations based on real-time data",
      sections: {
        organicAlternativesTitle: "Organic Alternatives",
        organicAlternativesSubtitle:
          "Sustainable and eco-friendly fertilizer options",
        applicationTimingTitle: "Application Timing",
        applicationTimingSubtitle:
          "Field-stage guidance for primary, secondary, and organic applications",
        costAnalysisTitle: "Cost Analysis",
        costAnalysisSubtitle:
          "Estimated spend across chemical correction and organic soil support"
      }
    }
  },
  realtimePanel: {
    title: "Real Time Sensor Data",
    soilTitle: "Soil Sensor Snapshot",
    soilSubtitle: "Live nutrient and root-zone indicators from the latest report",
    environmentTitle: "Environment Readings",
    environmentSubtitle: "Current atmospheric conditions and field telemetry health",
    trendTitle: "Soil NPK Levels Trend",
    trendSubtitle: "Historical nutrient levels (last 24 hours)",
    distributionTitle: "Environmental Conditions Distribution",
    distributionSubtitle: "Current temperature, humidity and sunlight levels",
    lastUpdatedLabel: "Last Updated",
    sunlightLabel: "Sunlight Intensity",
    temperatureLabel: "Temperature",
    humidityLabel: "Humidity",
    status: {
      critical: "Critical",
      warning: "Warning",
      optimal: "Optimal"
    }
  },
  overviewWeather: {
    title: "Weather Data",
    subtitle:
      "Current field atmosphere snapshot with temperature, humidity and flux.",
    chartTitle: "Weather Trend",
    chartSubtitle:
      "Live temperature, humidity and flux trend ending at the current reading.",
    labels: {
      temperature: "Temperature",
      humidity: "Humidity",
      flux: "Flux"
    },
    units: {
      temperature: "°C",
      humidity: "%",
      flux: "lux"
    },
    rangeOptions: {
      "24h": "24hrs",
      "1w": "1 week",
      "1m": "1 month",
      "3m": "3 months",
      "6m": "6 months",
      "1y": "Year"
    }
  }
};

function getInitialPathname() {
  if (typeof window === "undefined") {
    return "/";
  }

  return normalizePathname(window.location.pathname);
}

function normalizePathname(pathname) {
  if (!pathname) {
    return "/";
  }

  const normalized =
    pathname === "/index.html" ? "/" : pathname.replace(/\/+$/, "") || "/";

  if (normalized === "/recommendations") {
    return "/recommendations";
  }

  if (normalized === "/sensor-data") {
    return "/sensor-data";
  }

  return "/";
}

function App() {
  const [site, setSite] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pathname, setPathname] = useState(getInitialPathname);
  const [weatherRange, setWeatherRange] = useState("24h");
  const [selectedCropKey, setSelectedCropKey] = useState("");
  const [activeToolKey, setActiveToolKey] = useState("fertilizer");
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [languageBusy, setLanguageBusy] = useState(false);
  const profileRef = useRef(null);

  const uiText = site?.uiText || FALLBACK_UI_TEXT;
  const selectedCrop = getCropProfile(selectedCropKey);
  const cropUi = uiText.recommendationWorkspace.cropSelection;
  const predictedCrops = dashboard ? buildPredictedCropSuggestions(dashboard) : [];
  const predictedCropSections = dashboard
    ? buildPredictedCropSections(dashboard)
    : { cereals: [], vegetable: null };
  const weatherSnapshot = dashboard ? buildWeatherSnapshot(dashboard, uiText) : [];
  const weatherTrend = dashboard
    ? buildWeatherTrendSeries(dashboard, uiText, weatherRange)
    : null;
  const toolModel = dashboard
    ? buildToolWorkspaceModel(activeToolKey, site, dashboard, selectedCropKey)
    : null;
  const cropSpecificRows = buildCropSpecificTableRows(
    dashboard?.recommendations?.tableRows || [],
    selectedCropKey,
    uiText
  );
  const cropRecommendations = dashboard
    ? buildCropSpecificRecommendations(dashboard, selectedCropKey)
    : { summary: "", organic: [], inorganic: [] };
  const realtimeCardSets = dashboard ? buildRealtimeCardSets(dashboard, uiText) : null;
  const realtimeTrend = dashboard ? buildNpkTrendSeries(dashboard) : null;
  const environmentSegments = realtimeCardSets
    ? buildEnvironmentSegments(realtimeCardSets, uiText)
    : [];

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    function handlePopState() {
      setPathname(normalizePathname(window.location.pathname));
      setProfileOpen(false);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = site?.selectedLanguage || "en";
  }, [site?.selectedLanguage]);

  useEffect(() => {
    const pageTitle =
      pathname === "/recommendations"
        ? "Recommendations"
        : pathname === "/sensor-data"
          ? "Sensor Data"
          : "Overview";

    document.title = `${site?.brand || "AgriCure"} | ${pageTitle}`;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
  }, [pathname, site?.brand]);

  useEffect(() => {
    if (!chatOpen || chatMessages.length > 0) {
      return;
    }

    setChatMessages([
      {
        role: "assistant",
        text: uiText.chat.welcomeMessage
      }
    ]);
  }, [chatMessages.length, chatOpen, uiText.chat.welcomeMessage]);

  useEffect(() => {
    if (pathname !== "/recommendations" || selectedCropKey || predictedCrops.length === 0) {
      return;
    }

    startTransition(() => {
      setSelectedCropKey(predictedCrops[0].key);
      setActiveToolKey("fertilizer");
    });
  }, [pathname, predictedCrops, selectedCropKey]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [siteResponse, dashboardResponse] = await Promise.all([
        fetch("/api/site-data"),
        fetch("/api/dashboard")
      ]);
      const sitePayload = await siteResponse.json();
      const dashboardPayload = await dashboardResponse.json();

      if (!siteResponse.ok) {
        throw new Error(sitePayload.error || "Unable to load site data.");
      }

      if (!dashboardResponse.ok) {
        throw new Error(dashboardPayload.error || "Unable to load dashboard data.");
      }

      setSite(sitePayload);
      setDashboard(dashboardPayload);
    } catch (loadError) {
      setError(loadError.message || "Unable to load the AgriCure dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLanguageChange(nextLanguage) {
    if (!nextLanguage) {
      return;
    }

    setLanguageBusy(true);

    try {
      const response = await fetch("/api/preferences/language", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ language: nextLanguage })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save language preference.");
      }

      setChatMessages([]);
      await loadDashboard();
    } catch (languageError) {
      setError(languageError.message || "Unable to update language preference.");
    } finally {
      setLanguageBusy(false);
    }
  }

  async function handleChatSubmit(promptText) {
    const message = String(promptText || chatInput).trim();

    if (!message || chatBusy) {
      return;
    }

    const nextHistory = [...chatMessages, { role: "user", text: message }];
    setChatInput("");
    setChatBusy(true);
    setChatMessages([
      ...nextHistory,
      {
        role: "status",
        text: uiText.chat.thinkingMessage
      }
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          history: nextHistory.filter((entry) => entry.role !== "status")
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate chatbot response.");
      }

      setChatMessages([
        ...nextHistory,
        {
          role: "assistant",
          text: payload.reply || "I could not generate a response right now."
        }
      ]);
    } catch (chatError) {
      setChatMessages([
        ...nextHistory,
        {
          role: "assistant",
          text:
            chatError.message ||
            "The assistant is unavailable right now. Please try again in a moment."
        }
      ]);
    } finally {
      setChatBusy(false);
    }
  }

  function navigateTo(nextPath) {
    const normalizedPath = normalizePathname(nextPath);

    if (normalizedPath === pathname) {
      return;
    }

    window.history.pushState({}, "", normalizedPath);
    setProfileOpen(false);

    startTransition(() => {
      setPathname(normalizedPath);
    });
  }

  function handlePrimaryCropChange(value) {
    if (!value) {
      setSelectedCropKey("");
      return;
    }

    if (value === "vegetables") {
      if (!selectedCropKey || !isVegetableCropKey(selectedCropKey)) {
        setSelectedCropKey("");
      }
      return;
    }

    setSelectedCropKey(value);
    setActiveToolKey("fertilizer");
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !site || !dashboard) {
    return <ErrorScreen error={error} onRetry={loadDashboard} />;
  }

  const activePrimaryValue = selectedCrop
    ? selectedCrop.family === "Vegetable"
      ? "vegetables"
      : selectedCropKey
    : "";

  return (
    <>
      <div className="page-shell relative min-h-screen overflow-x-clip px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="page-glow page-glow--one" />
        <div className="page-glow page-glow--two" />

        <header className="sticky top-0 z-40 -mx-4 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)]">
          <div className="nav-shell flex flex-wrap items-center justify-between gap-4 rounded-none border-x-0 border-t-0 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => navigateTo("/")}
              className="flex items-center gap-3 text-left"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 via-lime-400 to-cyan-300 text-base font-black text-slate-950 shadow-soft">
                A
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                  Startup-grade agronomy
                </p>
                <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                  AgriCure
                </h1>
              </div>
            </button>

            <nav className="hidden items-center gap-2 lg:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  href={item.path}
                  label={item.label}
                  isActive={pathname === item.path}
                  onNavigate={navigateTo}
                />
              ))}
            </nav>

            <div className="flex items-center gap-3 sm:gap-4">
              <label className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-soft sm:flex">
                <span className="font-semibold text-slate-500">Language</span>
                <select
                  value={site.selectedLanguage}
                  onChange={(event) => handleLanguageChange(event.target.value)}
                  disabled={languageBusy}
                  className="bg-transparent font-semibold text-slate-900 outline-none"
                >
                  {site.languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((current) => !current)}
                  className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/85 px-3 py-2 shadow-soft transition hover:-translate-y-0.5"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white">
                    {site.profile.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                      {uiText.welcomePrefix}
                    </p>
                    <p className="text-sm font-semibold text-slate-950">{site.profile.name}</p>
                  </div>
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 top-[calc(100%+14px)] z-20 w-80 rounded-[1.8rem] border border-white/80 bg-white/95 p-5 shadow-ambient backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                      {uiText.farmProfileLabel}
                    </p>
                    <h2 className="mt-3 font-display text-2xl font-bold text-slate-950">
                      {site.profile.farm}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">{site.profile.role}</p>
                    <div className="mt-4 grid gap-3 rounded-[1.5rem] bg-slate-50 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Language</span>
                        <span className="font-semibold text-slate-900">
                          {site.languages.find((language) => language.code === site.selectedLanguage)?.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Role</span>
                        <span className="font-semibold text-slate-900">{site.profile.role}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      {uiText.manageAccountLabel}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <nav className="mt-3 grid grid-cols-3 gap-2 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                href={item.path}
                label={item.label}
                isActive={pathname === item.path}
                onNavigate={navigateTo}
                compact
              />
            ))}
          </nav>
        </header>

        <main className="mx-auto mt-8 flex w-full max-w-[88rem] flex-col gap-10 px-0 sm:px-1 lg:px-1">
          {pathname === "/" ? (
            <OverviewPage
              site={site}
              dashboard={dashboard}
              uiText={uiText}
              weatherRange={weatherRange}
              setWeatherRange={setWeatherRange}
              weatherSnapshot={weatherSnapshot}
              weatherTrend={weatherTrend}
              onNavigate={navigateTo}
            />
          ) : null}

          {pathname === "/recommendations" ? (
            <RecommendationsPage
              dashboard={dashboard}
              uiText={uiText}
              cropUi={cropUi}
              realtimeCardSets={realtimeCardSets}
              predictedCropSections={predictedCropSections}
              cropRecommendations={cropRecommendations}
              activePrimaryValue={activePrimaryValue}
              selectedCrop={selectedCrop}
              selectedCropKey={selectedCropKey}
              predictedCrops={predictedCrops}
              activeToolKey={activeToolKey}
              cropSpecificRows={cropSpecificRows}
              toolModel={toolModel}
              onNavigate={navigateTo}
              onPrimaryCropChange={handlePrimaryCropChange}
              onVegetableCropChange={(cropKey) => {
                setSelectedCropKey(cropKey);
                setActiveToolKey("fertilizer");
              }}
              onSelectCrop={(cropKey) => {
                setSelectedCropKey(cropKey);
                setActiveToolKey("fertilizer");
              }}
              onSelectTool={setActiveToolKey}
            />
          ) : null}

          {pathname === "/sensor-data" ? (
            <SensorDataPage
              dashboard={dashboard}
              uiText={uiText}
              realtimeCardSets={realtimeCardSets}
              realtimeTrend={realtimeTrend}
              environmentSegments={environmentSegments}
              onNavigate={navigateTo}
            />
          ) : null}
        </main>
      </div>

      <ChatWidget
        isOpen={chatOpen}
        onToggle={() => setChatOpen((current) => !current)}
        uiText={uiText.chat}
        selectedLanguage={site.selectedLanguage}
        messages={chatMessages}
        input={chatInput}
        busy={chatBusy}
        onInputChange={setChatInput}
        onSubmit={handleChatSubmit}
      />
    </>
  );
}

function OverviewPage({
  site,
  dashboard,
  uiText,
  weatherRange,
  setWeatherRange,
  weatherSnapshot,
  weatherTrend,
  onNavigate
}) {
  const humidityMetric = dashboard.realtime.metrics[1]?.value || "N/A";
  const feedItems = dashboard.realtime.feed || [];

  return (
    <div className="page-transition grid gap-8">
      <PageHero
        eyebrow="Farm command"
        title={
          <>
            Startup-ready
            <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-cyan-500 bg-clip-text text-transparent">
              {" "}
              agricultural intelligence
            </span>{" "}
            for every field decision.
          </>
        }
        description={site.subtitle}
        primaryAction={{
          label: "Open Recommendations",
          onClick: () => onNavigate("/recommendations")
        }}
        secondaryAction={{
          label: "Open Sensor Data",
          onClick: () => onNavigate("/sensor-data")
        }}
        stats={[
          {
            label: "Soil health",
            value: `${dashboard.overview.soilHealth.score}%`,
            detail: dashboard.overview.status
          },
          {
            label: "Humidity",
            value: humidityMetric,
            detail: "Live atmosphere"
          },
          {
            label: "Last report",
            value: formatTimeOnly(dashboard.overview.timestamp),
            detail: formatDateTime(dashboard.overview.timestamp)
          }
        ]}
      />

      <Reveal delay={180}>
        <HealthSignalCard dashboard={dashboard} />
      </Reveal>

      <SurfaceCard
        eyebrow={dashboard.overview.title}
        title={dashboard.overview.soilHealth.label}
        subtitle={dashboard.overview.soilHealth.support}
        elevated
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {dashboard.overview.soilData.map((item, index) => (
            <Reveal key={item.label} delay={80 + index * 50}>
              <MetricTile
                label={item.label}
                value={`${item.value}${item.unit ? ` ${item.unit}` : ""}`}
                tone={item.tone}
              />
            </Reveal>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard
        eyebrow={uiText.overviewWeather.title}
        title="Climate snapshot"
        subtitle={uiText.overviewWeather.subtitle}
      >
        <div className="grid gap-4">
          {weatherSnapshot.map((item, index) => (
            <Reveal key={item.key} delay={120 + index * 60}>
              <MetricTile
                label={item.label}
                value={`${formatNumber(item.value, item.decimals)} ${item.unit}`}
                tone={item.tone}
              />
            </Reveal>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard
        eyebrow={uiText.overviewWeather.chartTitle}
        title="Weather trend"
        subtitle={uiText.overviewWeather.chartSubtitle}
        right={
          <select
            value={weatherRange}
            onChange={(event) => setWeatherRange(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none"
          >
            {Object.entries(uiText.overviewWeather.rangeOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        }
      >
        {weatherTrend ? <LineChart chart={weatherTrend} /> : null}
      </SurfaceCard>

      <SurfaceCard
        eyebrow="Navigation"
        title="Open a dedicated page for the next task"
        subtitle="Recommendations and sensor operations now live on their own focused pages."
      >
        <div className="grid gap-4">
          <LaunchCard
            label="Recommendations"
            title="Nutrient, crop, and planning decisions"
            description="Move into a dedicated workspace for crop fit, fertilizer planning, and operational guidance."
            actionLabel="Go to Recommendations"
            onClick={() => onNavigate("/recommendations")}
            tone="emerald"
          />
          <LaunchCard
            label="Sensor Data"
            title="Realtime telemetry and environmental monitoring"
            description="Open the sensor page to inspect NPK drift, environmental distribution, and live feed notes."
            actionLabel="Go to Sensor Data"
            onClick={() => onNavigate("/sensor-data")}
            tone="sky"
          />
        </div>
      </SurfaceCard>

      <SurfaceCard
        eyebrow="Field feed"
        title="Latest observations"
        subtitle="Short operational notes pulled from the current realtime stream."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {feedItems.map((item, index) => (
            <Reveal key={`${item.time}-${item.detail}`} delay={80 + index * 70}>
              <article className="hover-lift rounded-[1.8rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {item.time}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{item.detail}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

function RecommendationsPage({
  dashboard,
  uiText,
  cropUi,
  realtimeCardSets,
  predictedCropSections,
  cropRecommendations,
  activePrimaryValue,
  selectedCrop,
  selectedCropKey,
  predictedCrops,
  activeToolKey,
  cropSpecificRows,
  toolModel,
  onNavigate,
  onPrimaryCropChange,
  onVegetableCropChange,
  onSelectCrop,
  onSelectTool
}) {
  const topOrganic = cropRecommendations.organic[0];
  const topInorganic = cropRecommendations.inorganic[0];
  const fertilizerSections = uiText.recommendationWorkspace?.fertilizer?.sections || {};
  const cerealPredictions = predictedCropSections?.cereals || [];
  const vegetablePrediction = predictedCropSections?.vegetable || null;
  const organicAlternativeItems = buildOrganicAlternativeItems(
    cropRecommendations.organic,
    cropRecommendations.inorganic
  );
  const applicationTimingItems = buildApplicationTimingItems(
    cropRecommendations.organic,
    cropRecommendations.inorganic,
    selectedCrop
  );

  return (
    <div className="page-transition grid gap-8">
      <PageHero
        eyebrow="Recommendation studio"
        title={
          <>
            Dedicated planning for
            <span className="bg-gradient-to-r from-slate-950 via-emerald-600 to-cyan-500 bg-clip-text text-transparent">
              {" "}
              crop fit, fertilizer, and next actions
            </span>
            .
          </>
        }
        description={uiText.recommendationWorkspace.toolExplorerSubtitle}
        primaryAction={{
          label: "Open Sensor Data",
          onClick: () => onNavigate("/sensor-data")
        }}
        secondaryAction={{
          label: "Back to Overview",
          onClick: () => onNavigate("/")
        }}
        stats={[
          {
            label: "Selected crop",
            value: selectedCrop?.label || predictedCrops[0]?.label || "Pending",
            detail: cropUi.summaryPrefix
          },
          {
            label: "Top organic",
            value: topOrganic?.fertilizer || "No recommendation",
            detail: topOrganic?.priority || "Review data"
          },
          {
            label: "Top inorganic",
            value: topInorganic?.fertilizer || "No recommendation",
            detail: topInorganic?.priority || "Review data"
          }
        ]}
      />

      <section className="grid gap-6">
        <SurfaceCard
          eyebrow={uiText.recommendationWorkspace.toolExplorerTitle}
          title={cropUi.title}
          subtitle={cropUi.subtitle}
        >
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-semibold text-slate-600">Primary crop</span>
                <select
                  value={activePrimaryValue}
                  onChange={(event) => onPrimaryCropChange(event.target.value)}
                  className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                >
                  <option value="">{cropUi.primaryPlaceholder}</option>
                  {PRIMARY_CROP_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.key === "vegetables" ? cropUi.vegetableOption : item.label}
                    </option>
                  ))}
                </select>
              </label>

              {activePrimaryValue === "vegetables" ? (
                <label className="grid gap-2 text-sm">
                  <span className="font-semibold text-slate-600">Vegetable crop</span>
                  <select
                    value={selectedCropKey}
                    onChange={(event) => onVegetableCropChange(event.target.value)}
                    className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                  >
                    <option value="">{cropUi.vegetablePlaceholder}</option>
                    {VEGETABLE_CROP_OPTIONS.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="grid gap-5">
              <div className="grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Predicted cereals
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {cerealPredictions.map((crop, index) => (
                    <Reveal key={crop.key} delay={90 + index * 60}>
                      <CropPredictionCard
                        crop={crop}
                        selectedCropKey={selectedCropKey}
                        predictedTag={cropUi.predictedTag}
                        onSelectCrop={onSelectCrop}
                      />
                    </Reveal>
                  ))}
                </div>
              </div>

              {vegetablePrediction ? (
                <div className="grid gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Vegetable prediction
                  </p>
                  <Reveal delay={220}>
                    <CropPredictionCard
                      crop={vegetablePrediction}
                      selectedCropKey={selectedCropKey}
                      predictedTag={cropUi.predictedTag}
                      onSelectCrop={onSelectCrop}
                    />
                  </Reveal>
                </div>
              ) : null}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          eyebrow={cropUi.selectedTitle}
          title={selectedCrop ? selectedCrop.label : "Select a crop to unlock the workspace"}
          subtitle={
            selectedCrop
              ? `${cropUi.summaryPrefix}: ${selectedCrop.label}. ${cropRecommendations.summary}`
              : cropUi.lockedMessage
          }
        >
          {selectedCrop ? (
            <div className="grid gap-5">
              <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  {cropUi.familyLabel}
                </p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h3 className="font-display text-3xl font-black">{selectedCrop.label}</h3>
                    <p className="mt-2 text-sm text-white/75">{selectedCrop.family}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    {cropUi.unlockedMessagePrefix} {selectedCrop.label}
                  </span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <StatTile
                    label={cropUi.estimatedCostLabel}
                    value={`${formatCurrency(selectedCrop.estimatedGrowCost)} / acre`}
                    dark
                  />
                  <StatTile
                    label={cropUi.marketPriceLabel}
                    value={`${formatCurrency(selectedCrop.marketPrice)} ${selectedCrop.marketUnit}`}
                    dark
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[1.6rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    Active recommendation
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {
                      uiText.recommendationWorkspace.tools.find(
                        (tool) => tool.key === activeToolKey
                      )?.title
                    }
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {uiText.recommendationWorkspace.tools.map((tool) => (
                    <button
                      key={tool.key}
                      type="button"
                      onClick={() => onSelectTool(tool.key)}
                      className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                        activeToolKey === tool.key
                          ? "bg-gradient-to-r from-slate-950 via-emerald-700 to-cyan-600 text-white shadow-ambient ring-2 ring-emerald-200"
                          : "bg-slate-100 text-slate-700 hover:bg-white hover:text-slate-950"
                      }`}
                    >
                      {tool.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-display text-2xl font-bold text-slate-950">{cropUi.lockedMessage}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Use the field-fit crop shortlist to open the recommendation workspace instantly.
              </p>
              {predictedCrops[0] ? (
                <button
                  type="button"
                  onClick={() => onSelectCrop(predictedCrops[0].key)}
                  className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Use best-fit crop
                </button>
              ) : null}
            </div>
          )}
        </SurfaceCard>
      </section>

      {selectedCrop && toolModel ? (
        toolModel.mode === "fertilizer" ? (
          <div className="grid gap-6">
            <SurfaceCard
              eyebrow={toolModel.badge}
              title="Current sensor values"
              subtitle={toolModel.subtitle}
              elevated
            >
              <div className="grid gap-6">
                <div className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {uiText.recommendationTableTitle}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-5 py-3 font-semibold">
                            {uiText.recommendationTableHeaders.nutrient}
                          </th>
                          <th className="px-5 py-3 font-semibold">
                            {uiText.recommendationTableHeaders.currentValue}
                          </th>
                          <th className="px-5 py-3 font-semibold">
                            {uiText.recommendationTableHeaders.thresholdValues}
                          </th>
                          <th className="px-5 py-3 font-semibold">
                            {uiText.recommendationTableHeaders.band}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cropSpecificRows.map((row) => (
                          <tr key={row.nutrient} className="border-t border-slate-100">
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {row.nutrient}
                            </td>
                            <td className="px-5 py-4 text-slate-700">{row.currentValue}</td>
                            <td className="px-5 py-4 text-slate-600">{row.thresholdValues}</td>
                            <td className="px-5 py-4">
                              <span className={`status-pill status-pill--${bandTone(row.band)}`}>
                                {row.band}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <SensorValueSection
                  title={uiText.realtimePanel.soilTitle}
                  subtitle={uiText.realtimePanel.soilSubtitle}
                  items={realtimeCardSets?.soil || []}
                  statusMap={uiText.realtimePanel.status}
                />

                <SensorValueSection
                  title={uiText.realtimePanel.environmentTitle}
                  subtitle={uiText.realtimePanel.environmentSubtitle}
                  items={realtimeCardSets?.environment || []}
                  statusMap={uiText.realtimePanel.status}
                />
              </div>
            </SurfaceCard>

            <SurfaceCard
              eyebrow="Nutrient correction"
              title={uiText.recommendationColumnTitles.inorganic}
              subtitle="Primary chemical correction options for the selected crop."
            >
              <RecommendationColumn
                title={uiText.recommendationColumnTitles.inorganic}
                items={cropRecommendations.inorganic}
                boxed={false}
                showPricing={false}
                showCostStats={false}
              />
            </SurfaceCard>

            <SurfaceCard
              eyebrow="Soil support"
              title={uiText.recommendationColumnTitles.organic}
              subtitle="Organic fertilizer options that support nutrient recovery and soil structure."
            >
              <RecommendationColumn
                title={uiText.recommendationColumnTitles.organic}
                items={cropRecommendations.organic}
                boxed={false}
                showPricing={false}
                showCostStats={false}
              />
            </SurfaceCard>

            <SurfaceCard
              eyebrow={fertilizerSections.costAnalysisTitle || "Cost Analysis"}
              title={fertilizerSections.costAnalysisTitle || "Cost Analysis"}
              subtitle={
                fertilizerSections.costAnalysisSubtitle ||
                "Estimated spend across chemical correction and organic soil support"
              }
            >
              <div className="grid gap-6">
                <RecommendationCostGroup
                  title={uiText.recommendationColumnTitles.inorganic}
                  items={cropRecommendations.inorganic}
                />
                <RecommendationCostGroup
                  title={uiText.recommendationColumnTitles.organic}
                  items={cropRecommendations.organic}
                />
              </div>
            </SurfaceCard>

            <SurfaceCard
              eyebrow={fertilizerSections.organicAlternativesTitle || "Organic Alternatives"}
              title={fertilizerSections.organicAlternativesTitle || "Organic Alternatives"}
              subtitle={
                fertilizerSections.organicAlternativesSubtitle ||
                "Sustainable and eco-friendly fertilizer options"
              }
            >
              <div className="grid gap-4">
                {organicAlternativeItems.map((item, index) => (
                  <Reveal key={`${item.title}-${item.altFertilizer}`} delay={80 + index * 50}>
                    <article className="hover-lift rounded-[1.9rem] border border-slate-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                        {item.eyebrow}
                      </p>
                      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-2xl font-bold text-slate-950">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            {item.altFertilizer}
                          </p>
                        </div>
                        <span className="status-pill status-pill--emerald">{item.applicationRate}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                      <p className="mt-4 rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {item.note}
                      </p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard
              eyebrow={fertilizerSections.applicationTimingTitle || "Application Timing"}
              title={fertilizerSections.applicationTimingTitle || "Application Timing"}
              subtitle={
                fertilizerSections.applicationTimingSubtitle ||
                "Field-stage guidance for primary, secondary, and organic applications"
              }
            >
              <div className="grid gap-4">
                {applicationTimingItems.map((item, index) => (
                  <Reveal key={`${item.eyebrow}-${item.title}`} delay={80 + index * 50}>
                    <article className="hover-lift rounded-[1.9rem] border border-slate-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {item.eyebrow}
                      </p>
                      <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <MiniStat label="Inorganic" value={item.inorganicRate} />
                        <MiniStat label="Organic" value={item.organicRate} />
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </SurfaceCard>
          </div>
        ) : (
          <SurfaceCard
            eyebrow={toolModel.badge}
            title={toolModel.title}
            subtitle={toolModel.subtitle}
            elevated
          >
            <div className="grid gap-6">
              {toolModel.gallery?.length ? <PestGalleryPanel items={toolModel.gallery} /> : null}

              <div className="grid gap-4">
                {toolModel.cards.map((card, index) => (
                  <Reveal key={`${card.eyebrow}-${card.title}`} delay={80 + index * 60}>
                    <article
                      className={`hover-lift rounded-[1.9rem] border ${toneBorder(
                        card.tone
                      )} ${toneSurface(card.tone)} p-5`}
                    >
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.24em] ${toneText(
                          card.tone
                        )}`}
                      >
                        {card.eyebrow}
                      </p>
                      <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
                    </article>
                  </Reveal>
                ))}
              </div>

              <div className="grid gap-5">
                <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {toolModel.checklistTitle}
                  </p>
                  <div className="mt-4 grid gap-3">
                    {toolModel.checklist.map((item) => (
                      <div
                        key={item}
                        className="flex gap-3 rounded-[1.3rem] bg-slate-50 px-4 py-3 text-sm text-slate-700"
                      >
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-[1.9rem] bg-slate-950 p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                    Planner note
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/80">{toolModel.note}</p>
                </article>
              </div>
            </div>
          </SurfaceCard>
        )
      ) : null}
    </div>
  );
}

function SensorDataPage({
  dashboard,
  uiText,
  realtimeCardSets,
  realtimeTrend,
  environmentSegments,
  onNavigate
}) {
  const humidityMetric = dashboard.realtime.metrics[1]?.value || "N/A";
  const temperatureMetric = dashboard.realtime.metrics[2]?.value || "N/A";

  return (
    <div className="page-transition grid gap-8">
      <PageHero
        eyebrow="Sensor operations"
        title={
          <>
            A focused telemetry page for
            <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
              {" "}
              live field monitoring
            </span>
            .
          </>
        }
        description={uiText.realtimePanel.environmentSubtitle}
        primaryAction={{
          label: "Open Recommendations",
          onClick: () => onNavigate("/recommendations")
        }}
        secondaryAction={{
          label: "Back to Overview",
          onClick: () => onNavigate("/")
        }}
        stats={[
          {
            label: "Last sync",
            value: formatTimeOnly(dashboard.realtime.updatedAt),
            detail: uiText.realtimePanel.lastUpdatedLabel
          },
          {
            label: "Humidity",
            value: humidityMetric,
            detail: "Environment node"
          },
          {
            label: "Root zone",
            value: temperatureMetric,
            detail: "Live root temperature"
          }
        ]}
      />

      <section className="grid gap-6">
        <SurfaceCard
          eyebrow={uiText.realtimePanel.soilTitle}
          title={uiText.realtimePanel.title}
          subtitle={uiText.realtimePanel.soilSubtitle}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {realtimeCardSets.soil.map((item, index) => (
              <Reveal key={item.label} delay={80 + index * 50}>
                <RealtimeMetricCard
                  item={item}
                  statusLabel={uiText.realtimePanel.status[item.status]}
                />
              </Reveal>
            ))}
          </div>
        </SurfaceCard>
      </section>

      <SurfaceCard
        eyebrow={uiText.realtimePanel.environmentTitle}
        title="Environment readings"
        subtitle={uiText.realtimePanel.environmentSubtitle}
      >
        <div className="grid gap-4">
          {realtimeCardSets.environment.map((item, index) => (
            <Reveal key={item.label} delay={100 + index * 60}>
              <RealtimeMetricCard
                item={item}
                statusLabel={uiText.realtimePanel.status[item.status]}
              />
            </Reveal>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard
        eyebrow={uiText.realtimePanel.trendTitle}
        title="NPK movement"
        subtitle={uiText.realtimePanel.trendSubtitle}
      >
        {realtimeTrend ? <LineChart chart={realtimeTrend} /> : null}
      </SurfaceCard>

      <SurfaceCard
        eyebrow={uiText.realtimePanel.distributionTitle}
        title="Environmental balance"
        subtitle={uiText.realtimePanel.distributionSubtitle}
      >
        <DonutChart segments={environmentSegments} />
      </SurfaceCard>

      <SurfaceCard
        eyebrow="Realtime feed"
        title="Operational notes"
        subtitle="A dedicated page for the sensor stream and the latest field signals."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {dashboard.realtime.feed.map((item, index) => (
            <Reveal key={`${item.time}-${item.detail}`} delay={100 + index * 70}>
              <article className="hover-lift rounded-[1.8rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {item.time}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{item.detail}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-soil-sand px-6">
      <div className="glass-panel w-full max-w-xl p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
          AgriCure
        </p>
        <h1 className="mt-4 font-display text-4xl font-black text-slate-950">
          Booting the field workspace
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Loading soil context, recommendations, and live telemetry.
        </p>
        <div className="mx-auto mt-6 h-3 w-full max-w-sm overflow-hidden rounded-full bg-slate-200">
          <div className="loading-bar h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-cyan-300" />
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-soil-sand px-6">
      <div className="glass-panel w-full max-w-xl p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
          AgriCure
        </p>
        <h1 className="mt-4 font-display text-4xl font-black text-slate-950">
          Unable to load the dashboard
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {error || "Please make sure the backend server is running and try again."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function NavLink({ href, label, isActive, onNavigate, compact = false }) {
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(href);
      }}
      className={`nav-link ${compact ? "justify-center text-center" : ""} ${
        isActive ? "nav-link--active" : ""
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </a>
  );
}

function PageHero({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  stats
}) {
  return (
    <section className="hero-shell relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(243,247,241,0.94))] px-6 py-8 shadow-ambient sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="hero-orb hero-orb--green" />
      <div className="hero-orb hero-orb--blue" />
      <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
        <div className="max-w-4xl">
          <Reveal>
            <p className="hero-badge">{eyebrow}</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mt-4 max-w-4xl font-display text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl xl:text-6xl">
              {title}
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {description}
            </p>
          </Reveal>
          <Reveal delay={320}>
            <div className="mt-7 flex flex-wrap gap-3">
              {primaryAction ? (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  {primaryAction.label}
                </button>
              ) : null}
              {secondaryAction ? (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className="rounded-full border border-slate-200 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  {secondaryAction.label}
                </button>
              ) : null}
            </div>
          </Reveal>
        </div>

        <div className="grid gap-4">
          {stats.map((item, index) => (
            <Reveal key={item.label} delay={140 + index * 90}>
              <article className="hover-lift rounded-[1.8rem] border border-white/80 bg-white/88 p-5 shadow-soft backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {item.label}
                </p>
                <h3 className="mt-3 font-display text-3xl font-black tracking-tight text-slate-950">
                  {item.value}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SurfaceCard({ eyebrow, title, subtitle, right, children, elevated = false }) {
  return (
    <section className={`glass-panel p-6 sm:p-7 ${elevated ? "shadow-ambient" : ""}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-950">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function HealthSignalCard({ dashboard }) {
  return (
    <article className="hover-lift overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-ambient">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
            Soil status
          </p>
          <h3 className="mt-3 font-display text-4xl font-black">
            {dashboard.overview.soilHealth.score}%
          </h3>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/78">
            {dashboard.overview.soilHealth.message}
          </p>
        </div>
        <span className={`status-pill status-pill--${severityTone(dashboard.overview.status)}`}>
          {dashboard.overview.status}
        </span>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-3 rounded-full bg-white/12">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-lime-300 to-cyan-300"
            style={{ width: `${dashboard.overview.soilHealth.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-4 text-sm text-white/74">
          <span>{dashboard.overview.soilHealth.support}</span>
          <span>{formatDateTime(dashboard.overview.timestamp)}</span>
        </div>
      </div>
    </article>
  );
}

function MetricTile({ label, value, tone }) {
  return (
    <article className={`hover-lift rounded-[1.7rem] border p-5 ${toneBorder(tone)} ${toneSurface(tone)}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${toneText(tone)}`}>
        {label}
      </p>
      <h3 className="mt-3 font-display text-3xl font-black tracking-tight text-slate-950">
        {value}
      </h3>
    </article>
  );
}

function StatTile({ label, value, dark = false }) {
  return (
    <article
      className={`rounded-[1.5rem] p-4 ${
        dark ? "bg-white/8 ring-1 ring-white/10" : "border border-slate-200 bg-white"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${dark ? "text-white/55" : "text-slate-500"}`}>
        {label}
      </p>
      <h3 className={`mt-3 text-lg font-bold ${dark ? "text-white" : "text-slate-950"}`}>
        {value}
      </h3>
    </article>
  );
}

function LaunchCard({ label, title, description, actionLabel, onClick, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`hover-lift flex w-full flex-col gap-4 rounded-[1.9rem] border p-5 text-left ${toneBorder(
        tone
      )} ${toneSurface(tone)}`}
    >
      <div>
        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${toneText(tone)}`}>
          {label}
        </p>
        <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">{title}</h3>
      </div>
      <p className="text-sm leading-7 text-slate-600">{description}</p>
      <span className="text-sm font-semibold text-slate-950">{actionLabel}</span>
    </button>
  );
}

function CropPredictionCard({ crop, selectedCropKey, predictedTag, onSelectCrop }) {
  const isSelected = selectedCropKey === crop.key;

  return (
    <button
      type="button"
      onClick={() => onSelectCrop(crop.key)}
      className={`hover-lift rounded-[1.8rem] border p-5 text-left transition ${
        isSelected
          ? "border-slate-950 bg-slate-950 text-white shadow-soft"
          : "border-white bg-white/90 hover:border-emerald-200 hover:bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.24em] ${
              isSelected ? "text-white/60" : "text-slate-500"
            }`}
          >
            {predictedTag} • {crop.family}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold">{crop.label}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            isSelected ? "bg-white/10 text-white" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {formatCurrency(crop.marketPrice)}
        </span>
      </div>
      <p className={`mt-3 text-sm leading-7 ${isSelected ? "text-white/78" : "text-slate-600"}`}>
        {crop.reason}
      </p>
    </button>
  );
}

function PestGalleryPanel({ items }) {
  return (
    <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        Pest gallery
      </p>
      <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">
        Common pests and disease references
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Web-loaded visual references for different pests or diseases linked to the selected crop.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={`${item.name}-${item.query}`} delay={60 + index * 50}>
            <PestPhotoCard item={item} />
          </Reveal>
        ))}
      </div>
    </article>
  );
}

function PestPhotoCard({ item }) {
  const [photoState, setPhotoState] = useState({
    loading: true,
    imageUrl: "",
    pageUrl: ""
  });

  useEffect(() => {
    let ignore = false;

    async function loadPestPhoto() {
      if (!item?.query) {
        setPhotoState({
          loading: false,
          imageUrl: "",
          pageUrl: ""
        });
        return;
      }

      setPhotoState({
        loading: true,
        imageUrl: "",
        pageUrl: ""
      });

      try {
        const response = await fetch(
          `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(
            item.query
          )}&limit=1`,
          {
            headers: {
              Accept: "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load pest photo.");
        }

        const payload = await response.json();
        const page = payload?.pages?.[0];
        const rawImageUrl = page?.thumbnail?.url || "";
        const imageUrl = rawImageUrl.startsWith("//") ? `https:${rawImageUrl}` : rawImageUrl;
        const pageUrl = page?.key ? `https://en.wikipedia.org/wiki/${page.key}` : "";

        if (!ignore) {
          setPhotoState({
            loading: false,
            imageUrl,
            pageUrl
          });
        }
      } catch {
        if (!ignore) {
          setPhotoState({
            loading: false,
            imageUrl: "",
            pageUrl: ""
          });
        }
      }
    }

    loadPestPhoto();

    return () => {
      ignore = true;
    };
  }, [item?.query]);

  return (
    <article className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-slate-50">
      <div className="group relative aspect-[4/5] bg-slate-100">
        {photoState.imageUrl ? (
          <img
            src={photoState.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : photoState.loading ? (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50 to-cyan-50 px-4 text-center">
            <p className="text-sm font-semibold text-slate-500">Loading pest photo...</p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50 to-cyan-50 px-4 text-center">
            <p className="text-sm font-semibold text-slate-500">Photo unavailable right now.</p>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Pest
          </p>
          <h4 className="mt-2 font-display text-2xl font-bold text-white">{item.name}</h4>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm leading-7 text-slate-600">
          Search topic: <span className="font-semibold text-slate-900">{item.query}</span>
        </p>
        {photoState.pageUrl ? (
          <a
            href={photoState.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Source: Wikipedia
          </a>
        ) : null}
      </div>
    </article>
  );
}

function SensorValueSection({ title, subtitle, items, statusMap }) {
  return (
    <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={`${title}-${item.label}`} delay={80 + index * 50}>
            <RealtimeMetricCard item={item} statusLabel={statusMap?.[item.status] || item.status} />
          </Reveal>
        ))}
      </div>
    </article>
  );
}

function RecommendationColumn({
  title,
  items = [],
  boxed = true,
  showPricing = true,
  showCostStats = true
}) {
  return (
    <article className={boxed ? "rounded-[1.9rem] border border-slate-200 bg-white p-5" : ""}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
      <div className="mt-4 grid gap-4">
        {items.map((item) => (
          <article key={item.title} className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-700">{item.fertilizer}</p>
              </div>
              <span className={`status-pill status-pill--${priorityTone(item.priority)}`}>
                {item.priority}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniStat label="Content" value={item.nutrientContent} />
              <MiniStat label="Rate" value={item.applicationRate} />
              {showPricing ? <MiniStat label="Price range" value={item.priceRange} /> : null}
              {showCostStats ? <MiniStat label="Cost / acre" value={item.costSummary.estimated} /> : null}
              {showCostStats ? <MiniStat label="Total plan" value={item.costSummary.total} /> : null}
            </div>
            <p className="mt-4 rounded-[1.2rem] bg-white px-4 py-3 text-sm text-slate-600">
              {item.note}
            </p>
          </article>
        ))}
      </div>
    </article>
  );
}

function RecommendationCostGroup({ title, items = [] }) {
  return (
    <div className="grid gap-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
      {items.map((item) => (
        <article key={`${title}-${item.title}`} className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-700">{item.fertilizer}</p>
            </div>
            <span className={`status-pill status-pill--${priorityTone(item.priority)}`}>
              {item.priority}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Price range" value={item.priceRange} />
            <MiniStat label="Cost / acre" value={item.costSummary.estimated} />
            <MiniStat label="Total plan" value={item.costSummary.total} />
          </div>
        </article>
      ))}
    </div>
  );
}

const FERTILIZER_FOCUS_LABELS = ["Nitrogen", "Phosphorus", "Potassium"];

function isPausedRecommendation(item) {
  const fertilizer = String(item?.fertilizer || "").toLowerCase();
  return fertilizer.startsWith("no ") || String(item?.applicationRate || "").startsWith("0 ");
}

function buildOrganicAlternativeItems(organicItems = [], inorganicItems = []) {
  return organicItems.map((item, index) => ({
    eyebrow: `${FERTILIZER_FOCUS_LABELS[index] || `Plan ${index + 1}`} support`,
    title: item.title,
    altFertilizer: `Alternative to ${inorganicItems[index]?.fertilizer || "synthetic fertilizer"}`,
    description: item.detail,
    note: item.note,
    applicationRate: item.applicationRate
  }));
}

function buildApplicationTimingItems(organicItems = [], inorganicItems = [], selectedCrop) {
  const cropLabel = selectedCrop?.label || "the selected crop";

  return inorganicItems.map((item, index) => {
    const organicItem = organicItems[index];
    const bothPaused = isPausedRecommendation(item) && isPausedRecommendation(organicItem);
    const urgentInput =
      item?.priority === "Urgent" ||
      item?.priority === "High" ||
      organicItem?.priority === "High";

    if (bothPaused) {
      return {
        eyebrow: FERTILIZER_FOCUS_LABELS[index] || `Plan ${index + 1}`,
        title: "No immediate application needed",
        description: `Current ${FERTILIZER_FOCUS_LABELS[index]?.toLowerCase() || "nutrient"} levels are already workable for ${cropLabel}. Recheck after the next soil report before applying a fresh dose.`,
        inorganicRate: item?.applicationRate || "0 kg / acre",
        organicRate: organicItem?.applicationRate || "0 kg / acre"
      };
    }

    if (urgentInput) {
      return {
        eyebrow: FERTILIZER_FOCUS_LABELS[index] || `Plan ${index + 1}`,
        title: "Apply in the next 3 to 5 days",
        description: `Start the ${item?.fertilizer || "recommended inorganic fertilizer"} dose during field preparation or before the next irrigation cycle for ${cropLabel}. Add the organic option as follow-up soil support if you want a slower-release backup.`,
        inorganicRate: item?.applicationRate || "Review plan",
        organicRate: organicItem?.applicationRate || "Review plan"
      };
    }

    return {
      eyebrow: FERTILIZER_FOCUS_LABELS[index] || `Plan ${index + 1}`,
      title: "Use in the next scheduled nutrient round",
      description: `A split application is enough for ${cropLabel}. Align fertilizer use with your next irrigation window and avoid stacking both inorganic and organic doses on the same day unless the field needs fast correction.`,
      inorganicRate: item?.applicationRate || "Review plan",
      organicRate: organicItem?.applicationRate || "Review plan"
    };
  });
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-[1.2rem] bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function RealtimeMetricCard({ item, statusLabel }) {
  return (
    <article className="hover-lift rounded-[1.8rem] border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {item.label}
        </p>
        <span className={`status-pill status-pill--${metricStatusTone(item.status)}`}>
          {statusLabel}
        </span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <strong className="font-display text-3xl font-black tracking-tight text-slate-950">
          {item.value}
        </strong>
        <span className="pb-1 text-sm text-slate-500">{item.unit}</span>
      </div>
      <div className="mt-4 h-3 rounded-full bg-slate-100">
        <div
          className={`h-3 rounded-full realtime-fill realtime-fill--${metricStatusTone(item.status)}`}
          style={{ width: `${item.progress}%` }}
        />
      </div>
    </article>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((sum, segment) => sum + segment.chartValue, 0) || 1;
  let cursor = 0;
  const gradientStops = segments
    .map((segment) => {
      const start = (cursor / total) * 100;
      cursor += segment.chartValue;
      const end = (cursor / total) * 100;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
      <div className="mx-auto grid h-56 w-56 place-items-center rounded-full bg-slate-100 p-5 shadow-inner">
        <div
          className="grid h-full w-full place-items-center rounded-full"
          style={{ backgroundImage: `conic-gradient(${gradientStops})` }}
        >
          <div className="grid h-28 w-28 place-items-center rounded-full bg-white shadow-soft">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Live mix
              </p>
              <p className="mt-2 font-display text-3xl font-black text-slate-950">
                {segments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm text-slate-700"
          >
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span>{segment.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ chart }) {
  const width = 840;
  const height = 320;
  const padding = {
    top: 20,
    right: 24,
    bottom: 44,
    left: 44
  };
  const pointCount = Math.max(chart.labels.length, 2);
  const allValues = chart.series.flatMap((item) => item.values);
  const maxValue = Math.max(1, ...allValues);
  const minValue = Math.min(0, ...allValues);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xStep = chartWidth / Math.max(pointCount - 1, 1);

  function toX(index) {
    return padding.left + xStep * index;
  }

  function toY(value) {
    return (
      padding.top +
      chartHeight -
      ((value - minValue) / Math.max(maxValue - minValue, 1)) * chartHeight
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full">
        {Array.from({ length: 4 }).map((_, index) => {
          const value = minValue + ((maxValue - minValue) / 4) * (index + 1);
          const y = toY(value);

          return (
            <g key={value}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(148, 163, 184, 0.18)"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[11px]"
              >
                {formatNumber(value, 0)}
              </text>
            </g>
          );
        })}

        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="rgba(15, 23, 42, 0.18)"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="rgba(15, 23, 42, 0.18)"
        />

        {chart.series.map((series) => {
          const points = series.values
            .map((value, index) => `${toX(index)},${toY(value)}`)
            .join(" ");

          return (
            <g key={series.label}>
              <polyline
                fill="none"
                stroke={series.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {series.values.map((value, index) => (
                <circle
                  key={`${series.label}-${chart.labels[index]}`}
                  cx={toX(index)}
                  cy={toY(value)}
                  r="4.5"
                  fill="#fff"
                  stroke={series.color}
                  strokeWidth="2.5"
                />
              ))}
            </g>
          );
        })}

        {chart.labels.map((label, index) => (
          <text
            key={label}
            x={toX(index)}
            y={height - 16}
            textAnchor="middle"
            className="fill-slate-400 text-[11px]"
          >
            {label}
          </text>
        ))}
      </svg>

      <div className="mt-4 flex flex-wrap gap-3">
        {chart.series.map((series) => (
          <div
            key={series.label}
            className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm text-slate-700"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
            <span>{series.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatWidget({
  isOpen,
  onToggle,
  uiText,
  selectedLanguage,
  messages,
  input,
  busy,
  onInputChange,
  onSubmit
}) {
  const recognitionRef = useRef(null);
  const pendingTranscriptRef = useRef("");
  const submitOnEndRef = useRef(false);
  const onInputChangeRef = useRef(onInputChange);
  const onSubmitRef = useRef(onSubmit);
  const [micAvailable, setMicAvailable] = useState(false);
  const [micListening, setMicListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(uiText.micIdleLabel || "Voice chat ready");
  const quickActions = [
    {
      label: uiText.quickActions.soilSummaryLabel,
      prompt: uiText.quickActions.soilSummaryPrompt
    },
    {
      label: uiText.quickActions.fertilizerHelpLabel,
      prompt: uiText.quickActions.fertilizerHelpPrompt
    },
    {
      label: uiText.quickActions.sensorInsightsLabel,
      prompt: uiText.quickActions.sensorInsightsPrompt
    }
  ];

  useEffect(() => {
    onInputChangeRef.current = onInputChange;
    onSubmitRef.current = onSubmit;
  }, [onInputChange, onSubmit]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicAvailable(false);
      setVoiceStatus(uiText.micUnsupportedLabel || "Voice input is not supported in this browser.");
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = getSpeechLocale(selectedLanguage);

    recognition.onstart = () => {
      setMicListening(true);
      setVoiceStatus(uiText.micListeningLabel || "Listening in selected language...");
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();

      pendingTranscriptRef.current = transcript;
      submitOnEndRef.current = Boolean(
        transcript && event.results[event.results.length - 1]?.isFinal
      );

      onInputChangeRef.current(transcript);
    };

    recognition.onerror = () => {
      setMicListening(false);
      setVoiceStatus(uiText.micIdleLabel || "Voice chat ready");
    };

    recognition.onend = () => {
      setMicListening(false);
      setVoiceStatus(uiText.micIdleLabel || "Voice chat ready");

      if (submitOnEndRef.current && pendingTranscriptRef.current.trim()) {
        const spokenPrompt = pendingTranscriptRef.current.trim();
        pendingTranscriptRef.current = "";
        submitOnEndRef.current = false;
        onSubmitRef.current(spokenPrompt);
      }
    };

    recognitionRef.current = recognition;
    setMicAvailable(true);
    setVoiceStatus(uiText.micIdleLabel || "Voice chat ready");

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      try {
        recognition.stop();
      } catch {
        // Ignore stop errors during cleanup.
      }
    };
  }, [
    selectedLanguage,
    uiText.micIdleLabel,
    uiText.micListeningLabel,
    uiText.micUnsupportedLabel
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return undefined;
    }

    const latestMessage = messages[messages.length - 1];

    if (!latestMessage || latestMessage.role !== "assistant" || micListening) {
      return undefined;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(latestMessage.text);
    const speechLocale = getSpeechLocale(selectedLanguage);
    utterance.lang = speechLocale;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(speechLocale.toLowerCase().split("-")[0])
    );

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [messages, micListening, selectedLanguage]);

  function handleMicToggle() {
    if (!micAvailable || !recognitionRef.current || busy) {
      return;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (micListening) {
      submitOnEndRef.current = Boolean(pendingTranscriptRef.current.trim());

      try {
        recognitionRef.current.stop();
      } catch {
        setMicListening(false);
      }

      return;
    }

    pendingTranscriptRef.current = "";
    submitOnEndRef.current = false;

    try {
      recognitionRef.current.lang = getSpeechLocale(selectedLanguage);
      recognitionRef.current.start();
    } catch {
      setVoiceStatus(uiText.micUnsupportedLabel || "Voice input is not supported in this browser.");
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="glass-panel w-[min(430px,calc(100vw-2.5rem))] overflow-hidden">
          <div className="border-b border-white/60 bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              {uiText.eyebrow}
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold">{uiText.title}</h2>
                <p className="mt-1 text-sm text-white/75">{uiText.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>

          <div className="max-h-[28rem] space-y-3 overflow-y-auto bg-white/75 px-5 py-5">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => onSubmit(action.prompt)}
                  className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`rounded-[1.5rem] px-4 py-3 ${
                  message.role === "user"
                    ? "ml-auto max-w-[88%] bg-slate-950 text-white"
                    : message.role === "status"
                      ? "max-w-[88%] bg-amber-50 text-amber-900"
                      : "max-w-[88%] bg-white text-slate-900 shadow-soft"
                }`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                    message.role === "user" ? "text-white/60" : "text-slate-400"
                  }`}
                >
                  {message.role === "user"
                    ? uiText.userLabel
                    : message.role === "status"
                      ? uiText.statusLabel
                      : uiText.assistantLabel}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.text}</p>
              </article>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
            className="border-t border-white/60 bg-white/85 p-4"
          >
            <textarea
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={uiText.inputPlaceholder}
              rows={3}
              className="w-full resize-none rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="grid gap-1">
                <p className="text-xs text-slate-500">{uiText.launcherSubtitle}</p>
                <p className={`text-xs font-semibold ${micListening ? "text-emerald-600" : "text-slate-500"}`}>
                  {voiceStatus}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMicToggle}
                  disabled={!micAvailable || busy}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                    micListening
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  {micListening
                    ? uiText.micStopLabel || "Stop voice"
                    : uiText.micStartLabel || "Start voice"}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "Sending..." : uiText.sendLabel}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        className="group overflow-hidden rounded-[1.7rem] bg-slate-950 px-5 py-4 text-left text-white shadow-ambient transition hover:-translate-y-0.5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
          {uiText.launcherSubtitle}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
            <span className="text-lg">AI</span>
          </div>
          <div>
            <p className="font-display text-lg font-bold">{uiText.launcherTitle}</p>
            <p className="text-sm text-white/70">Open assistant</p>
          </div>
        </div>
      </button>
    </div>
  );
}

function getSpeechLocale(languageCode) {
  const byLanguage = {
    en: "en-IN",
    hi: "hi-IN",
    te: "te-IN"
  };

  return byLanguage[languageCode] || "en-IN";
}

function Reveal({ children, delay = 0 }) {
  return (
    <div className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function bandTone(label) {
  const value = String(label || "").toLowerCase();

  if (value.includes("optimal")) {
    return "emerald";
  }

  if (value.includes("low")) {
    return "amber";
  }

  if (value.includes("high")) {
    return "rose";
  }

  if (value.includes("medium") || value.includes("moderate")) {
    return "amber";
  }

  if (value.includes("reference")) {
    return "slate";
  }

  return severityTone(label);
}

function toneSurface(tone) {
  const map = {
    green: "bg-emerald-50",
    emerald: "bg-emerald-50",
    blue: "bg-sky-50",
    sky: "bg-sky-50",
    teal: "bg-teal-50",
    amber: "bg-amber-50",
    orange: "bg-orange-50",
    rose: "bg-rose-50",
    violet: "bg-violet-50",
    indigo: "bg-indigo-50",
    purple: "bg-fuchsia-50",
    cyan: "bg-cyan-50"
  };

  return map[tone] || "bg-slate-50";
}

function toneBorder(tone) {
  const map = {
    green: "border-emerald-200",
    emerald: "border-emerald-200",
    blue: "border-sky-200",
    sky: "border-sky-200",
    teal: "border-teal-200",
    amber: "border-amber-200",
    orange: "border-orange-200",
    rose: "border-rose-200",
    violet: "border-violet-200",
    indigo: "border-indigo-200",
    purple: "border-fuchsia-200",
    cyan: "border-cyan-200"
  };

  return map[tone] || "border-slate-200";
}

function toneText(tone) {
  const map = {
    green: "text-emerald-700",
    emerald: "text-emerald-700",
    blue: "text-sky-700",
    sky: "text-sky-700",
    teal: "text-teal-700",
    amber: "text-amber-700",
    orange: "text-orange-700",
    rose: "text-rose-700",
    violet: "text-violet-700",
    indigo: "text-indigo-700",
    purple: "text-fuchsia-700",
    cyan: "text-cyan-700"
  };

  return map[tone] || "text-slate-700";
}

export default App;
