import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  PRIMARY_CROP_OPTIONS,
  VEGETABLE_CROP_OPTIONS,
  getCropProfile,
  isVegetableCropKey
} from "./lib/crops";
import {
  buildRecommendationCostTotals,
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
  formatDateLong,
  formatNumber,
  formatTimeOnly,
  metricStatusTone,
  priorityTone,
  severityTone
} from "./lib/dashboard";
import { requestJson } from "./lib/api";

const NAV_ITEM_CONFIG = [
  {
    path: "/",
    label: "Overview",
    icon: "overview"
  },
  {
    path: "/action-planner",
    label: "Action Planner",
    icon: "planner"
  },
  {
    path: "/recommendations",
    label: "Recommendations",
    icon: "recommendations"
  },
  {
    path: "/sensor-data",
    label: "Sensor Data",
    icon: "sensor"
  },
  {
    path: "/storages",
    label: "Storages",
    icon: "storage"
  },
  {
    path: "/contact",
    label: "Contact Us",
    icon: "contact"
  }
];

const ACTION_PLANNER_OPTIONS = [
  ...PRIMARY_CROP_OPTIONS.filter((item) => item.key !== "vegetables").map((item) => ({
    key: item.key,
    label: item.label
  })),
  ...VEGETABLE_CROP_OPTIONS.map((item) => ({
    key: item.key,
    label: `${item.label} (Vegetable)`
  }))
];

const STORAGE_REQUEST_CACHE_TTL_MS = 30 * 1000;
const storageRequestCache = new Map();
const FIXED_PROFILE_PRODUCT_ID = "AGC-PRODUCT-001";
const CONTACT_PHONE_NUMBER = "xxxxx";

function buildStorageRequestCacheKey(pathname, payload) {
  return `${pathname}:${JSON.stringify(payload)}`;
}

function withFixedProductId(siteData) {
  if (!siteData) {
    return siteData;
  }

  return {
    ...siteData,
    profile: {
      ...(siteData.profile || {}),
      productId: FIXED_PROFILE_PRODUCT_ID
    }
  };
}

function readCachedStorageRequest(cacheKey) {
  const cachedEntry = storageRequestCache.get(cacheKey);

  if (!cachedEntry) {
    return null;
  }

  if (Date.now() - cachedEntry.createdAt > STORAGE_REQUEST_CACHE_TTL_MS) {
    storageRequestCache.delete(cacheKey);
    return null;
  }

  return cachedEntry.promise;
}

async function requestCachedStorageJson(pathname, payload) {
  const cacheKey = buildStorageRequestCacheKey(pathname, payload);
  const cachedRequest = readCachedStorageRequest(cacheKey);

  if (cachedRequest) {
    return cachedRequest;
  }

  const requestPromise = requestJson(pathname, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then((result) => {
      storageRequestCache.set(cacheKey, {
        createdAt: Date.now(),
        promise: Promise.resolve(result)
      });
      return result;
    })
    .catch((error) => {
      storageRequestCache.delete(cacheKey);
      throw error;
    });

  storageRequestCache.set(cacheKey, {
    createdAt: Date.now(),
    promise: requestPromise
  });

  return requestPromise;
}

const FALLBACK_UI_TEXT = {
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

const HARD_CODED_TRANSLATIONS = {
  hi: [
    ["Startup-grade agronomy", "स्टार्टअप-ग्रेड कृषि"],
    ["Startup-ready agricultural intelligence for every field decision.", "हर खेत निर्णय के लिए तैयार कृषि बुद्धिमत्ता।"],
    ["Startup-ready", "तैयार"],
    ["agricultural intelligence", "कृषि बुद्धिमत्ता"],
    ["for every field decision.", "हर खेत निर्णय के लिए।"],
    ["Open Recommendations", "सिफारिशें खोलें"],
    ["Open Sensor Data", "सेंसर डेटा खोलें"],
    ["Back to Overview", "सारांश पर वापस जाएं"],
    ["Overview", "सारांश"],
    ["Action Planner", "कार्य योजना"],
    ["Recommendations", "सिफारिशें"],
    ["Sensor Data", "सेंसर डेटा"],
    ["Language", "भाषा"],
    ["Role", "भूमिका"],
    ["Farm command", "फार्म कमांड"],
    ["Soil health", "मिट्टी का स्वास्थ्य"],
    ["Humidity", "आर्द्रता"],
    ["Live atmosphere", "लाइव वातावरण"],
    ["Last report", "अंतिम रिपोर्ट"],
    ["Climate snapshot", "मौसम स्नैपशॉट"],
    ["Weather trend", "मौसम रुझान"],
    ["Navigation", "नेविगेशन"],
    ["Field feed", "फील्ड फ़ीड"],
    ["Latest observations", "नवीनतम अवलोकन"],
    ["Open a dedicated page for the next task", "अगले कार्य के लिए अलग पेज खोलें"],
    ["Recommendations and sensor operations now live on their own focused pages.", "सिफारिशें और सेंसर कार्य अब अपने अलग पेजों पर उपलब्ध हैं।"],
    ["Nutrient, crop, and planning decisions", "पोषक, फसल और योजना निर्णय"],
    ["Move into a dedicated workspace for crop fit, fertilizer planning, and operational guidance.", "फसल उपयुक्तता, उर्वरक योजना और संचालन मार्गदर्शन के लिए अलग कार्यक्षेत्र खोलें।"],
    ["Go to Recommendations", "सिफारिशों पर जाएं"],
    ["Realtime telemetry and environmental monitoring", "रियलटाइम टेलीमेट्री और पर्यावरण निगरानी"],
    ["Open the sensor page to inspect NPK drift, environmental distribution, and live feed notes.", "NPK परिवर्तन, पर्यावरण वितरण और लाइव नोट्स देखने के लिए सेंसर पेज खोलें।"],
    ["Go to Sensor Data", "सेंसर डेटा पर जाएं"],
    ["Short operational notes pulled from the current realtime stream.", "वर्तमान रियलटाइम स्ट्रीम से लिए गए संक्षिप्त संचालन नोट्स।"],
    ["Recommendation studio", "सिफारिश केंद्र"],
    ["Dedicated planning for", "के लिए समर्पित योजना"],
    ["crop fit, fertilizer, and next actions", "फसल उपयुक्तता, उर्वरक और अगले कार्य"],
    ["Selected crop", "चयनित फसल"],
    ["Top organic", "शीर्ष जैविक"],
    ["Top inorganic", "शीर्ष अकार्बनिक"],
    ["Pending", "लंबित"],
    ["No recommendation", "कोई सिफारिश नहीं"],
    ["Review data", "डेटा देखें"],
    ["Primary crop", "मुख्य फसल"],
    ["Vegetable crop", "सब्जी फसल"],
    ["Predicted cereals", "अनुमानित अनाज"],
    ["Vegetable prediction", "सब्जी अनुमान"],
    ["Select a crop to unlock the workspace", "वर्कस्पेस खोलने के लिए फसल चुनें"],
    ["Active recommendation", "सक्रिय सिफारिश"],
    ["Use the field-fit crop shortlist to open the recommendation workspace instantly.", "उपयुक्त फसल सूची से तुरंत सिफारिश वर्कस्पेस खोलें।"],
    ["Use best-fit crop", "सर्वश्रेष्ठ फसल चुनें"],
    ["Current sensor values", "वर्तमान सेंसर मान"],
    ["Nutrient correction", "पोषक सुधार"],
    ["Primary chemical correction options for the selected crop.", "चयनित फसल के लिए मुख्य रासायनिक सुधार विकल्प।"],
    ["Soil support", "मिट्टी समर्थन"],
    ["Organic fertilizer options that support nutrient recovery and soil structure.", "पोषक पुनर्प्राप्ति और मिट्टी संरचना के लिए जैविक उर्वरक विकल्प।"],
    ["Inorganic", "अकार्बनिक"],
    ["Organic", "जैविक"],
    ["Planner note", "योजना नोट"],
    ["Action planner", "कार्य योजना"],
    ["Turn a", "एक"],
    ["crop and seeding date", "फसल और बुवाई तिथि"],
    ["into a field action calendar.", "को खेत कार्य कैलेंडर में बदलें।"],
    ["Select the crop, enter the seeding date, and get a dated action plan with fertilizer, protection, and weeding events marked on the calendar.", "फसल चुनें, बुवाई तिथि दर्ज करें और उर्वरक, सुरक्षा तथा निराई कार्यों वाला दिनांकित कैलेंडर प्लान पाएं।"],
    ["Planner crop", "योजना फसल"],
    ["Choose crop", "फसल चुनें"],
    ["Planning context", "योजना संदर्भ"],
    ["Seeding date", "बुवाई तिथि"],
    ["Start of schedule", "कार्यक्रम की शुरुआत"],
    ["Planned actions", "योजित कार्य"],
    ["Calendar markers", "कैलेंडर चिह्न"],
    ["Calendar", "कैलेंडर"],
    ["Action calendar", "कार्य कैलेंडर"],
    ["The generated field actions are marked directly on the calendar.", "तैयार किए गए खेत कार्य सीधे कैलेंडर पर अंकित हैं।"],
    ["Questions", "प्रश्न"],
    ["Plan the crop schedule", "फसल कार्यक्रम बनाएं"],
    ["Answer the crop and seeding date questions to generate the farm action timeline.", "फार्म कार्य समयरेखा बनाने के लिए फसल और बुवाई तिथि के प्रश्नों का उत्तर दें।"],
    ["Question 1", "प्रश्न 1"],
    ["Enter the crop", "फसल दर्ज करें"],
    ["Suggested crops", "सुझाई गई फसलें"],
    ["Question 2", "प्रश्न 2"],
    ["Enter the seeding date", "बुवाई तिथि दर्ज करें"],
    ["Generated plan", "तैयार योजना"],
    ["Follow the dated actions below.", "नीचे दिए गए दिनांकित कार्यों का पालन करें।"],
    ["Assigned actions", "निर्धारित कार्य"],
    ["Close", "बंद करें"],
    ["Done", "पूर्ण"],
    ["Not done", "पूर्ण नहीं"],
    ["Reminder", "रिमाइंडर"],
    ["is still not done.", "अभी भी पूरा नहीं हुआ है।"],
    ["Reminder active every 3 hours from", "हर 3 घंटे में रिमाइंडर सक्रिय रहेगा"],
    ["until you mark it done.", "जब तक आप इसे पूरा चिह्नित नहीं करते।"],
    ["Prev", "पिछला"],
    ["Next", "अगला"],
    ["All", "सभी"],
    ["Sun", "रवि"],
    ["Mon", "सोम"],
    ["Tue", "मंगल"],
    ["Wed", "बुध"],
    ["Thu", "गुरु"],
    ["Fri", "शुक्र"],
    ["Sat", "शनि"],
    ["No actions", "कोई कार्य नहीं"],
    ["Sensor operations", "सेंसर संचालन"],
    ["A focused telemetry page for", "के लिए एक केंद्रित टेलीमेट्री पेज"],
    ["live field monitoring", "लाइव खेत निगरानी"],
    ["Last sync", "अंतिम सिंक"],
    ["Environment node", "पर्यावरण नोड"],
    ["Root zone", "रूट ज़ोन"],
    ["Live root temperature", "लाइव रूट तापमान"],
    ["Environment readings", "पर्यावरण रीडिंग"],
    ["NPK movement", "NPK गति"],
    ["Environmental balance", "पर्यावरण संतुलन"],
    ["Realtime feed", "रियलटाइम फ़ीड"],
    ["Operational notes", "संचालन नोट्स"],
    ["A dedicated page for the sensor stream and the latest field signals.", "सेंसर स्ट्रीम और नवीनतम खेत संकेतों के लिए समर्पित पेज।"],
    ["seeded on", "की बुवाई हुई"],
    ["per quintal", "प्रति क्विंटल"],
    ["(Vegetable)", "(सब्जी)"],
    ["Booting the field workspace", "फील्ड वर्कस्पेस शुरू हो रहा है"],
    ["Loading soil context, recommendations, and live telemetry.", "मिट्टी संदर्भ, सिफारिशें और लाइव टेलीमेट्री लोड हो रही हैं।"],
    ["Unable to load the dashboard", "डैशबोर्ड लोड नहीं हो सका"],
    ["Please make sure the backend server is running and try again.", "कृपया सुनिश्चित करें कि बैकएंड सर्वर चल रहा है और फिर प्रयास करें।"],
    ["Retry", "पुनः प्रयास"],
    ["Pest gallery", "कीट गैलरी"],
    ["Common pests and disease references", "सामान्य कीट और रोग संदर्भ"],
    ["Web-loaded visual references for different pests or diseases linked to the selected crop.", "चयनित फसल से जुड़े विभिन्न कीटों या रोगों के वेब-लोडेड दृश्य संदर्भ।"],
    ["Loading pest photo...", "कीट फोटो लोड हो रही है..."],
    ["Photo unavailable right now.", "फोटो अभी उपलब्ध नहीं है।"],
    ["The deployed app could not reach its API. Make sure the backend routes are deployed correctly.", "डिप्लॉय किया गया ऐप अपने API तक नहीं पहुंच सका। कृपया सुनिश्चित करें कि बैकएंड रूट्स सही तरीके से डिप्लॉय किए गए हैं।"],
    ["The API returned HTML instead of JSON. Check that the backend route is deployed correctly.", "API ने JSON के बजाय HTML लौटाया। कृपया जांचें कि बैकएंड रूट सही तरीके से डिप्लॉय हुआ है।"],
    ["Unable to reach the API right now. Please try again.", "अभी API तक पहुंचा नहीं जा सका। कृपया फिर से प्रयास करें।"],
    ["The server returned an invalid JSON response.", "सर्वर ने अमान्य JSON प्रतिक्रिया लौटाई।"],
    ["Pest", "कीट"],
    ["Search topic:", "खोज विषय:"],
    ["Source: Wikipedia", "स्रोत: विकिपीडिया"],
    ["Open assistant", "सहायक खोलें"],
    ["Sending...", "भेजा जा रहा है..."],
    ["Seeding", "बुवाई"],
    ["Irrigation", "सिंचाई"],
    ["Fertilizer", "उर्वरक"],
    ["Weeding", "निराई"],
    ["Pesticide", "कीटनाशक"],
    ["Monitoring", "निगरानी"],
    ["Harvest", "कटाई"],
    ["Nitrogen", "नाइट्रोजन"],
    ["Phosphorus", "फॉस्फोरस"],
    ["Potassium", "पोटैशियम"],
    ["Content", "सामग्री"],
    ["Rate", "मात्रा"],
    ["Price range", "मूल्य सीमा"],
    ["Cost / acre", "लागत / एकड़"],
    ["Total plan", "कुल योजना"],
    ["Live mix", "लाइव मिश्रण"],
    ["Paddy", "धान"],
    ["Wheat", "गेहूं"],
    ["Barley", "जौ"],
    ["Corn", "मक्का"],
    ["Sorghum", "ज्वार"],
    ["Millet", "बाजरा"],
    ["Oats", "जई"],
    ["Vegetables", "सब्जियां"],
    ["Tomato", "टमाटर"],
    ["Onion", "प्याज"],
    ["Potato", "आलू"],
    ["Brinjal", "बैंगन"],
    ["Okra", "भिंडी"],
    ["Chilli", "मिर्च"],
    ["Cabbage", "पत्ता गोभी"],
    ["Cauliflower", "फूलगोभी"],
    ["Carrot", "गाजर"],
    ["Cucumber", "खीरा"],
    ["Spinach", "पालक"],
    ["Beans", "बीन्स"],
    ["Peas", "मटर"],
    ["Bottle Gourd", "लौकी"],
    ["Pumpkin", "कद्दू"],
    ["Cereal", "अनाज"],
    ["Vegetable", "सब्जी"],
    ["Healthy", "स्वस्थ"],
    ["Optimal", "उत्तम"],
    ["Warning", "चेतावनी"],
    ["Critical", "गंभीर"],
    ["Profile", "प्रोफ़ाइल"],
    ["Farm Overview", "फार्म अवलोकन"],
    ["Current Soil Report", "वर्तमान मिट्टी रिपोर्ट"],
    ["Overall Soil Health", "समग्र मिट्टी स्वास्थ्य"],
    ["Current report", "वर्तमान रिपोर्ट"],
    ["Soil status", "मिट्टी की स्थिति"],
    ["Active record", "सक्रिय रिकॉर्ड"],
    ["Real Time Sensor Data", "रियल-टाइम सेंसर डेटा"],
    ["Soil Sensor Snapshot", "मिट्टी सेंसर स्नैपशॉट"],
    ["Environment Readings", "पर्यावरण रीडिंग"],
    ["Soil NPK Levels Trend", "मिट्टी NPK स्तर रुझान"],
    ["Environmental Conditions Distribution", "पर्यावरणीय स्थितियों का वितरण"],
    ["Last Updated", "अंतिम अपडेट"],
    ["Sunlight Intensity", "सूर्य प्रकाश तीव्रता"],
    ["Temperature", "तापमान"],
    ["Weather Data", "मौसम डेटा"],
    ["Weather Trend", "मौसम रुझान"],
    ["Nutrient Table", "पोषक तालिका"],
    ["Nutrient", "पोषक तत्व"],
    ["Current Value", "वर्तमान मान"],
    ["Threshold Values", "सीमा मान"],
    ["Band", "श्रेणी"],
    ["Organic Fertilizers", "जैविक उर्वरक"],
    ["Inorganic Fertilizers", "अकार्बनिक उर्वरक"],
    ["Farm Profile", "फार्म प्रोफ़ाइल"],
    ["Ask AgriCure AI", "AgriCure AI से पूछें"],
    ["Field Assistant", "फील्ड सहायक"],
    ["Soil summary", "मिट्टी सारांश"],
    ["Fertilizer help", "उर्वरक सहायता"],
    ["Sensor insights", "सेंसर अंतर्दृष्टि"],
    ["Type your question...", "अपना प्रश्न लिखें..."],
    ["Send", "भेजें"],
    ["Manage Account", "खाता प्रबंधित करें"],
    ["Brand examples", "ब्रांड उदाहरण"],
    ["Agmarknet filters", "Agmarknet फ़िल्टर"],
    ["Current prices and previous-year comparison are both pulled from Agmarknet for the selected crop and location.", "चयनित फसल और स्थान के लिए वर्तमान कीमतें और पिछले वर्ष की तुलना दोनों Agmarknet से ली गई हैं।"],
    ["Location filters", "स्थान फ़िल्टर"],
    ["Select state", "राज्य चुनें"],
    ["Select district", "ज़िला चुनें"],
    ["Choose state", "राज्य चुनें"],
    ["Choose district", "ज़िला चुनें"],
    ["All districts", "सभी ज़िले"],
    ["All districts in selected state", "चयनित राज्य के सभी ज़िले"],
    ["Market report", "बाज़ार रिपोर्ट"],
    ["Previous year report", "पिछले वर्ष की रिपोर्ट"],
    ["Latest report date", "नवीनतम रिपोर्ट तिथि"],
    ["Markets reporting", "रिपोर्ट देने वाले बाज़ार"],
    ["Average modal price", "औसत मॉडल मूल्य"],
    ["Arrivals", "आवक"],
    ["Min / max", "न्यूनतम / अधिकतम"],
    ["Total arrivals", "कुल आवक"],
    ["Reported", "रिपोर्ट की गई"],
    ["District-specific data was not found for the latest report, so the panel is showing the broader state report.", "नवीनतम रिपोर्ट के लिए जिला-स्तर का डेटा नहीं मिला, इसलिए पैनल व्यापक राज्य रिपोर्ट दिखा रहा है।"],
    ["No Agmarknet report is available for this selection right now.", "इस चयन के लिए अभी कोई Agmarknet रिपोर्ट उपलब्ध नहीं है।"],
    ["Loading Agmarknet report for the selected crop and location...", "चयनित फसल और स्थान के लिए Agmarknet रिपोर्ट लोड हो रही है..."],
    ["Farmer details", "किसान विवरण"],
    ["Farmer name", "किसान का नाम"],
    ["Farmer", "किसान"],
    ["Enter farmer name", "किसान का नाम दर्ज करें"],
    ["Land size", "भूमि का आकार"],
    ["Example: 4.5 acres", "उदाहरण: 4.5 एकड़"],
    ["Profile settings", "प्रोफ़ाइल सेटिंग्स"],
    ["Update the farmer details used for dashboard context and location-based price reporting.", "डैशबोर्ड संदर्भ और स्थान-आधारित मूल्य रिपोर्टिंग में उपयोग होने वाले किसान विवरण अपडेट करें।"],
    ["This profile drives the default Agmarknet state and district used in crop price insights across the app.", "यह प्रोफ़ाइल ऐप में फसल मूल्य जानकारी के लिए उपयोग होने वाले डिफ़ॉल्ट Agmarknet राज्य और ज़िले को तय करती है।"],
    ["Save profile", "प्रोफ़ाइल सहेजें"],
    ["Saving...", "सहेजा जा रहा है..."],
    ["Updated", "अपडेट किया गया"],
    ["State", "राज्य"],
    ["District", "ज़िला"],
    ["Location", "स्थान"],
    ["Set the", "सेट करें"],
    ["farmer profile and market location", "किसान प्रोफ़ाइल और बाज़ार स्थान"],
    ["State filters", "राज्य फ़िल्टर"],
    ["Central farmer support schemes", "केंद्रीय किसान सहायता योजनाएँ"],
    ["Central insurance schemes", "केंद्रीय बीमा योजनाएँ"],
    ["Central schemes", "केंद्रीय योजनाएँ"],
    ["State schemes", "राज्य योजनाएँ"],
    ["Insurance", "बीमा"],
    ["Official advisories", "आधिकारिक परामर्श"],
    ["Official link", "आधिकारिक लिंक"],
    ["Protection products", "सुरक्षा उत्पाद"],
    ["PPQS references", "PPQS संदर्भ"],
    ["These links come from the Directorate of Plant Protection, Quarantine & Storage advisory section.", "ये लिंक पादप संरक्षण, संगरोध एवं भंडारण निदेशालय के परामर्श अनुभाग से लिए गए हैं।"],
    ["No crop-specific PPQS advisory was matched yet for this crop.", "इस फसल के लिए अभी कोई फसल-विशिष्ट PPQS परामर्श नहीं मिला।"],
    ["farmer schemes", "किसान योजनाएँ"],
    ["insurance schemes", "बीमा योजनाएँ"],
    ["Choose a state to load state-specific schemes.", "राज्य-विशिष्ट योजनाएँ लोड करने के लिए राज्य चुनें।"],
    ["Choose a state to load state insurance schemes.", "राज्य बीमा योजनाएँ लोड करने के लिए राज्य चुनें।"],
    ["Choose a state to load the matching state-specific scheme details.", "मिलती हुई राज्य-विशिष्ट योजना जानकारी लोड करने के लिए राज्य चुनें।"],
    ["Choose a state to load the current crop price report and the same-month previous-year report from Agmarknet.", "Agmarknet से वर्तमान फसल मूल्य रिपोर्ट और पिछले वर्ष के उसी महीने की रिपोर्ट लोड करने के लिए राज्य चुनें।"],
    ["Select a state for local schemes", "स्थानीय योजनाओं के लिए राज्य चुनें"],
    ["Select a state for insurance schemes", "बीमा योजनाओं के लिए राज्य चुनें"],
    ["Selected state", "चयनित राज्य"],
    ["National farmer-focused schemes sourced from the Vikaspedia farmer schemes collection.", "Vikaspedia किसान योजना संग्रह से ली गई राष्ट्रीय किसान-केंद्रित योजनाएँ।"],
    ["Central farmer schemes are shown first. After you choose a state, the panel loads farmer-focused state schemes and insurance schemes for that state from Vikaspedia.", "पहले केंद्रीय किसान योजनाएँ दिखाई जाती हैं। राज्य चुनने के बाद पैनल उस राज्य की किसान-केंद्रित राज्य योजनाएँ और बीमा योजनाएँ Vikaspedia से लोड करता है।"],
    ["Insurance-related farmer schemes listed in the central Vikaspedia farmer collection.", "केंद्रीय Vikaspedia किसान संग्रह में सूचीबद्ध बीमा-संबंधित किसान योजनाएँ।"],
    ["Loading government schemes from Vikaspedia...", "Vikaspedia से सरकारी योजनाएँ लोड हो रही हैं..."],
    ["No central schemes were returned right now.", "अभी कोई केंद्रीय योजनाएँ नहीं मिलीं।"],
    ["No central insurance schemes were returned right now.", "अभी कोई केंद्रीय बीमा योजनाएँ नहीं मिलीं।"],
    ["No farmer-focused state schemes were matched for this selection yet.", "इस चयन के लिए अभी कोई किसान-केंद्रित राज्य योजना नहीं मिली।"],
    ["No state insurance scheme was matched for this selection yet.", "इस चयन के लिए अभी कोई राज्य बीमा योजना नहीं मिली।"],
    ["View Vikaspedia", "Vikaspedia देखें"],
    ["Use when", "कब उपयोग करें"],
    ["Check local dealer", "स्थानीय विक्रेता से जांचें"],
    ["Source", "स्रोत"],
    ["Very Poor", "बहुत खराब"],
    ["Poor", "खराब"],
    ["Moderate", "मध्यम"],
    ["Rebuild soil health urgently - consult agronomist", "मिट्टी के स्वास्थ्य को तुरंत सुधारें - कृषि विशेषज्ञ से सलाह लें"],
    ["Correct nutrient imbalance soon to prevent yield loss", "उपज हानि रोकने के लिए पोषक असंतुलन जल्द ठीक करें"],
    ["Maintain nutrients carefully and keep moisture steady", "पोषक स्तर संभालकर रखें और नमी स्थिर बनाए रखें"],
    ["Soil condition is stable for the current crop stage", "वर्तमान फसल अवस्था के लिए मिट्टी की स्थिति स्थिर है"],
    ["Soil biological activity and nutrient balance need immediate correction.", "मिट्टी की जैविक सक्रियता और पोषक संतुलन में तुरंत सुधार की जरूरत है।"],
    ["Targeted fertilizer support and irrigation discipline are recommended.", "लक्षित उर्वरक सहायता और अनुशासित सिंचाई की सलाह दी जाती है।"],
    ["Monitor nutrient drift and continue balanced field management.", "पोषक बदलाव पर नजर रखें और संतुलित खेत प्रबंधन जारी रखें।"],
    ["Current field conditions are favorable for continued crop growth.", "वर्तमान खेत परिस्थितियाँ फसल की निरंतर वृद्धि के लिए अनुकूल हैं।"],
    ["Nitrogen (N)", "नाइट्रोजन (N)"],
    ["Phosphorus (P)", "फॉस्फोरस (P)"],
    ["Potassium (K)", "पोटैशियम (K)"],
    ["pH Level", "pH स्तर"],
    ["Electrical Conductivity", "विद्युत चालकता"],
    ["Soil Moisture", "मिट्टी की नमी"],
    ["Soil Temperature", "मिट्टी का तापमान"],
    ["Root Zone Temperature", "रूट ज़ोन तापमान"],
    ["Battery Reserve", "बैटरी रिज़र्व"],
    ["Environment sensor", "पर्यावरण सेंसर"],
    ["Live root-zone reading", "लाइव रूट-ज़ोन रीडिंग"],
    ["Separate fertilizer guidance for organic inputs and inorganic nutrient correction based on the latest soil report.", "नवीनतम मिट्टी रिपोर्ट के आधार पर जैविक इनपुट और अकार्बनिक पोषक सुधार के लिए अलग उर्वरक मार्गदर्शन।"]
  ],
  te: [
    ["Startup-grade agronomy", "స్టార్టప్ స్థాయి వ్యవసాయం"],
    ["Startup-ready agricultural intelligence for every field decision.", "ప్రతి పొల నిర్ణయానికి సిద్ధమైన వ్యవసాయ మేధస్సు."],
    ["Startup-ready", "సిద్ధమైన"],
    ["agricultural intelligence", "వ్యవసాయ మేధస్సు"],
    ["for every field decision.", "ప్రతి పొల నిర్ణయానికి."],
    ["Open Recommendations", "సిఫార్సులు తెరవండి"],
    ["Open Sensor Data", "సెన్సార్ డేటా తెరవండి"],
    ["Back to Overview", "సారాంశానికి తిరిగి వెళ్లండి"],
    ["Overview", "సారాంశం"],
    ["Action Planner", "చర్యల ప్రణాళిక"],
    ["Recommendations", "సిఫార్సులు"],
    ["Sensor Data", "సెన్సార్ డేటా"],
    ["Language", "భాష"],
    ["Role", "పాత్ర"],
    ["Farm command", "ఫార్మ్ కమాండ్"],
    ["Soil health", "మట్టి ఆరోగ్యం"],
    ["Humidity", "ఆర్ద్రత"],
    ["Live atmosphere", "ప్రత్యక్ష వాతావరణం"],
    ["Last report", "చివరి నివేదిక"],
    ["Climate snapshot", "వాతావరణ స్నాప్‌షాట్"],
    ["Weather trend", "వాతావరణ ధోరణి"],
    ["Navigation", "నావిగేషన్"],
    ["Field feed", "ఫీల్డ్ ఫీడ్"],
    ["Latest observations", "తాజా పరిశీలనలు"],
    ["Open a dedicated page for the next task", "తర్వాతి పనికి ప్రత్యేక పేజీ తెరవండి"],
    ["Recommendations and sensor operations now live on their own focused pages.", "సిఫార్సులు మరియు సెన్సార్ కార్యాచరణలు ఇప్పుడు వేరే పేజీల్లో ఉన్నాయి."],
    ["Nutrient, crop, and planning decisions", "పోషకాలు, పంట, ప్రణాళిక నిర్ణయాలు"],
    ["Move into a dedicated workspace for crop fit, fertilizer planning, and operational guidance.", "పంట సరిపోక, ఎరువు ప్రణాళిక, కార్యాచరణ మార్గదర్శకత్వం కోసం ప్రత్యేక వర్క్‌స్పేస్ తెరవండి."],
    ["Go to Recommendations", "సిఫార్సుల వద్దకు వెళ్లండి"],
    ["Realtime telemetry and environmental monitoring", "రియల్‌టైమ్ టెలిమెట్రీ మరియు పర్యావరణ పరిశీలన"],
    ["Open the sensor page to inspect NPK drift, environmental distribution, and live feed notes.", "NPK మార్పు, పర్యావరణ పంపిణీ, ప్రత్యక్ష గమనికలను చూడటానికి సెన్సార్ పేజీ తెరవండి."],
    ["Go to Sensor Data", "సెన్సార్ డేటాకు వెళ్లండి"],
    ["Short operational notes pulled from the current realtime stream.", "ప్రస్తుత రియల్‌టైమ్ స్ట్రీమ్ నుండి చిన్న కార్యాచరణ గమనికలు."],
    ["Recommendation studio", "సిఫార్సుల కేంద్రం"],
    ["Dedicated planning for", "దీనికోసం ప్రత్యేక ప్రణాళిక"],
    ["crop fit, fertilizer, and next actions", "పంట సరిపోక, ఎరువు, తదుపరి చర్యలు"],
    ["Selected crop", "ఎంచుకున్న పంట"],
    ["Top organic", "ప్రధాన సేంద్రియ"],
    ["Top inorganic", "ప్రధాన రసాయనిక"],
    ["Pending", "వేచి ఉంది"],
    ["No recommendation", "సిఫార్సు లేదు"],
    ["Review data", "డేటా చూడండి"],
    ["Primary crop", "ప్రధాన పంట"],
    ["Vegetable crop", "కూరగాయ పంట"],
    ["Predicted cereals", "అంచనా ధాన్యాలు"],
    ["Vegetable prediction", "కూరగాయ అంచనా"],
    ["Select a crop to unlock the workspace", "వర్క్‌స్పేస్‌ను తెరవడానికి పంటను ఎంచుకోండి"],
    ["Active recommendation", "సక్రియ సిఫార్సు"],
    ["Use the field-fit crop shortlist to open the recommendation workspace instantly.", "సిఫార్సుల వర్క్‌స్పేస్ వెంటనే తెరవడానికి సరిపడే పంట జాబితాను ఉపయోగించండి."],
    ["Use best-fit crop", "ఉత్తమ పంటను ఉపయోగించండి"],
    ["Current sensor values", "ప్రస్తుత సెన్సార్ విలువలు"],
    ["Nutrient correction", "పోషకాల సరిదిద్దడం"],
    ["Primary chemical correction options for the selected crop.", "ఎంచుకున్న పంటకు ప్రధాన రసాయన సరిదిద్దే ఎంపికలు."],
    ["Soil support", "మట్టి మద్దతు"],
    ["Organic fertilizer options that support nutrient recovery and soil structure.", "పోషక పునరుద్ధరణ మరియు మట్టి నిర్మాణానికి మద్దతు ఇచ్చే సేంద్రియ ఎరువులు."],
    ["Inorganic", "రసాయనిక"],
    ["Organic", "సేంద్రియ"],
    ["Planner note", "ప్రణాళిక గమనిక"],
    ["Action planner", "చర్యల ప్రణాళిక"],
    ["Turn a", "ఒక"],
    ["crop and seeding date", "పంట మరియు విత్తన తేదీ"],
    ["into a field action calendar.", "ను పొల చర్యల క్యాలెండర్‌గా మార్చండి."],
    ["Select the crop, enter the seeding date, and get a dated action plan with fertilizer, protection, and weeding events marked on the calendar.", "పంటను ఎంచుకుని, విత్తన తేదీని నమోదు చేసి, ఎరువు, రక్షణ, కలుపు చర్యలతో తేదీ వారీ ప్రణాళికను పొందండి."],
    ["Planner crop", "ప్రణాళిక పంట"],
    ["Choose crop", "పంటను ఎంచుకోండి"],
    ["Planning context", "ప్రణాళిక సందర్భం"],
    ["Seeding date", "విత్తన తేదీ"],
    ["Start of schedule", "షెడ్యూల్ ప్రారంభం"],
    ["Planned actions", "ప్రణాళిక చర్యలు"],
    ["Calendar markers", "క్యాలెండర్ గుర్తులు"],
    ["Calendar", "క్యాలెండర్"],
    ["Action calendar", "చర్యల క్యాలెండర్"],
    ["The generated field actions are marked directly on the calendar.", "సృష్టించిన పొల చర్యలు నేరుగా క్యాలెండర్‌లో గుర్తించబడ్డాయి."],
    ["Questions", "ప్రశ్నలు"],
    ["Plan the crop schedule", "పంట షెడ్యూల్ రూపొందించండి"],
    ["Answer the crop and seeding date questions to generate the farm action timeline.", "ఫార్మ్ చర్యల టైమ్‌లైన్ రూపొందించడానికి పంట మరియు విత్తన తేదీ ప్రశ్నలకు సమాధానం ఇవ్వండి."],
    ["Question 1", "ప్రశ్న 1"],
    ["Enter the crop", "పంటను నమోదు చేయండి"],
    ["Suggested crops", "సూచించిన పంటలు"],
    ["Question 2", "ప్రశ్న 2"],
    ["Enter the seeding date", "విత్తన తేదీని నమోదు చేయండి"],
    ["Generated plan", "సృష్టించిన ప్రణాళిక"],
    ["Follow the dated actions below.", "క్రింద ఉన్న తేదీ వారీ చర్యలను అనుసరించండి."],
    ["Assigned actions", "కేటాయించిన చర్యలు"],
    ["Close", "మూసివేయండి"],
    ["Done", "పూర్తైంది"],
    ["Not done", "పూర్తి కాలేదు"],
    ["Reminder", "గుర్తుచూపు"],
    ["is still not done.", "ఇంకా పూర్తి కాలేదు."],
    ["Reminder active every 3 hours from", "ప్రతి 3 గంటలకు గుర్తుచూపు ప్రారంభం"],
    ["until you mark it done.", "మీరు పూర్తి చేసినట్లు గుర్తించే వరకు."],
    ["Prev", "ముందు"],
    ["Next", "తర్వాత"],
    ["All", "అన్ని"],
    ["Sun", "ఆది"],
    ["Mon", "సోమ"],
    ["Tue", "మంగళ"],
    ["Wed", "బుధ"],
    ["Thu", "గురు"],
    ["Fri", "శుక్ర"],
    ["Sat", "శని"],
    ["No actions", "చర్యలు లేవు"],
    ["Sensor operations", "సెన్సార్ కార్యాచరణలు"],
    ["A focused telemetry page for", "దీనికోసం కేంద్రీకృత టెలిమెట్రీ పేజీ"],
    ["live field monitoring", "ప్రత్యక్ష పొల పరిశీలన"],
    ["Last sync", "చివరి సమకాలీకరణ"],
    ["Environment node", "పర్యావరణ నోడ్"],
    ["Root zone", "రూట్ జోన్"],
    ["Live root temperature", "ప్రత్యక్ష రూట్ ఉష్ణోగ్రత"],
    ["Environment readings", "పర్యావరణ రీడింగ్స్"],
    ["NPK movement", "NPK చలనం"],
    ["Environmental balance", "పర్యావరణ సమతుల్యం"],
    ["Realtime feed", "రియల్‌టైమ్ ఫీడ్"],
    ["Operational notes", "కార్యాచరణ గమనికలు"],
    ["A dedicated page for the sensor stream and the latest field signals.", "సెన్సార్ స్ట్రీమ్ మరియు తాజా పొల సంకేతాల కోసం ప్రత్యేక పేజీ."],
    ["seeded on", "నాటిన తేదీ"],
    ["per quintal", "క్వింటాల్‌కు"],
    ["(Vegetable)", "(కూరగాయ)"],
    ["Booting the field workspace", "ఫీల్డ్ వర్క్‌స్పేస్ ప్రారంభమవుతోంది"],
    ["Loading soil context, recommendations, and live telemetry.", "మట్టి సమాచారం, సిఫార్సులు, ప్రత్యక్ష టెలిమెట్రీ లోడ్ అవుతోంది."],
    ["Unable to load the dashboard", "డ్యాష్‌బోర్డ్‌ను లోడ్ చేయలేకపోయాం"],
    ["Please make sure the backend server is running and try again.", "దయచేసి బ్యాక్‌ఎండ్ సర్వర్ నడుస్తోందో చూసి మళ్లీ ప్రయత్నించండి."],
    ["Retry", "మళ్లీ ప్రయత్నించండి"],
    ["Pest gallery", "కీటక గ్యాలరీ"],
    ["Common pests and disease references", "సాధారణ కీటకాలు మరియు రోగ సూచనలు"],
    ["Web-loaded visual references for different pests or diseases linked to the selected crop.", "ఎంచుకున్న పంటకు సంబంధించిన కీటకాలు లేదా రోగాలకు వెబ్ నుండి లోడ్ అయ్యే దృశ్య సూచనలు."],
    ["Loading pest photo...", "కీటక చిత్రం లోడ్ అవుతోంది..."],
    ["Photo unavailable right now.", "చిత్రం ప్రస్తుతం అందుబాటులో లేదు."],
    ["The deployed app could not reach its API. Make sure the backend routes are deployed correctly.", "డిప్లాయ్ చేసిన యాప్ తన API ను చేరుకోలేకపోయింది. బ్యాక్‌ఎండ్ రూట్లు సరిగ్గా డిప్లాయ్ అయ్యాయో చూడండి."],
    ["The API returned HTML instead of JSON. Check that the backend route is deployed correctly.", "API JSON బదులుగా HTML ను ఇచ్చింది. బ్యాక్‌ఎండ్ రూట్ సరిగ్గా డిప్లాయ్ అయ్యిందో పరిశీలించండి."],
    ["Unable to reach the API right now. Please try again.", "ప్రస్తుతం API ను చేరుకోలేకపోయాం. దయచేసి మళ్లీ ప్రయత్నించండి."],
    ["The server returned an invalid JSON response.", "సర్వర్ అమాన్యమైన JSON ప్రతిస్పందనను ఇచ్చింది."],
    ["Pest", "కీటకం"],
    ["Search topic:", "శోధన విషయం:"],
    ["Source: Wikipedia", "మూలం: వికీపీడియా"],
    ["Open assistant", "సహాయకాన్ని తెరవండి"],
    ["Sending...", "పంపుతోంది..."],
    ["Seeding", "విత్తనం"],
    ["Irrigation", "పారుదల"],
    ["Fertilizer", "ఎరువు"],
    ["Weeding", "కలుపు తొలగింపు"],
    ["Pesticide", "పురుగుమందు"],
    ["Monitoring", "పర్యవేక్షణ"],
    ["Harvest", "పంట కోత"],
    ["Nitrogen", "నైట్రజన్"],
    ["Phosphorus", "ఫాస్ఫరస్"],
    ["Potassium", "పొటాషియం"],
    ["Content", "పదార్థం"],
    ["Rate", "మోతాదు"],
    ["Price range", "ధర పరిధి"],
    ["Cost / acre", "వ్యయం / ఎకరం"],
    ["Total plan", "మొత్తం ప్రణాళిక"],
    ["Live mix", "ప్రత్యక్ష మిశ్రమం"],
    ["Paddy", "వరి"],
    ["Wheat", "గోధుమ"],
    ["Barley", "బార్లీ"],
    ["Corn", "మొక్కజొన్న"],
    ["Sorghum", "జొన్న"],
    ["Millet", "సజ్జ"],
    ["Oats", "ఓట్స్"],
    ["Vegetables", "కూరగాయలు"],
    ["Tomato", "టమాటా"],
    ["Onion", "ఉల్లిపాయ"],
    ["Potato", "బంగాళదుంప"],
    ["Brinjal", "వంకాయ"],
    ["Okra", "బెండకాయ"],
    ["Chilli", "మిర్చి"],
    ["Cabbage", "క్యాబేజీ"],
    ["Cauliflower", "కాలీఫ్లవర్"],
    ["Carrot", "క్యారెట్"],
    ["Cucumber", "దోసకాయ"],
    ["Spinach", "పాలకూర"],
    ["Beans", "బీన్స్"],
    ["Peas", "బఠానీలు"],
    ["Bottle Gourd", "సొరకాయ"],
    ["Pumpkin", "గుమ్మడికాయ"],
    ["Cereal", "ధాన్యం"],
    ["Vegetable", "కూరగాయ"],
    ["Healthy", "ఆరోగ్యకరమైన"],
    ["Optimal", "అనుకూలం"],
    ["Warning", "హెచ్చరిక"],
    ["Critical", "తీవ్రమైన"],
    ["Profile", "ప్రొఫైల్"],
    ["Farm Overview", "ఫార్మ్ అవలోకనం"],
    ["Current Soil Report", "ప్రస్తుత మట్టి నివేదిక"],
    ["Overall Soil Health", "మొత్తం మట్టి ఆరోగ్యం"],
    ["Current report", "ప్రస్తుత నివేదిక"],
    ["Soil status", "మట్టి స్థితి"],
    ["Active record", "సక్రియ నమోదు"],
    ["Real Time Sensor Data", "రియల్‌టైమ్ సెన్సార్ డేటా"],
    ["Soil Sensor Snapshot", "మట్టి సెన్సార్ స్నాప్‌షాట్"],
    ["Environment Readings", "పర్యావరణ రీడింగ్స్"],
    ["Soil NPK Levels Trend", "మట్టి NPK స్థాయుల ధోరణి"],
    ["Environmental Conditions Distribution", "పర్యావరణ పరిస్థితుల పంపిణీ"],
    ["Last Updated", "చివరిసారిగా నవీకరించబడింది"],
    ["Sunlight Intensity", "సూర్యకాంతి తీవ్రత"],
    ["Temperature", "ఉష్ణోగ్రత"],
    ["Weather Data", "వాతావరణ డేటా"],
    ["Weather Trend", "వాతావరణ ధోరణి"],
    ["Nutrient Table", "పోషకాల పట్టిక"],
    ["Nutrient", "పోషకం"],
    ["Current Value", "ప్రస్తుత విలువ"],
    ["Threshold Values", "పరిమితి విలువలు"],
    ["Band", "స్థాయి"],
    ["Organic Fertilizers", "సేంద్రియ ఎరువులు"],
    ["Inorganic Fertilizers", "రసాయన ఎరువులు"],
    ["Farm Profile", "ఫార్మ్ ప్రొఫైల్"],
    ["Ask AgriCure AI", "AgriCure AI ను అడగండి"],
    ["Field Assistant", "పొల సహాయకుడు"],
    ["Soil summary", "మట్టి సారాంశం"],
    ["Fertilizer help", "ఎరువు సహాయం"],
    ["Sensor insights", "సెన్సార్ సమాచారం"],
    ["Type your question...", "మీ ప్రశ్నను టైప్ చేయండి..."],
    ["Send", "పంపండి"],
    ["Manage Account", "ఖాతా నిర్వహణ"],
    ["Brand examples", "బ్రాండ్ ఉదాహరణలు"],
    ["Agmarknet filters", "Agmarknet ఫిల్టర్లు"],
    ["Current prices and previous-year comparison are both pulled from Agmarknet for the selected crop and location.", "ఎంచుకున్న పంట మరియు ప్రాంతానికి సంబంధించిన ప్రస్తుత ధరలు, గత సంవత్సరంతో పోలిక రెండూ Agmarknet నుంచి తీసుకురాబడ్డాయి."],
    ["Location filters", "ప్రాంత ఫిల్టర్లు"],
    ["Select state", "రాష్ట్రాన్ని ఎంచుకోండి"],
    ["Select district", "జిల్లాను ఎంచుకోండి"],
    ["Choose state", "రాష్ట్రాన్ని ఎంచుకోండి"],
    ["Choose district", "జిల్లాను ఎంచుకోండి"],
    ["All districts", "అన్ని జిల్లాలు"],
    ["All districts in selected state", "ఎంచుకున్న రాష్ట్రంలోని అన్ని జిల్లాలు"],
    ["Market report", "మార్కెట్ నివేదిక"],
    ["Previous year report", "గత సంవత్సరం నివేదిక"],
    ["Latest report date", "తాజా నివేదిక తేదీ"],
    ["Markets reporting", "నివేదిక ఇచ్చిన మార్కెట్లు"],
    ["Average modal price", "సగటు మోడల్ ధర"],
    ["Arrivals", "ఆవకలు"],
    ["Min / max", "కనిష్ట / గరిష్ట"],
    ["Total arrivals", "మొత్తం ఆవకలు"],
    ["Reported", "నివేదించబడింది"],
    ["District-specific data was not found for the latest report, so the panel is showing the broader state report.", "తాజా నివేదికకు జిల్లా-స్థాయి డేటా లభించలేదు, అందుకే ప్యానెల్ విస్తృత రాష్ట్ర నివేదికను చూపిస్తోంది."],
    ["No Agmarknet report is available for this selection right now.", "ఈ ఎంపికకు ప్రస్తుతం Agmarknet నివేదిక అందుబాటులో లేదు."],
    ["Loading Agmarknet report for the selected crop and location...", "ఎంచుకున్న పంట మరియు ప్రాంతానికి సంబంధించిన Agmarknet నివేదిక లోడ్ అవుతోంది..."],
    ["Farmer details", "రైతు వివరాలు"],
    ["Farmer name", "రైతు పేరు"],
    ["Farmer", "రైతు"],
    ["Enter farmer name", "రైతు పేరును నమోదు చేయండి"],
    ["Land size", "భూమి విస్తీర్ణం"],
    ["Example: 4.5 acres", "ఉదాహరణ: 4.5 ఎకరాలు"],
    ["Profile settings", "ప్రొఫైల్ సెట్టింగ్స్"],
    ["Update the farmer details used for dashboard context and location-based price reporting.", "డ్యాష్‌బోర్డ్ సందర్భం మరియు ప్రాంతానికి సంబంధించిన ధరల నివేదికల కోసం ఉపయోగించే రైతు వివరాలను నవీకరించండి."],
    ["This profile drives the default Agmarknet state and district used in crop price insights across the app.", "ఈ ప్రొఫైల్ యాప్ అంతటా పంట ధర వివరాల కోసం ఉపయోగించే డిఫాల్ట్ Agmarknet రాష్ట్రం మరియు జిల్లాను నిర్ణయిస్తుంది."],
    ["Save profile", "ప్రొఫైల్ సేవ్ చేయండి"],
    ["Saving...", "సేవ్ అవుతోంది..."],
    ["Updated", "నవీకరించబడింది"],
    ["State", "రాష్ట్రం"],
    ["District", "జిల్లా"],
    ["Location", "ప్రాంతం"],
    ["Set the", "సెట్ చేయండి"],
    ["farmer profile and market location", "రైతు ప్రొఫైల్ మరియు మార్కెట్ ప్రాంతం"],
    ["State filters", "రాష్ట్ర ఫిల్టర్లు"],
    ["Central farmer support schemes", "కేంద్ర రైతు మద్దతు పథకాలు"],
    ["Central insurance schemes", "కేంద్ర బీమా పథకాలు"],
    ["Central schemes", "కేంద్ర పథకాలు"],
    ["State schemes", "రాష్ట్ర పథకాలు"],
    ["Insurance", "బీమా"],
    ["Official advisories", "అధికారిక సలహాలు"],
    ["Official link", "అధికారిక లింక్"],
    ["Protection products", "రక్షణ ఉత్పత్తులు"],
    ["PPQS references", "PPQS సూచనలు"],
    ["These links come from the Directorate of Plant Protection, Quarantine & Storage advisory section.", "ఈ లింకులు Plant Protection, Quarantine & Storage డైరెక్టరేట్ సలహా విభాగం నుంచి తీసుకోబడ్డాయి."],
    ["No crop-specific PPQS advisory was matched yet for this crop.", "ఈ పంటకు సంబంధించిన ప్రత్యేక PPQS సలహా ఇంకా దొరకలేదు."],
    ["farmer schemes", "రైతు పథకాలు"],
    ["insurance schemes", "బీమా పథకాలు"],
    ["Choose a state to load state-specific schemes.", "రాష్ట్రానికి ప్రత్యేకమైన పథకాలను లోడ్ చేయడానికి ఒక రాష్ట్రాన్ని ఎంచుకోండి."],
    ["Choose a state to load state insurance schemes.", "రాష్ట్ర బీమా పథకాలను లోడ్ చేయడానికి ఒక రాష్ట్రాన్ని ఎంచుకోండి."],
    ["Choose a state to load the matching state-specific scheme details.", "సరిపోయే రాష్ట్ర-ప్రత్యేక పథకం వివరాలను లోడ్ చేయడానికి ఒక రాష్ట్రాన్ని ఎంచుకోండి."],
    ["Choose a state to load the current crop price report and the same-month previous-year report from Agmarknet.", "ప్రస్తుత పంట ధర నివేదికను మరియు గత సంవత్సరం అదే నెల నివేదికను Agmarknet నుంచి లోడ్ చేయడానికి రాష్ట్రాన్ని ఎంచుకోండి."],
    ["Select a state for local schemes", "స్థానిక పథకాల కోసం రాష్ట్రాన్ని ఎంచుకోండి"],
    ["Select a state for insurance schemes", "బీమా పథకాల కోసం రాష్ట్రాన్ని ఎంచుకోండి"],
    ["Selected state", "ఎంచుకున్న రాష్ట్రం"],
    ["National farmer-focused schemes sourced from the Vikaspedia farmer schemes collection.", "Vikaspedia రైతు పథకాల సేకరణ నుంచి తీసుకున్న జాతీయ రైతు-కేంద్రిత పథకాలు."],
    ["Central farmer schemes are shown first. After you choose a state, the panel loads farmer-focused state schemes and insurance schemes for that state from Vikaspedia.", "మొదట కేంద్ర రైతు పథకాలు చూపబడతాయి. మీరు రాష్ట్రాన్ని ఎంచుకున్న తర్వాత, ఆ రాష్ట్రానికి సంబంధించిన రైతు-కేంద్రిత రాష్ట్ర పథకాలు మరియు బీమా పథకాలను ప్యానెల్ Vikaspedia నుంచి లోడ్ చేస్తుంది."],
    ["Insurance-related farmer schemes listed in the central Vikaspedia farmer collection.", "కేంద్ర Vikaspedia రైతు సేకరణలో ఉన్న బీమా సంబంధిత రైతు పథకాలు."],
    ["Loading government schemes from Vikaspedia...", "Vikaspedia నుంచి ప్రభుత్వ పథకాలు లోడ్ అవుతున్నాయి..."],
    ["No central schemes were returned right now.", "ప్రస్తుతం కేంద్ర పథకాలు ఏవీ లభించలేదు."],
    ["No central insurance schemes were returned right now.", "ప్రస్తుతం కేంద్ర బీమా పథకాలు ఏవీ లభించలేదు."],
    ["No farmer-focused state schemes were matched for this selection yet.", "ఈ ఎంపికకు సంబంధించిన రైతు-కేంద్రిత రాష్ట్ర పథకాలు ఇంకా లభించలేదు."],
    ["No state insurance scheme was matched for this selection yet.", "ఈ ఎంపికకు సంబంధించిన రాష్ట్ర బీమా పథకం ఇంకా లభించలేదు."],
    ["View Vikaspedia", "Vikaspedia చూడండి"],
    ["Use when", "ఎప్పుడు ఉపయోగించాలి"],
    ["Check local dealer", "స్థానిక విక్రేత వద్ద తనిఖీ చేయండి"],
    ["Source", "మూలం"],
    ["Very Poor", "చాలా బలహీనమైనది"],
    ["Poor", "బలహీనమైనది"],
    ["Moderate", "మధ్యస్థం"],
    ["Rebuild soil health urgently - consult agronomist", "మట్టి ఆరోగ్యాన్ని తక్షణం మెరుగుపరచండి - వ్యవసాయ నిపుణుడిని సంప్రదించండి"],
    ["Correct nutrient imbalance soon to prevent yield loss", "దిగుబడి నష్టాన్ని నివారించేందుకు పోషకాల అసమతుల్యతను త్వరగా సరిచేయండి"],
    ["Maintain nutrients carefully and keep moisture steady", "పోషకాలను జాగ్రత్తగా నిలబెట్టండి మరియు తేమను స్థిరంగా ఉంచండి"],
    ["Soil condition is stable for the current crop stage", "ప్రస్తుత పంట దశకు మట్టి పరిస్థితి స్థిరంగా ఉంది"],
    ["Soil biological activity and nutrient balance need immediate correction.", "మట్టిలో జీవ క్రియాశీలత మరియు పోషకాల సమతుల్యతకు తక్షణ సవరణ అవసరం."],
    ["Targeted fertilizer support and irrigation discipline are recommended.", "లక్ష్యిత ఎరువు మద్దతు మరియు క్రమబద్ధమైన పారుదల సిఫార్సు చేయబడుతున్నాయి."],
    ["Monitor nutrient drift and continue balanced field management.", "పోషకాల మార్పులను గమనించి సమతుల్యమైన పొల నిర్వహణను కొనసాగించండి."],
    ["Current field conditions are favorable for continued crop growth.", "ప్రస్తుత పొల పరిస్థితులు పంట పెరుగుదలకు అనుకూలంగా ఉన్నాయి."],
    ["Nitrogen (N)", "నైట్రోజన్ (N)"],
    ["Phosphorus (P)", "ఫాస్ఫరస్ (P)"],
    ["Potassium (K)", "పొటాషియం (K)"],
    ["pH Level", "pH స్థాయి"],
    ["Electrical Conductivity", "విద్యుత్ వాహకత"],
    ["Soil Moisture", "మట్టి తేమ"],
    ["Soil Temperature", "మట్టి ఉష్ణోగ్రత"],
    ["Root Zone Temperature", "రూట్ జోన్ ఉష్ణోగ్రత"],
    ["Battery Reserve", "బ్యాటరీ నిల్వ"],
    ["Environment sensor", "పర్యావరణ సెన్సార్"],
    ["Live root-zone reading", "ప్రత్యక్ష రూట్-జోన్ రీడింగ్"],
    ["Separate fertilizer guidance for organic inputs and inorganic nutrient correction based on the latest soil report.", "తాజా మట్టి నివేదిక ఆధారంగా సేంద్రియ ఇన్‌పుట్లు మరియు రసాయన పోషక సవరణకు వేర్వేరు ఎరువు మార్గదర్శనం."]
  ]
};

const RESIDUAL_TRANSLATIONS = {
  hi: [
    ["AgriCure AI", "एग्रीक्योर एआई"],
    ["AgriCure", "एग्रीक्योर"],
    ["Field copilot", "फील्ड सहायक"],
    ["Voice input is not supported in this browser.", "इस ब्राउज़र में वॉइस इनपुट समर्थित नहीं है।"],
    ["Listening in selected language...", "चयनित भाषा में सुन रहा है..."],
    ["Voice chat ready", "वॉइस चैट तैयार है"],
    ["Start voice", "वॉइस शुरू करें"],
    ["Stop voice", "वॉइस रोकें"],
    ["Thinking through your farm data...", "आपके खेत के डेटा का विश्लेषण किया जा रहा है..."],
    ["You", "आप"],
    ["Status", "स्थिति"],
    ["Field", "खेत"],
    ["copilot", "सहायक"],
    ["Dashboard", "डैशबोर्ड"],
    ["Select", "चुनें"],
    ["Crop", "फसल"],
    ["Crops", "फसलें"],
    ["Recommendation", "सिफारिश"],
    ["Recommendations", "सिफारिशें"],
    ["Fertilizer", "उर्वरक"],
    ["Organic", "जैविक"],
    ["Inorganic", "अकार्बनिक"],
    ["Soil", "मिट्टी"],
    ["Sensor", "सेंसर"],
    ["Sensors", "सेंसर"],
    ["Data", "डेटा"],
    ["Weather", "मौसम"],
    ["Report", "रिपोर्ट"],
    ["Current", "वर्तमान"],
    ["Latest", "नवीनतम"],
    ["Real Time", "रियल-टाइम"],
    ["Environment", "पर्यावरण"],
    ["Readings", "रीडिंग्स"],
    ["Reading", "रीडिंग"],
    ["Temperature", "तापमान"],
    ["Moisture", "नमी"],
    ["Humidity", "आर्द्रता"],
    ["Battery", "बैटरी"],
    ["Reserve", "रिज़र्व"],
    ["Network", "नेटवर्क"],
    ["Probe", "प्रोब"],
    ["average", "औसत"],
    ["Average", "औसत"],
    ["Active", "सक्रिय"],
    ["Support", "समर्थन"],
    ["Maintenance", "रखरखाव"],
    ["Correction", "सुधार"],
    ["Application", "प्रयोग"],
    ["Dose", "मात्रा"],
    ["Growth", "वृद्धि"],
    ["Nutrient", "पोषक"],
    ["Nutrients", "पोषक तत्व"],
    ["Nitrogen", "नाइट्रोजन"],
    ["Phosphorus", "फॉस्फोरस"],
    ["Potassium", "पोटैशियम"],
    ["Level", "स्तर"],
    ["Target", "लक्ष्य"],
    ["Low", "कम"],
    ["Medium", "मध्यम"],
    ["High", "उच्च"],
    ["Healthy", "स्वस्थ"],
    ["Critical", "गंभीर"],
    ["Warning", "चेतावनी"],
    ["Summary", "सारांश"],
    ["Planning", "योजना"],
    ["Action", "कार्य"],
    ["Actions", "कार्य"],
    ["Irrigation", "सिंचाई"],
    ["Weeding", "निराई"],
    ["Monitoring", "निगरानी"],
    ["Harvest", "कटाई"],
    ["Seeding", "बुवाई"],
    ["Protection", "सुरक्षा"],
    ["Cycle", "चक्र"],
    ["Schedule", "कार्यक्रम"],
    ["Overview", "अवलोकन"],
    ["Profile", "प्रोफ़ाइल"],
    ["Market", "बाज़ार"],
    ["Price", "मूल्य"],
    ["Prices", "मूल्य"],
    ["Cost", "लागत"],
    ["Total", "कुल"],
    ["State", "राज्य"],
    ["District", "ज़िला"],
    ["Scheme", "योजना"],
    ["Schemes", "योजनाएँ"],
    ["Insurance", "बीमा"],
    ["Farmer", "किसान"],
    ["Name", "नाम"],
    ["Official", "आधिकारिक"],
    ["Link", "लिंक"],
    ["Advisory", "परामर्श"],
    ["Source", "स्रोत"],
    ["Latest", "नवीनतम"],
    ["Network", "नेटवर्क"],
    ["Battery", "बैटरी"],
    ["Urea", "यूरिया"],
    ["Calcium Ammonium Nitrate", "कैल्शियम अमोनियम नाइट्रेट"],
    ["Diammonium Phosphate", "डायमोनियम फॉस्फेट"],
    ["Single Super Phosphate", "सिंगल सुपर फॉस्फेट"],
    ["Muriate of Potash", "म्यूरिएट ऑफ पोटाश"],
    ["Potash", "पोटाश"],
    ["Blood Meal", "ब्लड मील"],
    ["Neem Cake", "नीम केक"],
    ["Bone Meal", "बोन मील"],
    ["Poultry Manure", "पोल्ट्री खाद"],
    ["Compost", "कम्पोस्ट"],
    ["PROM", "प्रोम"],
    ["DAP", "डीएपी"],
    ["SSP", "एसएसपी"],
    ["MOP", "एमओपी"],
    ["CAN", "सीएएन"],
    ["MAP", "एमएपी"],
    ["SOP", "एसओपी"],
    ["NPK", "एनपीके"],
    ["PPQS", "पीपीक्यूएस"],
    ["Wikipedia", "विकिपीडिया"],
    ["Vikaspedia", "विकासपीडिया"],
    ["Agmarknet", "एगमार्कनेट"],
    ["kg", "किग्रा"],
    ["acre", "एकड़"],
    ["acres", "एकड़"],
    ["quintal", "क्विंटल"],
    ["lux", "लक्स"],
    ["ms", "मि.से."],
    ["Rs", "रु"]
  ],
  te: [
    ["AgriCure AI", "అగ్రిక్యూర్ ఏఐ"],
    ["AgriCure", "అగ్రిక్యూర్"],
    ["Field copilot", "పొల సహాయకుడు"],
    ["Voice input is not supported in this browser.", "ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్‌కు మద్దతు లేదు."],
    ["Listening in selected language...", "ఎంచుకున్న భాషలో వింటోంది..."],
    ["Voice chat ready", "వాయిస్ చాట్ సిద్ధంగా ఉంది"],
    ["Start voice", "వాయిస్ ప్రారంభించండి"],
    ["Stop voice", "వాయిస్ ఆపండి"],
    ["Thinking through your farm data...", "మీ పొల డేటాను విశ్లేషిస్తోంది..."],
    ["You", "మీరు"],
    ["Status", "స్థితి"],
    ["Field", "పొల"],
    ["copilot", "సహాయకుడు"],
    ["Dashboard", "డ్యాష్‌బోర్డ్"],
    ["Select", "ఎంచుకోండి"],
    ["Crop", "పంట"],
    ["Crops", "పంటలు"],
    ["Recommendation", "సిఫార్సు"],
    ["Recommendations", "సిఫార్సులు"],
    ["Fertilizer", "ఎరువు"],
    ["Organic", "సేంద్రియ"],
    ["Inorganic", "రసాయన"],
    ["Soil", "మట్టి"],
    ["Sensor", "సెన్సార్"],
    ["Sensors", "సెన్సార్లు"],
    ["Data", "డేటా"],
    ["Weather", "వాతావరణం"],
    ["Report", "నివేదిక"],
    ["Current", "ప్రస్తుత"],
    ["Latest", "తాజా"],
    ["Real Time", "రియల్‌టైమ్"],
    ["Environment", "పర్యావరణం"],
    ["Readings", "రీడింగ్స్"],
    ["Reading", "రీడింగ్"],
    ["Temperature", "ఉష్ణోగ్రత"],
    ["Moisture", "తేమ"],
    ["Humidity", "ఆర్ద్రత"],
    ["Battery", "బ్యాటరీ"],
    ["Reserve", "నిల్వ"],
    ["Network", "నెట్‌వర్క్"],
    ["Probe", "ప్రోబ్"],
    ["average", "సగటు"],
    ["Average", "సగటు"],
    ["Active", "సక్రియ"],
    ["Support", "మద్దతు"],
    ["Maintenance", "నిర్వహణ"],
    ["Correction", "సరిదిద్దడం"],
    ["Application", "వర్తింపు"],
    ["Dose", "మోతాదు"],
    ["Growth", "వృద్ధి"],
    ["Nutrient", "పోషకం"],
    ["Nutrients", "పోషకాలు"],
    ["Nitrogen", "నైట్రోజన్"],
    ["Phosphorus", "ఫాస్ఫరస్"],
    ["Potassium", "పొటాషియం"],
    ["Level", "స్థాయి"],
    ["Target", "లక్ష్యం"],
    ["Low", "తక్కువ"],
    ["Medium", "మధ్యస్థ"],
    ["High", "అధిక"],
    ["Healthy", "ఆరోగ్యకరమైన"],
    ["Critical", "తీవ్రమైన"],
    ["Warning", "హెచ్చరిక"],
    ["Summary", "సారాంశం"],
    ["Planning", "ప్రణాళిక"],
    ["Action", "చర్య"],
    ["Actions", "చర్యలు"],
    ["Irrigation", "పారుదల"],
    ["Weeding", "కలుపు తొలగింపు"],
    ["Monitoring", "పర్యవేక్షణ"],
    ["Harvest", "పంట కోత"],
    ["Seeding", "విత్తనం"],
    ["Protection", "రక్షణ"],
    ["Cycle", "చక్రం"],
    ["Schedule", "షెడ్యూల్"],
    ["Overview", "అవలోకనం"],
    ["Profile", "ప్రొఫైల్"],
    ["Market", "మార్కెట్"],
    ["Price", "ధర"],
    ["Prices", "ధరలు"],
    ["Cost", "ఖర్చు"],
    ["Total", "మొత్తం"],
    ["State", "రాష్ట్రం"],
    ["District", "జిల్లా"],
    ["Scheme", "పథకం"],
    ["Schemes", "పథకాలు"],
    ["Insurance", "బీమా"],
    ["Farmer", "రైతు"],
    ["Name", "పేరు"],
    ["Official", "అధికారిక"],
    ["Link", "లింక్"],
    ["Advisory", "సలహా"],
    ["Source", "మూలం"],
    ["Urea", "యూరియా"],
    ["Calcium Ammonium Nitrate", "కాల్షియం అమ్మోనియం నైట్రేట్"],
    ["Diammonium Phosphate", "డైఅమ్మోనియం ఫాస్ఫేట్"],
    ["Single Super Phosphate", "సింగిల్ సూపర్ ఫాస్ఫేట్"],
    ["Muriate of Potash", "మ్యూరియేట్ ఆఫ్ పొటాష్"],
    ["Potash", "పొటాష్"],
    ["Blood Meal", "బ్లడ్ మీల్"],
    ["Neem Cake", "నీమ్కేక్"],
    ["Bone Meal", "బోన్ మీల్"],
    ["Poultry Manure", "పోల్ట్రీ ఎరువు"],
    ["Compost", "కంపోస్ట్"],
    ["PROM", "ప్రమ్"],
    ["DAP", "డీఏపీ"],
    ["SSP", "ఎస్‌ఎస్‌పీ"],
    ["MOP", "ఎంఓపీ"],
    ["CAN", "సీఏఎన్"],
    ["MAP", "ఎంఏపీ"],
    ["SOP", "ఎస్‌ఓపీ"],
    ["NPK", "ఎన్‌పీకే"],
    ["PPQS", "పీపీక్యూఎస్"],
    ["Wikipedia", "వికీపీడియా"],
    ["Vikaspedia", "వికాస్‌పీడియా"],
    ["Agmarknet", "అగ్‌మార్క్‌నెట్"],
    ["kg", "కిలో"],
    ["acre", "ఎకరం"],
    ["acres", "ఎకరాలు"],
    ["quintal", "క్వింటాల్"],
    ["lux", "లక్స్"],
    ["ms", "మి.సె."],
    ["Rs", "రూ"]
  ]
};

const LETTER_NAMES = {
  hi: {
    a: "ए", b: "बी", c: "सी", d: "डी", e: "ई", f: "एफ", g: "जी", h: "एच", i: "आई",
    j: "जे", k: "के", l: "एल", m: "एम", n: "एन", o: "ओ", p: "पी", q: "क्यू", r: "आर",
    s: "एस", t: "टी", u: "यू", v: "वी", w: "डब्ल्यू", x: "एक्स", y: "वाई", z: "जेड"
  },
  te: {
    a: "ఏ", b: "బీ", c: "సీ", d: "డీ", e: "ఈ", f: "ఎఫ్", g: "జీ", h: "హెచ్", i: "ఐ",
    j: "జే", k: "కే", l: "ఎల్", m: "ఎం", n: "ఎన్", o: "ఓ", p: "పీ", q: "క్యూ", r: "ఆర్",
    s: "ఎస్", t: "టీ", u: "యూ", v: "వీ", w: "డబ్ల్యూ", x: "ఎక్స్", y: "వై", z: "జెడ్"
  }
};

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceHardCodedPhrase(current, source, target) {
  if (current === source) {
    return target;
  }

  const escapedSource = escapeRegExp(source);
  const usesWordBoundaries = /^[A-Za-z0-9]/.test(source) && /[A-Za-z0-9)]$/.test(source);

  if (usesWordBoundaries) {
    return current.replace(
      new RegExp(`(^|[^A-Za-z0-9])${escapedSource}(?=$|[^A-Za-z0-9])`, "g"),
      (match, prefix) => `${prefix}${target}`
    );
  }

  return current.replace(new RegExp(escapedSource, "g"), target);
}

function spellLatinToken(token, languageCode) {
  const letterNames = LETTER_NAMES[languageCode];

  if (!letterNames) {
    return token;
  }

  return token.replace(/[A-Za-z]/g, (character) => letterNames[character.toLowerCase()] || character);
}

function localizeResidualLatinText(value, languageCode) {
  if (languageCode === "en" || typeof value !== "string" || !/[A-Za-z]/.test(value)) {
    return value;
  }

  const residualPatterns = [...(RESIDUAL_TRANSLATIONS[languageCode] || [])].sort(
    (left, right) => right[0].length - left[0].length
  );
  const localizedValue = residualPatterns.reduce(
    (current, [source, target]) => replaceHardCodedPhrase(current, source, target),
    value
  );

  return localizedValue.replace(/[A-Za-z][A-Za-z0-9+-]*/g, (token) =>
    spellLatinToken(token, languageCode)
  );
}

function resolveAppErrorMessage(error, fallbackMessage) {
  if (error?.code === "API_UNREACHABLE") {
    return "The deployed app could not reach its API. Make sure the backend routes are deployed correctly.";
  }

  if (error?.code === "API_HTML_RESPONSE") {
    return "The API returned HTML instead of JSON. Check that the backend route is deployed correctly.";
  }

  if (error?.code === "API_FETCH_FAILED") {
    return "Unable to reach the API right now. Please try again.";
  }

  if (error?.code === "API_INVALID_JSON") {
    return "The server returned an invalid JSON response.";
  }

  return error?.message || fallbackMessage;
}

function translateText(value, languageCode) {
  if (languageCode === "en" || typeof value !== "string" || !value) {
    return value;
  }

  const patterns = [...(HARD_CODED_TRANSLATIONS[languageCode] || [])].sort(
    (left, right) => right[0].length - left[0].length
  );

  const translatedValue = patterns.reduce(
    (current, [source, target]) => replaceHardCodedPhrase(current, source, target),
    value
  );

  return localizeResidualLatinText(translatedValue, languageCode);
}

function translateContent(value, languageCode) {
  if (Array.isArray(value)) {
    return value.map((item) => translateContent(item, languageCode));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, itemValue]) => [key, translateContent(itemValue, languageCode)])
    );
  }

  return translateText(value, languageCode);
}

function getLanguageOptionLabel(language, activeLanguage) {
  const byCode = {
    en: {
      en: "English",
      hi: "अंग्रेज़ी",
      te: "ఇంగ్లీష్"
    },
    hi: {
      en: "Hindi",
      hi: "हिंदी",
      te: "హిందీ"
    },
    te: {
      en: "Telugu",
      hi: "तेलुगु",
      te: "తెలుగు"
    }
  };

  return byCode[language?.code]?.[activeLanguage] || language?.label || language?.code || "";
}

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

  if (normalized === "/action-planner") {
    return "/action-planner";
  }

  if (normalized === "/sensor-data") {
    return "/sensor-data";
  }

  if (normalized === "/storages") {
    return "/storages";
  }

  if (normalized === "/profile") {
    return "/profile";
  }

  if (normalized === "/contact") {
    return "/contact";
  }

  return "/";
}

function buildAgmarknetUnitLabel(unit) {
  const normalizedUnit = String(unit || "").toLowerCase();

  if (!normalizedUnit) {
    return "/ quintal";
  }

  if (normalizedUnit.includes("quintal")) {
    return "/ quintal";
  }

  if (normalizedUnit.includes("kg")) {
    return "/ kg";
  }

  if (normalizedUnit.includes("tonne")) {
    return "/ tonne";
  }

  return `/ ${String(unit).replace(/^rs\.?\//i, "").trim()}`;
}

function mergeCropMarketInsight(crop, insight) {
  if (!crop) {
    return crop;
  }

  if (!insight) {
    return {
      ...crop,
      marketSource: null
    };
  }

  return {
    ...crop,
    marketPrice: insight.latestPrice,
    marketUnit: buildAgmarknetUnitLabel(insight.priceUnit),
    marketSource: {
      marketName: insight.marketName,
      stateName: insight.stateName,
      lastReportedDate: insight.lastReportedDate,
      source: insight.source
    }
  };
}

function collectAgmarknetCropKeys(selectedCropKey, predictedCrops, predictedCropSections) {
  return Array.from(
    new Set(
      [
        selectedCropKey,
        ...(predictedCrops || []).slice(0, 5).map((item) => item.key),
        ...((predictedCropSections?.cereals || []).slice(0, 3).map((item) => item.key)),
        predictedCropSections?.vegetable?.key
      ].filter(Boolean)
    )
  );
}

function buildLocationKey(stateName, districtName) {
  return `${String(stateName || "").trim()}::${String(districtName || "").trim()}`;
}

function normalizeLocationLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findStateOption(states, stateName) {
  const normalizedState = normalizeLocationLabel(stateName);

  if (!normalizedState) {
    return null;
  }

  return (states || []).find((state) => normalizeLocationLabel(state.name) === normalizedState) || null;
}

function findDistrictOption(states, stateName, districtName) {
  const state = findStateOption(states, stateName);
  const normalizedDistrict = normalizeLocationLabel(districtName);

  if (!state || !normalizedDistrict) {
    return null;
  }

  return (
    (state.districts || []).find(
      (district) => normalizeLocationLabel(district.name) === normalizedDistrict
    ) || null
  );
}

function matchesLocationOption(optionName, value) {
  return normalizeLocationLabel(optionName) === normalizeLocationLabel(value);
}

function canonicalizeLocationSelection(states, stateName, districtName) {
  const matchedState = findStateOption(states, stateName);
  const matchedDistrict = findDistrictOption(
    states,
    matchedState?.name || stateName,
    districtName
  );

  return {
    state: matchedState?.name || String(stateName || "").trim(),
    district: matchedDistrict?.name || String(districtName || "").trim()
  };
}

function getDistrictOptionsForState(states, stateName) {
  const match = findStateOption(states, stateName);
  return match?.districts || [];
}

function formatArrivals(arrivals, unit = "Metric Tonnes") {
  if (arrivals === null || arrivals === undefined || arrivals === "") {
    return "N/A";
  }

  return `${formatNumber(arrivals, 1)} ${unit}`;
}

function formatDistanceLabel(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || distanceKm === "") {
    return "Distance unavailable";
  }

  return `${formatNumber(distanceKm, 1)} km away`;
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
  const [plannerSeedingDate, setPlannerSeedingDate] = useState("");
  const [plannerActionStatus, setPlannerActionStatus] = useState({});
  const [plannerReminders, setPlannerReminders] = useState([]);
  const [marketInsights, setMarketInsights] = useState({});
  const [marketInsightAttempts, setMarketInsightAttempts] = useState({});
  const [agmarknetLocations, setAgmarknetLocations] = useState([]);
  const [priceFilterState, setPriceFilterState] = useState("");
  const [priceFilterDistrict, setPriceFilterDistrict] = useState("");
  const [priceReport, setPriceReport] = useState(null);
  const [priceReportLoading, setPriceReportLoading] = useState(false);
  const [priceReportError, setPriceReportError] = useState("");
  const [storageFilterState, setStorageFilterState] = useState("");
  const [storageFilterDistrict, setStorageFilterDistrict] = useState("");
  const [nearbyStorages, setNearbyStorages] = useState([]);
  const [nearbyStoragesLoading, setNearbyStoragesLoading] = useState(false);
  const [nearbyStoragesError, setNearbyStoragesError] = useState("");
  const [nearbyStorageMeta, setNearbyStorageMeta] = useState(null);
  const [storageUserPosition, setStorageUserPosition] = useState(null);
  const [storageLocationStatus, setStorageLocationStatus] = useState("idle");
  const [areaStorages, setAreaStorages] = useState([]);
  const [areaStoragesLoading, setAreaStoragesLoading] = useState(false);
  const [areaStoragesError, setAreaStoragesError] = useState("");
  const [areaStorageMeta, setAreaStorageMeta] = useState(null);
  const [ppqsAdvisories, setPpqsAdvisories] = useState({});
  const [schemeFilterState, setSchemeFilterState] = useState("");
  const [schemeInsights, setSchemeInsights] = useState(null);
  const [schemeInsightsLoading, setSchemeInsightsLoading] = useState(false);
  const [schemeInsightsError, setSchemeInsightsError] = useState("");
  const [seedVarietyInsights, setSeedVarietyInsights] = useState(null);
  const [seedVarietyLoading, setSeedVarietyLoading] = useState(false);
  const [seedVarietyError, setSeedVarietyError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const profileRef = useRef(null);
  const nearbyStorageRequestKeyRef = useRef("");
  const areaStorageRequestKeyRef = useRef("");

  const activeLanguage = site?.selectedLanguage || "en";
  const profileLocationKey = buildLocationKey(site?.profile?.state, site?.profile?.district);
  const translate = (value) => translateText(value, activeLanguage);
  const uiText = translateContent(site?.uiText || FALLBACK_UI_TEXT, activeLanguage);
  const selectedCrop = getCropProfile(selectedCropKey);
  const cropUi = uiText.recommendationWorkspace.cropSelection;
  const navItems = useMemo(
    () =>
      NAV_ITEM_CONFIG.map((item) => ({
        ...item,
        label: translate(item.label)
      })),
    [activeLanguage]
  );
  const actionPlannerOptions = useMemo(
    () =>
      ACTION_PLANNER_OPTIONS.map((item) => ({
        ...item,
        label: translate(item.label)
      })),
    [activeLanguage]
  );
  const basePredictedCrops = useMemo(
    () => (dashboard ? buildPredictedCropSuggestions(dashboard) : []),
    [dashboard]
  );
  const basePredictedCropSections = useMemo(
    () =>
      dashboard
        ? buildPredictedCropSections(dashboard)
        : { cereals: [], vegetable: null },
    [dashboard]
  );
  const agmarknetCropKeys = useMemo(
    () =>
      collectAgmarknetCropKeys(
        selectedCropKey,
        basePredictedCrops,
        basePredictedCropSections
      ),
    [basePredictedCropSections, basePredictedCrops, selectedCropKey]
  );
  const predictedCrops = basePredictedCrops
    .map((item) => mergeCropMarketInsight(item, marketInsights[item.key]))
    .map((item) => ({
      ...item,
      label: translate(item.label),
      family: translate(item.family),
      marketUnit: translate(item.marketUnit),
      reason: translate(item.reason)
    }));
  const predictedCropSections = translateContent(
    {
      cereals: basePredictedCropSections.cereals.map((item) =>
        mergeCropMarketInsight(item, marketInsights[item.key])
      ),
      vegetable: mergeCropMarketInsight(
        basePredictedCropSections.vegetable,
        marketInsights[basePredictedCropSections.vegetable?.key]
      )
    },
    activeLanguage
  );
  const selectedCropInsight = selectedCropKey ? marketInsights[selectedCropKey] : null;
  const selectedCropAdvisories = selectedCropKey ? ppqsAdvisories[selectedCropKey] : null;
  const priceDistrictOptions = getDistrictOptionsForState(agmarknetLocations, priceFilterState);
  const storageDistrictOptions = getDistrictOptionsForState(agmarknetLocations, storageFilterState);
  const weatherSnapshot = dashboard
    ? translateContent(buildWeatherSnapshot(dashboard, uiText), activeLanguage)
    : [];
  const weatherTrend = dashboard
    ? translateContent(buildWeatherTrendSeries(dashboard, uiText, weatherRange), activeLanguage)
    : null;
  const toolModel = dashboard
    ? translateContent(
        buildToolWorkspaceModel(
          activeToolKey,
          site,
          dashboard,
          selectedCropKey,
          marketInsights
        ),
        activeLanguage
      )
    : null;
  const activeWorkspaceTool = uiText.recommendationWorkspace.tools.find(
    (tool) => tool.key === activeToolKey
  );
  const workspaceToolModel =
    toolModel ||
    (activeWorkspaceTool
      ? {
          title: activeWorkspaceTool.title,
          badge: activeWorkspaceTool.badge,
          subtitle: activeWorkspaceTool.description,
          mode: "dynamic",
          cards: [],
          checklistTitle: translate("Recommendations"),
          checklist: [],
          note: ""
        }
      : null);
  const cropSpecificRows = translateContent(
    buildCropSpecificTableRows(dashboard?.recommendations?.tableRows || [], selectedCropKey, uiText),
    activeLanguage
  );
  const cropRecommendations = dashboard
    ? translateContent(buildCropSpecificRecommendations(dashboard, selectedCropKey), activeLanguage)
    : { summary: "", organic: [], inorganic: [] };
  const plannerActions = buildPlannerActions(
    selectedCrop,
    plannerSeedingDate,
    cropRecommendations
  ).map((action) => ({
    ...action,
    title: translate(action.title),
    shortLabel: translate(action.shortLabel),
    description: translate(action.description)
  }));
  const plannerActionStatuses = buildPlannerActionStatuses(
    plannerActions,
    plannerActionStatus
  );
  const realtimeCardSets = dashboard
    ? translateContent(buildRealtimeCardSets(dashboard, uiText), activeLanguage)
    : null;
  const realtimeTrend = dashboard
    ? translateContent(buildNpkTrendSeries(dashboard), activeLanguage)
    : null;
  const environmentSegments = realtimeCardSets
    ? translateContent(buildEnvironmentSegments(realtimeCardSets, uiText), activeLanguage)
    : [];

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      try {
        const { response, payload } = await requestJson("/api/agmarknet/locations");

        if (!response.ok || cancelled) {
          return;
        }

        setAgmarknetLocations(payload.states || []);
      } catch {
        // Keep location selectors empty if the lookup request fails.
      }
    }

    loadLocations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMarketInsights({});
    setMarketInsightAttempts({});
  }, [profileLocationKey]);

  useEffect(() => {
    const location = canonicalizeLocationSelection(
      agmarknetLocations,
      site?.profile?.state,
      site?.profile?.district
    );

    setPriceFilterState(location.state);
    setPriceFilterDistrict(location.district);
    setStorageFilterState(location.state);
    setStorageFilterDistrict(location.district);
    setSchemeFilterState(location.state);
  }, [agmarknetLocations, site?.profile?.state, site?.profile?.district]);

  useEffect(() => {
    if (
      priceFilterDistrict &&
      !priceDistrictOptions.some((district) => matchesLocationOption(district.name, priceFilterDistrict))
    ) {
      setPriceFilterDistrict("");
    }
  }, [priceDistrictOptions, priceFilterDistrict]);

  useEffect(() => {
    if (
      storageFilterDistrict &&
      !storageDistrictOptions.some((district) => matchesLocationOption(district.name, storageFilterDistrict))
    ) {
      setStorageFilterDistrict("");
    }
  }, [storageDistrictOptions, storageFilterDistrict]);

  useEffect(() => {
    const missingCropKeys = agmarknetCropKeys.filter(
      (cropKey) => !marketInsights[cropKey] && !marketInsightAttempts[cropKey]
    );

    if (missingCropKeys.length === 0) {
      return;
    }

    let cancelled = false;

    setMarketInsightAttempts((current) => {
      const nextState = { ...current };
      missingCropKeys.forEach((cropKey) => {
        nextState[cropKey] = true;
      });
      return nextState;
    });

    async function loadAgmarknetPrices() {
      try {
        const { response, payload } = await requestJson("/api/agmarknet/prices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cropKeys: missingCropKeys,
            stateName: site?.profile?.state || "",
            districtName: site?.profile?.district || ""
          })
        });

        if (!response.ok || cancelled) {
          return;
        }

        setMarketInsights((current) => ({
          ...current,
          ...(payload.insights || {})
        }));
      } catch {
        // Ignore Agmarknet issues and keep the static fallback prices in place.
      }
    }

    loadAgmarknetPrices();

    return () => {
      cancelled = true;
    };
  }, [
    agmarknetCropKeys,
    marketInsightAttempts,
    marketInsights,
    site?.profile?.district,
    site?.profile?.state
  ]);

  useEffect(() => {
    if (!selectedCropKey || ppqsAdvisories[selectedCropKey]) {
      return;
    }

    let cancelled = false;

    async function loadPpqsAdvisories() {
      try {
        const { response, payload } = await requestJson("/api/ppqs/advisories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cropKey: selectedCropKey
          })
        });

        if (!response.ok || cancelled) {
          return;
        }

        setPpqsAdvisories((current) => ({
          ...current,
          [selectedCropKey]: payload
        }));
      } catch {
        // Keep the protection panel usable even if PPQS is temporarily unavailable.
      }
    }

    loadPpqsAdvisories();

    return () => {
      cancelled = true;
    };
  }, [ppqsAdvisories, selectedCropKey]);

  useEffect(() => {
    if (activeToolKey !== "price" || !selectedCropKey || !priceFilterState) {
      setPriceReport(null);
      setPriceReportError("");
      return;
    }

    let cancelled = false;

    async function loadPriceReport() {
      setPriceReportLoading(true);
      setPriceReportError("");

      try {
        const { response, payload } = await requestJson("/api/agmarknet/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cropKey: selectedCropKey,
            stateName: priceFilterState,
            districtName: priceFilterDistrict
          })
        });

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load crop price report.");
        }

        if (!cancelled) {
          setPriceReport(payload.report || null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setPriceReport(null);
          setPriceReportError(
            resolveAppErrorMessage(loadError, "Unable to load crop price report.")
          );
        }
      } finally {
        if (!cancelled) {
          setPriceReportLoading(false);
        }
      }
    }

    loadPriceReport();

    return () => {
      cancelled = true;
    };
  }, [activeToolKey, priceFilterDistrict, priceFilterState, selectedCropKey]);

  useEffect(() => {
    if (activeToolKey !== "schemes") {
      return;
    }

    let cancelled = false;

    async function loadSchemeInsights() {
      setSchemeInsightsLoading(true);
      setSchemeInsightsError("");

      try {
        const { response, payload } = await requestJson("/api/vikaspedia/schemes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            stateName: schemeFilterState
          })
        });

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load government schemes.");
        }

        if (!cancelled) {
          setSchemeInsights(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setSchemeInsights(null);
          setSchemeInsightsError(
            resolveAppErrorMessage(loadError, "Unable to load government schemes.")
          );
        }
      } finally {
        if (!cancelled) {
          setSchemeInsightsLoading(false);
        }
      }
    }

    loadSchemeInsights();

    return () => {
      cancelled = true;
    };
  }, [activeToolKey, schemeFilterState]);

  useEffect(() => {
    if (activeToolKey !== "seed" || !selectedCropKey) {
      setSeedVarietyInsights(null);
      setSeedVarietyLoading(false);
      setSeedVarietyError("");
      return;
    }

    let cancelled = false;

    async function loadSeedVarieties() {
      setSeedVarietyLoading(true);
      setSeedVarietyError("");

      try {
        const { response, payload } = await requestJson("/api/seeds/official-varieties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cropKey: selectedCropKey
          })
        });

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load official seed varieties.");
        }

        if (!cancelled) {
          setSeedVarietyInsights(payload || null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setSeedVarietyInsights(null);
          setSeedVarietyError(
            resolveAppErrorMessage(loadError, "Unable to load official seed varieties.")
          );
        }
      } finally {
        if (!cancelled) {
          setSeedVarietyLoading(false);
        }
      }
    }

    loadSeedVarieties();

    return () => {
      cancelled = true;
    };
  }, [activeToolKey, selectedCropKey]);

  useEffect(() => {
    if (
      pathname !== "/storages" ||
      storageUserPosition ||
      storageLocationStatus !== "idle"
    ) {
      return;
    }

    if (typeof window === "undefined" || !window.navigator?.geolocation) {
      setStorageLocationStatus("unsupported");
      return;
    }

    setStorageLocationStatus("requesting");

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        setStorageUserPosition({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6))
        });
        setStorageLocationStatus("ready");
      },
      () => {
        setStorageLocationStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10 * 60 * 1000
      }
    );
  }, [pathname, storageLocationStatus, storageUserPosition]);

  useEffect(() => {
    if (pathname !== "/storages" || !storageUserPosition) {
      return;
    }

    const requestKey = `${storageUserPosition.latitude}:${storageUserPosition.longitude}`;

    if (nearbyStorageRequestKeyRef.current === requestKey) {
      return;
    }

    nearbyStorageRequestKeyRef.current = requestKey;
    let cancelled = false;

    async function loadNearbyStorages() {
      setNearbyStoragesLoading(true);
      setNearbyStoragesError("");

      try {
        const { response, payload } = await requestCachedStorageJson("/api/storages/nearby", {
          latitude: storageUserPosition.latitude,
          longitude: storageUserPosition.longitude,
          limit: 6
        });

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load nearby storages.");
        }

        if (!cancelled) {
          setNearbyStorages(payload.items || []);
          setNearbyStorageMeta(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setNearbyStorages([]);
          setNearbyStorageMeta(null);
          setNearbyStoragesError(
            resolveAppErrorMessage(loadError, "Unable to load nearby storages.")
          );
        }
      } finally {
        if (!cancelled) {
          setNearbyStoragesLoading(false);
        }
      }
    }

    loadNearbyStorages();

    return () => {
      cancelled = true;
    };
  }, [pathname, storageUserPosition]);

  useEffect(() => {
    if (pathname !== "/storages" || !storageFilterState) {
      setAreaStorages([]);
      setAreaStorageMeta(null);
      setAreaStoragesError("");
      areaStorageRequestKeyRef.current = "";
      return;
    }

    const requestKey = `${storageFilterState}:${storageFilterDistrict || "*"}`;

    if (areaStorageRequestKeyRef.current === requestKey) {
      return;
    }

    areaStorageRequestKeyRef.current = requestKey;
    let cancelled = false;

    async function loadAreaStorages() {
      setAreaStoragesLoading(true);
      setAreaStoragesError("");

      try {
        const { response, payload } = await requestCachedStorageJson("/api/storages/area", {
          stateName: storageFilterState,
          districtName: storageFilterDistrict,
          limit: 10
        });

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load storages for this area.");
        }

        if (!cancelled) {
          setAreaStorages(payload.items || []);
          setAreaStorageMeta(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setAreaStorages([]);
          setAreaStorageMeta(null);
          setAreaStoragesError(
            resolveAppErrorMessage(loadError, "Unable to load storages for this area.")
          );
        }
      } finally {
        if (!cancelled) {
          setAreaStoragesLoading(false);
        }
      }
    }

    loadAreaStorages();

    return () => {
      cancelled = true;
    };
  }, [pathname, storageFilterDistrict, storageFilterState]);

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
      pathname === "/profile"
        ? "Profile"
        :
      pathname === "/action-planner"
        ? "Action Planner"
        : pathname === "/recommendations"
          ? "Recommendations"
          : pathname === "/sensor-data"
            ? "Sensor Data"
            : pathname === "/storages"
              ? "Storages"
            : "Overview";

    document.title = `${site?.brand || "AgriCure"} | ${translate(pageTitle)}`;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
  }, [pathname, site?.brand, activeLanguage]);

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
    if (typeof window === "undefined") {
      return;
    }

    try {
      const saved = window.localStorage.getItem("plannerActionStatus");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed && typeof parsed === "object") {
          setPlannerActionStatus(parsed);
        }
      }
    } catch {
      // Ignore local storage read issues.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem("plannerActionStatus", JSON.stringify(plannerActionStatus));
    } catch {
      // Ignore local storage write issues.
    }
  }, [plannerActionStatus]);

  useEffect(() => {
    function refreshPlannerReminders() {
      setPlannerActionStatus((current) => {
        const now = Date.now();
        const todayIso = toIsoDate(new Date());
        const dueActions = plannerActions.filter((action) => action.date <= todayIso);
        const nextState = { ...current };
        const activeReminders = [];
        let changed = false;

        dueActions.forEach((action) => {
          const currentStatus = nextState[action.id] || {
            done: false,
            lastReminderAt: 0
          };

          if (currentStatus.done) {
            return;
          }

          if (!currentStatus.lastReminderAt || now - currentStatus.lastReminderAt >= 3 * 60 * 60 * 1000) {
            nextState[action.id] = {
              ...currentStatus,
              lastReminderAt: now
            };
            changed = true;
          }

          activeReminders.push({
            id: action.id,
            title: action.title,
            date: action.date,
            type: action.type
          });
        });

        setPlannerReminders(activeReminders);
        return changed ? nextState : current;
      });
    }

    refreshPlannerReminders();
    const intervalId = window.setInterval(refreshPlannerReminders, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [plannerActions]);

  useEffect(() => {
    if (
      (pathname !== "/recommendations" && pathname !== "/action-planner") ||
      selectedCropKey ||
      predictedCrops.length === 0
    ) {
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

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [
        { response: siteResponse, payload: sitePayload },
        { response: dashboardResponse, payload: dashboardPayload }
      ] = await Promise.all([
        requestJson("/api/site-data"),
        requestJson("/api/dashboard")
      ]);

      if (!siteResponse.ok) {
        throw new Error(sitePayload.error || "Unable to load site data.");
      }

      if (!dashboardResponse.ok) {
        throw new Error(dashboardPayload.error || "Unable to load dashboard data.");
      }

      setSite(withFixedProductId(sitePayload));
      setDashboard(dashboardPayload);
    } catch (loadError) {
      setError(
        resolveAppErrorMessage(loadError, "Unable to load the AgriCure dashboard.")
      );
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
      const { response, payload } = await requestJson("/api/preferences/language", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ language: nextLanguage })
      });

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save language preference.");
      }

      setChatMessages([]);
      await loadDashboard();
    } catch (languageError) {
      setError(
        resolveAppErrorMessage(languageError, "Unable to update language preference.")
      );
    } finally {
      setLanguageBusy(false);
    }
  }

  async function handleProfileSave(profilePatch) {
    setProfileSaving(true);
    setError("");

    try {
      const { response, payload } = await requestJson("/api/site-data", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profile: profilePatch
        })
      });

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save profile.");
      }

      if (payload.siteData) {
        setSite(withFixedProductId(payload.siteData));
      }
    } catch (saveError) {
      setError(resolveAppErrorMessage(saveError, "Unable to save profile."));
      throw saveError;
    } finally {
      setProfileSaving(false);
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
      const { response, payload } = await requestJson("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          history: nextHistory.filter((entry) => entry.role !== "status")
        })
      });

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
    setProfileOpen(false);

    if (normalizedPath === pathname) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      });
      return;
    }

    setPathname(normalizedPath);
    window.history.pushState({}, "", normalizedPath);
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

  function handlePlannerActionStatusChange(actionId, done) {
    setPlannerActionStatus((current) => ({
      ...current,
      [actionId]: {
        done,
        lastReminderAt: done ? Date.now() : current[actionId]?.lastReminderAt || 0
      }
    }));
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
      <div className="page-shell relative min-h-screen overflow-x-clip px-3 pb-28 pt-3 sm:px-6 sm:pb-20 sm:pt-4 lg:px-8">
        <div className="page-glow page-glow--one" />
        <div className="page-glow page-glow--two" />

        <header className="sticky top-0 z-40 -mx-3 w-[calc(100%+1.5rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)]">
          <div className="nav-shell flex flex-col gap-3 rounded-none border-x-0 border-t-0 px-3 py-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <button
              type="button"
              onClick={() => navigateTo("/")}
              className="flex items-center gap-3 text-left"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-200 bg-emerald-50 text-base font-black text-emerald-800 shadow-soft ring-1 ring-white/60 sm:h-12 sm:w-12">
                A
              </div>
              <div className="min-w-0">
                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 sm:block">
                  Agricultural Intelligence Platform
                </p>
                <h1 className="executive-title text-xl font-bold sm:text-2xl">
                  AgriCure
                </h1>
              </div>
            </button>

            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  href={item.path}
                  label={item.label}
                  isActive={pathname === item.path}
                  onNavigate={navigateTo}
                />
              ))}
            </nav>

            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <label className="flex min-w-0 items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-soft sm:hidden">
                <span className="truncate font-semibold text-slate-500">{translate("Language")}</span>
                <select
                  value={site.selectedLanguage}
                  onChange={(event) => handleLanguageChange(event.target.value)}
                  disabled={languageBusy}
                  className="min-w-0 bg-transparent font-semibold text-slate-900 outline-none"
                >
                  {site.languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {getLanguageOptionLabel(language, activeLanguage)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-sm text-slate-700 shadow-soft sm:flex">
                <span className="font-semibold text-slate-500">{translate("Language")}</span>
                <select
                  value={site.selectedLanguage}
                  onChange={(event) => handleLanguageChange(event.target.value)}
                  disabled={languageBusy}
                  className="bg-transparent font-semibold text-slate-900 outline-none"
                >
                  {site.languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {getLanguageOptionLabel(language, activeLanguage)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((current) => !current)}
                  className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/92 px-2.5 py-2 shadow-soft transition hover:-translate-y-0.5 sm:gap-3 sm:px-3"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-800 shadow-soft sm:h-11 sm:w-11">
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
                  <div className="executive-surface absolute right-0 top-[calc(100%+14px)] z-20 w-[min(22rem,calc(100vw-1.5rem))] rounded-[1.35rem] p-4 backdrop-blur-xl sm:w-80 sm:rounded-[1.6rem] sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                      {uiText.farmProfileLabel}
                    </p>
                    <h2 className="executive-title mt-3 text-2xl font-bold">
                      {site.profile.farm}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">{translate(site.profile.role)}</p>
                    <div className="mt-4 grid gap-3 rounded-[1.5rem] bg-slate-50 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{translate("Language")}</span>
                        <span className="font-semibold text-slate-900">
                          {getLanguageOptionLabel(
                            site.languages.find((language) => language.code === site.selectedLanguage),
                            activeLanguage
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{translate("Role")}</span>
                        <span className="font-semibold text-slate-900">{translate(site.profile.role)}</span>
                      </div>
                      {site.profile.landSize ? (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">{translate("Land size")}</span>
                          <span className="font-semibold text-slate-900">{site.profile.landSize}</span>
                        </div>
                      ) : null}
                      {site.profile.state ? (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">{translate("Location")}</span>
                          <span className="font-semibold text-right text-slate-900">
                            {site.profile.district
                              ? `${site.profile.district}, ${site.profile.state}`
                              : site.profile.state}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo("/profile")}
                      className="mt-4 w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      {uiText.manageAccountLabel}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <nav className="mt-3 hidden gap-2 overflow-x-auto pb-1 sm:flex sm:flex-wrap lg:hidden">
            {navItems.map((item) => (
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

        <main className="mx-auto mt-5 flex w-full max-w-[96rem] flex-col gap-6 px-0 sm:mt-8 sm:gap-8 sm:px-2 lg:gap-10 lg:px-2">
          {plannerReminders.length ? (
            <PlannerReminderBanner
              reminders={plannerReminders}
              actionStatuses={plannerActionStatuses}
              translate={translate}
            />
          ) : null}

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
              translate={translate}
            />
          ) : null}

          {pathname === "/action-planner" ? (
            <ActionPlannerPage
              cropUi={cropUi}
              predictedCrops={predictedCrops}
              selectedCrop={selectedCrop}
              selectedCropKey={selectedCropKey}
              actionPlannerOptions={actionPlannerOptions}
              plannerSeedingDate={plannerSeedingDate}
              plannerActions={plannerActions}
              plannerActionStatuses={plannerActionStatuses}
              onNavigate={navigateTo}
              translate={translate}
              onSelectCrop={(cropKey) => {
                setSelectedCropKey(cropKey);
                setActiveToolKey("fertilizer");
              }}
              onSeedingDateChange={setPlannerSeedingDate}
              onActionStatusChange={handlePlannerActionStatusChange}
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
              selectedCropInsight={selectedCropInsight}
              selectedCropAdvisories={selectedCropAdvisories}
              predictedCrops={predictedCrops}
              activeToolKey={activeToolKey}
              cropSpecificRows={cropSpecificRows}
              toolModel={workspaceToolModel}
              agmarknetLocations={agmarknetLocations}
              priceFilterState={priceFilterState}
              priceFilterDistrict={priceFilterDistrict}
              priceReport={priceReport}
              priceReportLoading={priceReportLoading}
              priceReportError={priceReportError}
              schemeFilterState={schemeFilterState}
              schemeInsights={schemeInsights}
              schemeInsightsLoading={schemeInsightsLoading}
              schemeInsightsError={schemeInsightsError}
              seedVarietyInsights={seedVarietyInsights}
              seedVarietyLoading={seedVarietyLoading}
              seedVarietyError={seedVarietyError}
              onNavigate={navigateTo}
              translate={translate}
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
              onPriceStateChange={setPriceFilterState}
              onPriceDistrictChange={setPriceFilterDistrict}
              onSchemeStateChange={setSchemeFilterState}
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
              translate={translate}
            />
          ) : null}

          {pathname === "/storages" ? (
            <StoragePage
              selectedCrop={selectedCrop}
              agmarknetLocations={agmarknetLocations}
              storageFilterState={storageFilterState}
              storageFilterDistrict={storageFilterDistrict}
              storageDistrictOptions={storageDistrictOptions}
              nearbyStorages={nearbyStorages}
              nearbyStoragesLoading={nearbyStoragesLoading}
              nearbyStoragesError={nearbyStoragesError}
              nearbyStorageMeta={nearbyStorageMeta}
              storageUserPosition={storageUserPosition}
              storageLocationStatus={storageLocationStatus}
              areaStorages={areaStorages}
              areaStoragesLoading={areaStoragesLoading}
              areaStoragesError={areaStoragesError}
              areaStorageMeta={areaStorageMeta}
              onNavigate={navigateTo}
              onStorageStateChange={setStorageFilterState}
              onStorageDistrictChange={setStorageFilterDistrict}
              translate={translate}
            />
          ) : null}

          {pathname === "/profile" ? (
            <ProfilePage
              site={site}
              agmarknetLocations={agmarknetLocations}
              saving={profileSaving}
              onNavigate={navigateTo}
              onSaveProfile={handleProfileSave}
              translate={translate}
            />
          ) : null}

          {pathname === "/contact" ? (
            <ContactPage
              site={site}
              onNavigate={navigateTo}
              translate={translate}
            />
          ) : null}
        </main>
      </div>

      <MobileTabBar
        items={navItems}
        pathname={pathname}
        onNavigate={navigateTo}
      />

      <ChatWidget
        isOpen={chatOpen}
        onToggle={() => setChatOpen((current) => !current)}
        onClose={() => setChatOpen(false)}
        uiText={uiText.chat}
        selectedLanguage={site.selectedLanguage}
        messages={chatMessages}
        input={chatInput}
        busy={chatBusy}
        translate={translate}
        onInputChange={setChatInput}
        onSubmit={handleChatSubmit}
      />
    </>
  );
}

function NavIcon({ icon, active }) {
  const tone = active ? "text-emerald-800" : "text-slate-500";

  if (icon === "overview") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${tone}`} aria-hidden="true">
        <path
          d="M4.75 10.25L12 4.75L19.25 10.25V18A1.25 1.25 0 0 1 18 19.25H6A1.25 1.25 0 0 1 4.75 18V10.25Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "planner") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${tone}`} aria-hidden="true">
        <path
          d="M7.5 3.75V6.25M16.5 3.75V6.25M4.75 8H19.25M6.25 20.25H17.75A1.5 1.5 0 0 0 19.25 18.75V6.25A1.5 1.5 0 0 0 17.75 4.75H6.25A1.5 1.5 0 0 0 4.75 6.25V18.75A1.5 1.5 0 0 0 6.25 20.25ZM8 11.5H12.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "recommendations") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${tone}`} aria-hidden="true">
        <path
          d="M12 19.25C15.4518 19.25 18.25 16.4518 18.25 13C18.25 9.54822 15.4518 6.75 12 6.75C8.54822 6.75 5.75 9.54822 5.75 13C5.75 16.4518 8.54822 19.25 12 19.25ZM12 4.75V2.75M7.05 7.05L5.64 5.64M4.75 13H2.75M19.25 13H21.25M16.95 7.05L18.36 5.64"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "sensor") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${tone}`} aria-hidden="true">
        <path
          d="M12 18.75A2.75 2.75 0 1 0 12 13.25A2.75 2.75 0 0 0 12 18.75ZM12 5.25V8.25M5.64 8.64L7.76 10.76M18.36 8.64L16.24 10.76M4.75 13H7.25M16.75 13H19.25"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "contact") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${tone}`} aria-hidden="true">
        <path
          d="M6.75 5.75H17.25A1.5 1.5 0 0 1 18.75 7.25V16.75A1.5 1.5 0 0 1 17.25 18.25H6.75A1.5 1.5 0 0 1 5.25 16.75V7.25A1.5 1.5 0 0 1 6.75 5.75ZM7 8L12 12L17 8M9 18.25V20.25M15 18.25V20.25"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${tone}`} aria-hidden="true">
      <path
        d="M5.75 8.25H18.25M7.25 5.25H16.75M7 18.75H17A1.75 1.75 0 0 0 18.75 17V9.5A1.75 1.75 0 0 0 17 7.75H7A1.75 1.75 0 0 0 5.25 9.5V17A1.75 1.75 0 0 0 7 18.75ZM9 11.25H15M9 14.25H13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MobileTabBar({ items, pathname, onNavigate }) {
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
      <nav className="mobile-tabbar glass-panel grid grid-cols-6 gap-1.5 p-1.5">
        {items.map((item) => {
          const isActive = pathname === item.path;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`flex min-h-[4.35rem] flex-col items-center justify-center gap-1 rounded-[1.1rem] px-1 py-2 text-center transition ${
                isActive
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-[0_10px_22px_rgba(15,23,42,0.06)]"
                  : "bg-white/72 text-slate-600"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <NavIcon icon={item.icon} active={isActive} />
              <span className={`text-[10px] font-semibold leading-tight ${isActive ? "text-emerald-800" : "text-slate-600"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
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
  onNavigate,
  translate
}) {
  const humidityMetric = dashboard.realtime.metrics[1]?.value || "N/A";
  const feedItems = dashboard.realtime.feed || [];

  return (
    <div className="page-transition grid gap-8">
      <PageHero
        eyebrow={translate("Farm command")}
        title={
          <>
            {translate("Startup-ready")}
              <span className="text-emerald-700">
                {` ${translate("agricultural intelligence")}`}
            </span>{` ${translate("for every field decision.")}`}
          </>
        }
        description={translate(site.subtitle)}
        primaryAction={{
          label: translate("Open Recommendations"),
          onClick: () => onNavigate("/recommendations")
        }}
        secondaryAction={{
          label: translate("Open Sensor Data"),
          onClick: () => onNavigate("/sensor-data")
        }}
        stats={[
          {
            label: translate("Soil health"),
            value: `${dashboard.overview.soilHealth.score}%`,
            detail: translate(dashboard.overview.status)
          },
          {
            label: translate("Humidity"),
            value: humidityMetric,
            detail: translate("Live atmosphere")
          },
          {
            label: translate("Last report"),
            value: formatTimeOnly(dashboard.overview.timestamp),
            detail: formatDateTime(dashboard.overview.timestamp)
          }
        ]}
      />

      <Reveal delay={180}>
        <HealthSignalCard dashboard={dashboard} translate={translate} />
      </Reveal>

      <SurfaceCard
        eyebrow={translate(dashboard.overview.title)}
        title={translate(dashboard.overview.soilHealth.label)}
        subtitle={translate(dashboard.overview.soilHealth.support)}
        elevated
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {dashboard.overview.soilData.map((item, index) => (
            <Reveal key={item.label} delay={80 + index * 50}>
              <MetricTile
                label={translate(item.label)}
                value={`${item.value}${item.unit ? ` ${item.unit}` : ""}`}
                tone={resolveOverviewMetricTone(item, "soil", index)}
              />
            </Reveal>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard
        eyebrow={uiText.overviewWeather.title}
        title={translate("Climate snapshot")}
        subtitle={uiText.overviewWeather.subtitle}
      >
        <div className="grid gap-4">
          {weatherSnapshot.map((item, index) => (
            <Reveal key={item.key} delay={120 + index * 60}>
              <MetricTile
                label={item.label}
                value={`${formatNumber(item.value, item.decimals)} ${item.unit}`}
                tone={resolveOverviewMetricTone(item, "environment", index)}
              />
            </Reveal>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard
        eyebrow={uiText.overviewWeather.chartTitle}
        title={translate("Weather trend")}
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
        eyebrow={translate("Navigation")}
        title={translate("Open a dedicated page for the next task")}
        subtitle={translate("Recommendations and sensor operations now live on their own focused pages.")}
      >
        <div className="grid gap-4">
          <LaunchCard
            label={translate("Recommendations")}
            title={translate("Nutrient, crop, and planning decisions")}
            description={translate("Move into a dedicated workspace for crop fit, fertilizer planning, and operational guidance.")}
            actionLabel={translate("Go to Recommendations")}
            onClick={() => onNavigate("/recommendations")}
            tone="emerald"
          />
          <LaunchCard
            label={translate("Sensor Data")}
            title={translate("Realtime telemetry and environmental monitoring")}
            description={translate("Open the sensor page to inspect NPK drift, environmental distribution, and live feed notes.")}
            actionLabel={translate("Go to Sensor Data")}
            onClick={() => onNavigate("/sensor-data")}
            tone="sky"
          />
        </div>
      </SurfaceCard>

      <SurfaceCard
        eyebrow={translate("Field feed")}
        title={translate("Latest observations")}
        subtitle={translate("Short operational notes pulled from the current realtime stream.")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {feedItems.map((item, index) => (
            <Reveal key={`${item.time}-${item.detail}`} delay={80 + index * 70}>
              <article className="hover-lift rounded-[1.8rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {item.time}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{translate(item.detail)}</p>
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
  selectedCropInsight,
  selectedCropAdvisories,
  predictedCrops,
  activeToolKey,
  cropSpecificRows,
  toolModel,
  agmarknetLocations,
  priceFilterState,
  priceFilterDistrict,
  priceReport,
  priceReportLoading,
  priceReportError,
  schemeFilterState,
  schemeInsights,
  schemeInsightsLoading,
  schemeInsightsError,
  seedVarietyInsights,
  seedVarietyLoading,
  seedVarietyError,
  onNavigate,
  translate,
  onPrimaryCropChange,
  onVegetableCropChange,
  onSelectCrop,
  onSelectTool,
  onPriceStateChange,
  onPriceDistrictChange,
  onSchemeStateChange
}) {
  const topOrganic = cropRecommendations.organic[0];
  const topInorganic = cropRecommendations.inorganic[0];
  const workspaceToolModel = toolModel;
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
  const priceDistrictOptions = getDistrictOptionsForState(agmarknetLocations, priceFilterState);

  return (
    <div className="page-transition grid gap-8">
      <PageHero
        eyebrow={translate("Recommendation studio")}
        title={
          <>
            {translate("Dedicated planning for")}
            <span className="text-emerald-700">
              {` ${translate("crop fit, fertilizer, and next actions")}`}
            </span>
            .
          </>
        }
        description={uiText.recommendationWorkspace.toolExplorerSubtitle}
        primaryAction={{
          label: translate("Open Sensor Data"),
          onClick: () => onNavigate("/sensor-data")
        }}
        secondaryAction={{
          label: translate("Back to Overview"),
          onClick: () => onNavigate("/")
        }}
        stats={[
          {
            label: translate("Selected crop"),
            value: translate(selectedCrop?.label || predictedCrops[0]?.label || "Pending"),
            detail: cropUi.summaryPrefix
          },
          {
            label: translate("Top organic"),
            value: translate(topOrganic?.fertilizer || "No recommendation"),
            detail: translate(topOrganic?.priority || "Review data")
          },
          {
            label: translate("Top inorganic"),
            value: translate(topInorganic?.fertilizer || "No recommendation"),
            detail: translate(topInorganic?.priority || "Review data")
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
                <span className="font-semibold text-slate-600">{translate("Primary crop")}</span>
                <select
                  value={activePrimaryValue}
                  onChange={(event) => onPrimaryCropChange(event.target.value)}
                  className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                >
                  <option value="">{cropUi.primaryPlaceholder}</option>
                  {PRIMARY_CROP_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.key === "vegetables"
                        ? cropUi.vegetableOption
                        : translate(item.label)}
                    </option>
                  ))}
                </select>
              </label>

              {activePrimaryValue === "vegetables" ? (
                <label className="grid gap-2 text-sm">
                  <span className="font-semibold text-slate-600">{translate("Vegetable crop")}</span>
                  <select
                    value={selectedCropKey}
                    onChange={(event) => onVegetableCropChange(event.target.value)}
                    className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                  >
                    <option value="">{cropUi.vegetablePlaceholder}</option>
                    {VEGETABLE_CROP_OPTIONS.map((item) => (
                      <option key={item.key} value={item.key}>
                        {translate(item.label)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="grid gap-5">
              <div className="grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {translate("Predicted cereals")}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {cerealPredictions.map((crop, index) => (
                    <Reveal key={crop.key} delay={90 + index * 60}>
                      <CropPredictionCard
                        crop={crop}
                        selectedCropKey={selectedCropKey}
                        predictedTag={cropUi.predictedTag}
                        translate={translate}
                        onSelectCrop={onSelectCrop}
                      />
                    </Reveal>
                  ))}
                </div>
              </div>

              {vegetablePrediction ? (
                <div className="grid gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {translate("Vegetable prediction")}
                  </p>
                  <Reveal delay={220}>
                    <CropPredictionCard
                      crop={vegetablePrediction}
                      selectedCropKey={selectedCropKey}
                      predictedTag={cropUi.predictedTag}
                      translate={translate}
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
          title={
            selectedCrop ? translate(selectedCrop.label) : translate("Select a crop to unlock the workspace")
          }
          subtitle={
            selectedCrop
              ? `${cropUi.summaryPrefix}: ${translate(selectedCrop.label)}. ${cropRecommendations.summary}`
              : cropUi.lockedMessage
          }
        >
          {selectedCrop ? (
            <div className="grid gap-5">
              <div className="rounded-[2rem] border border-emerald-200 bg-[linear-gradient(180deg,#f8fffb_0%,#dcfce7_100%)] p-6 text-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  {cropUi.familyLabel}
                </p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h3 className="font-display text-3xl font-black">{translate(selectedCrop.label)}</h3>
                    <p className="mt-2 text-sm text-slate-700">{translate(selectedCrop.family)}</p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                    {cropUi.unlockedMessagePrefix} {translate(selectedCrop.label)}
                  </span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <StatTile
                    label={cropUi.estimatedCostLabel}
                    value={`${formatCurrency(selectedCrop.estimatedGrowCost)} / acre`}
                  />
                  <StatTile
                    label={cropUi.marketPriceLabel}
                    value={`${
                      selectedCropInsight
                        ? formatCurrency(selectedCropInsight.latestPrice)
                        : formatCurrency(selectedCrop.marketPrice)
                    } ${
                      selectedCropInsight
                        ? translate(buildAgmarknetUnitLabel(selectedCropInsight.priceUnit))
                        : translate(selectedCrop.marketUnit)
                    }`}
                  />
                </div>
                {selectedCropInsight ? (
                  <p className="mt-4 text-sm text-slate-600">
                    {`Agmarknet • ${selectedCropInsight.marketName}, ${
                      selectedCropInsight.stateName
                    } • ${formatDateLong(selectedCropInsight.lastReportedDate)}`}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3">
                <div className="rounded-[1.6rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    {translate("Active recommendation")}
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
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-soft"
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
                {translate("Use the field-fit crop shortlist to open the recommendation workspace instantly.")}
              </p>
              {predictedCrops[0] ? (
                <button
                  type="button"
                  onClick={() => onSelectCrop(predictedCrops[0].key)}
                  className="accent-button mt-5 rounded-full px-5 py-3 text-sm font-semibold transition"
                >
                  {translate("Use best-fit crop")}
                </button>
              ) : null}
            </div>
          )}
        </SurfaceCard>
      </section>

      {selectedCrop && workspaceToolModel ? (
        workspaceToolModel.mode === "fertilizer" ? (
          <div className="grid gap-6">
            <SurfaceCard
              eyebrow={toolModel.badge}
              title={translate("Current sensor values")}
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
                  cardKind="soil"
                />

                <SensorValueSection
                  title={uiText.realtimePanel.environmentTitle}
                  subtitle={uiText.realtimePanel.environmentSubtitle}
                  items={realtimeCardSets?.environment || []}
                  statusMap={uiText.realtimePanel.status}
                  cardKind="environment"
                />
              </div>
            </SurfaceCard>

            <SurfaceCard
              eyebrow={translate("Nutrient correction")}
              title={uiText.recommendationColumnTitles.inorganic}
              subtitle={translate("Primary chemical correction options for the selected crop.")}
            >
              <RecommendationColumn
                title={uiText.recommendationColumnTitles.inorganic}
                items={cropRecommendations.inorganic}
                boxed={false}
                marketplaceKind="inorganic"
                translate={translate}
              />
            </SurfaceCard>

            <SurfaceCard
              eyebrow={translate("Soil support")}
              title={uiText.recommendationColumnTitles.organic}
              subtitle={translate("Organic fertilizer options that support nutrient recovery and soil structure.")}
            >
              <RecommendationColumn
                title={uiText.recommendationColumnTitles.organic}
                items={cropRecommendations.organic}
                boxed={false}
                marketplaceKind="organic"
                translate={translate}
              />
            </SurfaceCard>

            <SurfaceCard
              eyebrow={fertilizerSections.organicAlternativesTitle || "Organic Alternatives"}
              title={fertilizerSections.organicAlternativesTitle || "Organic Alternatives"}
              subtitle={
                fertilizerSections.organicAlternativesSubtitle ||
                "Sustainable and eco-friendly fertilizer options"
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {organicAlternativeItems.map((item, index) => (
                  <Reveal key={`${item.title}-${item.fertilizerName}`} delay={80 + index * 50}>
                    <article className="hover-lift rounded-[1.9rem] border border-emerald-200 bg-[linear-gradient(180deg,#f0fdf4_0%,#dcfce7_100%)] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                        {item.eyebrow}
                      </p>
                      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-2xl font-bold text-slate-950">
                            {item.fertilizerName}
                          </h3>
                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            {item.title}
                          </p>
                        </div>
                        <span className="status-pill status-pill--emerald">{item.applicationRate}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                      <p className="mt-4 rounded-[1.2rem] bg-white/70 px-4 py-3 text-sm text-slate-700">
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
                        <MiniStat label={translate("Inorganic")} value={item.inorganicRate} />
                        <MiniStat label={translate("Organic")} value={item.organicRate} />
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </SurfaceCard>
          </div>
        ) : activeToolKey === "seed" ? (
          <SeedVarietyPanel
            toolModel={workspaceToolModel}
            selectedCrop={selectedCrop}
            seedVarietyInsights={seedVarietyInsights}
            seedVarietyLoading={seedVarietyLoading}
            seedVarietyError={seedVarietyError}
            translate={translate}
          />
        ) : activeToolKey === "price" ? (
          <PriceInsightPanel
            toolModel={workspaceToolModel}
            selectedCrop={selectedCrop}
            agmarknetLocations={agmarknetLocations}
            priceFilterState={priceFilterState}
            priceFilterDistrict={priceFilterDistrict}
            priceDistrictOptions={priceDistrictOptions}
            priceReport={priceReport}
            priceReportLoading={priceReportLoading}
            priceReportError={priceReportError}
            onPriceStateChange={onPriceStateChange}
            onPriceDistrictChange={onPriceDistrictChange}
            translate={translate}
          />
        ) : activeToolKey === "schemes" ? (
          <SchemeInsightsPanel
            toolModel={workspaceToolModel}
            agmarknetLocations={agmarknetLocations}
            schemeFilterState={schemeFilterState}
            schemeInsights={schemeInsights}
            schemeInsightsLoading={schemeInsightsLoading}
            schemeInsightsError={schemeInsightsError}
            onSchemeStateChange={onSchemeStateChange}
            translate={translate}
          />
        ) : (
          <SurfaceCard
            eyebrow={workspaceToolModel.badge}
            title={workspaceToolModel.title}
            subtitle={workspaceToolModel.subtitle}
            elevated
          >
            <div className="grid gap-6">
              {workspaceToolModel.gallery?.length ? (
                <PestGalleryPanel items={workspaceToolModel.gallery} translate={translate} />
              ) : null}

              <div className="grid gap-4">
                {workspaceToolModel.cards.map((card, index) => (
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

              {activeToolKey === "pesticide" ? (
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <ProtectionProductPanel
                    products={workspaceToolModel.products || []}
                    translate={translate}
                  />
                  <PpqsAdvisoryPanel
                    advisoryBundle={selectedCropAdvisories}
                    translate={translate}
                  />
                </div>
              ) : null}

              <div className="grid gap-5">
                <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {workspaceToolModel.checklistTitle}
                  </p>
                  <div className="mt-4 grid gap-3">
                    {workspaceToolModel.checklist.map((item) => (
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

                <article className="soft-accent-panel rounded-[1.9rem] p-5 text-slate-900">
                  <p className="soft-accent-kicker text-xs font-semibold uppercase tracking-[0.24em]">
                    {translate("Planner note")}
                  </p>
                  <p className="soft-accent-copy mt-3 text-sm leading-7">{workspaceToolModel.note}</p>
                </article>
              </div>
            </div>
          </SurfaceCard>
        )
      ) : null}
    </div>
  );
}

function SeedVarietyPanel({
  toolModel,
  selectedCrop,
  seedVarietyInsights,
  seedVarietyLoading,
  seedVarietyError,
  translate = (value) => value
}) {
  const supportedCropLabels = (seedVarietyInsights?.supportedCropKeys || [])
    .map((cropKey) => getCropProfile(cropKey)?.label)
    .filter(Boolean)
    .map((label) => translate(label));

  return (
    <SurfaceCard
      eyebrow={toolModel.badge}
      title={toolModel.title}
      subtitle={translate("Official seed varieties for the selected crop. Only values traced to certified institute pages are shown, and unpublished price fields stay blank instead of estimated.")}
      elevated
    >
      <div className="grid gap-6">
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {translate("Selection scope")}
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold text-slate-950">
              {translate(selectedCrop?.label || "Choose crop")}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {translate("This panel replaces placeholder seed cards with officially sourced variety entries whenever a connected institute source is available for the selected crop.")}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniStat
                label={translate("Selected crop")}
                value={translate(selectedCrop?.label || "Choose crop")}
              />
              <MiniStat
                label={translate("Official entries")}
                value={String(seedVarietyInsights?.varietyCount || 0)}
              />
            </div>
          </article>

          <article className="soft-accent-panel rounded-[1.9rem] p-5 text-slate-900">
            <p className="soft-accent-kicker text-xs font-semibold uppercase tracking-[0.24em]">
              {translate("Certified source")}
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold">
              {seedVarietyInsights?.sourceName || translate("Official seed directory")}
            </h3>
            <p className="soft-accent-copy mt-3 text-sm leading-7">
              {translate(
                seedVarietyInsights?.note ||
                  "Only officially published seed insights are shown here."
              )}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat
                label={translate("Verified")}
                value={
                  seedVarietyInsights?.verifiedOn
                    ? formatDateLong(seedVarietyInsights.verifiedOn)
                    : translate("Not listed")
                }
                dark
              />
              <MiniStat
                label={translate("Varieties")}
                value={String(seedVarietyInsights?.varietyCount || 0)}
                dark
              />
              <MiniStat
                label={translate("Official prices")}
                value={String(seedVarietyInsights?.officialPriceCount || 0)}
                dark
              />
            </div>
            {seedVarietyInsights?.sourceUrl ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={seedVarietyInsights.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="accent-button rounded-full px-4 py-2 text-sm font-semibold transition"
                >
                  {translate("Open official source")}
                </a>
                {seedVarietyInsights?.priceSourceUrl ? (
                  <a
                    href={seedVarietyInsights.priceSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-emerald-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  >
                    {translate("Open official price source")}
                  </a>
                ) : null}
              </div>
            ) : null}
          </article>
        </div>

        {seedVarietyLoading ? (
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">
            {translate("Loading official seed varieties for the selected crop...")}
          </div>
        ) : seedVarietyError ? (
          <div className="rounded-[1.8rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {translate(seedVarietyError)}
          </div>
        ) : seedVarietyInsights?.supported === false ? (
          <article className="rounded-[1.9rem] border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {translate("Coverage note")}
            </p>
            <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">
              {translate("Official seed sheet not available for this crop yet")}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {translate(seedVarietyInsights.message)}
            </p>
            {supportedCropLabels.length ? (
              <p className="mt-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{translate("Currently covered:")}</span>{" "}
                {supportedCropLabels.join(", ")}
              </p>
            ) : null}
          </article>
        ) : (
          <div className="grid gap-4">
            {(seedVarietyInsights?.varieties || []).map((variety, index) => (
              <Reveal key={`${variety.name}-${variety.type}`} delay={70 + index * 40}>
                <article className="hover-lift rounded-[1.9rem] border border-slate-200 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                        {translate(variety.type || "Official variety")}
                      </p>
                      <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
                        {translate(variety.name)}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        variety.officialPriceLabel
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {translate(variety.officialPriceLabel || "Price not published")}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    <StatTile
                      label={translate("Time to grow")}
                      value={translate(variety.maturityLabel || "Not listed")}
                    />
                    <StatTile
                      label={translate("Expected output")}
                      value={translate(variety.yieldLabel || "Not listed")}
                    />
                    <StatTile
                      label={translate("Best fit")}
                      value={translate(variety.suitabilityLabel || "See official source")}
                    />
                  </div>

                  {variety.seedRateLabel ? (
                    <div className="mt-4 rounded-[1.3rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{translate("Seed rate:")}</span>{" "}
                      {translate(variety.seedRateLabel)}
                    </div>
                  ) : null}

                  {variety.insights?.length ? (
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {translate("Official insights")}
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {variety.insights.map((item) => (
                          <div
                            key={`${variety.name}-${item}`}
                            className="flex gap-3 rounded-[1.3rem] bg-slate-50 px-4 py-3 text-sm text-slate-700"
                          >
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            <span>{translate(item)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-600">{translate(variety.officialPriceNote)}</p>
                    <div className="flex flex-wrap gap-3">
                      {variety.priceSourceUrl ? (
                        <a
                          href={variety.priceSourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                        >
                          {translate("Price source")}
                        </a>
                      ) : null}
                      <a
                        href={variety.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="accent-button rounded-full px-4 py-2 text-sm font-semibold transition"
                      >
                        {translate("Official source")}
                      </a>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

function SchemeInsightsPanel({
  toolModel,
  agmarknetLocations,
  schemeFilterState,
  schemeInsights,
  schemeInsightsLoading,
  schemeInsightsError,
  onSchemeStateChange,
  translate = (value) => value
}) {
  const centralSchemes = schemeInsights?.centralSchemes || [];
  const stateSchemes = schemeInsights?.stateSchemes || [];
  const insuranceCentral = schemeInsights?.insuranceSchemes?.central || [];
  const insuranceState = schemeInsights?.insuranceSchemes?.state || [];

  return (
    <SurfaceCard
      eyebrow={toolModel.badge}
      title={toolModel.title}
      subtitle={toolModel.subtitle}
      elevated
    >
      <div className="grid gap-6">
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {translate("State filters")}
            </p>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2 text-sm">
                <span className="font-semibold text-slate-700">{translate("Select state")}</span>
                <select
                  value={schemeFilterState}
                  onChange={(event) => onSchemeStateChange(event.target.value)}
                  className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                >
                  <option value="">{translate("Choose state")}</option>
                  {agmarknetLocations.map((state) => (
                    <option key={state.id || state.name} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 grid gap-3">
              {toolModel.cards.map((card) => (
                <div
                  key={`${card.eyebrow}-${card.title}`}
                  className={`rounded-[1.5rem] border ${toneBorder(card.tone)} ${toneSurface(card.tone)} p-4`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${toneText(card.tone)}`}>
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold text-slate-950">{card.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{card.description}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.9rem] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              {translate("Source")}
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold text-slate-950">
              {translate("Vikaspedia")}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {translate("Central farmer schemes are shown first. After you choose a state, the panel loads farmer-focused state schemes and insurance schemes for that state from Vikaspedia.")}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniStat
                label={translate("Central schemes")}
                value={String(centralSchemes.length)}
              />
              <MiniStat
                label={translate("Selected state")}
                value={schemeFilterState || translate("Choose state")}
              />
            </div>
          </article>
        </div>

        {schemeInsightsLoading ? (
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">
            {translate("Loading government schemes from Vikaspedia...")}
          </div>
        ) : schemeInsightsError ? (
          <div className="rounded-[1.8rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {translate(schemeInsightsError)}
          </div>
        ) : (
          <div className="grid gap-6">
            <SchemeSection
              eyebrow={translate("Central schemes")}
              title={translate("Central farmer support schemes")}
              subtitle={translate("National farmer-focused schemes sourced from the Vikaspedia farmer schemes collection.")}
              items={centralSchemes}
              emptyMessage={translate("No central schemes were returned right now.")}
              translate={translate}
            />

            <SchemeSection
              eyebrow={translate("State schemes")}
              title={
                schemeFilterState
                  ? `${schemeFilterState} ${translate("farmer schemes")}`
                  : translate("Select a state for local schemes")
              }
              subtitle={
                schemeFilterState
                  ? `${translate("Farmer-relevant schemes matched for")} ${schemeFilterState}.`
                  : translate("Choose a state to load the matching state-specific scheme details.")
              }
              items={stateSchemes}
              emptyMessage={
                schemeFilterState
                  ? translate("No farmer-focused state schemes were matched for this selection yet.")
                  : translate("Choose a state to load state-specific schemes.")
              }
              translate={translate}
            />

            <div className="grid gap-6 xl:grid-cols-2">
              <SchemeSection
                eyebrow={translate("Insurance")}
                title={translate("Central insurance schemes")}
                subtitle={translate("Insurance-related farmer schemes listed in the central Vikaspedia farmer collection.")}
                items={insuranceCentral}
                emptyMessage={translate("No central insurance schemes were returned right now.")}
                translate={translate}
              />
              <SchemeSection
                eyebrow={translate("Insurance")}
                title={
                  schemeFilterState
                    ? `${schemeFilterState} ${translate("insurance schemes")}`
                    : translate("Select a state for insurance schemes")
                }
                subtitle={
                  schemeFilterState
                    ? `${translate("Insurance schemes matched for")} ${schemeFilterState}.`
                    : translate("Choose a state to load state insurance schemes.")
                }
                items={insuranceState}
                emptyMessage={
                  schemeFilterState
                    ? translate("No state insurance scheme was matched for this selection yet.")
                    : translate("Choose a state to load state insurance schemes.")
                }
                translate={translate}
              />
            </div>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

function SchemeSection({
  eyebrow,
  title,
  subtitle,
  items = [],
  emptyMessage,
  translate = (value) => value
}) {
  return (
    <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
      <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{subtitle}</p>
      {items.length ? (
        <div className="mt-5 grid gap-4">
          {items.map((item, index) => (
            <Reveal key={`${item.scope}-${item.title}-${index}`} delay={70 + index * 45}>
              <SchemeCard item={item} translate={translate} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          {emptyMessage}
        </div>
      )}
    </article>
  );
}

function SchemeCard({ item, translate = (value) => value }) {
  return (
    <article className="rounded-[1.6rem] border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {item.stateName ? `${item.stateName} • ` : ""}
            {translate(formatSchemeScope(item.scope))}
          </p>
          <h4 className="mt-2 font-display text-xl font-bold text-slate-950">{item.title}</h4>
        </div>
        {item.updatedAt ? (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {translate("Updated")} {formatDateLong(item.updatedAt)}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</p>

      {item.highlights?.length ? (
        <div className="mt-4 grid gap-2">
          {item.highlights.slice(0, 3).map((highlight) => (
            <div
              key={highlight}
              className="flex gap-3 rounded-[1.2rem] bg-white px-4 py-3 text-sm text-slate-700"
            >
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>{highlight}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="accent-button rounded-full px-4 py-2 text-sm font-semibold transition"
        >
          {translate("View Vikaspedia")}
        </a>
        {item.officialUrl ? (
          <a
            href={item.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-slate-950"
          >
            {translate("Official link")}
          </a>
        ) : null}
      </div>
    </article>
  );
}

function formatSchemeScope(scope) {
  switch (scope) {
    case "central":
      return "Central";
    case "state":
      return "State";
    case "central-insurance":
      return "Central insurance";
    case "state-insurance":
      return "State insurance";
    default:
      return "Scheme";
  }
}

const PROTECTION_MARKETPLACE_PRODUCTS = [
  {
    matchers: ["tricyclazole", "beam"],
    productLabel: "Beam Fungicide",
    url: "https://www.bighaat.com/products/beam-fungicide"
  },
  {
    matchers: ["mancozeb", "indofil m-45", "indofil"],
    productLabel: "Indofil M-45 Fungicide",
    url: "https://www.bighaat.com/products/indofil-m45-contact-fungicide"
  },
  {
    matchers: ["chlorantraniliprole", "coragen"],
    productLabel: "Coragen Insecticide",
    url: "https://www.bighaat.com/products/coragen-dupont"
  },
  {
    matchers: ["imidacloprid", "confidor"],
    productLabel: "Confidor Super Insecticide",
    url: "https://www.bighaat.com/products/confidor-super-insecticide"
  },
  {
    matchers: ["propiconazole", "tilt"],
    productLabel: "Tilt Fungicide",
    url: "https://www.bighaat.com/products/tilt-fungicide"
  },
  {
    matchers: ["thiamethoxam", "actara"],
    productLabel: "Actara Insecticide",
    url: "https://www.bighaat.com/products/actara-insecticide"
  },
  {
    matchers: ["lambda-cyhalothrin", "lambda cyhalothrin", "karate"],
    productLabel: "Karate Insecticide",
    url: "https://www.bighaat.com/products/karate-insecticide"
  },
  {
    matchers: ["metalaxyl", "ridomil gold", "ridomil"],
    productLabel: "Ridomil Gold Fungicide",
    url: "https://www.bighaat.com/products/ridomil-gold-fungicide"
  },
  {
    matchers: ["emamectin", "proclaim"],
    productLabel: "Proclaim Insecticide",
    url: "https://www.bighaat.com/products/proclaim-insecticide"
  },
  {
    matchers: ["spinosad", "tracer"],
    productLabel: "Tracer Insecticide",
    url: "https://www.bighaat.com/products/tracer-insecticide"
  },
  {
    matchers: ["copper oxychloride", "blitox"],
    productLabel: "Blitox Fungicide",
    url: "https://www.bighaat.com/products/blitox-fungicide"
  }
];

function getProtectionMarketplaceProduct(product) {
  const haystack = normalizeLocationLabel(
    [product?.title, ...(product?.brands || [])].filter(Boolean).join(" ")
  );

  return (
    PROTECTION_MARKETPLACE_PRODUCTS.find((entry) =>
      entry.matchers.some((matcher) => haystack.includes(normalizeLocationLabel(matcher)))
    ) || null
  );
}

function ProtectionProductPanel({ products = [], translate = (value) => value }) {
  if (!products.length) {
    return null;
  }

  const actionableProducts = products
    .map((product) => getProtectionMarketplaceProduct(product))
    .filter(Boolean);

  function handleBuyProtectionBundle() {
    if (typeof window === "undefined") {
      return;
    }

    actionableProducts.forEach((product) => {
      window.open(product.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {translate("Protection products")}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 px-4 py-4">
        {actionableProducts.length ? (
          <>
            <button
              type="button"
              onClick={handleBuyProtectionBundle}
              className="rounded-full bg-[linear-gradient(135deg,#065f46_0%,#0f766e_100%)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
            >
              {translate("Buy both on BigHaat")}
            </button>
            <span className="text-xs text-emerald-800">
              {translate("Opens the matched pesticide and insecticide product pages in new tabs.")}
            </span>
          </>
        ) : (
          <span className="text-sm font-semibold text-slate-600">
            {translate("Buy links are unavailable for the current protection pair.")}
          </span>
        )}
      </div>
      <div className="mt-4 grid gap-4">
        {products.map((product) => {
          const marketplaceProduct = getProtectionMarketplaceProduct(product);

          return (
            <div
              key={`${product.type}-${product.title}`}
              className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {translate(product.type)}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold text-slate-950">
                    {product.title}
                  </h3>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniStat
                  label={translate("Brand examples")}
                  value={product.brands?.join(", ") || translate("Check local dealer")}
                />
                <MiniStat label={translate("Use when")} value={product.useCase} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {marketplaceProduct ? (
                  <>
                    <a
                      href={marketplaceProduct.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-[linear-gradient(135deg,#065f46_0%,#0f766e_100%)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                    >
                      {translate("Buy on BigHaat")}
                    </a>
                    <span className="text-xs text-slate-500">
                      {translate("Opens")} {marketplaceProduct.productLabel} {translate("on BigHaat")}
                    </span>
                  </>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
                    {translate("Buy link unavailable")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function PpqsAdvisoryPanel({ advisoryBundle, translate = (value) => value }) {
  const advisories = advisoryBundle?.advisories || [];

  return (
    <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {translate("Official advisories")}
      </p>
      <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">
        {translate("PPQS references")}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {translate("These links come from the Directorate of Plant Protection, Quarantine & Storage advisory section.")}
      </p>
      {advisories.length ? (
        <div className="mt-5 grid gap-3">
          {advisories.map((advisory) => (
            <a
              key={advisory.href}
              href={advisory.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-[1.4rem] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-700 transition hover:border-emerald-200 hover:bg-white"
            >
              <span className="block font-semibold text-slate-950">{advisory.title}</span>
              <span className="mt-2 block text-xs uppercase tracking-[0.2em] text-slate-500">
                PPQS Download
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          {translate("No crop-specific PPQS advisory was matched yet for this crop.")}
        </div>
      )}
    </article>
  );
}

function PriceReportCard({ title, report, translate = (value) => value }) {
  if (!report) {
    return (
      <article className="rounded-[1.8rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
        {translate("No Agmarknet report is available for this selection right now.")}
      </article>
    );
  }

  return (
    <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {title}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
            {report.districtName
              ? `${report.districtName}, ${report.stateName}`
              : report.stateName}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {translate("Latest report date")}: {formatDateLong(report.latestDate)}
          </p>
          {report.districtFallbackApplied ? (
            <p className="mt-2 text-sm text-amber-700">
              {translate("District-specific data was not found for the latest report, so the panel is showing the broader state report.")}
            </p>
          ) : null}
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {translate("Agmarknet")}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label={translate("Average modal price")}
          value={
            report.averageModalPrice !== null
              ? `${formatCurrency(report.averageModalPrice)} ${buildAgmarknetUnitLabel(report.unitOfPrice)}`
              : "N/A"
          }
        />
        <MiniStat
          label={translate("Price range")}
          value={
            report.minimumPrice !== null && report.maximumPrice !== null
              ? `${formatCurrency(report.minimumPrice)} - ${formatCurrency(report.maximumPrice)}`
              : "N/A"
          }
        />
        <MiniStat label={translate("Markets reporting")} value={String(report.marketsReporting)} />
        <MiniStat
          label={translate("Total arrivals")}
          value={formatArrivals(report.totalArrivals, report.unitOfArrivals)}
        />
      </div>
      <div className="mt-5 grid gap-3">
        {report.rows.map((row) => (
          <div
            key={`${row.marketName}-${row.reportedOn}-${row.variety}`}
            className="rounded-[1.4rem] bg-slate-50 px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{row.marketName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {row.districtName ? `${row.districtName} • ` : ""}
                  {row.variety || translate("Market report")}
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {row.modalPrice !== null
                  ? `${formatCurrency(row.modalPrice)} ${buildAgmarknetUnitLabel(report.unitOfPrice)}`
                  : "N/A"}
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <MiniStat
                label={translate("Min / max")}
                value={
                  row.minimumPrice !== null && row.maximumPrice !== null
                    ? `${formatCurrency(row.minimumPrice)} / ${formatCurrency(row.maximumPrice)}`
                    : "N/A"
                }
              />
              <MiniStat label={translate("Arrivals")} value={formatArrivals(row.arrivals)} />
              <MiniStat label={translate("Reported")} value={formatDateLong(row.reportedOn)} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function PriceInsightPanel({
  toolModel,
  selectedCrop,
  agmarknetLocations,
  priceFilterState,
  priceFilterDistrict,
  priceDistrictOptions,
  priceReport,
  priceReportLoading,
  priceReportError,
  onPriceStateChange,
  onPriceDistrictChange,
  translate = (value) => value
}) {
  return (
    <SurfaceCard
      eyebrow={toolModel.badge}
      title={toolModel.title}
      subtitle={toolModel.subtitle}
      elevated
    >
      <div className="grid gap-6">
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {translate("Location filters")}
            </p>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2 text-sm">
                <span className="font-semibold text-slate-700">{translate("Select state")}</span>
                <select
                  value={priceFilterState}
                  onChange={(event) => {
                    onPriceStateChange(event.target.value);
                    onPriceDistrictChange("");
                  }}
                  className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                >
                  <option value="">{translate("Choose state")}</option>
                  {agmarknetLocations.map((state) => (
                    <option key={state.id || state.name} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-semibold text-slate-700">{translate("Select district")}</span>
                <select
                  value={priceFilterDistrict}
                  onChange={(event) => onPriceDistrictChange(event.target.value)}
                  disabled={!priceFilterState}
                  className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">{translate("All districts in selected state")}</option>
                  {priceDistrictOptions.map((district) => (
                    <option key={district.id || district.name} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 grid gap-3">
              {toolModel.cards.map((card) => (
                <div
                  key={`${card.eyebrow}-${card.title}`}
                  className={`rounded-[1.5rem] border ${toneBorder(card.tone)} ${toneSurface(card.tone)} p-4`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${toneText(card.tone)}`}>
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold text-slate-950">{card.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{card.description}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="soft-accent-panel rounded-[1.9rem] p-5 text-slate-900">
            <p className="soft-accent-kicker text-xs font-semibold uppercase tracking-[0.24em]">
              {translate("Selected crop")}
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold">
              {translate(selectedCrop?.label || "Choose crop")}
            </h3>
            <p className="soft-accent-copy mt-3 text-sm leading-7">
              {translate("Current prices and previous-year comparison are both pulled from Agmarknet for the selected crop and location.")}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniStat
                label={translate("State")}
                value={priceFilterState || translate("Choose state")}
              />
              <MiniStat
                label={translate("District")}
                value={priceFilterDistrict || translate("All districts")}
              />
            </div>
          </article>
        </div>

        {!priceFilterState ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            {translate("Select a state to load the current crop price report and the same-month previous-year report from Agmarknet.")}
          </div>
        ) : priceReportLoading ? (
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">
            {translate("Loading Agmarknet report for the selected crop and location...")}
          </div>
        ) : priceReportError ? (
          <div className="rounded-[1.8rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {translate(priceReportError)}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <PriceReportCard
              title={translate("Current report")}
              report={priceReport?.currentReport}
              translate={translate}
            />
            <PriceReportCard
              title={translate("Previous year report")}
              report={priceReport?.previousYearReport}
              translate={translate}
            />
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

function StoragePage({
  selectedCrop,
  agmarknetLocations,
  storageFilterState,
  storageFilterDistrict,
  storageDistrictOptions,
  nearbyStorages,
  nearbyStoragesLoading,
  nearbyStoragesError,
  nearbyStorageMeta,
  storageUserPosition,
  storageLocationStatus,
  areaStorages,
  areaStoragesLoading,
  areaStoragesError,
  areaStorageMeta,
  onNavigate,
  onStorageStateChange,
  onStorageDistrictChange,
  translate = (value) => value
}) {
  const selectedAreaLabel =
    [storageFilterDistrict, storageFilterState].filter(Boolean).join(", ") ||
    translate("Choose state");
  const nearbyLocationLabel = storageUserPosition
    ? `${storageUserPosition.latitude}, ${storageUserPosition.longitude}`
    : translate("Waiting for location");
  const sourceNote =
    nearbyStorageMeta?.source?.note ||
    areaStorageMeta?.source?.note ||
    "Price and availability are only shown when the public source publishes them.";
  const districtFallbackApplied = Boolean(areaStorageMeta?.query?.districtFallbackApplied);

  return (
    <div className="page-transition grid gap-8">
      <PageHero
        eyebrow={translate("Storages")}
        title={
          <>
            {translate("Find nearby")}
            <span className="text-emerald-700">
              {` ${translate("cold storages")}`}
            </span>
            .
          </>
        }
        description={translate("Use your live location or select a state and district to load a small set of real cold storage locations without pulling heavy datasets.")}
        primaryAction={{
          label: translate("Open Recommendations"),
          onClick: () => onNavigate("/recommendations")
        }}
        secondaryAction={{
          label: translate("Back to Overview"),
          onClick: () => onNavigate("/")
        }}
        stats={[
          {
            label: translate("Nearby storages"),
            value: String(nearbyStorages.length),
            detail: nearbyLocationLabel
          },
          {
            label: translate("Selected area"),
            value: selectedAreaLabel,
            detail: translate("State and district filter")
          },
          {
            label: translate("Crop context"),
            value: translate(selectedCrop?.label || "General storage"),
            detail: translate("Storage search note")
          }
        ]}
      />

      <SurfaceCard
        eyebrow={translate("Nearby cold storage")}
        title={translate("Nearest storages from your location")}
        subtitle={translate(sourceNote)}
        elevated
      >
        {storageLocationStatus === "requesting" || nearbyStoragesLoading ? (
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">
            {translate("Fetching your location and loading nearby storages...")}
          </div>
        ) : null}

        {storageLocationStatus === "unsupported" ? (
          <div className="rounded-[1.8rem] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            {translate("This browser does not support location access. Use the state and district filters below instead.")}
          </div>
        ) : null}

        {storageLocationStatus === "denied" ? (
          <div className="rounded-[1.8rem] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            {translate("Location access was blocked, so nearby storages could not be loaded. You can still browse storages by state and district below.")}
          </div>
        ) : null}

        {!nearbyStoragesLoading && nearbyStoragesError ? (
          <div className="rounded-[1.8rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {translate(nearbyStoragesError)}
          </div>
        ) : null}

        {!nearbyStoragesLoading &&
        storageLocationStatus === "ready" &&
        !nearbyStoragesError &&
        nearbyStorages.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            {translate("No nearby cold storages were returned for this location right now. Try the state and district filter below.")}
          </div>
        ) : null}

        {nearbyStorages.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {nearbyStorages.map((storage, index) => (
              <Reveal key={storage.id} delay={80 + index * 45}>
                <StorageCard storage={storage} showDistance translate={translate} />
              </Reveal>
            ))}
          </div>
        ) : null}
      </SurfaceCard>

      <SurfaceCard
        eyebrow={translate("Area filter")}
        title={translate("Browse storages by state and district")}
        subtitle={translate("The list stays intentionally small and only shows published data points from the source.")}
        elevated
      >
        <div className="grid gap-6">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {translate("Location filters")}
              </p>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2 text-sm">
                  <span className="font-semibold text-slate-700">{translate("Select state")}</span>
                  <select
                    value={storageFilterState}
                    onChange={(event) => {
                      onStorageStateChange(event.target.value);
                      onStorageDistrictChange("");
                    }}
                    className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                  >
                    <option value="">{translate("Choose state")}</option>
                    {agmarknetLocations.map((state) => (
                      <option key={state.id || state.name} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm">
                  <span className="font-semibold text-slate-700">{translate("Select district")}</span>
                  <select
                    value={storageFilterDistrict}
                    onChange={(event) => onStorageDistrictChange(event.target.value)}
                    disabled={!storageFilterState}
                    className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">{translate("All districts in selected state")}</option>
                    {storageDistrictOptions.map((district) => (
                      <option key={district.id || district.name} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </article>

            <article className="soft-accent-panel rounded-[1.9rem] p-5 text-slate-900">
              <p className="soft-accent-kicker text-xs font-semibold uppercase tracking-[0.24em]">
                {translate("Selected search")}
              </p>
              <h3 className="mt-3 font-display text-3xl font-bold">{selectedAreaLabel}</h3>
              <p className="soft-accent-copy mt-3 text-sm leading-7">
                {translate(sourceNote)}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniStat
                  label={translate("Storages shown")}
                  value={String(areaStorages.length)}
                  dark
                />
                <MiniStat
                  label={translate("Area source")}
                  value={areaStorageMeta?.query?.label || translate("Nominatim + OpenStreetMap")}
                  dark
                />
              </div>
            </article>
          </div>

          {!storageFilterState ? (
            <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              {translate("Select a state and optional district to load storages in that area.")}
            </div>
          ) : areaStoragesLoading ? (
            <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">
              {translate("Loading storages for the selected area...")}
            </div>
          ) : areaStoragesError ? (
            <div className="rounded-[1.8rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              {translate(areaStoragesError)}
            </div>
          ) : areaStorages.length === 0 ? (
            <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              {translate("No storages were returned for this state and district right now.")}
            </div>
          ) : (
            <div className="grid gap-4">
              {districtFallbackApplied ? (
                <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  {translate("No storage data was found for the selected district, so the list is showing storages from the whole selected state.")}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {areaStorages.map((storage, index) => (
                  <Reveal key={storage.id} delay={90 + index * 45}>
                    <StorageCard storage={storage} translate={translate} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}

function StorageCard({ storage, showDistance = false, translate = (value) => value }) {
  return (
    <article className="hover-lift rounded-[1.8rem] border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {translate("Cold storage")}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
            {storage.name}
          </h3>
        </div>
        {showDistance ? (
          <span className="status-pill status-pill--sky">
            {formatDistanceLabel(storage.distanceKm)}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-7 text-slate-600">
        {storage.address || translate("Address not published")}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStat label={translate("Price")} value={storage.priceLabel} />
        <MiniStat label={translate("Availability")} value={storage.availabilityLabel} />
        <MiniStat
          label={translate("Capacity")}
          value={storage.capacityLabel || translate("Not publicly listed")}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        {storage.phone ? <span>{storage.phone}</span> : null}
        {storage.website ? (
          <a
            href={storage.website}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-cyan-700 hover:text-cyan-800"
          >
            {translate("Website")}
          </a>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={storage.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="accent-button rounded-full px-4 py-2 text-sm font-semibold transition"
        >
          {translate("Location")}
        </a>
        <a
          href={storage.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          {translate("Source")}
        </a>
      </div>
    </article>
  );
}

function ProfilePage({
  site,
  agmarknetLocations,
  saving,
  onNavigate,
  onSaveProfile,
  translate = (value) => value
}) {
  const [formState, setFormState] = useState({
    name: "",
    landSize: "",
    state: "",
    district: ""
  });
  const [saveMessage, setSaveMessage] = useState("");
  const districtOptions = getDistrictOptionsForState(agmarknetLocations, formState.state);

  useEffect(() => {
    const location = canonicalizeLocationSelection(
      agmarknetLocations,
      site?.profile?.state,
      site?.profile?.district
    );

    setFormState({
      name: site?.profile?.name || "",
      landSize: site?.profile?.landSize || "",
      state: location.state,
      district: location.district
    });
  }, [
    agmarknetLocations,
    site?.profile?.district,
    site?.profile?.landSize,
    site?.profile?.name,
    site?.profile?.state
  ]);

  useEffect(() => {
    if (
      formState.district &&
      !districtOptions.some((district) => matchesLocationOption(district.name, formState.district))
    ) {
      setFormState((current) => ({
        ...current,
        district: ""
      }));
    }
  }, [districtOptions, formState.district]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaveMessage("");
    await onSaveProfile(formState);
    setSaveMessage("Profile saved.");
  }

  return (
    <div className="page-transition grid gap-8">
      <PageHero
        eyebrow={translate("Profile")}
        title={
          <>
            {translate("Set the")}
            <span className="text-emerald-700">
              {` ${translate("farmer profile and market location")}`}
            </span>
            .
          </>
        }
        description={translate("This profile drives the default Agmarknet state and district used in crop price insights across the app.")}
        primaryAction={{
          label: translate("Open Recommendations"),
          onClick: () => onNavigate("/recommendations")
        }}
        secondaryAction={{
          label: translate("Back to Overview"),
          onClick: () => onNavigate("/")
        }}
        stats={[
          {
            label: translate("Farmer"),
            value: site?.profile?.name || translate("Pending"),
            detail: translate("Profile name")
          },
          {
            label: translate("Land size"),
            value: site?.profile?.landSize || translate("Pending"),
            detail: translate("Active record")
          },
          {
            label: translate("Product ID"),
            value: site?.profile?.productId || FIXED_PROFILE_PRODUCT_ID,
            detail: translate("Profile record")
          },
          {
            label: translate("Location"),
            value: site?.profile?.district
              ? `${site.profile.district}, ${site.profile.state}`
              : site?.profile?.state || translate("Pending"),
            detail: translate("Agmarknet filters")
          }
        ]}
      />

      <SurfaceCard
        eyebrow={translate("Farmer details")}
        title={translate("Profile settings")}
        subtitle={translate("Update the farmer details used for dashboard context and location-based price reporting.")}
        elevated
      >
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-700">{translate("Farmer name")}</span>
              <input
                type="text"
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
                className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                placeholder={translate("Enter farmer name")}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-700">{translate("Product ID")}</span>
              <input
                type="text"
                value={site?.profile?.productId || FIXED_PROFILE_PRODUCT_ID}
                readOnly
                className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-700">{translate("Land size")}</span>
              <input
                type="text"
                value={formState.landSize}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    landSize: event.target.value
                  }))
                }
                className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                placeholder={translate("Example: 4.5 acres")}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-700">{translate("State")}</span>
              <select
                value={formState.state}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    state: event.target.value,
                    district: ""
                  }))
                }
                className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
              >
                <option value="">{translate("Choose state")}</option>
                {agmarknetLocations.map((state) => (
                  <option key={state.id || state.name} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-slate-700">{translate("District")}</span>
              <select
                value={formState.district}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    district: event.target.value
                  }))
                }
                disabled={!formState.state}
                className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">{translate("Choose district")}</option>
                {districtOptions.map((district) => (
                  <option key={district.id || district.name} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="accent-button rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed"
            >
              {saving ? translate("Saving...") : translate("Save profile")}
            </button>
            {saveMessage ? <p className="text-sm font-semibold text-emerald-700">{translate(saveMessage)}</p> : null}
          </div>
        </form>
      </SurfaceCard>
    </div>
  );
}

function ContactPage({ site, onNavigate, translate = (value) => value }) {
  const productId = site?.profile?.productId || FIXED_PROFILE_PRODUCT_ID;

  return (
    <div className="page-transition grid gap-8">
      <PageHero
        eyebrow={translate("Contact Us")}
        title={
          <>
            {translate("Connect with")}
            <span className="text-emerald-700">
              {` ${translate("AgriCure support")}`}
            </span>
            .
          </>
        }
        description={translate("Use the support phone number below and share the product ID so the team can help you quickly.")}
        secondaryAction={{
          label: translate("Back to Overview"),
          onClick: () => onNavigate("/")
        }}
        stats={[
          {
            label: translate("Support phone"),
            value: CONTACT_PHONE_NUMBER,
            detail: translate("Customer assistance")
          },
          {
            label: translate("Product ID"),
            value: productId,
            detail: translate("Share this with support")
          }
        ]}
      />

      <SurfaceCard
        eyebrow={translate("Support details")}
        title={translate("Contact information")}
        subtitle={translate("Call the team directly and keep the product ID ready during the conversation.")}
        elevated
      >
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {translate("Phone number")}
            </p>
            <p className="mt-3 text-2xl font-black text-slate-950">{CONTACT_PHONE_NUMBER}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {translate("Available for product setup, platform help, and support queries.")}
            </p>
            <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              {translate("Number hidden for now")}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              {translate("Product ID")}
            </p>
            <p className="mt-3 text-2xl font-black text-slate-950">{productId}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {translate("Keep this ID ready when you speak with the AgriCure team.")}
            </p>
          </article>
        </div>
      </SurfaceCard>
    </div>
  );
}

function ActionPlannerPage({
  cropUi,
  predictedCrops,
  selectedCrop,
  selectedCropKey,
  actionPlannerOptions,
  plannerSeedingDate,
  plannerActions,
  plannerActionStatuses,
  onNavigate,
  translate,
  onSelectCrop,
  onSeedingDateChange,
  onActionStatusChange
}) {
  const calendarDate = plannerSeedingDate || new Date().toISOString().slice(0, 10);
  const [visibleMonth, setVisibleMonth] = useState(startOfMonthIso(calendarDate));
  const [selectedDate, setSelectedDate] = useState("");
  const [activePlannerFilter, setActivePlannerFilter] = useState("All");

  useEffect(() => {
    setVisibleMonth(startOfMonthIso(calendarDate));
  }, [calendarDate]);

  const filteredPlannerActions =
    activePlannerFilter === "All"
      ? plannerActions
      : plannerActions.filter((action) => action.type === activePlannerFilter);
  const selectedDateActions = filteredPlannerActions.filter((action) => action.date === selectedDate);

  return (
    <div className="page-transition grid gap-8">
      <PageHero
        eyebrow={translate("Action planner")}
        title={
          <>
            {translate("Turn a")}
            <span className="text-emerald-700">
              {` ${translate("crop and seeding date")}`}
            </span>{` ${translate("into a field action calendar.")}`}
          </>
        }
        description={translate("Select the crop, enter the seeding date, and get a dated action plan with fertilizer, protection, and weeding events marked on the calendar.")}
        primaryAction={{
          label: translate("Open Recommendations"),
          onClick: () => onNavigate("/recommendations")
        }}
        secondaryAction={{
          label: translate("Back to Overview"),
          onClick: () => onNavigate("/")
        }}
        stats={[
          {
            label: translate("Planner crop"),
            value: translate(selectedCrop?.label || "Choose crop"),
            detail: translate("Planning context")
          },
          {
            label: translate("Seeding date"),
            value: plannerSeedingDate ? formatDateLong(plannerSeedingDate) : translate("Pending"),
            detail: translate("Start of schedule")
          },
          {
            label: translate("Planned actions"),
            value: String(plannerActions.length),
            detail: translate("Calendar markers")
          }
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
        <SurfaceCard
          eyebrow={translate("Calendar")}
          title={translate("Action calendar")}
          subtitle={translate("The generated field actions are marked directly on the calendar.")}
          elevated
        >
          <PlannerCalendar
            anchorDate={visibleMonth}
            actions={filteredPlannerActions}
            actionStatuses={plannerActionStatuses}
            activeFilter={activePlannerFilter}
            onFilterChange={setActivePlannerFilter}
            onPreviousMonth={() => setVisibleMonth((current) => shiftMonthIso(current, -1))}
            onNextMonth={() => setVisibleMonth((current) => shiftMonthIso(current, 1))}
            onSelectDate={setSelectedDate}
            translate={translate}
          />
        </SurfaceCard>

        <SurfaceCard
          eyebrow={translate("Questions")}
          title={translate("Plan the crop schedule")}
          subtitle={translate("Answer the crop and seeding date questions to generate the farm action timeline.")}
          elevated
        >
          <div className="grid gap-6">
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {translate("Question 1")}
              </p>
              <label className="grid gap-2 text-sm">
                <span className="font-semibold text-slate-700">{translate("Enter the crop")}</span>
                <select
                  value={selectedCropKey}
                  onChange={(event) => onSelectCrop(event.target.value)}
                  className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                >
                  <option value="">{cropUi.primaryPlaceholder}</option>
                  {actionPlannerOptions.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {translate("Suggested crops")}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {predictedCrops.slice(0, 4).map((crop, index) => (
                    <Reveal key={crop.key} delay={70 + index * 50}>
                      <CropPredictionCard
                        crop={crop}
                        selectedCropKey={selectedCropKey}
                        predictedTag={cropUi.predictedTag}
                        translate={translate}
                        onSelectCrop={onSelectCrop}
                      />
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>

            {selectedCrop ? (
              <div className="grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {translate("Question 2")}
                </p>
                <label className="grid gap-2 text-sm">
                  <span className="font-semibold text-slate-700">{translate("Enter the seeding date")}</span>
                  <input
                    type="date"
                    value={plannerSeedingDate}
                    onChange={(event) => onSeedingDateChange(event.target.value)}
                    className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
                  />
                </label>
              </div>
            ) : null}

            {selectedCrop && plannerSeedingDate ? (
              <div className="grid gap-4">
                <div className="rounded-[1.6rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    {translate("Generated plan")}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {translate(selectedCrop.label)} {translate("seeded on")} {formatDateLong(plannerSeedingDate)}.{" "}
                    {translate("Follow the dated actions below.")}
                  </p>
                </div>

                {plannerActions.map((action, index) => (
                  <Reveal key={`${action.date}-${action.title}`} delay={90 + index * 55}>
                    <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${plannerEventText(action.type)}`}>
                            {translate(action.type)}
                          </p>
                          <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
                            {action.title}
                          </h3>
                        </div>
                        <span className={`status-pill status-pill--${plannerEventTone(action.type)}`}>
                          {formatDateLong(action.date)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{action.description}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>
        </SurfaceCard>
      </section>

      {selectedDate && selectedDateActions.length ? (
        <PlannerActionPopup
          date={selectedDate}
          actions={selectedDateActions}
          actionStatuses={plannerActionStatuses}
          onClose={() => setSelectedDate("")}
          onActionStatusChange={onActionStatusChange}
          translate={translate}
        />
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
  onNavigate,
  translate
}) {
  const humidityMetric = dashboard.realtime.metrics[1]?.value || "N/A";
  const temperatureMetric = dashboard.realtime.metrics[2]?.value || "N/A";

  return (
    <div className="page-transition grid gap-8">
      <PageHero
        eyebrow={translate("Sensor operations")}
        title={
          <>
            {translate("A focused telemetry page for")}
            <span className="text-emerald-700">
              {` ${translate("live field monitoring")}`}
            </span>
            .
          </>
        }
        description={uiText.realtimePanel.environmentSubtitle}
        primaryAction={{
          label: translate("Open Recommendations"),
          onClick: () => onNavigate("/recommendations")
        }}
        secondaryAction={{
          label: translate("Back to Overview"),
          onClick: () => onNavigate("/")
        }}
        stats={[
          {
            label: translate("Last sync"),
            value: formatTimeOnly(dashboard.realtime.updatedAt),
            detail: uiText.realtimePanel.lastUpdatedLabel
          },
          {
            label: translate("Humidity"),
            value: humidityMetric,
            detail: translate("Environment node")
          },
          {
            label: translate("Root zone"),
            value: temperatureMetric,
            detail: translate("Live root temperature")
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
                  tone={resolveRealtimeMetricTone(item, "soil", index)}
                />
              </Reveal>
            ))}
          </div>
        </SurfaceCard>
      </section>

      <SurfaceCard
        eyebrow={uiText.realtimePanel.environmentTitle}
        title={translate("Environment readings")}
        subtitle={uiText.realtimePanel.environmentSubtitle}
      >
        <div className="grid gap-4">
          {realtimeCardSets.environment.map((item, index) => (
            <Reveal key={item.label} delay={100 + index * 60}>
              <RealtimeMetricCard
                item={item}
                statusLabel={uiText.realtimePanel.status[item.status]}
                tone={resolveRealtimeMetricTone(item, "environment", index)}
              />
            </Reveal>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard
          eyebrow={uiText.realtimePanel.trendTitle}
          title={translate("NPK movement")}
          subtitle={uiText.realtimePanel.trendSubtitle}
        >
          {realtimeTrend ? <LineChart chart={realtimeTrend} /> : null}
        </SurfaceCard>

        <SurfaceCard
          eyebrow={uiText.realtimePanel.distributionTitle}
          title={translate("Environmental balance")}
          subtitle={uiText.realtimePanel.distributionSubtitle}
        >
          <DonutChart segments={environmentSegments} translate={translate} />
        </SurfaceCard>
      </div>

      <SurfaceCard
        eyebrow={translate("Realtime feed")}
        title={translate("Operational notes")}
        subtitle={translate("A dedicated page for the sensor stream and the latest field signals.")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {dashboard.realtime.feed.map((item, index) => (
            <Reveal key={`${item.time}-${item.detail}`} delay={100 + index * 70}>
              <article className="hover-lift rounded-[1.8rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {item.time}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{translate(item.detail)}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

function LoadingScreen() {
  const translate = (value) =>
    translateText(value, typeof document === "undefined" ? "en" : document.documentElement.lang || "en");

  return (
    <div className="flex min-h-screen items-center justify-center bg-soil-sand px-6">
      <div className="glass-panel w-full max-w-xl p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
          AgriCure
        </p>
        <h1 className="mt-4 font-display text-4xl font-black text-slate-950">
          {translate("Booting the field workspace")}
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {translate("Loading soil context, recommendations, and live telemetry.")}
        </p>
        <div className="mx-auto mt-6 h-3 w-full max-w-sm overflow-hidden rounded-full bg-slate-200">
          <div className="loading-bar h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-cyan-300" />
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }) {
  const translate = (value) =>
    translateText(value, typeof document === "undefined" ? "en" : document.documentElement.lang || "en");

  return (
    <div className="flex min-h-screen items-center justify-center bg-soil-sand px-6">
      <div className="glass-panel w-full max-w-xl p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
          AgriCure
        </p>
        <h1 className="mt-4 font-display text-4xl font-black text-slate-950">
          {translate("Unable to load the dashboard")}
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {translate(error || "Please make sure the backend server is running and try again.")}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="accent-button mt-6 rounded-full px-5 py-3 text-sm font-semibold transition"
        >
          {translate("Retry")}
        </button>
      </div>
    </div>
  );
}

function NavLink({ href, label, isActive, onNavigate, compact = false }) {
  return (
    <button
      type="button"
      onClick={() => {
        onNavigate(href);
      }}
      className={`nav-link ${compact ? "w-full justify-center text-center sm:min-w-max sm:shrink-0" : ""} ${
        isActive ? "nav-link--active" : ""
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </button>
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
    <section className="hero-shell relative overflow-hidden rounded-[1.9rem] px-4 py-6 sm:rounded-[2.3rem] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="hero-orb hero-orb--green" />
      <div className="hero-orb hero-orb--blue" />
      <div className="relative grid gap-6 sm:gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
        <div className="max-w-4xl">
          <Reveal>
            <p className="hero-badge">{eyebrow}</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="executive-title mt-4 max-w-4xl text-[2rem] font-black leading-tight sm:text-5xl xl:text-6xl">
              {title}
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
              {description}
            </p>
          </Reveal>
          <Reveal delay={260}>
            <div className="title-rule mt-6" />
          </Reveal>
          <Reveal delay={320}>
            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap">
              {primaryAction ? (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className="w-full rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 sm:w-auto"
                >
                  {primaryAction.label}
                </button>
              ) : null}
              {secondaryAction ? (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className="w-full rounded-full border border-slate-200/80 bg-white/92 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white sm:w-auto"
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
              <article className="executive-surface hover-lift rounded-[1.7rem] p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {item.label}
                </p>
                <h3 className="executive-title mt-3 text-3xl font-black">
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
    <section className={`glass-panel p-4 sm:p-7 ${elevated ? "shadow-ambient ring-1 ring-slate-200/60" : ""}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="section-kicker">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="executive-title mt-2 text-2xl font-black sm:text-3xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:leading-7">{subtitle}</p>
          ) : null}
          <div className="title-rule mt-4" />
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function HealthSignalCard({ dashboard, translate = (value) => value }) {
  return (
    <article className="hover-lift overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white p-4 text-slate-900 shadow-[0_18px_38px_rgba(15,23,42,0.05)] sm:rounded-[2rem] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {translate("Soil status")}
          </p>
          <h3 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl">
            {dashboard.overview.soilHealth.score}%
          </h3>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
            {translate(dashboard.overview.soilHealth.message)}
          </p>
        </div>
        <span className={`status-pill status-pill--${severityTone(dashboard.overview.status)}`}>
          {translate(dashboard.overview.status)}
        </span>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-3 rounded-full bg-slate-100">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
            style={{ width: `${dashboard.overview.soilHealth.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
          <span>{translate(dashboard.overview.soilHealth.support)}</span>
          <span>{formatDateTime(dashboard.overview.timestamp)}</span>
        </div>
      </div>
    </article>
  );
}

function MetricTile({ label, value, tone }) {
  return (
    <article className={`hover-lift rounded-[1.35rem] border p-4 sm:rounded-[1.7rem] sm:p-5 ${toneBorder(tone)} ${toneSurface(tone)} shadow-[0_14px_34px_rgba(15,23,42,0.05)]`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${toneText(tone)}`}>
        {label}
      </p>
      <h3 className="executive-title mt-3 text-2xl font-black sm:text-3xl">
        {value}
      </h3>
    </article>
  );
}

function StatTile({ label, value, dark = false }) {
  return (
    <article
      className={`rounded-[1.5rem] p-4 ${
        dark ? "soft-accent-stat" : "border border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.22em] ${
          dark ? "soft-accent-stat-label" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <h3 className={`mt-3 text-lg font-bold ${dark ? "soft-accent-stat-value" : "text-slate-950"}`}>
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
        <h3 className="executive-title mt-3 text-2xl font-bold">{title}</h3>
      </div>
      <p className="text-sm leading-7 text-slate-600">{description}</p>
      <span className="text-sm font-semibold text-slate-950">{actionLabel}</span>
    </button>
  );
}

function CropPredictionCard({ crop, selectedCropKey, predictedTag, onSelectCrop, translate = (value) => value }) {
  const isSelected = selectedCropKey === crop.key;

  return (
    <button
      type="button"
      onClick={() => onSelectCrop(crop.key)}
      aria-pressed={isSelected}
      className={`hover-lift rounded-[1.8rem] border p-5 text-left transition ${
        isSelected
          ? "border-emerald-300 bg-[linear-gradient(135deg,rgba(236,253,245,0.98)_0%,rgba(255,255,255,0.98)_52%,rgba(236,254,255,0.98)_100%)] text-slate-950 shadow-[0_20px_44px_rgba(31,92,78,0.14)] ring-2 ring-emerald-200/80"
          : "border-slate-200/80 bg-white/92 hover:border-emerald-200 hover:bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.24em] ${
              isSelected ? "text-emerald-800" : "text-slate-500"
            }`}
          >
            {predictedTag} • {translate(crop.family)}
          </p>
          <h3 className="executive-title mt-2 text-2xl font-bold">{translate(crop.label)}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            isSelected
              ? "bg-[linear-gradient(135deg,#065f46_0%,#0f766e_100%)] text-white shadow-sm"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {formatCurrency(crop.marketPrice)}
        </span>
      </div>
      <p className={`mt-3 text-sm leading-7 ${isSelected ? "text-slate-700" : "text-slate-600"}`}>
        {translate(crop.reason)}
      </p>
      {crop.marketSource ? (
        <p className={`mt-2 text-xs ${isSelected ? "text-slate-600" : "text-slate-500"}`}>
          {`${crop.marketSource.source} • ${crop.marketSource.marketName}, ${
            crop.marketSource.stateName
          } • ${formatDateLong(crop.marketSource.lastReportedDate)}`}
        </p>
      ) : null}
    </button>
  );
}

function PestGalleryPanel({ items, translate = (value) => value }) {
  return (
    <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {translate("Pest gallery")}
      </p>
      <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">
        {translate("Common pests and disease references")}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {translate("Web-loaded visual references for different pests or diseases linked to the selected crop.")}
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={`${item.name}-${item.query}`} delay={60 + index * 50}>
            <PestPhotoCard item={item} translate={translate} />
          </Reveal>
        ))}
      </div>
    </article>
  );
}

function PestPhotoCard({ item, translate = (value) => value }) {
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
            <p className="text-sm font-semibold text-slate-500">{translate("Loading pest photo...")}</p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50 to-cyan-50 px-4 text-center">
            <p className="text-sm font-semibold text-slate-500">{translate("Photo unavailable right now.")}</p>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-950/80 via-emerald-900/35 to-transparent p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            {translate("Pest")}
          </p>
          <h4 className="mt-2 font-display text-2xl font-bold text-white">{translate(item.name)}</h4>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm leading-7 text-slate-600">
          {translate("Search topic:")} <span className="font-semibold text-slate-900">{translate(item.query)}</span>
        </p>
        {photoState.pageUrl ? (
          <a
            href={photoState.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="accent-button mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold transition"
          >
            {translate("Source: Wikipedia")}
          </a>
        ) : null}
      </div>
    </article>
  );
}

function PlannerActionPopup({
  date,
  actions,
  actionStatuses,
  onClose,
  onActionStatusChange,
  translate = (value) => value
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/20 px-4">
      <div className="glass-panel w-full max-w-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {translate("Assigned actions")}
            </p>
            <h3 className="mt-2 font-display text-3xl font-bold text-slate-950">
              {formatDateLong(date)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {translate("Close")}
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {actions.map((action) => {
            const done = Boolean(actionStatuses[action.id]?.done);

            return (
              <article key={action.id} className="rounded-[1.7rem] border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${plannerEventText(action.type)}`}>
                      {translate(action.type)}
                    </p>
                    <h4 className="mt-2 font-display text-2xl font-bold text-slate-950">
                      {action.title}
                    </h4>
                  </div>
                  <span className={`status-pill status-pill--${done ? "slate" : plannerEventTone(action.type)}`}>
                    {done ? translate("Done") : translate("Not done")}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{action.description}</p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onActionStatusChange(action.id, true)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      done ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {translate("Done")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onActionStatusChange(action.id, false)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      !done ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {translate("Not done")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlannerReminderBanner({ reminders, actionStatuses, translate = (value) => value }) {
  const pendingReminders = reminders.filter((item) => !actionStatuses[item.id]?.done);

  if (pendingReminders.length === 0) {
    return null;
  }

  return (
    <section className="glass-panel border border-amber-200 bg-amber-50/90 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
        {translate("Reminder")}
      </p>
      <div className="mt-3 grid gap-3">
        {pendingReminders.map((item) => (
          <div key={item.id} className="rounded-[1.2rem] bg-white px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-950">{item.title}</span> {translate("is still not done.")}{" "}
            {translate("Reminder active every 3 hours from")} {formatDateLong(item.date)}{" "}
            {translate("until you mark it done.")}
          </div>
        ))}
      </div>
    </section>
  );
}

function PlannerCalendar({
  anchorDate,
  actions,
  actionStatuses,
  activeFilter,
  onFilterChange,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
  translate = (value) => value
}) {
  const baseDate = parseIsoDate(anchorDate);
  const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const actionsByDate = new Map();

  actions.forEach((action) => {
    const existing = actionsByDate.get(action.date) || [];
    actionsByDate.set(action.date, [...existing, action]);
  });
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const currentDate = new Date(gridStart);
    currentDate.setDate(gridStart.getDate() + index);
    const isoDate = toIsoDate(currentDate);
    const isCurrentMonth = currentDate.getMonth() === monthStart.getMonth();

    days.push({
      isoDate,
      label: currentDate.getDate(),
      isCurrentMonth,
      actions: actionsByDate.get(isoDate) || []
    });
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPreviousMonth}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {translate("Prev")}
          </button>
          <h3 className="font-display text-3xl font-bold text-slate-950">
            {monthStart.toLocaleDateString(getSpeechLocale(document.documentElement.lang || "en"), {
              month: "long",
              year: "numeric"
            })}
          </h3>
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {translate("Next")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onFilterChange("All")}
          className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] transition ${
            activeFilter === "All"
              ? "accent-button text-white"
              : "bg-slate-100 text-slate-700 hover:bg-white"
          }`}
        >
          {translate("All")}
        </button>
        {PLANNER_EVENT_TYPES.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onFilterChange(item.type)}
            className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] transition ${
              activeFilter === item.type
                ? `status-pill status-pill--${item.tone}`
                : "bg-slate-100 text-slate-700 hover:bg-white"
            }`}
            >
            {translate(item.label)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[34rem] grid gap-3 sm:min-w-[44rem]">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2">
                {translate(day)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => (
              <button
                type="button"
                key={day.isoDate}
                onClick={() => {
                  if (day.actions.length) {
                    onSelectDate(day.isoDate);
                  }
                }}
                className={`aspect-square min-h-[82px] rounded-[1.1rem] border p-2.5 align-top sm:min-h-[96px] sm:rounded-[1.3rem] sm:p-3 ${
                  day.isCurrentMonth
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50 text-slate-400"
                } ${
                  day.actions.length
                    ? "text-left transition hover:border-emerald-300 hover:shadow-soft"
                    : "text-left"
                }`}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold">{day.label}</span>
                    {day.actions.length ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
                        {day.actions.length}
                      </span>
                    ) : null}
                  </div>

                  {day.actions.length ? (
                    <div className="grid gap-2">
                      <div className="flex flex-wrap gap-1">
                        {day.actions.slice(0, 4).map((action) => (
                          <span
                            key={`${day.isoDate}-${action.type}-${action.shortLabel}`}
                            className={`h-3 w-3 rounded-full ${
                              actionStatuses[action.id]?.done
                                ? "bg-slate-300"
                                : plannerEventDot(action.type)
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        View actions
                      </p>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-300">
                      {translate("No actions")}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SensorValueSection({ title, subtitle, items, statusMap, cardKind }) {
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
            <RealtimeMetricCard
              item={item}
              statusLabel={statusMap?.[item.status] || item.status}
              tone={resolveRealtimeMetricTone(item, cardKind, index)}
            />
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
  showCostStats = true,
  marketplaceKind = "",
  translate = (value) => value
}) {
  const totals = showCostStats ? buildRecommendationCostTotals(items) : null;
  const actionableMarketplaceItems = items
    .map((item, index) => {
      const nutrientKey = FERTILIZER_MARKETPLACE_NUTRIENT_KEYS[index];

      if (!nutrientKey || isPausedRecommendation(item)) {
        return null;
      }

      return getMarketplaceProduct(marketplaceKind, nutrientKey);
    })
    .filter(Boolean);

  function handleBuyTotalPlan() {
    if (typeof window === "undefined") {
      return;
    }

    actionableMarketplaceItems.forEach((product) => {
      window.open(product.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <article className={boxed ? "rounded-[1.9rem] border border-slate-200 bg-white p-5" : ""}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
      <div className="mt-4 grid gap-4">
        {items.map((item, index) => {
          const nutrientKey = FERTILIZER_MARKETPLACE_NUTRIENT_KEYS[index];
          const marketplaceProduct = nutrientKey
            ? getMarketplaceProduct(marketplaceKind, nutrientKey)
            : null;
          const canBuy = Boolean(marketplaceProduct) && !isPausedRecommendation(item);

          return (
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
                <MiniStat label={translate("Content")} value={item.nutrientContent} />
                <MiniStat label={translate("Rate")} value={item.applicationRate} />
                {item.brandExamples?.length ? (
                  <MiniStat
                    label={translate("Brand examples")}
                    value={item.brandExamples.join(", ")}
                  />
                ) : null}
                {showPricing ? <MiniStat label={translate("Price range")} value={item.priceRange} /> : null}
                {showCostStats ? <MiniStat label={translate("Cost / acre")} value={item.costSummary.estimated} /> : null}
                {showCostStats ? <MiniStat label={translate("Total plan")} value={item.costSummary.total} /> : null}
              </div>
              <p className="mt-4 rounded-[1.2rem] bg-white px-4 py-3 text-sm text-slate-600">
                {item.note}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {canBuy ? (
                  <a
                    href={marketplaceProduct.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[linear-gradient(135deg,#065f46_0%,#0f766e_100%)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                  >
                    {translate("Buy on BigHaat")}
                  </a>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
                    {translate("No purchase needed")}
                  </span>
                )}
                {canBuy ? (
                  <span className="text-xs text-slate-500">
                    {translate("Opens")} {marketplaceProduct.productLabel} {translate("on BigHaat")}
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
        {showCostStats && items.length ? (
          <article className="rounded-[1.7rem] border border-emerald-200 bg-[linear-gradient(180deg,#f8fffb_0%,#dcfce7_100%)] p-5 text-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              {translate("Total plan")}
            </p>
            <h3 className="mt-3 font-display text-2xl font-bold">{title}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniStat label={translate("Cost / acre")} value={totals.estimated} />
              <MiniStat label={translate("Total plan")} value={totals.total} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {actionableMarketplaceItems.length ? (
                <>
                  <button
                    type="button"
                    onClick={handleBuyTotalPlan}
                    className="rounded-full bg-[linear-gradient(135deg,#065f46_0%,#0f766e_100%)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                  >
                    {translate("Buy total on BigHaat")}
                  </button>
                  <span className="text-xs text-slate-600">
                    {translate("Opens the recommended")} {actionableMarketplaceItems.length}{" "}
                    {translate("product pages in new tabs.")}
                  </span>
                </>
              ) : (
                <span className="rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600">
                  {translate("No purchase needed right now")}
                </span>
              )}
            </div>
          </article>
        ) : null}
      </div>
    </article>
  );
}

const FERTILIZER_FOCUS_LABELS = ["Nitrogen", "Phosphorus", "Potassium"];
const FERTILIZER_MARKETPLACE_NUTRIENT_KEYS = ["nitrogen", "phosphorus", "potassium"];
const FERTILIZER_MARKETPLACE_PRODUCTS = {
  inorganic: {
    nitrogen: {
      productLabel: "IFFCO Nano Urea",
      url: "https://www.bighaat.com/products/iffco-nano-urea?variant=40999565164567"
    },
    phosphorus: {
      productLabel: "Katra Urea Phosphate 17-44-00",
      url: "https://www.bighaat.com/products/katra-urea-phosphate-17-44-00?variant=41908173733911"
    },
    potassium: {
      productLabel: "Agriventure NPK 00-00-50",
      url: "https://www.bighaat.com/products/agriventure-npk-00-00-50-fertilizer?variant=41911008657431"
    }
  },
  organic: {
    nitrogen: {
      productLabel: "Amruth Neem Powder",
      url: "https://www.bighaat.com/products/amruth-neem-powder?variant=42260901330967"
    },
    phosphorus: {
      productLabel: "Gloryfert PROM",
      url: "https://www.bighaat.com/products/gloryfert-prom-organic-fertilizers?variant=40454319046679"
    },
    potassium: {
      productLabel: "Speed Kompost",
      url: "https://www.bighaat.com/products/speed-kompost?variant=40639842353175"
    }
  }
};

function getMarketplaceProduct(kind, nutrientKey) {
  return FERTILIZER_MARKETPLACE_PRODUCTS[kind]?.[nutrientKey] || null;
}

function isPausedRecommendation(item) {
  const fertilizer = String(item?.fertilizer || "").toLowerCase();
  return fertilizer.startsWith("no ") || String(item?.applicationRate || "").startsWith("0 ");
}

function buildOrganicAlternativeItems(organicItems = [], inorganicItems = []) {
  return organicItems.map((item, index) => ({
    eyebrow: `${FERTILIZER_FOCUS_LABELS[index] || `Plan ${index + 1}`} organic option`,
    title: `${FERTILIZER_FOCUS_LABELS[index] || `Plan ${index + 1}`} organic alternative`,
    fertilizerName: item.fertilizer || "Organic fertilizer",
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

const SOIL_STATUS_BACKGROUND_RULES = [
  { min: 24, max: 44 },
  { min: 18, max: 40 },
  { min: 80, max: 160 },
  { min: 6.2, max: 7.5 }
];

const ENVIRONMENT_CARD_TONES = ["orange", "teal", "amber"];

function readMetricNumber(value) {
  const match = String(value ?? "").match(/-?\d+(\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : Number.NaN;
}

function resolveSoilMetricTone(value, index, fallbackTone = "slate") {
  const rule = SOIL_STATUS_BACKGROUND_RULES[index];

  if (!rule) {
    return fallbackTone;
  }

  const numericValue = readMetricNumber(value);

  if (!Number.isFinite(numericValue)) {
    return fallbackTone;
  }

  if (numericValue < rule.min) {
    return "rose";
  }

  if (numericValue > rule.max) {
    return "sky";
  }

  return "emerald";
}

function resolveWeatherMetricTone(item, index) {
  const key = String(item?.key || item?.label || "").toLowerCase();

  if (key.includes("humidity")) {
    return "teal";
  }

  if (key.includes("flux") || key.includes("sunlight")) {
    return "amber";
  }

  if (key.includes("temperature")) {
    return "orange";
  }

  return ENVIRONMENT_CARD_TONES[index % ENVIRONMENT_CARD_TONES.length];
}

function resolveRealtimeMetricTone(item, cardKind, index) {
  if (cardKind === "soil") {
    return resolveSoilMetricTone(item?.value, index);
  }

  if (cardKind === "environment") {
    return resolveWeatherMetricTone(item, index);
  }

  return "slate";
}

function resolveOverviewMetricTone(item, section, index) {
  if (section === "soil") {
    return resolveSoilMetricTone(item?.value, index, item?.tone || "slate");
  }

  if (section === "environment") {
    return resolveWeatherMetricTone(item, index);
  }

  return item?.tone || "slate";
}

function MiniStat({ label, value, dark = false }) {
  return (
    <div className={`rounded-[1.2rem] px-4 py-3 ${dark ? "soft-accent-stat" : "bg-white"}`}>
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
          dark ? "soft-accent-stat-label" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p className={`mt-2 text-sm font-semibold ${dark ? "soft-accent-stat-value" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function RealtimeMetricCard({ item, statusLabel, tone = "slate" }) {
  return (
    <article
      className={`hover-lift rounded-[1.8rem] border p-5 ${toneBorder(tone)} ${toneSurface(tone)}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${toneText(tone)}`}>
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

function DonutChart({ segments, translate = (value) => value }) {
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
                {translate("Live mix")}
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
  onClose,
  uiText,
  selectedLanguage,
  messages,
  input,
  busy,
  translate = (value) => value,
  onInputChange,
  onSubmit
}) {
  const widgetRef = useRef(null);
  const recognitionRef = useRef(null);
  const spokenMessageRef = useRef("");
  const pendingTranscriptRef = useRef("");
  const submitOnEndRef = useRef(false);
  const onInputChangeRef = useRef(onInputChange);
  const onSubmitRef = useRef(onSubmit);
  const [micAvailable, setMicAvailable] = useState(false);
  const [micListening, setMicListening] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
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

    function handlePointerDown(event) {
      if (isOpen && widgetRef.current && !widgetRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return undefined;
    }

    const synth = window.speechSynthesis;
    const syncVoices = () => {
      const voices = synth.getVoices();

      if (voices.length) {
        setAvailableVoices(voices);
      }
    };

    syncVoices();
    synth.addEventListener?.("voiceschanged", syncVoices);

    return () => {
      synth.removeEventListener?.("voiceschanged", syncVoices);
    };
  }, []);

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
    const speechKey = `${messages.length}:${latestMessage?.role || ""}:${latestMessage?.text || ""}`;

    if (!isOpen || !latestMessage || latestMessage.role !== "assistant" || micListening) {
      return undefined;
    }

    if (spokenMessageRef.current === speechKey) {
      return undefined;
    }

    spokenMessageRef.current = speechKey;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(normalizeSpeechText(latestMessage.text));
    const speechLocale = getSpeechLocale(selectedLanguage);
    utterance.lang = speechLocale;
    utterance.rate = getSpeechRate(selectedLanguage);
    utterance.pitch = 1;
    utterance.volume = 1;

    const matchedVoice = pickSpeechVoice(availableVoices, speechLocale);

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    const timeoutId = window.setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 60);

    return () => {
      window.clearTimeout(timeoutId);
      window.speechSynthesis.cancel();
    };
  }, [availableVoices, isOpen, messages, micListening, selectedLanguage]);

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
    <div ref={widgetRef} className="fixed bottom-24 right-3 z-30 flex flex-col items-end gap-3 sm:bottom-5 sm:right-5">
      {isOpen ? (
        <div className="glass-panel w-[min(430px,calc(100vw-2.5rem))] overflow-hidden">
          <div className="accent-shell border-b border-white/10 px-5 py-4 text-white">
            <p className="accent-shell-muted text-xs font-semibold uppercase tracking-[0.3em]">
              {uiText.eyebrow}
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold">{uiText.title}</h2>
                <p className="accent-shell-muted mt-1 text-sm">{uiText.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="accent-shell-chip rounded-full px-3 py-1 text-sm font-semibold"
              >
                {translate("Close")}
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
                    ? "accent-shell ml-auto max-w-[88%] text-white"
                    : message.role === "status"
                      ? "max-w-[88%] bg-amber-50 text-amber-900"
                      : "max-w-[88%] bg-white text-slate-900 shadow-soft"
                }`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                    message.role === "user" ? "accent-shell-muted" : "text-slate-400"
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
                  className="accent-button rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {busy ? translate("Sending...") : uiText.sendLabel}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        aria-label={uiText.launcherTitle}
        className="accent-shell group grid h-14 w-14 place-items-center overflow-hidden rounded-full text-left text-white shadow-ambient transition hover:-translate-y-0.5 sm:flex sm:h-auto sm:w-auto sm:items-center sm:rounded-[1.7rem] sm:px-5 sm:py-4"
      >
        <div className="accent-shell-chip grid h-10 w-10 place-items-center rounded-full sm:hidden">
          <span className="text-lg">{translate("AI")}</span>
        </div>
        <div className="hidden sm:ml-3 sm:block">
          <p className="accent-shell-muted text-xs font-semibold uppercase tracking-[0.28em]">
            {uiText.launcherSubtitle}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="accent-shell-chip hidden h-10 w-10 place-items-center rounded-2xl sm:grid">
              <span className="text-lg">{translate("AI")}</span>
            </div>
            <div>
              <p className="font-display text-lg font-bold">{uiText.launcherTitle}</p>
              <p className="accent-shell-muted text-sm">{translate("Open assistant")}</p>
            </div>
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

function normalizeSpeechText(value) {
  return String(value || "")
    .replace(/\bNPK\b/g, "N P K")
    .replace(/\bpH\b/g, "P H")
    .replace(/\buS\/cm\b/gi, "micro siemens per centimeter")
    .replace(/\s+/g, " ")
    .trim();
}

function getSpeechRate(languageCode) {
  return languageCode === "en" ? 0.94 : 0.88;
}

function scoreSpeechVoice(voice, speechLocale) {
  const targetLanguage = speechLocale.toLowerCase();
  const targetPrefix = targetLanguage.split("-")[0];
  const voiceLanguage = String(voice?.lang || "").toLowerCase();
  const voiceName = String(voice?.name || "").toLowerCase();
  let score = 0;

  if (voiceLanguage === targetLanguage) {
    score += 6;
  } else if (voiceLanguage.startsWith(targetPrefix)) {
    score += 4;
  }

  if (
    /google|microsoft|samantha|zira|heera|lekha|neural|natural|enhanced|premium/i.test(
      voiceName
    )
  ) {
    score += 3;
  }

  if (voice?.default) {
    score += 1;
  }

  if (voice?.localService) {
    score += 1;
  }

  return score;
}

function pickSpeechVoice(voices, speechLocale) {
  if (!Array.isArray(voices) || voices.length === 0) {
    return null;
  }

  return [...voices].sort(
    (left, right) => scoreSpeechVoice(right, speechLocale) - scoreSpeechVoice(left, speechLocale)
  )[0];
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

const PLANNER_EVENT_TYPES = [
  { type: "Seeding", label: "Seeding", tone: "sky" },
  { type: "Irrigation", label: "Irrigation", tone: "sky" },
  { type: "Fertilizer", label: "Fertilizer", tone: "emerald" },
  { type: "Weeding", label: "Weeding", tone: "amber" },
  { type: "Pesticide", label: "Pesticide", tone: "rose" },
  { type: "Monitoring", label: "Monitoring", tone: "violet" },
  { type: "Harvest", label: "Harvest", tone: "indigo" }
];

function plannerEventTone(type) {
  const value = String(type || "").toLowerCase();

  if (value.includes("fertilizer")) {
    return "emerald";
  }

  if (value.includes("weeding")) {
    return "amber";
  }

  if (value.includes("pesticide")) {
    return "rose";
  }

  if (value.includes("monitor")) {
    return "violet";
  }

  if (value.includes("harvest")) {
    return "indigo";
  }

  return "sky";
}

function plannerEventText(type) {
  const map = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    sky: "text-sky-600"
  };

  return map[plannerEventTone(type)] || "text-slate-500";
}

function plannerEventDot(type) {
  const map = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500"
  };

  return map[plannerEventTone(type)] || "bg-slate-400";
}

function plannerEventPill(type) {
  const map = {
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700"
  };

  return map[plannerEventTone(type)] || "bg-slate-100 text-slate-700";
}

function parseIsoDate(isoDate) {
  const match = String(isoDate || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.valueOf()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function startOfMonthIso(isoDate) {
  const date = parseIsoDate(isoDate);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function shiftMonthIso(isoDate, offset) {
  const date = parseIsoDate(isoDate);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + offset, 1));
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDaysToIsoDate(isoDate, days) {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function buildPlannerActionStatuses(actions, statusMap) {
  return actions.reduce((accumulator, action) => {
    accumulator[action.id] = statusMap[action.id] || {
      done: false,
      lastReminderAt: 0
    };
    return accumulator;
  }, {});
}

function buildPlannerActions(selectedCrop, seedingDate, cropRecommendations) {
  if (!selectedCrop || !seedingDate) {
    return [];
  }

  const inorganic = cropRecommendations?.inorganic?.[0];
  const organic = cropRecommendations?.organic?.[0];
  const cropLabel = selectedCrop.label;
  const profileKey = selectedCrop.thresholdProfileKey || "default";
  const cropKey = String(selectedCrop.label || "").toLowerCase();

  const schedules = {
    paddy: {
      irrigationDays: [3, 12, 26, 42],
      monitoringDays: [18, 34, 56],
      fertilizerDays: [0, 20, 40],
      weedingDays: [18, 36],
      pesticideDays: [28, 50],
      harvestDay: 115
    },
    wheat: {
      irrigationDays: [7, 24, 45, 70],
      monitoringDays: [14, 32, 58],
      fertilizerDays: [0, 22, 48],
      weedingDays: [20, 38],
      pesticideDays: [35, 62],
      harvestDay: 120
    },
    corn: {
      irrigationDays: [5, 16, 30, 48, 68],
      monitoringDays: [12, 26, 44],
      fertilizerDays: [0, 18, 36],
      weedingDays: [16, 32],
      pesticideDays: [24, 46],
      harvestDay: 105
    },
    fruitingVegetable: {
      irrigationDays: [3, 10, 18, 28, 40, 55],
      monitoringDays: [9, 20, 34, 48],
      fertilizerDays: [0, 16, 32, 48],
      weedingDays: [12, 26],
      pesticideDays: [22, 38, 54],
      harvestDay: 80
    },
    rootVegetable: {
      irrigationDays: [4, 12, 22, 36, 52],
      monitoringDays: [10, 24, 40],
      fertilizerDays: [0, 18, 36],
      weedingDays: [14, 28],
      pesticideDays: [26, 44],
      harvestDay: 95
    },
    leafyVegetable: {
      irrigationDays: [2, 8, 15, 24, 34],
      monitoringDays: [7, 18, 28],
      fertilizerDays: [0, 14, 26],
      weedingDays: [10, 22],
      pesticideDays: [18, 30],
      harvestDay: 55
    },
    default: {
      irrigationDays: [5, 16, 30, 48],
      monitoringDays: [12, 28, 44],
      fertilizerDays: [0, 20, 38],
      weedingDays: [14, 30],
      pesticideDays: [24, 42],
      harvestDay: 100
    }
  };

  const schedule = schedules[profileKey] || schedules.default;
  const actions = [];

  function pushAction(type, dayOffset, shortLabel, title, description) {
    actions.push({
      id: `${cropLabel}-${seedingDate}-${type.toLowerCase()}-${dayOffset}-${shortLabel.toLowerCase().replace(/\s+/g, "-")}`,
      type,
      date: addDaysToIsoDate(seedingDate, dayOffset),
      title,
      shortLabel,
      description
    });
  }

  pushAction(
    "Seeding",
    0,
    "Seed",
    `${cropLabel} seeding`,
    `Seed ${cropLabel} on the planned date and confirm moisture availability for establishment.`
  );

  pushAction(
    "Fertilizer",
    schedule.fertilizerDays[0],
    "Basal feed",
    "Basal fertilizer application",
    `Apply ${inorganic?.fertilizer || "the primary inorganic fertilizer"} at seeding time. Organic support can follow with ${organic?.fertilizer || "the recommended organic fertilizer"} if needed.`
  );

  schedule.irrigationDays.forEach((dayOffset, index) => {
    pushAction(
      "Irrigation",
      dayOffset,
      `Water ${index + 1}`,
      index === 0 ? "First irrigation cycle" : `Irrigation cycle ${index + 1}`,
      `Plan irrigation for ${cropLabel} around this date and adjust based on rainfall and soil moisture.`
    );
  });

  schedule.monitoringDays.forEach((dayOffset, index) => {
    pushAction(
      "Monitoring",
      dayOffset,
      `Scout ${index + 1}`,
      `Field scouting round ${index + 1}`,
      `Inspect ${cropLabel} for nutrient stress, pest pressure, and stand uniformity before the next field operation.`
    );
  });

  schedule.weedingDays.forEach((dayOffset, index) => {
    pushAction(
      "Weeding",
      dayOffset,
      index === 0 ? "Weeding 1" : `Weeding ${index + 1}`,
      index === 0 ? "First weeding window" : `Weeding round ${index + 1}`,
      `Do ${index === 0 ? "the first" : "the next"} weeding pass around this date to reduce competition in ${cropLabel}.`
    );
  });

  schedule.fertilizerDays.slice(1).forEach((dayOffset, index) => {
    pushAction(
      "Fertilizer",
      dayOffset,
      index === 0 ? "Top dress" : `Feed ${index + 2}`,
      index === 0 ? "Top-dress fertilizer round" : `Fertilizer round ${index + 2}`,
      `Follow up with ${inorganic?.fertilizer || "the recommended fertilizer"} as the next nutrient round for ${cropLabel}.`
    );
  });

  schedule.pesticideDays.forEach((dayOffset, index) => {
    pushAction(
      "Pesticide",
      dayOffset,
      index === 0 ? "Spray" : `Spray ${index + 1}`,
      index === 0 ? "Protection spray and scout" : `Protection round ${index + 1}`,
      `Scout the field and apply pesticide or insecticide only if symptoms or pest pressure are visible on ${cropLabel}.`
    );
  });

  if (profileKey.includes("Vegetable") || profileKey === "fruitingVegetable") {
    pushAction(
      "Monitoring",
      42,
      "Flowering",
      "Flowering and fruit-set check",
      `Check flowering, fruit set, and nutrient balance for ${cropLabel} before the next support input.`
    );
  }

  if (cropKey.includes("paddy")) {
    pushAction(
      "Monitoring",
      65,
      "Tillers",
      "Tillering and panicle check",
      `Inspect tiller strength and panicle development in ${cropLabel} to confirm the crop is on track.`
    );
  }

  pushAction(
    "Harvest",
    schedule.harvestDay,
    "Harvest",
    "Harvest preparation window",
    `Prepare labor, bags, and transport for ${cropLabel}. Confirm maturity and weather before harvest.`
  );

  return actions.sort((first, second) => first.date.localeCompare(second.date));
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
