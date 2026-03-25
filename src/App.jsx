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
  formatDateLong,
  formatNumber,
  formatTimeOnly,
  metricStatusTone,
  priorityTone,
  severityTone
} from "./lib/dashboard";

const NAV_ITEM_CONFIG = [
  {
    path: "/",
    label: "Overview"
  },
  {
    path: "/action-planner",
    label: "Action Planner"
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

const TRANSLATION_PATTERNS = {
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
    ["Critical", "गंभीर"]
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
    ["Optimal", "ఉత్తమం"],
    ["Warning", "హెచ్చరిక"],
    ["Critical", "క్రిటికల్"]
  ]
};

function translateText(value, languageCode) {
  if (languageCode === "en" || typeof value !== "string" || !value) {
    return value;
  }

  const patterns = TRANSLATION_PATTERNS[languageCode] || [];
  return patterns.reduce((current, [source, target]) => current.split(source).join(target), value);
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

  if (normalized === "/profile") {
    return "/profile";
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

function getDistrictOptionsForState(states, stateName) {
  const match = (states || []).find((state) => state.name === stateName);
  return match?.districts || [];
}

function formatArrivals(arrivals, unit = "Metric Tonnes") {
  if (arrivals === null || arrivals === undefined || arrivals === "") {
    return "N/A";
  }

  return `${formatNumber(arrivals, 1)} ${unit}`;
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
  const [ppqsAdvisories, setPpqsAdvisories] = useState({});
  const [schemeFilterState, setSchemeFilterState] = useState("");
  const [schemeInsights, setSchemeInsights] = useState(null);
  const [schemeInsightsLoading, setSchemeInsightsLoading] = useState(false);
  const [schemeInsightsError, setSchemeInsightsError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const profileRef = useRef(null);

  const activeLanguage = site?.selectedLanguage || "en";
  const profileLocationKey = buildLocationKey(site?.profile?.state, site?.profile?.district);
  const translate = (value) => translateText(value, activeLanguage);
  const uiText = translateContent(site?.uiText || FALLBACK_UI_TEXT, activeLanguage);
  const selectedCrop = getCropProfile(selectedCropKey);
  const cropUi = uiText.recommendationWorkspace.cropSelection;
  const navItems = NAV_ITEM_CONFIG.map((item) => ({
    ...item,
    label: translate(item.label)
  }));
  const actionPlannerOptions = ACTION_PLANNER_OPTIONS.map((item) => ({
    ...item,
    label: translate(item.label)
  }));
  const basePredictedCrops = dashboard ? buildPredictedCropSuggestions(dashboard) : [];
  const basePredictedCropSections = dashboard
    ? buildPredictedCropSections(dashboard)
    : { cereals: [], vegetable: null };
  const agmarknetCropKeys = collectAgmarknetCropKeys(
    selectedCropKey,
    basePredictedCrops,
    basePredictedCropSections
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
        const response = await fetch("/api/agmarknet/locations");
        const payload = await response.json();

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
    setPriceFilterState(site?.profile?.state || "");
    setPriceFilterDistrict(site?.profile?.district || "");
    setSchemeFilterState(site?.profile?.state || "");
  }, [site?.profile?.state, site?.profile?.district]);

  useEffect(() => {
    if (
      priceFilterDistrict &&
      !priceDistrictOptions.some((district) => district.name === priceFilterDistrict)
    ) {
      setPriceFilterDistrict("");
    }
  }, [priceDistrictOptions, priceFilterDistrict]);

  useEffect(() => {
    const missingCropKeys = agmarknetCropKeys.filter(
      (cropKey) => !marketInsights[cropKey] && !marketInsightAttempts[cropKey]
    );

    if (missingCropKeys.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadAgmarknetPrices() {
      try {
        const response = await fetch("/api/agmarknet/prices", {
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
        const payload = await response.json();

        if (!response.ok || cancelled) {
          return;
        }

        setMarketInsights((current) => ({
          ...current,
          ...(payload.insights || {})
        }));
      } catch {
        // Ignore Agmarknet issues and keep the static fallback prices in place.
      } finally {
        if (!cancelled) {
          setMarketInsightAttempts((current) => {
            const nextState = { ...current };
            missingCropKeys.forEach((cropKey) => {
              nextState[cropKey] = true;
            });
            return nextState;
          });
        }
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
        const response = await fetch("/api/ppqs/advisories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cropKey: selectedCropKey
          })
        });
        const payload = await response.json();

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
        const response = await fetch("/api/agmarknet/report", {
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
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load crop price report.");
        }

        if (!cancelled) {
          setPriceReport(payload.report || null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setPriceReport(null);
          setPriceReportError(loadError.message || "Unable to load crop price report.");
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
        const response = await fetch("/api/vikaspedia/schemes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            stateName: schemeFilterState
          })
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load government schemes.");
        }

        if (!cancelled) {
          setSchemeInsights(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setSchemeInsights(null);
          setSchemeInsightsError(loadError.message || "Unable to load government schemes.");
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

  async function handleProfileSave(profilePatch) {
    setProfileSaving(true);
    setError("");

    try {
      const response = await fetch("/api/site-data", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profile: profilePatch
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save profile.");
      }

      if (payload.siteData) {
        setSite(payload.siteData);
      }
    } catch (saveError) {
      setError(saveError.message || "Unable to save profile.");
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

            <div className="flex items-center gap-3 sm:gap-4">
              <label className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-soft sm:flex">
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
                      className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      {uiText.manageAccountLabel}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
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

        <main className="mx-auto mt-8 flex w-full max-w-[88rem] flex-col gap-10 px-0 sm:px-1 lg:px-1">
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
              toolModel={toolModel}
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
        translate={translate}
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
            <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-cyan-500 bg-clip-text text-transparent">
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
                tone={item.tone}
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
                tone={item.tone}
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
            <span className="bg-gradient-to-r from-slate-950 via-emerald-600 to-cyan-500 bg-clip-text text-transparent">
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
              <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  {cropUi.familyLabel}
                </p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h3 className="font-display text-3xl font-black">{translate(selectedCrop.label)}</h3>
                    <p className="mt-2 text-sm text-white/75">{translate(selectedCrop.family)}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    {cropUi.unlockedMessagePrefix} {translate(selectedCrop.label)}
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
                    value={`${
                      selectedCropInsight
                        ? formatCurrency(selectedCropInsight.latestPrice)
                        : formatCurrency(selectedCrop.marketPrice)
                    } ${
                      selectedCropInsight
                        ? translate(buildAgmarknetUnitLabel(selectedCropInsight.priceUnit))
                        : translate(selectedCrop.marketUnit)
                    }`}
                    dark
                  />
                </div>
                {selectedCropInsight ? (
                  <p className="mt-4 text-sm text-white/72">
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
                {translate("Use the field-fit crop shortlist to open the recommendation workspace instantly.")}
              </p>
              {predictedCrops[0] ? (
                <button
                  type="button"
                  onClick={() => onSelectCrop(predictedCrops[0].key)}
                  className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  {translate("Use best-fit crop")}
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
              eyebrow={translate("Nutrient correction")}
              title={uiText.recommendationColumnTitles.inorganic}
              subtitle={translate("Primary chemical correction options for the selected crop.")}
            >
              <RecommendationColumn
                title={uiText.recommendationColumnTitles.inorganic}
                items={cropRecommendations.inorganic}
                boxed={false}
                showPricing={false}
                showCostStats={false}
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
                showPricing={false}
                showCostStats={false}
                translate={translate}
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
                  translate={translate}
                />
                <RecommendationCostGroup
                  title={uiText.recommendationColumnTitles.organic}
                  items={cropRecommendations.organic}
                  translate={translate}
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
                        <MiniStat label={translate("Inorganic")} value={item.inorganicRate} />
                        <MiniStat label={translate("Organic")} value={item.organicRate} />
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </SurfaceCard>
          </div>
        ) : activeToolKey === "price" ? (
          <PriceInsightPanel
            toolModel={toolModel}
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
            toolModel={toolModel}
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
            eyebrow={toolModel.badge}
            title={toolModel.title}
            subtitle={toolModel.subtitle}
            elevated
          >
            <div className="grid gap-6">
              {toolModel.gallery?.length ? (
                <PestGalleryPanel items={toolModel.gallery} translate={translate} />
              ) : null}

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

              {activeToolKey === "pesticide" ? (
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <ProtectionProductPanel
                    products={toolModel.products || []}
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
                    {translate("Planner note")}
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

          <article className="rounded-[1.9rem] bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              {translate("Source")}
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold">Vikaspedia</h3>
            <p className="mt-3 text-sm leading-7 text-white/80">
              {translate("Central farmer schemes are shown first. After you choose a state, the panel loads farmer-focused state schemes and insurance schemes for that state from Vikaspedia.")}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniStat
                label={translate("Central schemes")}
                value={String(centralSchemes.length)}
                dark
              />
              <MiniStat
                label={translate("Selected state")}
                value={schemeFilterState || translate("Choose state")}
                dark
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
            {schemeInsightsError}
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
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
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

function ProtectionProductPanel({ products = [], translate = (value) => value }) {
  if (!products.length) {
    return null;
  }

  return (
    <article className="rounded-[1.9rem] border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {translate("Protection products")}
      </p>
      <div className="mt-4 grid gap-4">
        {products.map((product) => (
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
          </div>
        ))}
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

          <article className="rounded-[1.9rem] bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              {translate("Selected crop")}
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold">
              {translate(selectedCrop?.label || "Choose crop")}
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/80">
              {translate("Current prices and previous-year comparison are both pulled from Agmarknet for the selected crop and location.")}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniStat
                label={translate("State")}
                value={priceFilterState || translate("Choose state")}
                dark
              />
              <MiniStat
                label={translate("District")}
                value={priceFilterDistrict || translate("All districts")}
                dark
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
            {priceReportError}
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
    setFormState({
      name: site?.profile?.name || "",
      landSize: site?.profile?.landSize || "",
      state: site?.profile?.state || "",
      district: site?.profile?.district || ""
    });
  }, [site?.profile?.district, site?.profile?.landSize, site?.profile?.name, site?.profile?.state]);

  useEffect(() => {
    if (formState.district && !districtOptions.some((district) => district.name === formState.district)) {
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
            <span className="bg-gradient-to-r from-slate-950 via-emerald-600 to-cyan-500 bg-clip-text text-transparent">
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
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
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
            <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-cyan-500 bg-clip-text text-transparent">
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
            <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
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
              />
            </Reveal>
          ))}
        </div>
      </SurfaceCard>

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
          className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
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
      className={`nav-link ${compact ? "min-w-max shrink-0 justify-center text-center" : ""} ${
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

function HealthSignalCard({ dashboard, translate = (value) => value }) {
  return (
    <article className="hover-lift overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-ambient">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
            {translate("Soil status")}
          </p>
          <h3 className="mt-3 font-display text-4xl font-black">
            {dashboard.overview.soilHealth.score}%
          </h3>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/78">
            {translate(dashboard.overview.soilHealth.message)}
          </p>
        </div>
        <span className={`status-pill status-pill--${severityTone(dashboard.overview.status)}`}>
          {translate(dashboard.overview.status)}
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
          <span>{translate(dashboard.overview.soilHealth.support)}</span>
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

function CropPredictionCard({ crop, selectedCropKey, predictedTag, onSelectCrop, translate = (value) => value }) {
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
            {predictedTag} • {translate(crop.family)}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold">{translate(crop.label)}</h3>
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
        {translate(crop.reason)}
      </p>
      {crop.marketSource ? (
        <p className={`mt-2 text-xs ${isSelected ? "text-white/60" : "text-slate-500"}`}>
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

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent p-4">
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
            className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
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
              ? "bg-slate-950 text-white"
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
        <div className="min-w-[44rem] grid gap-3">
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
                className={`aspect-square min-h-[96px] rounded-[1.3rem] border p-3 align-top ${
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
  showCostStats = true,
  translate = (value) => value
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
          </article>
        ))}
      </div>
    </article>
  );
}

function RecommendationCostGroup({ title, items = [], translate = (value) => value }) {
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
            <MiniStat label={translate("Price range")} value={item.priceRange} />
            {item.brandExamples?.length ? (
              <MiniStat label={translate("Brand examples")} value={item.brandExamples.join(", ")} />
            ) : null}
            <MiniStat label={translate("Cost / acre")} value={item.costSummary.estimated} />
            <MiniStat label={translate("Total plan")} value={item.costSummary.total} />
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

function MiniStat({ label, value, dark = false }) {
  return (
    <div className={`rounded-[1.2rem] px-4 py-3 ${dark ? "bg-white/10" : "bg-white"}`}>
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
          dark ? "text-white/60" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p className={`mt-2 text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
        {value}
      </p>
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
  uiText,
  selectedLanguage,
  messages,
  input,
  busy,
  translate = (value) => value,
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
            <p className="text-sm text-white/70">{translate("Open assistant")}</p>
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
