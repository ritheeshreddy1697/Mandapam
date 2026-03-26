import {
  CROP_CATALOG,
  CROP_THRESHOLD_PROFILES,
  getCropProfile
} from "./crops";

export const DEFAULT_FIELD_AREA = 42;

function getFormatLocale() {
  if (typeof document === "undefined") {
    return "en-IN";
  }

  const languageCode = document.documentElement.lang || "en";
  const localeMap = {
    en: "en-IN",
    hi: "hi-IN",
    te: "te-IN"
  };

  return localeMap[languageCode] || "en-IN";
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function extractNumericValue(value) {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? match[0] : "";
}

export function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat(getFormatLocale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(toNumber(value));
}

export function formatCurrency(value) {
  return `Rs ${new Intl.NumberFormat(getFormatLocale()).format(Math.round(toNumber(value)))}`;
}

function formatAgmarknetUnit(unit) {
  const normalizedUnit = String(unit || "").toLowerCase();

  if (!normalizedUnit) {
    return "quintal";
  }

  if (normalizedUnit.includes("quintal")) {
    return "quintal";
  }

  if (normalizedUnit.includes("kg")) {
    return "kg";
  }

  if (normalizedUnit.includes("tonne")) {
    return "tonne";
  }

  return String(unit).replace(/^rs\.?\//i, "").trim();
}

export function formatDateTime(value) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(getFormatLocale(), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function formatDateLong(value) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(getFormatLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function formatTimeOnly(value) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(getFormatLocale(), {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function severityTone(status) {
  const value = String(status || "").toLowerCase();

  if (value.includes("healthy") || value.includes("optimal")) {
    return "emerald";
  }

  if (value.includes("moderate") || value.includes("medium")) {
    return "amber";
  }

  if (value.includes("poor") || value.includes("critical")) {
    return "rose";
  }

  return "slate";
}

export function priorityTone(priority) {
  const value = String(priority || "").toLowerCase();

  if (value.includes("urgent")) {
    return "rose";
  }

  if (value.includes("high")) {
    return "amber";
  }

  if (value.includes("medium")) {
    return "sky";
  }

  return "emerald";
}

export function metricStatusTone(status) {
  if (status === "optimal") {
    return "emerald";
  }

  if (status === "warning") {
    return "amber";
  }

  return "rose";
}

export function estimateSunlightLux() {
  return 71;
}

export function getRecommendationContext(dashboard) {
  const soilData = dashboard?.overview?.soilData || [];
  const soilTemperature = Number.parseFloat(extractNumericValue(soilData[6]?.value));
  const environmentTemperature = Number.isFinite(soilTemperature)
    ? soilTemperature + 1.3
    : Number.parseFloat(extractNumericValue(dashboard?.realtime?.metrics?.[2]?.value));

  return {
    nitrogen: Number.parseFloat(extractNumericValue(soilData[0]?.value)),
    phosphorus: Number.parseFloat(extractNumericValue(soilData[1]?.value)),
    potassium: Number.parseFloat(extractNumericValue(soilData[2]?.value)),
    moisture: Number.parseFloat(
      extractNumericValue(dashboard?.realtime?.metrics?.[0]?.value || soilData[5]?.value)
    ),
    humidity: Number.parseFloat(extractNumericValue(dashboard?.realtime?.metrics?.[1]?.value)),
    temperature: Number.parseFloat(extractNumericValue(soilData[6]?.value)),
    environmentTemperature,
    ph: Number.parseFloat(extractNumericValue(soilData[3]?.value)),
    conductivity: Number.parseFloat(extractNumericValue(soilData[4]?.value)),
    score: Number.parseFloat(dashboard?.overview?.soilHealth?.score) || 0
  };
}

export function calculateRangeFit(value, range) {
  if (!Number.isFinite(value) || !Array.isArray(range) || range.length !== 2) {
    return 0;
  }

  const [min, max] = range;

  if (value >= min && value <= max) {
    return 1;
  }

  const distance = value < min ? min - value : value - max;
  const span = Math.max(max - min, 1);
  return clamp(1 - distance / span, 0, 1);
}

const WEATHER_PROFILE_RANGES = {
  default: {
    humidityRange: [50, 74],
    airTemperatureRange: [18, 32]
  },
  paddy: {
    humidityRange: [68, 88],
    airTemperatureRange: [22, 34]
  },
  wheat: {
    humidityRange: [40, 62],
    airTemperatureRange: [14, 28]
  },
  corn: {
    humidityRange: [50, 72],
    airTemperatureRange: [20, 34]
  },
  pulse: {
    humidityRange: [42, 64],
    airTemperatureRange: [20, 32]
  },
  oilseed: {
    humidityRange: [44, 68],
    airTemperatureRange: [18, 32]
  },
  fiber: {
    humidityRange: [52, 76],
    airTemperatureRange: [24, 36]
  },
  spice: {
    humidityRange: [58, 84],
    airTemperatureRange: [22, 34]
  },
  fruitingVegetable: {
    humidityRange: [56, 76],
    airTemperatureRange: [20, 34]
  },
  leafyVegetable: {
    humidityRange: [60, 82],
    airTemperatureRange: [16, 28]
  },
  rootVegetable: {
    humidityRange: [52, 74],
    airTemperatureRange: [16, 28]
  }
};

function getCropWeatherProfile(profile) {
  return WEATHER_PROFILE_RANGES[profile.thresholdProfileKey] || WEATHER_PROFILE_RANGES.default;
}

function calculateWeatherFit(value, range) {
  if (!Number.isFinite(value)) {
    return 0.68;
  }

  return calculateRangeFit(value, range);
}

function buildCropFitReason(profile, context) {
  const reasons = [];
  const thresholdProfile =
    CROP_THRESHOLD_PROFILES[profile.thresholdProfileKey] || CROP_THRESHOLD_PROFILES.default;
  const weatherProfile = getCropWeatherProfile(profile);

  if (calculateRangeFit(context.moisture, profile.moistureRange) >= 0.95) {
    reasons.push(`soil moisture ${formatNumber(context.moisture, 1)}% fits this crop well`);
  }

  if (calculateRangeFit(context.ph, profile.phRange) >= 0.95) {
    reasons.push(`pH ${formatNumber(context.ph, 1)} is in a comfortable band`);
  }

  if (calculateRangeFit(context.temperature, profile.temperatureRange) >= 0.95) {
    reasons.push(
      `soil temperature ${formatNumber(context.temperature, 1)}°C supports establishment`
    );
  }

  if (
    calculateWeatherFit(
      context.environmentTemperature,
      weatherProfile.airTemperatureRange
    ) >= 0.95
  ) {
    reasons.push(
      `weather temperature ${formatNumber(context.environmentTemperature, 1)}°C is favorable`
    );
  }

  if (calculateWeatherFit(context.humidity, weatherProfile.humidityRange) >= 0.95) {
    reasons.push(`humidity ${formatNumber(context.humidity, 1)}% is supportive right now`);
  }

  if (context.score >= profile.minHealthScore) {
    reasons.push(`soil health ${formatNumber(context.score, 0)}% is strong enough for planning`);
  }

  if (
    calculateRangeFit(context.nitrogen, [0, thresholdProfile.nutrients.N.mediumMax]) >= 0.92 &&
    calculateRangeFit(context.phosphorus, [0, thresholdProfile.nutrients.P.mediumMax]) >= 0.92
  ) {
    reasons.push("current N and P levels are close to this crop's target band");
  }

  if (reasons.length === 0) {
    return `${profile.label} stays workable if you manage irrigation, fertilizer timing, and weather swings carefully.`;
  }

  return `${reasons.slice(0, 2).join(" and ")}.`;
}

function buildCropRankings(dashboard) {
  const context = getRecommendationContext(dashboard);
  const tones = ["emerald", "sky", "amber", "teal", "violet", "rose"];

  return Object.entries(CROP_CATALOG)
    .map(([key, profile], index) => {
      const thresholdProfile =
        CROP_THRESHOLD_PROFILES[profile.thresholdProfileKey] || CROP_THRESHOLD_PROFILES.default;
      const weatherProfile = getCropWeatherProfile(profile);
      const moistureFit = calculateRangeFit(context.moisture, profile.moistureRange);
      const phFit = calculateRangeFit(context.ph, profile.phRange);
      const temperatureFit = calculateRangeFit(context.temperature, profile.temperatureRange);
      const conductivityFit = calculateRangeFit(context.conductivity, profile.conductivityRange);
      const airTemperatureFit = calculateWeatherFit(
        context.environmentTemperature,
        weatherProfile.airTemperatureRange
      );
      const humidityFit = calculateWeatherFit(context.humidity, weatherProfile.humidityRange);
      const nitrogenFit = calculateRangeFit(context.nitrogen, [
        0,
        thresholdProfile.nutrients.N.mediumMax
      ]);
      const phosphorusFit = calculateRangeFit(context.phosphorus, [
        0,
        thresholdProfile.nutrients.P.mediumMax
      ]);
      const potassiumFit = calculateRangeFit(context.potassium, [
        0,
        thresholdProfile.nutrients.K.mediumMax
      ]);
      const nutrientFit = (nitrogenFit + phosphorusFit + potassiumFit) / 3;
      const healthFit = clamp(context.score / Math.max(profile.minHealthScore, 1), 0, 1.2);
      const fitScore =
        moistureFit * 0.2 +
        phFit * 0.14 +
        temperatureFit * 0.12 +
        conductivityFit * 0.08 +
        nutrientFit * 0.18 +
        healthFit * 0.14 +
        airTemperatureFit * 0.08 +
        humidityFit * 0.06;

      return {
        key,
        label: profile.label,
        family: profile.family,
        estimatedGrowCost: profile.estimatedGrowCost,
        marketPrice: profile.marketPrice,
        marketUnit: profile.marketUnit,
        fitScore,
        tone: tones[index % tones.length],
        reason: buildCropFitReason(profile, context)
      };
    })
    .sort((first, second) => second.fitScore - first.fitScore);
}

export function buildPredictedCropSuggestions(dashboard) {
  return buildCropRankings(dashboard)
    .slice(0, 4);
}

export function buildPredictedCropSections(dashboard) {
  const rankings = buildCropRankings(dashboard);

  return {
    cereals: rankings.filter((item) => item.family !== "Vegetable").slice(0, 3),
    vegetable: rankings.find((item) => item.family === "Vegetable") || null
  };
}

function capitalize(value) {
  const text = String(value || "");
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : "";
}

function formatThresholdNumber(value, digits = 0) {
  return Number.isInteger(value) ? formatNumber(value, 0) : formatNumber(value, digits);
}

function buildNutrientThresholdText(rule, labels) {
  const optimalLabel = labels.optimal || labels.medium || "Optimal";

  return `${labels.low}: 0-${formatThresholdNumber(rule.lowMax)} | ${optimalLabel}: ${formatThresholdNumber(
    rule.lowMax
  )}-${formatThresholdNumber(rule.mediumMax)} | ${labels.high}: ${formatThresholdNumber(
    rule.mediumMax
  )}+`;
}

function getNutrientBandKeyForCrop(value, rule) {
  if (!Number.isFinite(value)) {
    return "optimal";
  }

  if (value <= rule.lowMax) {
    return "low";
  }

  if (value <= rule.mediumMax) {
    return "optimal";
  }

  return "high";
}

function getNutrientBandForCrop(value, rule, labels) {
  const bandKey = getNutrientBandKeyForCrop(value, rule);
  return labels[bandKey] || capitalize(bandKey);
}

function buildTargetRangeText(rule, digits = 1, suffix = "", labels) {
  return `${labels.target}: ${formatThresholdNumber(rule.min, digits)}-${formatThresholdNumber(
    rule.max,
    digits
  )}${suffix}`;
}

function getRangeBandKeyForCrop(value, rule) {
  if (!Number.isFinite(value)) {
    return "optimal";
  }

  if (value < rule.min - rule.warningBuffer) {
    return "low";
  }

  if (value > rule.max + rule.warningBuffer) {
    return "high";
  }

  if (value >= rule.min && value <= rule.max) {
    return "optimal";
  }

  return value < rule.min ? "low" : "high";
}

function getRangeBandForCrop(value, rule, labels) {
  const bandKey = getRangeBandKeyForCrop(value, rule);
  return labels[bandKey] || capitalize(bandKey);
}

function getSelectedCropThresholdProfile(selectedCropKey) {
  const selectedCrop = getCropProfile(selectedCropKey);
  const profileKey = selectedCrop?.thresholdProfileKey || "default";

  return CROP_THRESHOLD_PROFILES[profileKey] || CROP_THRESHOLD_PROFILES.default;
}

export function buildCropSpecificTableRows(tableRows, selectedCropKey, uiText) {
  if (!selectedCropKey) {
    return tableRows || [];
  }

  const labels = uiText?.recommendationWorkspace?.thresholdLabels || {
    low: "Low",
    medium: "Optimal",
    high: "High",
    optimal: "Optimal",
    target: "Target"
  };
  const thresholdProfile = getSelectedCropThresholdProfile(selectedCropKey);
  const byNutrient = new Map(
    (tableRows || []).map((row) => [String(row.nutrient).toUpperCase(), row])
  );
  const nutrientOrder = ["PH", "EC", "N", "P", "K"];

  return nutrientOrder
    .map((nutrient) => {
      const row = byNutrient.get(nutrient);

      if (!row) {
        return null;
      }

      const numericValue = Number.parseFloat(extractNumericValue(row.currentValue));

      if (nutrient === "PH") {
        return {
          ...row,
          thresholdValues: buildTargetRangeText(thresholdProfile.ph, 1, "", labels),
          band: getRangeBandForCrop(numericValue, thresholdProfile.ph, labels)
        };
      }

      if (nutrient === "EC") {
        return {
          ...row,
          thresholdValues: buildTargetRangeText(
            thresholdProfile.ec,
            0,
            " uS/cm",
            labels
          ),
          band: getRangeBandForCrop(numericValue, thresholdProfile.ec, labels)
        };
      }

      return {
        ...row,
        thresholdValues: buildNutrientThresholdText(
          thresholdProfile.nutrients[nutrient],
          labels
        ),
        band: getNutrientBandForCrop(
          numericValue,
          thresholdProfile.nutrients[nutrient],
          labels
        )
      };
    })
    .filter(Boolean);
}

function formatCurrencyRange(minValue, maxValue) {
  return `${formatCurrency(minValue)} - ${formatCurrency(maxValue)}`;
}

function buildPlannerCostSummary(rateMinKg, rateMaxKg, priceMinPerKg, priceMaxPerKg) {
  const estimatedMin = Math.round(rateMinKg * priceMinPerKg);
  const estimatedMax = Math.round(rateMaxKg * priceMaxPerKg);
  const totalMin = estimatedMin * DEFAULT_FIELD_AREA;
  const totalMax = estimatedMax * DEFAULT_FIELD_AREA;

  return {
    estimatedMin,
    estimatedMax,
    totalMin,
    totalMax,
    estimated: `${formatCurrencyRange(estimatedMin, estimatedMax)} / acre`,
    total: `${formatCurrencyRange(totalMin, totalMax)} / ${DEFAULT_FIELD_AREA} acres`
  };
}

export function buildRecommendationCostTotals(items = []) {
  const totals = items.reduce(
    (current, item) => ({
      estimatedMin: current.estimatedMin + toNumber(item?.costSummary?.estimatedMin),
      estimatedMax: current.estimatedMax + toNumber(item?.costSummary?.estimatedMax),
      totalMin: current.totalMin + toNumber(item?.costSummary?.totalMin),
      totalMax: current.totalMax + toNumber(item?.costSummary?.totalMax)
    }),
    {
      estimatedMin: 0,
      estimatedMax: 0,
      totalMin: 0,
      totalMax: 0
    }
  );

  return {
    estimated: `${formatCurrencyRange(totals.estimatedMin, totals.estimatedMax)} / acre`,
    total: `${formatCurrencyRange(totals.totalMin, totals.totalMax)} / ${DEFAULT_FIELD_AREA} acres`
  };
}

function formatPriceRange(priceRange) {
  return `${formatCurrencyRange(priceRange[0], priceRange[1])} / kg`;
}

function formatApplicationRate(rateRange) {
  return `${formatNumber(rateRange[0], 0)} - ${formatNumber(rateRange[1], 0)} kg / acre`;
}

function scaleRange(range, factor) {
  return range.map((value) => Math.max(0, Math.round(value * factor)));
}

const NUTRIENT_META = {
  N: {
    label: "Nitrogen",
    lowSupport: "canopy growth and early vigor",
    optimalSupport: "steady vegetative balance",
    highWarning: "excess vegetative growth"
  },
  P: {
    label: "Phosphorus",
    lowSupport: "root establishment and early energy transfer",
    optimalSupport: "steady root and flowering support",
    highWarning: "phosphorus lockup and wasted input"
  },
  K: {
    label: "Potassium",
    lowSupport: "water regulation and stress tolerance",
    optimalSupport: "fruit fill and stem strength",
    highWarning: "unnecessary salt loading"
  }
};

const BASE_CROP_PROGRAMS = {
  inorganic: {
    N: {
      low: {
        fertilizer: "Urea",
        brandExamples: ["IFFCO Urea", "NFL Kisan Urea"],
        nutrientContent: "46% N",
        rate: [44, 54],
        price: [5, 6],
        note: "Use split application instead of a single heavy nitrogen pass."
      },
      optimal: {
        fertilizer: "Calcium Ammonium Nitrate (CAN)",
        brandExamples: ["RCF CAN", "MFL CAN"],
        nutrientContent: "25 - 26% N",
        rate: [18, 24],
        price: [12, 15],
        note: "A light maintenance dose is enough when nitrogen is already near target."
      }
    },
    P: {
      low: {
        fertilizer: "DAP (Diammonium Phosphate)",
        brandExamples: ["IFFCO DAP", "Jai Kisaan Navratna DAP"],
        nutrientContent: "46% P",
        rate: [18, 22],
        price: [22, 27],
        note: "Good for quick phosphorus correction around establishment and early growth."
      },
      optimal: {
        fertilizer: "SSP (Single Super Phosphate)",
        brandExamples: ["Coromandel Gromor SSP", "IPL SSP"],
        nutrientContent: "16% P",
        rate: [18, 24],
        price: [6, 8],
        note: "Use a lighter phosphorus dose when the crop is already close to the target range."
      }
    },
    K: {
      low: {
        fertilizer: "MOP (Muriate of Potash / KCl)",
        brandExamples: ["IPL MOP", "Coromandel MOP"],
        nutrientContent: "60% K",
        rate: [18, 24],
        price: [16, 20],
        note: "Correct low potassium before the next critical growth window."
      },
      optimal: {
        fertilizer: "MOP (Muriate of Potash / KCl)",
        brandExamples: ["IPL MOP", "Coromandel MOP"],
        nutrientContent: "60% K",
        rate: [8, 14],
        price: [16, 20],
        note: "A light potash top-up is enough when potassium is already in the workable band."
      }
    }
  },
  organic: {
    N: {
      low: {
        fertilizer: "Blood Meal",
        brandExamples: ["Local certified blood meal brands"],
        nutrientContent: "10 - 12% N",
        rate: [8, 12],
        price: [80, 120],
        note: "Fastest organic nitrogen source when the crop needs a stronger push."
      },
      optimal: {
        fertilizer: "Neem Cake",
        brandExamples: ["Godrej Agrovet Neem Cake", "Multiplex Neem Cake"],
        nutrientContent: "4 - 5% N",
        rate: [20, 30],
        price: [25, 35],
        note: "Supports steady nitrogen release and improves soil biological activity."
      }
    },
    P: {
      low: {
        fertilizer: "Bone Meal",
        brandExamples: ["Local certified bone meal brands"],
        nutrientContent: "15 - 25% P",
        rate: [12, 18],
        price: [40, 80],
        note: "Strong organic phosphorus support for low-P fields."
      },
      optimal: {
        fertilizer: "PROM (Phosphate Rich Organic Manure)",
        brandExamples: ["IPL PROM", "state-certified PROM suppliers"],
        nutrientContent: "10 - 20% P",
        rate: [18, 24],
        price: [10, 20],
        note: "A steady organic phosphorus option when only maintenance support is needed."
      }
    },
    K: {
      low: {
        fertilizer: "Poultry Manure",
        brandExamples: ["Local FCO-registered poultry manure brands"],
        nutrientContent: "2 - 3% nutrient support",
        rate: [120, 160],
        price: [6, 10],
        note: "Useful when potassium support and organic matter both need attention."
      },
      optimal: {
        fertilizer: "Compost",
        brandExamples: ["IFFCO City Compost", "state-certified compost suppliers"],
        nutrientContent: "0.5 - 1% nutrient support",
        rate: [140, 200],
        price: [3, 6],
        note: "Best for mild organic maintenance and soil structure support."
      }
    }
  }
};

const CROP_PROGRAM_MULTIPLIERS = {
  default: { N: 1, P: 1, K: 1 },
  paddy: { N: 1.15, P: 1, K: 1.1 },
  wheat: { N: 0.95, P: 1, K: 0.95 },
  corn: { N: 1.2, P: 1.1, K: 1.15 },
  fruitingVegetable: { N: 1.05, P: 1.1, K: 1.2 },
  rootVegetable: { N: 0.9, P: 1, K: 1.15 },
  leafyVegetable: { N: 1.1, P: 1, K: 1.05 }
};

function buildCropSpecificRecommendationItem({
  type,
  selectedCrop,
  profileKey,
  nutrientKey,
  bandKey,
  currentValue
}) {
  const nutrientMeta = NUTRIENT_META[nutrientKey];
  const cropLabel = selectedCrop?.label || "Selected crop";

  if (bandKey === "high") {
    const noInputLabel = type === "organic" ? "organic" : "inorganic";

    return {
      title: `Hold ${nutrientMeta.label.toLowerCase()} input for ${cropLabel}`,
      priority: "Medium",
      detail: `${nutrientMeta.label} is High for ${cropLabel} at ${formatNumber(
        currentValue,
        1
      )}. Skip extra ${noInputLabel} ${nutrientMeta.label.toLowerCase()} fertilizer for now to avoid ${nutrientMeta.highWarning}.`,
      fertilizer: `No ${nutrientMeta.label.toLowerCase()} fertilizer now`,
      brandExamples: [],
      nutrientContent: "Not required",
      priceRange: `${formatCurrency(0)} / kg`,
      applicationRate: "0 kg / acre",
      note:
        type === "organic"
          ? `Keep organic soil builders light until ${nutrientMeta.label.toLowerCase()} falls back toward the crop target.`
          : `Do not add more chemical correction until the next soil reading confirms a drop in ${nutrientMeta.label.toLowerCase()}.`,
      costSummary: buildPlannerCostSummary(0, 0, 0, 0)
    };
  }

  const programMultiplier =
    CROP_PROGRAM_MULTIPLIERS[profileKey] || CROP_PROGRAM_MULTIPLIERS.default;
  const program =
    BASE_CROP_PROGRAMS[type]?.[nutrientKey]?.[bandKey] ||
    BASE_CROP_PROGRAMS[type]?.[nutrientKey]?.optimal;
  const scaledRate = scaleRange(program.rate, programMultiplier[nutrientKey] || 1);
  const priority =
    type === "inorganic" && nutrientKey === "N" && bandKey === "low"
      ? "Urgent"
      : bandKey === "low"
        ? "High"
        : "Medium";

  return {
    title: `${cropLabel} ${nutrientMeta.label.toLowerCase()} ${
      bandKey === "low" ? "correction" : "maintenance"
    }`,
    priority,
    detail: `${nutrientMeta.label} is ${capitalize(bandKey)} for ${cropLabel} at ${formatNumber(
      currentValue,
      1
    )}. ${program.fertilizer} suits this crop profile for ${
      bandKey === "low" ? nutrientMeta.lowSupport : nutrientMeta.optimalSupport
    }.`,
    fertilizer: program.fertilizer,
    brandExamples: program.brandExamples || [],
    nutrientContent: program.nutrientContent,
    priceRange: formatPriceRange(program.price),
    applicationRate: formatApplicationRate(scaledRate),
    note: `${program.note} Planned for ${cropLabel}.`,
    costSummary: buildPlannerCostSummary(
      scaledRate[0],
      scaledRate[1],
      program.price[0],
      program.price[1]
    )
  };
}

export function buildCropSpecificRecommendations(dashboard, selectedCropKey) {
  const selectedCrop = getCropProfile(selectedCropKey);

  if (!selectedCrop || !dashboard?.recommendations) {
    return {
      summary: dashboard?.recommendations?.summary || "",
      organic: dashboard?.recommendations?.organic || [],
      inorganic: dashboard?.recommendations?.inorganic || []
    };
  }

  const thresholdProfile = getSelectedCropThresholdProfile(selectedCropKey);
  const profileKey = selectedCrop.thresholdProfileKey || "default";
  const rowsByNutrient = new Map(
    (dashboard?.recommendations?.tableRows || []).map((row) => [
      String(row.nutrient).toUpperCase(),
      row
    ])
  );
  const nutrientKeys = ["N", "P", "K"];

  return {
    summary: `Fertilizer guidance aligned to ${selectedCrop.label} thresholds and nutrient demand.`,
    inorganic: nutrientKeys.map((nutrientKey) => {
      const row = rowsByNutrient.get(nutrientKey);
      const currentValue = Number.parseFloat(extractNumericValue(row?.currentValue));
      const bandKey = getNutrientBandKeyForCrop(
        currentValue,
        thresholdProfile.nutrients[nutrientKey]
      );

      return buildCropSpecificRecommendationItem({
        type: "inorganic",
        selectedCrop,
        profileKey,
        nutrientKey,
        bandKey,
        currentValue
      });
    }),
    organic: nutrientKeys.map((nutrientKey) => {
      const row = rowsByNutrient.get(nutrientKey);
      const currentValue = Number.parseFloat(extractNumericValue(row?.currentValue));
      const bandKey = getNutrientBandKeyForCrop(
        currentValue,
        thresholdProfile.nutrients[nutrientKey]
      );

      return buildCropSpecificRecommendationItem({
        type: "organic",
        selectedCrop,
        profileKey,
        nutrientKey,
        bandKey,
        currentValue
      });
    })
  };
}

function buildCropProtectionPlan(selectedCrop, humidityValue, temperatureValue, moistureValue) {
  if (!selectedCrop) {
    return {
      cards: [
        {
          eyebrow: "Crop protection",
          title: "Select a crop first",
          description:
            "Pesticide and insecticide guidance becomes more accurate after you choose the crop.",
          tone: "amber"
        }
      ],
      checklist: [
        "Confirm the crop before choosing any protection spray.",
        "Inspect symptoms physically before mixing any input.",
        "Use label dose and local agronomist advice for severe field pressure."
      ],
      gallery: [],
      products: [],
      note: "Protection guidance depends on the selected crop and current field conditions."
    };
  }

  const profileKey = selectedCrop.thresholdProfileKey || "default";
  const cropLabel = selectedCrop.label;
  const humidityState =
    humidityValue >= 70 ? "high" : humidityValue >= 58 ? "moderate" : "low";
  const heatState =
    temperatureValue >= 30 ? "high" : temperatureValue >= 24 ? "warm" : "cool";
  const dryState = moistureValue < 18;

  const protectionProfiles = {
    paddy: {
      effects: "blast, sheath blight, and leaf folder pressure",
      pesticide: {
        label: "Tricyclazole 75% WP or Mancozeb 75% WP",
        brands: ["Beam", "Indofil M-45"],
        useCase: "blast lesions, sheath infection, or fungal spotting"
      },
      insecticide: {
        label: "Chlorantraniliprole 18.5% SC or Imidacloprid 17.8% SL",
        brands: ["Coragen", "Confidor"],
        useCase: "stem borer, leaf folder, or hopper activity"
      },
      diseaseSymptoms: "blast lesions, sheath infection, or fungal spotting",
      insectSymptoms: "stem borer, leaf folder, or hopper activity",
      gallery: [
        { name: "Rice Blast", query: "Rice blast disease" },
        { name: "Brown Planthopper", query: "Brown planthopper" },
        { name: "Rice Stem Borer", query: "Rice stem borer" }
      ]
    },
    wheat: {
      effects: "rust, leaf blight, and aphid flare-ups",
      pesticide: {
        label: "Propiconazole 25% EC or Mancozeb 75% WP",
        brands: ["Tilt", "Indofil M-45"],
        useCase: "rust pustules or spreading leaf blight"
      },
      insecticide: {
        label: "Thiamethoxam 25% WG or Lambda-cyhalothrin 5% EC",
        brands: ["Actara", "Karate"],
        useCase: "aphids or armyworm patches"
      },
      diseaseSymptoms: "rust pustules or spreading leaf blight",
      insectSymptoms: "aphids or armyworm patches",
      gallery: [
        { name: "Wheat Rust", query: "Wheat rust" },
        { name: "Aphid", query: "Aphid" },
        { name: "Armyworm", query: "Armyworm" }
      ]
    },
    corn: {
      effects: "leaf blight, downy mildew, and armyworm pressure",
      pesticide: {
        label: "Metalaxyl 8% + Mancozeb 64% WP",
        brands: ["Ridomil Gold"],
        useCase: "leaf blight streaks or mildew symptoms"
      },
      insecticide: {
        label: "Emamectin Benzoate 5% SG or Spinosad 45% SC",
        brands: ["Proclaim", "Tracer"],
        useCase: "fall armyworm, stem borer, or chewing damage"
      },
      diseaseSymptoms: "leaf blight streaks or mildew symptoms",
      insectSymptoms: "fall armyworm, stem borer, or chewing damage",
      gallery: [
        { name: "Fall Armyworm", query: "Fall armyworm" },
        { name: "Corn Leaf Blight", query: "Northern corn leaf blight" },
        { name: "Corn Stem Borer", query: "Corn borer" }
      ]
    },
    fruitingVegetable: {
      effects: "blight, fruit rot, and sucking-pest pressure",
      pesticide: {
        label: "Mancozeb 75% WP or Copper Oxychloride 50% WP",
        brands: ["Indofil M-45", "Blitox"],
        useCase: "leaf blight, fruit rot, or fungal spotting"
      },
      insecticide: {
        label: "Spinosad 45% SC or Emamectin Benzoate 5% SG",
        brands: ["Tracer", "Proclaim"],
        useCase: "thrips, fruit borer, whitefly, or aphid activity"
      },
      diseaseSymptoms: "leaf blight, fruit rot, or fungal spotting",
      insectSymptoms: "thrips, fruit borer, whitefly, or aphid activity",
      gallery: [
        { name: "Whitefly", query: "Whitefly" },
        { name: "Thrips", query: "Thrips" },
        { name: "Fruit Borer", query: "Helicoverpa armigera" }
      ]
    },
    rootVegetable: {
      effects: "leaf spot, crown rot, and leaf-miner pressure",
      pesticide: {
        label: "Metalaxyl 8% + Mancozeb 64% WP",
        brands: ["Ridomil Gold"],
        useCase: "leaf spot, damping symptoms, or crown rot"
      },
      insecticide: {
        label: "Imidacloprid 17.8% SL or Spinosad 45% SC",
        brands: ["Confidor", "Tracer"],
        useCase: "cutworm, leaf miner, or aphid activity"
      },
      diseaseSymptoms: "leaf spot, damping symptoms, or crown rot",
      insectSymptoms: "cutworm, leaf miner, or aphid activity",
      gallery: [
        { name: "Leaf Miner", query: "Leaf miner" },
        { name: "Cutworm", query: "Cutworm" },
        { name: "Root Rot", query: "Root rot" }
      ]
    },
    leafyVegetable: {
      effects: "downy mildew, leaf spot, and caterpillar pressure",
      pesticide: {
        label: "Copper Oxychloride 50% WP or Mancozeb 75% WP",
        brands: ["Blitox", "Indofil M-45"],
        useCase: "downy mildew patches or leaf spot spread"
      },
      insecticide: {
        label: "Spinosad 45% SC or Thiamethoxam 25% WG",
        brands: ["Tracer", "Actara"],
        useCase: "aphids, caterpillars, or chewing damage"
      },
      diseaseSymptoms: "downy mildew patches or leaf spot spread",
      insectSymptoms: "aphids, caterpillars, or chewing damage",
      gallery: [
        { name: "Downy Mildew", query: "Downy mildew" },
        { name: "Caterpillar", query: "Caterpillar" },
        { name: "Aphid", query: "Aphid" }
      ]
    }
  };
  const protectionProfile =
    protectionProfiles[profileKey] || protectionProfiles.wheat;
  const humidityNote =
    humidityState === "high"
      ? "Humidity is high, so fungal pressure can rise quickly."
      : humidityState === "moderate"
        ? "Humidity is moderate, so keep a close watch on canopy disease."
        : "Humidity is lower, so insect pressure may become more visible than disease pressure.";
  const temperatureNote =
    heatState === "high"
      ? "Higher temperature can accelerate pest movement and spray loss in daytime."
      : heatState === "warm"
        ? "Current temperature is workable, but early-morning or evening spray timing is still safer."
        : "Cooler conditions can slow pest activity but still support fungal persistence after moisture events.";
  const moistureNote = dryState
    ? "Low soil moisture can also push stress symptoms that look like pest damage."
    : "Current root-zone moisture is not the main stress trigger right now.";
  const products = [
    {
      type: "Pesticide",
      title: protectionProfile.pesticide.label,
      brands: protectionProfile.pesticide.brands,
      useCase: protectionProfile.pesticide.useCase
    },
    {
      type: "Insecticide",
      title: protectionProfile.insecticide.label,
      brands: protectionProfile.insecticide.brands,
      useCase: protectionProfile.insecticide.useCase
    }
  ];

  return {
    cards: [
      {
        eyebrow: `Possible effects on ${cropLabel}`,
        title: protectionProfile.effects,
        description: `${humidityNote} ${temperatureNote} ${moistureNote}`,
        tone: "rose"
      },
      {
        eyebrow: "Recommended pesticide",
        title: protectionProfile.pesticide.label,
        description: `Use this path if ${cropLabel} shows ${protectionProfile.diseaseSymptoms}. Common brand examples: ${protectionProfile.pesticide.brands.join(", ")}.`,
        tone: "amber"
      },
      {
        eyebrow: "Recommended insecticide",
        title: protectionProfile.insecticide.label,
        description: `Use this route if scouting confirms ${protectionProfile.insectSymptoms} on ${cropLabel}. Common brand examples: ${protectionProfile.insecticide.brands.join(", ")}.`,
        tone: "emerald"
      }
    ],
    checklist: [
      `Scout ${cropLabel} for actual symptoms before selecting a spray program.`,
      "Spray in the early morning or late evening to reduce drift and evaporation.",
      "Rotate chemistry groups and stay within label dose to avoid resistance pressure.",
      "Use the PPQS advisory links below as the official reference before finalizing any crop protection spray."
    ],
    gallery: protectionProfile.gallery || [],
    products,
    note: `This protection view is tuned for ${cropLabel} using the current humidity, temperature, and soil moisture context.`
  };
}

export function buildWeatherSnapshot(dashboard, uiText) {
  const weatherUi = uiText?.overviewWeather;
  const humidityValue = Number.parseFloat(
    extractNumericValue(dashboard?.realtime?.metrics?.[1]?.value)
  );
  const soilTemperatureValue = Number.parseFloat(
    extractNumericValue(dashboard?.overview?.soilData?.[6]?.value)
  );
  const temperatureValue = Number.isFinite(soilTemperatureValue)
    ? soilTemperatureValue + 1.3
    : 21.4;
  const fluxValue = estimateSunlightLux();

  return [
    {
      key: "temperature",
      label: weatherUi?.labels?.temperature || "Temperature",
      value: temperatureValue,
      unit: weatherUi?.units?.temperature || "°C",
      decimals: 1,
      tone: "rose"
    },
    {
      key: "humidity",
      label: weatherUi?.labels?.humidity || "Humidity",
      value: Number.isFinite(humidityValue) ? humidityValue : 66,
      unit: weatherUi?.units?.humidity || "%",
      decimals: 1,
      tone: "teal"
    },
    {
      key: "flux",
      label: weatherUi?.labels?.flux || "Flux",
      value: fluxValue,
      unit: weatherUi?.units?.flux || "lux",
      decimals: 0,
      tone: "amber"
    }
  ];
}

export function buildWeatherTrendSeries(dashboard, uiText, rangeKey) {
  const weatherUi = uiText?.overviewWeather;
  const snapshot = buildWeatherSnapshot(dashboard, uiText);
  const configs = {
    "24h": {
      labels: ["21h", "18h", "15h", "12h", "9h", "6h", "3h", "Now"],
      temperature: [0.88, 0.9, 0.93, 0.98, 1.06, 1.11, 1.04, 1],
      humidity: [1.12, 1.1, 1.08, 1.04, 0.97, 0.95, 0.98, 1],
      flux: [0.28, 0.18, 0.12, 0.34, 0.58, 0.82, 0.93, 1]
    },
    "1w": {
      labels: ["6d", "5d", "4d", "3d", "2d", "1d", "12h", "Now"],
      temperature: [0.92, 0.9, 0.94, 0.99, 1.04, 1.08, 1.02, 1],
      humidity: [1.08, 1.05, 1.02, 0.98, 0.96, 0.99, 1.01, 1],
      flux: [0.52, 0.48, 0.55, 0.6, 0.68, 0.74, 0.88, 1]
    },
    "1m": {
      labels: ["4w", "3w", "2w", "10d", "7d", "3d", "1d", "Now"],
      temperature: [0.9, 0.92, 0.95, 0.97, 1.01, 1.05, 1.03, 1],
      humidity: [1.1, 1.06, 1.03, 0.99, 0.96, 0.98, 1.01, 1],
      flux: [0.48, 0.54, 0.58, 0.62, 0.7, 0.78, 0.9, 1]
    },
    "3m": {
      labels: ["12w", "10w", "8w", "6w", "4w", "2w", "1w", "Now"],
      temperature: [0.84, 0.88, 0.93, 0.97, 1.01, 1.05, 1.03, 1],
      humidity: [1.14, 1.1, 1.06, 1.01, 0.97, 0.96, 0.99, 1],
      flux: [0.38, 0.45, 0.52, 0.6, 0.68, 0.76, 0.88, 1]
    },
    "6m": {
      labels: ["24w", "20w", "16w", "12w", "8w", "4w", "2w", "Now"],
      temperature: [0.8, 0.84, 0.88, 0.93, 0.98, 1.03, 1.02, 1],
      humidity: [1.18, 1.13, 1.08, 1.03, 0.99, 0.97, 1.01, 1],
      flux: [0.32, 0.4, 0.48, 0.57, 0.66, 0.78, 0.9, 1]
    },
    "1y": {
      labels: ["12m", "10m", "8m", "6m", "4m", "2m", "1m", "Now"],
      temperature: [0.76, 0.8, 0.86, 0.92, 0.98, 1.02, 1.01, 1],
      humidity: [1.22, 1.16, 1.1, 1.04, 1, 0.98, 1.01, 1],
      flux: [0.25, 0.34, 0.42, 0.54, 0.66, 0.8, 0.92, 1]
    }
  };
  const activeConfig = configs[rangeKey] || configs["24h"];

  return {
    labels: activeConfig.labels,
    series: [
      {
        label: weatherUi?.labels?.temperature || "Temperature",
        color: "#ef6b6f",
        values: activeConfig.temperature.map((factor) => snapshot[0].value * factor)
      },
      {
        label: weatherUi?.labels?.humidity || "Humidity",
        color: "#27b3c7",
        values: activeConfig.humidity.map((factor) => snapshot[1].value * factor)
      },
      {
        label: weatherUi?.labels?.flux || "Flux",
        color: "#efbe4d",
        values: activeConfig.flux.map((factor) => snapshot[2].value * factor)
      }
    ]
  };
}

function isWithinAnyRange(value, ranges) {
  return ranges.some(([min, max]) => value >= min && value <= max);
}

function evaluateMetricState(value, config) {
  if (!Number.isFinite(value)) {
    return {
      status: "warning",
      progress: 0
    };
  }

  const status = isWithinAnyRange(value, config.optimal)
    ? "optimal"
    : isWithinAnyRange(value, config.warning)
      ? "warning"
      : "critical";
  const progress = clamp(((value - config.min) / (config.max - config.min)) * 100, 6, 100);

  return { status, progress };
}

function createRealtimeCardData(label, value, unit, config) {
  const numericValue = Number.parseFloat(extractNumericValue(value));

  if (!Number.isFinite(numericValue)) {
    return {
      label,
      value: "N/A",
      unit,
      status: "warning",
      progress: 12
    };
  }

  const state = evaluateMetricState(numericValue, config);

  return {
    label,
    value: formatNumber(numericValue, config.decimals || 0),
    unit,
    status: state.status,
    progress: state.progress
  };
}

export function buildRealtimeCardSets(dashboard, uiText) {
  const soilData = dashboard?.overview?.soilData || [];
  const realtimeLabels = uiText?.realtimePanel || {};
  const parsedHumidityValue = Number.parseFloat(
    extractNumericValue(dashboard?.realtime?.metrics?.[1]?.value)
  );
  const humidityValue = Number.isFinite(parsedHumidityValue) ? parsedHumidityValue : 66;
  const soilTemperatureValue = Number.parseFloat(extractNumericValue(soilData[6]?.value));
  const environmentTemperatureValue = Number.isFinite(soilTemperatureValue)
    ? soilTemperatureValue + 1.3
    : 21.4;
  const sunlightLux = estimateSunlightLux();

  return {
    soil: [
      createRealtimeCardData(soilData[0]?.label || "Nitrogen", soilData[0]?.value, "mg/kg", {
        min: 0,
        max: 80,
        optimal: [[24, 44]],
        warning: [[18, 24], [44, 60]],
        decimals: 1
      }),
      createRealtimeCardData(
        soilData[1]?.label || "Phosphorus",
        soilData[1]?.value,
        "mg/kg",
        {
          min: 0,
          max: 80,
          optimal: [[18, 40]],
          warning: [[12, 18], [40, 55]],
          decimals: 1
        }
      ),
      createRealtimeCardData(soilData[2]?.label || "Potassium", soilData[2]?.value, "mg/kg", {
        min: 0,
        max: 200,
        optimal: [[80, 160]],
        warning: [[50, 80], [160, 180]],
        decimals: 1
      }),
      createRealtimeCardData(soilData[3]?.label || "pH Level", soilData[3]?.value, "", {
        min: 0,
        max: 14,
        optimal: [[6.2, 7.5]],
        warning: [[5.8, 6.2], [7.5, 8.2]],
        decimals: 2
      }),
      createRealtimeCardData(soilData[5]?.label || "Soil Moisture", soilData[5]?.value, "%", {
        min: 0,
        max: 50,
        optimal: [[28, 38]],
        warning: [[24, 28], [38, 42]],
        decimals: 1
      }),
      createRealtimeCardData(
        soilData[4]?.label || "Electrical Conductivity",
        soilData[4]?.value,
        "uS/cm",
        {
          min: 0,
          max: 400,
          optimal: [[120, 260]],
          warning: [[80, 120], [260, 320]],
          decimals: 2
        }
      ),
      createRealtimeCardData(
        soilData[6]?.label || "Soil Temperature",
        soilData[6]?.value,
        "°C",
        {
          min: 0,
          max: 40,
          optimal: [[18, 26]],
          warning: [[12, 18], [26, 30]],
          decimals: 1
        }
      )
    ],
    environment: [
      createRealtimeCardData(realtimeLabels.sunlightLabel || "Sunlight Intensity", sunlightLux, "lux", {
        min: 0,
        max: 120,
        optimal: [[80, 120]],
        warning: [[50, 80]],
        decimals: 0
      }),
      createRealtimeCardData(
        realtimeLabels.temperatureLabel || "Temperature",
        environmentTemperatureValue,
        "°C",
        {
          min: 0,
          max: 40,
          optimal: [[18, 30]],
          warning: [[12, 18], [30, 34]],
          decimals: 1
        }
      ),
      createRealtimeCardData(realtimeLabels.humidityLabel || "Humidity", humidityValue, "%", {
        min: 0,
        max: 100,
        optimal: [[55, 72]],
        warning: [[45, 55], [72, 82]],
        decimals: 1
      })
    ],
    sunlightLux,
    environmentTemperatureValue,
    humidityValue
  };
}

export function buildNpkTrendSeries(dashboard) {
  const soilData = dashboard?.overview?.soilData || [];
  const baseValues = [
    Number.parseFloat(extractNumericValue(soilData[0]?.value)),
    Number.parseFloat(extractNumericValue(soilData[1]?.value)),
    Number.parseFloat(extractNumericValue(soilData[2]?.value))
  ];
  const factors = [
    [1.35, 1.15, 0.95, 1.08, 1.28, 1.18, 1.05, 1],
    [0.82, 0.75, 0.72, 1.1, 1.32, 1.18, 1.06, 1],
    [0.22, 0.18, 0.15, 0.82, 1.02, 0.9, 0.72, 1]
  ];

  return {
    labels: ["24h", "20h", "16h", "12h", "8h", "4h", "2h", "Now"],
    series: [
      {
        label: soilData[0]?.label || "Nitrogen",
        color: "#5b8fdd",
        values: factors[0].map((factor) => Math.max(0, (baseValues[0] || 0) * factor))
      },
      {
        label: soilData[1]?.label || "Phosphorus",
        color: "#e3b640",
        values: factors[1].map((factor) => Math.max(0, (baseValues[1] || 0) * factor))
      },
      {
        label: soilData[2]?.label || "Potassium",
        color: "#52c980",
        values: factors[2].map((factor) => Math.max(0, (baseValues[2] || 0) * factor))
      }
    ]
  };
}

export function buildEnvironmentSegments(cardSets, uiText) {
  const realtimeUi = uiText?.realtimePanel || {};

  return [
    {
      label: `${realtimeUi.temperatureLabel || "Temperature"}: ${formatNumber(
        cardSets.environmentTemperatureValue,
        1
      )}°C`,
      chartValue: Math.max(cardSets.environmentTemperatureValue, 0),
      color: "#ef6b6f"
    },
    {
      label: `${realtimeUi.humidityLabel || "Humidity"}: ${formatNumber(
        cardSets.humidityValue,
        1
      )}%`,
      chartValue: Math.max(cardSets.humidityValue, 0),
      color: "#26b5c6"
    },
    {
      label: `${realtimeUi.sunlightLabel || "Sunlight Intensity"}: ${formatNumber(
        cardSets.sunlightLux,
        0
      )} lux`,
      chartValue: Math.max(cardSets.sunlightLux / 100, 0.2),
      color: "#f0bf4c"
    }
  ];
}

export function buildToolWorkspaceModel(toolKey, site, dashboard, selectedCropKey, marketInsights = {}) {
  const tools = site?.uiText?.recommendationWorkspace?.tools || [];
  const tool = tools.find((item) => item.key === toolKey);
  const selectedCrop = getCropProfile(selectedCropKey);
  const selectedCropInsight = selectedCropKey ? marketInsights[selectedCropKey] : null;
  const cropSpecificRecommendations = buildCropSpecificRecommendations(
    dashboard,
    selectedCropKey
  );
  const topOrganic =
    cropSpecificRecommendations?.organic?.[0] || dashboard?.recommendations?.organic?.[0];
  const topInorganic =
    cropSpecificRecommendations?.inorganic?.[0] || dashboard?.recommendations?.inorganic?.[0];
  const predictedCrops = buildPredictedCropSuggestions(dashboard);
  const moistureMetric = dashboard?.realtime?.metrics?.[0] || {
    label: "Soil Moisture",
    value: dashboard?.overview?.soilData?.[5]?.value || "N/A"
  };
  const humidityMetric = dashboard?.realtime?.metrics?.[1] || {
    label: "Humidity",
    value: "N/A"
  };
  const temperatureMetric = dashboard?.realtime?.metrics?.[2] || {
    label: "Root Zone Temperature",
    value: dashboard?.overview?.soilData?.[6]?.value || "N/A"
  };
  const humidityValue = Number.parseFloat(extractNumericValue(humidityMetric.value));
  const temperatureValue = Number.parseFloat(extractNumericValue(temperatureMetric.value));
  const moistureValue = Number.parseFloat(extractNumericValue(moistureMetric.value));

  if (!tool) {
    return null;
  }

  switch (toolKey) {
    case "fertilizer":
      return {
        title: site?.uiText?.recommendationWorkspace?.fertilizer?.title || tool.title,
        badge: site?.uiText?.recommendationWorkspace?.fertilizer?.badge || tool.badge,
        subtitle: selectedCrop
          ? `${site?.uiText?.recommendationWorkspace?.fertilizer?.subtitle || tool.description} for ${selectedCrop.label}.`
          : site?.uiText?.recommendationWorkspace?.fertilizer?.subtitle || tool.description,
        mode: "fertilizer"
      };
    case "irrigation":
      return {
        title: tool.title,
        badge: tool.badge,
        subtitle: tool.description,
        mode: "dynamic",
        cards: [
          {
            eyebrow: moistureMetric.label,
            title: moistureMetric.value,
            description:
              dashboard?.realtime?.feed?.[0]?.detail || dashboard?.overview?.soilHealth?.message,
            tone: "sky"
          },
          {
            eyebrow: humidityMetric.label,
            title: humidityMetric.value,
            description:
              dashboard?.realtime?.feed?.[2]?.detail || "Humidity is stable for crop planning.",
            tone: "teal"
          },
          {
            eyebrow: "Recommended action",
            title:
              Number.parseFloat(extractNumericValue(moistureMetric.value)) < 20
                ? "Irrigate within 12 hours"
                : "Monitor and apply a light cycle",
            description:
              "Use current moisture and humidity together before pushing a heavy irrigation cycle.",
            tone: "emerald"
          }
        ],
        checklistTitle: "Suggested irrigation checks",
        checklist: [
          "Confirm probe readings before opening the main line.",
          "Prioritize a short cycle if moisture is trending below target.",
          "Review humidity and root-zone temperature together for field timing."
        ],
        note: "Refreshed from the current dashboard context."
      };
    case "crop":
      return {
        title: tool.title,
        badge: tool.badge,
        subtitle: tool.description,
        mode: "dynamic",
        cards: predictedCrops.slice(0, 3).map((item) => ({
          eyebrow: "Predicted fit",
          title: item.label,
          description: item.reason,
          tone: item.tone
        })),
        checklistTitle: "Planning notes",
        checklist: [
          `Current soil status is ${dashboard?.overview?.status || "moderate"}.`,
          selectedCrop
            ? `${selectedCrop.label} is currently selected as your working crop.`
            : "Pick one of the predicted crops before finalizing acreage.",
          "Match crop choice with irrigation availability and local market demand.",
          "Use the fertilizer panel before finalizing acreage allocation."
        ],
        note: "These crop ideas are rule-based suggestions from the current soil and realtime readings."
      };
    case "pesticide":
      const protectionPlan = buildCropProtectionPlan(
        selectedCrop,
        humidityValue,
        temperatureValue,
        moistureValue
      );

      return {
        title: tool.title,
        badge: tool.badge,
        subtitle: selectedCrop
          ? `${tool.description} for ${selectedCrop.label}.`
          : tool.description,
        mode: "dynamic",
        gallery: protectionPlan.gallery,
        products: protectionPlan.products,
        cards: protectionPlan.cards,
        checklistTitle: selectedCrop
          ? `Protection checklist for ${selectedCrop.label}`
          : "Protection checklist",
        checklist: protectionPlan.checklist,
        note: protectionPlan.note
      };
    case "price":
      return {
        title: tool.title,
        badge: tool.badge,
        subtitle: tool.description,
        mode: "dynamic",
        cards: [
          {
            eyebrow: "Market focus",
            title: selectedCrop ? `${selectedCrop.label} planning` : "Paddy planning",
            description: selectedCrop
              ? selectedCropInsight
                ? `Agmarknet reference is ${formatCurrency(selectedCropInsight.latestPrice)} / ${formatAgmarknetUnit(selectedCropInsight.priceUnit)} from ${selectedCropInsight.marketName}, ${selectedCropInsight.stateName}.`
                : `Market reference is ${formatCurrency(selectedCrop.marketPrice)} ${selectedCrop.marketUnit}.`
              : "Balanced soil chemistry can support a cereal crop with moderate input discipline.",
            tone: "violet"
          },
          {
            eyebrow: "Top scenario",
            title: predictedCrops[0]?.label || "Current crop economics",
            description:
              "Compare expected yield with local mandi rates before locking crop choice.",
            tone: "amber"
          },
          {
            eyebrow: "Margin control",
            title: "Input-aware selling",
            description: `Keep fertilizer costs in view: ${topInorganic?.costSummary?.estimated || "review cost ranges"} before locking crop choice.`,
            tone: "emerald"
          }
        ],
        checklistTitle: "Before relying on price outlook",
        checklist: [
          "Compare the planning signal with your local mandi or buyer feed.",
          "Use crop suitability and cost structure together, not price alone.",
          "Recheck after the next soil and sensor update."
        ],
        note: selectedCropInsight
          ? `Reference price pulled from Agmarknet using ${selectedCropInsight.marketName}, ${selectedCropInsight.stateName} on ${selectedCropInsight.lastReportedDate}.`
          : "This is a planning-oriented outlook, not a live mandi price feed."
      };
    case "seed":
      return {
        title: tool.title,
        badge: tool.badge,
        subtitle: tool.description,
        mode: "dynamic",
        cards: [
          {
            eyebrow: "Balanced performance",
            title: "Medium-duration hybrid",
            description: "Use when you want steady output under the current moderate soil profile.",
            tone: "teal"
          },
          {
            eyebrow: "Stress-tolerant",
            title: "Resilient variety",
            description:
              "A safer choice when soil health still needs improvement and weather risk is higher.",
            tone: "violet"
          },
          {
            eyebrow: "Input-linked choice",
            title: topOrganic?.title || "Organic-support pairing",
            description:
              "Pair seed selection with your fertilizer path for more predictable crop management.",
            tone: "emerald"
          }
        ],
        checklistTitle: "Seed selection checklist",
        checklist: [
          "Match duration to your irrigation reliability and labor capacity.",
          "Prefer certified seed lots from verified dealers.",
          "Check if the variety aligns with the crop you shortlisted in Crop Prediction."
        ],
        note: `Generated using the current soil health signal of ${dashboard?.overview?.soilHealth?.score || 0}%.`
      };
    case "schemes":
      return {
        title: tool.title,
        badge: tool.badge,
        subtitle: tool.description,
        mode: "dynamic",
        cards: [
          {
            eyebrow: "Income support",
            title: "Direct benefit schemes",
            description:
              "Review state and national farmer support programs tied to landholding and identity records.",
            tone: "emerald"
          },
          {
            eyebrow: "Risk cover",
            title: "Insurance and crop protection",
            description:
              "Shortlist schemes that reduce exposure when soil health or climate risk remains uneven.",
            tone: "indigo"
          },
          {
            eyebrow: "Soil improvement",
            title: "Testing and input support",
            description:
              "Look for programs that help with soil testing, micronutrients, or irrigation modernization.",
            tone: "sky"
          }
        ],
        checklistTitle: "Scheme follow-up",
        checklist: [
          `Keep farm details ready for ${site?.profile?.farm || "your farm"}.`,
          "Verify eligibility on the latest official state or central portal.",
          "Use the current soil report as supporting context where needed."
        ],
        note: "Eligibility and availability can change, so verify details with the current official agriculture portal."
      };
    case "illegal":
      return {
        title: tool.title,
        badge: tool.badge,
        subtitle: tool.description,
        mode: "dynamic",
        cards: [
          {
            eyebrow: "Package check",
            title: "Seal, batch, manufacturer",
            description:
              "Confirm packaging quality, batch number, and manufacturer identity before buying.",
            tone: "amber"
          },
          {
            eyebrow: "Document check",
            title: "Invoice and dealer trail",
            description:
              "Avoid cash-only loose stock and insist on a valid invoice from an authorized dealer.",
            tone: "rose"
          },
          {
            eyebrow: "Field safety",
            title: "Test before full use",
            description: "Use small-area validation first if the source or quality feels uncertain.",
            tone: "emerald"
          }
        ],
        checklistTitle: "Counterfeit fertilizer checks",
        checklist: [
          "Compare labeling, nutrient declaration, and MRP print quality.",
          "Reject torn seals, overwritten dates, or missing batch information.",
          "Escalate suspicious stock to the local agriculture office before field-wide application."
        ],
        note: "Use this as a screening checklist before purchase or application."
      };
    default:
      return null;
  }
}
