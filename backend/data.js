const defaultUiText = {
  welcomePrefix: "Welcome,",
  farmProfileLabel: "Farm Profile",
  manageAccountLabel: "Profile",
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
    launcherSubtitle: "Gemini-powered help",
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
      primaryLabel: "Select crop option",
      primaryPlaceholder: "Choose crop",
      vegetableOption: "Vegetables",
      vegetableLabel: "Choose vegetable",
      vegetablePlaceholder: "Select vegetable",
      suggestedTitle: "Suggested Crops",
      suggestedSubtitle: "Predicted crops from the current soil and sensor values.",
      selectedTitle: "Selected Crop Economics",
      selectedSubtitle: "Estimated grow cost and market price for the chosen crop.",
      estimatedCostLabel: "Estimated cost to grow",
      marketPriceLabel: "Market price",
      familyLabel: "Crop family",
      predictedTag: "Predicted fit",
      selectAction: "Select crop",
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
      medium: "Medium",
      high: "High",
      optimal: "Optimal",
      target: "Target"
    },
    tools: [
      {
        key: "fertilizer",
        badge: "ML-BASED",
        title: "Fertilizer Recommendation",
        description:
          "Get ML-powered fertilizer recommendations for optimal crop growth",
        tone: "green",
        interactive: true
      },
      {
        key: "irrigation",
        badge: "ML-BASED",
        title: "Irrigation Prediction",
        description: "Smart water management with AI-based irrigation predictions",
        tone: "blue",
        interactive: false
      },
      {
        key: "crop",
        badge: "ML-BASED",
        title: "Crop Prediction",
        description: "Discover the best crops to grow based on soil and climate",
        tone: "amber",
        interactive: false
      },
      {
        key: "pesticide",
        badge: "GUIDE",
        title: "Pesticide & Insecticide",
        description: "Comprehensive protection guide for pest and disease control",
        tone: "rose",
        interactive: false
      },
      {
        key: "price",
        badge: "LIVE",
        title: "Crop Price Prediction",
        description: "Real-time market insights and price predictions",
        tone: "violet",
        interactive: false
      },
      {
        key: "seed",
        badge: "ML-BASED",
        title: "Seed Variety Recommendation",
        description: "Choose the best seed varieties for maximum yield",
        tone: "teal",
        interactive: false
      },
      {
        key: "schemes",
        badge: "INFO",
        title: "Govt Schemes",
        description: "Latest government schemes and subsidies for farmers",
        tone: "indigo",
        interactive: false
      },
      {
        key: "illegal",
        badge: "VERIFY",
        title: "Illegal Fertilizers Check",
        description: "Verify and check for counterfeit fertilizer products",
        tone: "orange",
        interactive: false
      }
    ],
    fertilizer: {
      backLabel: "Back",
      badge: "ML-Powered",
      title: "Fertilizer Recommendation",
      subtitle:
        "Select your farm and get ML-powered fertilizer recommendations based on real-time data",
      autofillLabel: "Auto-fill with Sensor Data",
      farmSelectionTitle: "Farm Selection",
      farmSelectLabel: "Select Farm",
      addFarmLabel: "Add Farm",
      soilChemistryTitle: "Soil Chemistry",
      sections: {
        organicAlternativesTitle: "Organic Alternatives",
        organicAlternativesSubtitle:
          "Sustainable and eco-friendly fertilizer options",
        applicationTimingTitle: "Application Timing",
        applicationTimingSubtitle:
          "Field-stage guidance for primary, secondary, and organic applications",
        costAnalysisTitle: "Cost Analysis",
        costAnalysisSubtitle:
          "Estimated spend across chemical correction and organic soil support",
        npkRatioLabel: "NPK Ratio:",
        providesLabel: "Provides:",
        whyUseLabel: "Why use this:",
        chemicalLabel: "Chemical Fertilizers",
        organicLabel: "Organic Alternatives",
        fieldAreaLabel: "Field area"
      },
      fieldLabels: {
        nitrogen: "Nitrogen (mg/kg)",
        phosphorus: "Phosphorus (mg/kg)",
        potassium: "Potassium (mg/kg)",
        ph: "Soil pH",
        moisture: "Soil Moisture (%)",
        temperature: "Soil Temperature (C)",
        conductivity: "Electrical Conductivity (uS/cm)"
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

const defaultSiteData = {
  brand: "AgriCure",
  title: "Dashboard",
  subtitle:
    "Comprehensive soil analysis and fertilizer recommendations powered by real-time data and ML",
  selectedLanguage: "en",
  languages: [
    { code: "en", label: "English", sarvamCode: "en-IN" },
    { code: "hi", label: "हिंदी", sarvamCode: "hi-IN" },
    { code: "te", label: "తెలుగు", sarvamCode: "te-IN" }
  ],
  profile: {
    name: "Test User",
    role: "Farm Manager",
    farm: "Mandapam Demonstration Farm",
    landSize: "",
    state: "",
    district: ""
  },
  uiText: defaultUiText
};

const supportedLanguageCodes = defaultSiteData.languages.map(
  (language) => language.code
);

const defaultSoilReport = {
  id: 0,
  farm_name: "North Field",
  report_status: null,
  health_score: null,
  nitrogen: 18.2,
  phosphorus: 45.0,
  potassium: 37.0,
  ph: 7.2,
  electrical_conductivity: 183.0,
  soil_moisture: 22.7,
  soil_temperature: 20.1,
  organic_matter: 1.9,
  recommendation_note: null,
  recorded_at: "2026-03-23T11:25:17.182+00:00"
};

const defaultSensorReadings = [
  {
    sensor_name: "environment",
    humidity: 63.0,
    root_zone_temperature: 20.1,
    battery_reserve: 86.0,
    packets_delayed: 0.8,
    uplink_latency: 82.0,
    recorded_at: "2026-03-23T11:25:17.189+00:00"
  },
  {
    sensor_name: "probeA",
    moisture: 22.7,
    recorded_at: "2026-03-23T11:25:17.189+00:00"
  },
  {
    sensor_name: "probeB",
    moisture: 24.3,
    recorded_at: "2026-03-23T11:25:17.189+00:00"
  }
];

const fieldAreaAcres = 42;

const nutrientThresholds = {
  nitrogen: {
    label: "Nitrogen (N)",
    lowMax: 10,
    mediumMax: 25,
    thresholdText: "Low: 0-10 | Medium: 10-25 | High: 25+"
  },
  phosphorus: {
    label: "Phosphorus (P)",
    lowMax: 15,
    mediumMax: 30,
    thresholdText: "Low: 0-15 | Medium: 15-30 | High: 30+"
  },
  potassium: {
    label: "Potassium (K)",
    lowMax: 50,
    mediumMax: 150,
    thresholdText: "Low: 0-50 | Medium: 50-150 | High: 150+"
  }
};

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function hasNumericValue(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function roundTo(value, digits = 1) {
  return Number(toNumber(value).toFixed(digits));
}

function average(values, fallback = 0) {
  const validValues = values.filter((value) => Number.isFinite(value));

  if (validValues.length === 0) {
    return fallback;
  }

  const total = validValues.reduce((sum, value) => sum + value, 0);
  return total / validValues.length;
}

function formatInr(value) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatRange(min, max) {
  if (min === max) {
    return `Rs ${formatInr(min)}`;
  }

  return `Rs ${formatInr(min)} - Rs ${formatInr(max)}`;
}

function buildCostSummary(rateMinKg, rateMaxKg, priceMinPerKg, priceMaxPerKg) {
  const estimatedMin = rateMinKg * priceMinPerKg;
  const estimatedMax = rateMaxKg * priceMaxPerKg;
  const totalMin = estimatedMin * fieldAreaAcres;
  const totalMax = estimatedMax * fieldAreaAcres;

  return {
    estimated: `${formatRange(estimatedMin, estimatedMax)} / acre`,
    total: `${formatRange(totalMin, totalMax)} / ${fieldAreaAcres} acres`
  };
}

function buildSiteData(statePayload = {}) {
  return {
    ...defaultSiteData,
    brand: statePayload.brand || defaultSiteData.brand,
    title: statePayload.title || defaultSiteData.title,
    subtitle: statePayload.subtitle || defaultSiteData.subtitle,
    selectedLanguage:
      statePayload.selectedLanguage || defaultSiteData.selectedLanguage,
    languages: defaultSiteData.languages.map((language) => ({ ...language })),
    profile: {
      ...defaultSiteData.profile,
      ...(statePayload.profile || {})
    },
    uiText: {
      ...defaultUiText,
      recommendationTableHeaders: {
        ...defaultUiText.recommendationTableHeaders
      },
      recommendationColumnTitles: {
        ...defaultUiText.recommendationColumnTitles
      },
      chat: {
        ...defaultUiText.chat,
        quickActions: {
          ...defaultUiText.chat.quickActions
        }
      },
      recommendationWorkspace: {
        ...defaultUiText.recommendationWorkspace,
        cropSelection: {
          ...defaultUiText.recommendationWorkspace.cropSelection
        },
        thresholdLabels: {
          ...defaultUiText.recommendationWorkspace.thresholdLabels
        },
        tools: defaultUiText.recommendationWorkspace.tools.map((tool) => ({
          ...tool
        })),
        fertilizer: {
          ...defaultUiText.recommendationWorkspace.fertilizer,
          sections: {
            ...defaultUiText.recommendationWorkspace.fertilizer.sections
          },
          fieldLabels: {
            ...defaultUiText.recommendationWorkspace.fertilizer.fieldLabels
          }
        }
      },
      realtimePanel: {
        ...defaultUiText.realtimePanel,
        status: {
          ...defaultUiText.realtimePanel.status
        }
      },
      overviewWeather: {
        ...defaultUiText.overviewWeather,
        labels: {
          ...defaultUiText.overviewWeather.labels
        },
        units: {
          ...defaultUiText.overviewWeather.units
        },
        rangeOptions: {
          ...defaultUiText.overviewWeather.rangeOptions
        }
      }
    }
  };
}

function getNutrientBand(value, rule) {
  if (value <= rule.lowMax) {
    return "Low";
  }

  if (value <= rule.mediumMax) {
    return "Medium";
  }

  return "High";
}

function createSoilData(soilReport) {
  return [
    {
      label: "Nitrogen (N)",
      value: roundTo(soilReport.nitrogen, 1).toFixed(1),
      unit: "",
      tone: "green"
    },
    {
      label: "Phosphorus (P)",
      value: roundTo(soilReport.phosphorus, 1).toFixed(1),
      unit: "",
      tone: "blue"
    },
    {
      label: "Potassium (K)",
      value: roundTo(soilReport.potassium, 1).toFixed(1),
      unit: "",
      tone: "amber"
    },
    {
      label: "pH Level",
      value: roundTo(soilReport.ph, 2).toFixed(2),
      unit: "",
      tone: "purple"
    },
    {
      label: "Electrical Conductivity",
      value: roundTo(soilReport.electrical_conductivity, 2).toFixed(2),
      unit: "uS/cm",
      tone: "cyan"
    },
    {
      label: "Soil Moisture",
      value: roundTo(soilReport.soil_moisture, 1).toFixed(1),
      unit: "%",
      tone: "sky"
    },
    {
      label: "Soil Temperature",
      value: roundTo(soilReport.soil_temperature, 1).toFixed(1),
      unit: "C",
      tone: "orange"
    }
  ];
}

function getHealthScore(soilReport) {
  if (hasNumericValue(soilReport.health_score)) {
    return Math.round(Number(soilReport.health_score));
  }

  const nitrogenBand = getNutrientBand(
    toNumber(soilReport.nitrogen),
    nutrientThresholds.nitrogen
  );
  const phosphorusBand = getNutrientBand(
    toNumber(soilReport.phosphorus),
    nutrientThresholds.phosphorus
  );
  const potassiumBand = getNutrientBand(
    toNumber(soilReport.potassium),
    nutrientThresholds.potassium
  );

  const bandScore = {
    Low: 35,
    Medium: 65,
    High: 82
  };

  const moisture = toNumber(soilReport.soil_moisture, 22.7);
  const ph = toNumber(soilReport.ph, 7.2);
  const conductivity = toNumber(soilReport.electrical_conductivity, 183);

  const moistureScore = moisture < 15 ? 35 : moisture < 20 ? 52 : moisture <= 30 ? 72 : 60;
  const phScore = ph >= 6.0 && ph <= 7.5 ? 78 : ph >= 5.5 && ph <= 8.0 ? 62 : 45;
  const conductivityScore =
    conductivity <= 200 ? 72 : conductivity <= 300 ? 58 : 42;

  return Math.round(
    average(
      [
        bandScore[nitrogenBand],
        bandScore[phosphorusBand],
        bandScore[potassiumBand],
        moistureScore,
        phScore,
        conductivityScore
      ],
      55
    )
  );
}

function getHealthStatus(score, reportStatus) {
  if (reportStatus) {
    return reportStatus;
  }

  if (score < 40) {
    return "Very Poor";
  }

  if (score < 55) {
    return "Poor";
  }

  if (score < 70) {
    return "Moderate";
  }

  return "Healthy";
}

function getHealthMessage(score, soilReport) {
  if (soilReport.recommendation_note) {
    return soilReport.recommendation_note;
  }

  if (score < 40) {
    return "Rebuild soil health urgently - consult agronomist";
  }

  if (score < 55) {
    return "Correct nutrient imbalance soon to prevent yield loss";
  }

  if (score < 70) {
    return "Maintain nutrients carefully and keep moisture steady";
  }

  return "Soil condition is stable for the current crop stage";
}

function getHealthSupport(score) {
  if (score < 40) {
    return "Soil biological activity and nutrient balance need immediate correction.";
  }

  if (score < 55) {
    return "Targeted fertilizer support and irrigation discipline are recommended.";
  }

  if (score < 70) {
    return "Monitor nutrient drift and continue balanced field management.";
  }

  return "Current field conditions are favorable for continued crop growth.";
}

function createRecommendation(config) {
  return {
    title: config.title,
    priority: config.priority,
    detail: config.detail,
    fertilizer: config.fertilizer,
    nutrientContent: config.nutrientContent,
    priceRange: config.priceRange,
    applicationRate: config.applicationRate,
    note: config.note,
    costSummary: config.costSummary
  };
}

function buildOrganicRecommendations(soilReport) {
  const nitrogenValue = toNumber(soilReport.nitrogen);
  const phosphorusValue = toNumber(soilReport.phosphorus);
  const potassiumValue = toNumber(soilReport.potassium);

  const nitrogenBand = getNutrientBand(nitrogenValue, nutrientThresholds.nitrogen);
  const phosphorusBand = getNutrientBand(
    phosphorusValue,
    nutrientThresholds.phosphorus
  );
  const potassiumBand = getNutrientBand(
    potassiumValue,
    nutrientThresholds.potassium
  );

  const organicNitrogenRecommendation =
    nitrogenBand === "Low"
      ? createRecommendation({
          title: "Blood meal nitrogen boost",
          priority: "High",
          detail:
            `Nitrogen is ${nitrogenBand} at ${roundTo(nitrogenValue, 1)}. Use a rich organic nitrogen source for stronger recovery without switching fully to synthetic inputs.`,
          fertilizer: "Blood Meal",
          nutrientContent: "10 - 12% N",
          priceRange: "Rs 80 - 120 / kg",
          applicationRate: "8 - 10 kg / acre",
          note: "Very rich organic nitrogen source from your list.",
          costSummary: buildCostSummary(8, 10, 80, 120)
        })
      : nitrogenBand === "Medium"
        ? createRecommendation({
            title: "Neem cake maintenance",
            priority: "Medium",
            detail:
              `Nitrogen is ${nitrogenBand} at ${roundTo(nitrogenValue, 1)}. Neem cake is suitable for moderate organic nitrogen support while also helping with pest control.`,
            fertilizer: "Neem Cake",
            nutrientContent: "4 - 5% N",
            priceRange: "Rs 25 - 35 / kg",
            applicationRate: "25 - 35 kg / acre",
            note: "Adds nitrogen and also supports pest management.",
            costSummary: buildCostSummary(25, 35, 25, 35)
          })
        : createRecommendation({
            title: "Hold organic nitrogen input",
            priority: "Medium",
            detail:
              `Nitrogen is ${nitrogenBand} at ${roundTo(nitrogenValue, 1)}. No extra organic nitrogen source is required right now.`,
            fertilizer: "No nitrogen fertilizer now",
            nutrientContent: "Not required",
            priceRange: "Rs 0 / kg",
            applicationRate: "0 kg / acre",
            note: "Skip vermicompost, neem cake, FYM, blood meal, and fish emulsion until nitrogen falls.",
            costSummary: buildCostSummary(0, 0, 0, 0)
          });

  const organicPhosphorusRecommendation =
    phosphorusBand === "Low"
      ? createRecommendation({
          title: "Bone meal phosphorus correction",
          priority: "High",
          detail:
            `Phosphorus is ${phosphorusBand} at ${roundTo(phosphorusValue, 1)}. Bone meal is the strongest organic phosphorus source from your list for low-P correction.`,
          fertilizer: "Bone Meal",
          nutrientContent: "15 - 25% P",
          priceRange: "Rs 40 - 80 / kg",
          applicationRate: "12 - 18 kg / acre",
          note: "Best organic phosphorus source from your provided list.",
          costSummary: buildCostSummary(12, 18, 40, 80)
        })
      : phosphorusBand === "Medium"
        ? createRecommendation({
            title: "PROM maintenance dose",
            priority: "Medium",
            detail:
              `Phosphorus is ${phosphorusBand} at ${roundTo(phosphorusValue, 1)}. PROM is a balanced organic option for moderate phosphorus support.`,
            fertilizer: "PROM (Phosphate Rich Organic Manure)",
            nutrientContent: "10 - 20% P",
            priceRange: "Rs 10 - 20 / kg",
            applicationRate: "20 - 25 kg / acre",
            note: "Improved organic phosphorus source from your list.",
            costSummary: buildCostSummary(20, 25, 10, 20)
          })
        : createRecommendation({
            title: "Avoid organic phosphorus now",
            priority: "Medium",
            detail:
              `Phosphorus is ${phosphorusBand} at ${roundTo(phosphorusValue, 1)}. Do not add bone meal, PROM, or other organic phosphorus sources now.`,
            fertilizer: "No phosphorus fertilizer now",
            nutrientContent: "Not required",
            priceRange: "Rs 0 / kg",
            applicationRate: "0 kg / acre",
            note: "Skip bone meal, rock phosphate, compost, poultry manure, guano, and PROM until phosphorus drops.",
            costSummary: buildCostSummary(0, 0, 0, 0)
          });

  const organicPotassiumRecommendation =
    potassiumBand === "Low"
      ? createRecommendation({
          title: "Poultry manure organic support",
          priority: "High",
          detail:
            `Potassium is ${potassiumBand} at ${roundTo(potassiumValue, 1)}. Poultry manure is used here as the practical organic support option from the fertilizer list you shared.`,
          fertilizer: "Poultry Manure",
          nutrientContent: "2 - 3% nutrient support",
          priceRange: "Rs 6 - 10 / kg",
          applicationRate: "120 - 160 kg / acre",
          note: "Used as the organic potassium-support option from your provided table.",
          costSummary: buildCostSummary(120, 160, 6, 10)
        })
      : potassiumBand === "Medium"
        ? createRecommendation({
            title: "Compost potassium maintenance",
            priority: "Medium",
            detail:
              `Potassium is ${potassiumBand} at ${roundTo(potassiumValue, 1)}. Compost is a mild organic amendment for maintaining potassium-supporting soil fertility.`,
            fertilizer: "Compost",
            nutrientContent: "0.5 - 1% nutrient support",
            priceRange: "Rs 3 - 6 / kg",
            applicationRate: "150 - 220 kg / acre",
            note: "Easily available organic amendment from your list.",
            costSummary: buildCostSummary(150, 220, 3, 6)
          })
        : createRecommendation({
            title: "No organic potassium input now",
            priority: "Medium",
            detail:
              `Potassium is ${potassiumBand} at ${roundTo(potassiumValue, 1)}. No extra organic potassium-support fertilizer is needed right now.`,
            fertilizer: "No potassium fertilizer now",
            nutrientContent: "Not required",
            priceRange: "Rs 0 / kg",
            applicationRate: "0 kg / acre",
            note: "Hold compost and manure-based potash-support inputs until potassium falls back into range.",
            costSummary: buildCostSummary(0, 0, 0, 0)
          });

  return [
    organicNitrogenRecommendation,
    organicPhosphorusRecommendation,
    organicPotassiumRecommendation
  ];
}

function buildInorganicRecommendations(soilReport) {
  const nitrogenValue = toNumber(soilReport.nitrogen);
  const phosphorusValue = toNumber(soilReport.phosphorus);
  const potassiumValue = toNumber(soilReport.potassium);

  const nitrogenBand = getNutrientBand(nitrogenValue, nutrientThresholds.nitrogen);
  const phosphorusBand = getNutrientBand(
    phosphorusValue,
    nutrientThresholds.phosphorus
  );
  const potassiumBand = getNutrientBand(
    potassiumValue,
    nutrientThresholds.potassium
  );

  const nitrogenRecommendation =
    nitrogenBand === "Low"
      ? createRecommendation({
          title: "Urea correction dose",
          priority: "Urgent",
          detail:
            `Nitrogen is ${nitrogenBand} at ${roundTo(nitrogenValue, 1)}. Urea is the primary inorganic source recommended for rapid nitrogen correction.`,
          fertilizer: "Urea",
          nutrientContent: "46% N",
          priceRange: "Rs 5 - 6 / kg",
          applicationRate: "45 - 55 kg / acre",
          note: "Cheapest and most widely used nitrogen fertilizer.",
          costSummary: buildCostSummary(45, 55, 5, 6)
        })
      : nitrogenBand === "Medium"
        ? createRecommendation({
            title: "CAN maintenance dose",
            priority: "Medium",
            detail:
              `Nitrogen is ${nitrogenBand} at ${roundTo(nitrogenValue, 1)}. A lighter Calcium Ammonium Nitrate program is enough for maintenance without pushing growth too aggressively.`,
            fertilizer: "Calcium Ammonium Nitrate (CAN)",
            nutrientContent: "25 - 26% N",
            priceRange: "Rs 12 - 15 / kg",
            applicationRate: "20 - 25 kg / acre",
            note: "Safer handling than nitrate and suitable for moderate correction.",
            costSummary: buildCostSummary(20, 25, 12, 15)
          })
        : createRecommendation({
            title: "Hold nitrogen fertilizer",
            priority: "Medium",
            detail:
              `Nitrogen is ${nitrogenBand} at ${roundTo(nitrogenValue, 1)}. Avoid adding inorganic nitrogen now to prevent excess vegetative growth and nutrient wastage.`,
            fertilizer: "No nitrogen fertilizer now",
            nutrientContent: "Not required",
            priceRange: "Rs 0 / kg",
            applicationRate: "0 kg / acre",
            note: "Skip urea, CAN, and nitrate products until nitrogen drops back into range.",
            costSummary: buildCostSummary(0, 0, 0, 0)
          });

  const phosphorusRecommendation =
    phosphorusBand === "Low"
      ? createRecommendation({
          title: "DAP phosphorus correction",
          priority: "High",
          detail:
            `Phosphorus is ${phosphorusBand} at ${roundTo(phosphorusValue, 1)}. DAP is recommended here as the primary phosphorus source for faster correction.`,
          fertilizer: "DAP (Diammonium Phosphate)",
          nutrientContent: "46% P",
          priceRange: "Rs 22 - 27 / kg",
          applicationRate: "18 - 22 kg / acre",
          note: "Most common phosphorus fertilizer and useful for strong early correction.",
          costSummary: buildCostSummary(18, 22, 22, 27)
        })
      : phosphorusBand === "Medium"
        ? createRecommendation({
            title: "SSP maintenance dose",
            priority: "Medium",
            detail:
              `Phosphorus is ${phosphorusBand} at ${roundTo(phosphorusValue, 1)}. A low-cost SSP maintenance dose is enough if the next crop stage still needs phosphate support.`,
            fertilizer: "SSP (Single Super Phosphate)",
            nutrientContent: "16% P",
            priceRange: "Rs 6 - 8 / kg",
            applicationRate: "25 - 35 kg / acre",
            note: "Cheapest phosphorus source for moderate maintenance.",
            costSummary: buildCostSummary(25, 35, 6, 8)
          })
        : createRecommendation({
            title: "Avoid phosphate fertilizer",
            priority: "Medium",
            detail:
              `Phosphorus is ${phosphorusBand} at ${roundTo(phosphorusValue, 1)}. Do not apply inorganic phosphorus now because the field already has enough available phosphorus.`,
            fertilizer: "No phosphorus fertilizer now",
            nutrientContent: "Not required",
            priceRange: "Rs 0 / kg",
            applicationRate: "0 kg / acre",
            note: "Skip DAP, SSP, TSP, MAP, and other phosphate fertilizers until levels fall.",
            costSummary: buildCostSummary(0, 0, 0, 0)
          });

  const potassiumRecommendation =
    potassiumBand === "Low"
      ? createRecommendation({
          title: "MOP potassium correction",
          priority: "High",
          detail:
            `Potassium is ${potassiumBand} at ${roundTo(potassiumValue, 1)}. MOP is the recommended inorganic source to restore potassium quickly and economically.`,
          fertilizer: "MOP (Muriate of Potash / KCl)",
          nutrientContent: "60% K",
          priceRange: "Rs 16 - 20 / kg",
          applicationRate: "20 - 25 kg / acre",
          note: "Most used potassium fertilizer and the best-value option for correction.",
          costSummary: buildCostSummary(20, 25, 16, 20)
        })
      : potassiumBand === "Medium"
        ? createRecommendation({
            title: "MOP maintenance dose",
            priority: "Medium",
            detail:
              `Potassium is ${potassiumBand} at ${roundTo(potassiumValue, 1)}. A moderate MOP maintenance dose is enough to keep potassium stable in the next cycle.`,
            fertilizer: "MOP (Muriate of Potash / KCl)",
            nutrientContent: "60% K",
            priceRange: "Rs 16 - 20 / kg",
            applicationRate: "10 - 15 kg / acre",
            note: "Most used potassium source and the simplest maintenance option.",
            costSummary: buildCostSummary(10, 15, 16, 20)
          })
        : createRecommendation({
            title: "No potash required now",
            priority: "Medium",
            detail:
              `Potassium is ${potassiumBand} at ${roundTo(potassiumValue, 1)}. Do not add inorganic potassium now because the field is already above the target range.`,
            fertilizer: "No potassium fertilizer now",
            nutrientContent: "Not required",
            priceRange: "Rs 0 / kg",
            applicationRate: "0 kg / acre",
            note: "Skip MOP, SOP, potassium nitrate, and other potash fertilizers until levels drop.",
            costSummary: buildCostSummary(0, 0, 0, 0)
          });

  return [
    nitrogenRecommendation,
    phosphorusRecommendation,
    potassiumRecommendation
  ];
}

function buildRecommendationTable(soilReport) {
  return [
    {
      nutrient: "pH",
      currentValue: roundTo(soilReport.ph, 2).toFixed(2),
      thresholdValues: "Not provided",
      band: "Reference pending"
    },
    {
      nutrient: "EC",
      currentValue: `${roundTo(soilReport.electrical_conductivity, 2).toFixed(
        2
      )} uS/cm`,
      thresholdValues: "Not provided",
      band: "Reference pending"
    },
    {
      nutrient: "N",
      currentValue: roundTo(soilReport.nitrogen, 1).toFixed(1),
      thresholdValues: nutrientThresholds.nitrogen.thresholdText,
      band: getNutrientBand(
        toNumber(soilReport.nitrogen),
        nutrientThresholds.nitrogen
      )
    },
    {
      nutrient: "P",
      currentValue: roundTo(soilReport.phosphorus, 1).toFixed(1),
      thresholdValues: nutrientThresholds.phosphorus.thresholdText,
      band: getNutrientBand(
        toNumber(soilReport.phosphorus),
        nutrientThresholds.phosphorus
      )
    },
    {
      nutrient: "K",
      currentValue: roundTo(soilReport.potassium, 1).toFixed(1),
      thresholdValues: nutrientThresholds.potassium.thresholdText,
      band: getNutrientBand(
        toNumber(soilReport.potassium),
        nutrientThresholds.potassium
      )
    }
  ];
}

function buildRealtimeData(sensorReadings, soilReport) {
  const environmentRow =
    sensorReadings.find((reading) => reading.sensor_name === "environment") || {};
  const probeRows = sensorReadings.filter((reading) =>
    hasNumericValue(reading.moisture)
  );

  const averageMoisture = average(
    probeRows.map((reading) => toNumber(reading.moisture)),
    toNumber(soilReport.soil_moisture, 22.7)
  );
  const rootZoneTemperature = Number.isFinite(
    Number(environmentRow.root_zone_temperature)
  )
    ? Number(environmentRow.root_zone_temperature)
    : toNumber(soilReport.soil_temperature, 20.1);
  const recordedAt =
    environmentRow.recorded_at ||
    probeRows[0]?.recorded_at ||
    soilReport.recorded_at ||
    defaultSoilReport.recorded_at;

  return {
    updatedAt: recordedAt,
    metrics: [
      {
        label: "Soil Moisture",
        value: `${roundTo(averageMoisture, 1).toFixed(1)}%`,
        change: `${probeRows.length || 1} probe average`,
        tone: "sky"
      },
      {
        label: "Humidity",
        value: `${roundTo(environmentRow.humidity, 1).toFixed(1)}%`,
        change: "Environment sensor",
        tone: "blue"
      },
      {
        label: "Root Zone Temperature",
        value: `${roundTo(rootZoneTemperature, 1).toFixed(1)} C`,
        change: "Live root-zone reading",
        tone: "orange"
      },
      {
        label: "Battery Reserve",
        value: `${roundTo(environmentRow.battery_reserve, 1).toFixed(1)}%`,
        change: `${roundTo(environmentRow.uplink_latency, 0)} ms uplink latency`,
        tone: "green"
      }
    ],
    feed: [
      {
        time: "Latest",
        detail: `Probe average moisture is ${roundTo(averageMoisture, 1).toFixed(
          1
        )}% across ${probeRows.length || 1} active soil probes.`
      },
      {
        time: "Network",
        detail: `${roundTo(environmentRow.packets_delayed, 1).toFixed(
          1
        )} packets delayed and ${roundTo(environmentRow.uplink_latency, 0)} ms uplink latency reported by the environment node.`
      },
      {
        time: "Battery",
        detail: `Sensor battery reserve is ${roundTo(
          environmentRow.battery_reserve,
          1
        ).toFixed(1)}% with humidity at ${roundTo(environmentRow.humidity, 1).toFixed(
          1
        )}%.`
      }
    ]
  };
}

function buildDashboardData({
  soilReport = defaultSoilReport,
  sensorReadings = defaultSensorReadings
} = {}) {
  const report = {
    ...defaultSoilReport,
    ...(soilReport || {})
  };
  const sensors =
    Array.isArray(sensorReadings) && sensorReadings.length > 0
      ? sensorReadings
      : defaultSensorReadings;
  const score = getHealthScore(report);
  const status = getHealthStatus(score, report.report_status);

  return {
    activeTab: "overview",
    tabs: [
      {
        key: "overview",
        label: "Farm Overview"
      },
      {
        key: "recommendations",
        label: "Recommendations"
      },
      {
        key: "realtime",
        label: "Real Time Sensor Data"
      }
    ],
    overview: {
      title: "Current Soil Report",
      timestamp: report.recorded_at || defaultSoilReport.recorded_at,
      status,
      soilHealth: {
        label: "Overall Soil Health",
        score,
        progress: score,
        message: getHealthMessage(score, report),
        support: getHealthSupport(score)
      },
      soilData: createSoilData(report)
    },
    recommendations: {
      summary:
        "Separate fertilizer guidance for organic inputs and inorganic nutrient correction based on the latest soil report.",
      tableRows: buildRecommendationTable(report),
      organic: buildOrganicRecommendations(report),
      inorganic: buildInorganicRecommendations(report)
    },
    realtime: buildRealtimeData(sensors, report)
  };
}

module.exports = {
  buildSiteData,
  buildDashboardData,
  defaultSiteData,
  defaultSoilReport,
  defaultSensorReadings,
  supportedLanguageCodes
};
