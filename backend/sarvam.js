const { loadEnv } = require("./env");

loadEnv();

const SARVAM_TRANSLATE_ENDPOINT = "https://api.sarvam.ai/translate";
const DEFAULT_SARVAM_MODEL = "sarvam-translate:v1";

const appLanguageToSarvamCode = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN"
};

const translationCache = new Map();

function hasSarvamConfig() {
  return Boolean(process.env.SARVAM_API_KEY);
}

function getSarvamLanguageCode(languageCode) {
  return appLanguageToSarvamCode[languageCode] || null;
}

function createSarvamError(message, statusCode = 502) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sleep(durationMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

async function translateText(text, targetLanguageCode, sourceLanguageCode = "en-IN") {
  const normalizedText = typeof text === "string" ? text.trim() : "";

  if (!normalizedText || !targetLanguageCode || targetLanguageCode === sourceLanguageCode) {
    return text;
  }

  if (!hasSarvamConfig()) {
    return text;
  }

  const cacheKey = `${sourceLanguageCode}:${targetLanguageCode}:${normalizedText}`;
  const cachedTranslation = translationCache.get(cacheKey);

  if (cachedTranslation) {
    return cachedTranslation;
  }

  const translationPromise = (async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(SARVAM_TRANSLATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": process.env.SARVAM_API_KEY
        },
        body: JSON.stringify({
          input: normalizedText,
          source_language_code: sourceLanguageCode,
          target_language_code: targetLanguageCode,
          model: process.env.SARVAM_TRANSLATE_MODEL || DEFAULT_SARVAM_MODEL
        })
      });

      if (response.ok) {
        const payload = await response.json();

        if (
          typeof payload?.translated_text !== "string" ||
          !payload.translated_text.trim()
        ) {
          throw createSarvamError("Sarvam returned an empty translation.");
        }

        return payload.translated_text.trim();
      }

      const errorText = await response.text();

      if (response.status === 429 && attempt < 2) {
        await sleep(450 * (attempt + 1));
        continue;
      }

      throw createSarvamError(
        `Sarvam translation failed (${response.status} ${response.statusText}). ${errorText}`
      );
    }

    throw createSarvamError("Sarvam translation retry limit reached.");
  })();

  translationCache.set(cacheKey, translationPromise);

  try {
    const translatedText = await translationPromise;
    translationCache.set(cacheKey, translatedText);
    return translatedText;
  } catch (error) {
    translationCache.delete(cacheKey);
    throw error;
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function translateTexts(texts, targetLanguageCode, sourceLanguageCode = "en-IN") {
  const uniqueTexts = Array.from(
    new Set(
      texts
        .filter((text) => typeof text === "string")
        .map((text) => text.trim())
        .filter(Boolean)
    )
  );

  if (uniqueTexts.length === 0) {
    return new Map();
  }

  const translatedTexts = await mapWithConcurrency(uniqueTexts, 1, (text) =>
    translateText(text, targetLanguageCode, sourceLanguageCode)
  );

  return new Map(uniqueTexts.map((text, index) => [text, translatedTexts[index]]));
}

async function translateRecordFields(record, fieldNames, targetLanguageCode) {
  if (!record || typeof record !== "object") {
    return;
  }

  const sourceTexts = fieldNames
    .map((fieldName) => record[fieldName])
    .filter((value) => typeof value === "string" && value.trim());
  const translations = await translateTexts(sourceTexts, targetLanguageCode);

  fieldNames.forEach((fieldName) => {
    if (typeof record[fieldName] === "string" && record[fieldName].trim()) {
      record[fieldName] = translations.get(record[fieldName].trim()) || record[fieldName];
    }
  });
}

async function translateArrayFields(items, fieldNames, targetLanguageCode) {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  const sourceTexts = items.flatMap((item) =>
    fieldNames
      .map((fieldName) => item?.[fieldName])
      .filter((value) => typeof value === "string" && value.trim())
  );
  const translations = await translateTexts(sourceTexts, targetLanguageCode);

  items.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }

    fieldNames.forEach((fieldName) => {
      if (typeof item[fieldName] === "string" && item[fieldName].trim()) {
        item[fieldName] = translations.get(item[fieldName].trim()) || item[fieldName];
      }
    });
  });
}

function cloneSiteData(siteData) {
  return {
    ...siteData,
    languages: Array.isArray(siteData.languages)
      ? siteData.languages.map((language) => ({ ...language }))
      : [],
    profile: {
      ...(siteData.profile || {})
    },
    uiText: {
      ...(siteData.uiText || {}),
      recommendationTableHeaders: {
        ...(siteData.uiText?.recommendationTableHeaders || {})
      },
      recommendationColumnTitles: {
        ...(siteData.uiText?.recommendationColumnTitles || {})
      },
      chat: {
        ...(siteData.uiText?.chat || {}),
        quickActions: {
          ...(siteData.uiText?.chat?.quickActions || {})
        }
      },
      recommendationWorkspace: {
        ...(siteData.uiText?.recommendationWorkspace || {}),
        cropSelection: {
          ...(siteData.uiText?.recommendationWorkspace?.cropSelection || {})
        },
        thresholdLabels: {
          ...(siteData.uiText?.recommendationWorkspace?.thresholdLabels || {})
        },
        tools: Array.isArray(siteData.uiText?.recommendationWorkspace?.tools)
          ? siteData.uiText.recommendationWorkspace.tools.map((tool) => ({ ...tool }))
          : [],
        fertilizer: {
          ...(siteData.uiText?.recommendationWorkspace?.fertilizer || {}),
          sections: {
            ...(siteData.uiText?.recommendationWorkspace?.fertilizer?.sections || {})
          },
          fieldLabels: {
            ...(siteData.uiText?.recommendationWorkspace?.fertilizer?.fieldLabels || {})
          }
        }
      },
      realtimePanel: {
        ...(siteData.uiText?.realtimePanel || {}),
        status: {
          ...(siteData.uiText?.realtimePanel?.status || {})
        }
      },
      overviewWeather: {
        ...(siteData.uiText?.overviewWeather || {}),
        labels: {
          ...(siteData.uiText?.overviewWeather?.labels || {})
        },
        units: {
          ...(siteData.uiText?.overviewWeather?.units || {})
        },
        rangeOptions: {
          ...(siteData.uiText?.overviewWeather?.rangeOptions || {})
        }
      }
    }
  };
}

function cloneDashboardData(dashboardData) {
  return {
    ...dashboardData,
    tabs: Array.isArray(dashboardData.tabs)
      ? dashboardData.tabs.map((tab) => ({ ...tab }))
      : [],
    overview: {
      ...(dashboardData.overview || {}),
      soilHealth: {
        ...(dashboardData.overview?.soilHealth || {})
      },
      soilData: Array.isArray(dashboardData.overview?.soilData)
        ? dashboardData.overview.soilData.map((item) => ({ ...item }))
        : []
    },
    recommendations: {
      ...(dashboardData.recommendations || {}),
      tableRows: Array.isArray(dashboardData.recommendations?.tableRows)
        ? dashboardData.recommendations.tableRows.map((row) => ({ ...row }))
        : [],
      organic: Array.isArray(dashboardData.recommendations?.organic)
        ? dashboardData.recommendations.organic.map((item) => ({
            ...item,
            costSummary: item?.costSummary ? { ...item.costSummary } : undefined
          }))
        : [],
      inorganic: Array.isArray(dashboardData.recommendations?.inorganic)
        ? dashboardData.recommendations.inorganic.map((item) => ({
            ...item,
            costSummary: item?.costSummary ? { ...item.costSummary } : undefined
          }))
        : []
    },
    realtime: {
      ...(dashboardData.realtime || {}),
      metrics: Array.isArray(dashboardData.realtime?.metrics)
        ? dashboardData.realtime.metrics.map((item) => ({ ...item }))
        : [],
      feed: Array.isArray(dashboardData.realtime?.feed)
        ? dashboardData.realtime.feed.map((item) => ({ ...item }))
        : []
    }
  };
}

async function localizeSiteData(siteData, languageCode) {
  const targetLanguageCode = getSarvamLanguageCode(languageCode);

  if (!hasSarvamConfig() || !targetLanguageCode || languageCode === "en") {
    return siteData;
  }

  const localizedSiteData = cloneSiteData(siteData);

  await translateRecordFields(localizedSiteData, ["title", "subtitle"], targetLanguageCode);
  await translateRecordFields(localizedSiteData.profile, ["role"], targetLanguageCode);
  await translateRecordFields(
    localizedSiteData.uiText,
    [
      "welcomePrefix",
      "farmProfileLabel",
      "manageAccountLabel",
      "recommendationTableTitle"
    ],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.recommendationTableHeaders,
    ["nutrient", "currentValue", "thresholdValues", "band"],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.recommendationColumnTitles,
    ["organic", "inorganic"],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.chat,
    [
      "launcherTitle",
      "launcherSubtitle",
      "eyebrow",
      "title",
      "subtitle",
      "assistantLabel",
      "userLabel",
      "statusLabel",
      "inputPlaceholder",
      "sendLabel",
      "welcomeMessage",
      "thinkingMessage"
    ],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.chat.quickActions,
    [
      "soilSummaryLabel",
      "soilSummaryPrompt",
      "fertilizerHelpLabel",
      "fertilizerHelpPrompt",
      "sensorInsightsLabel",
      "sensorInsightsPrompt"
    ],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.recommendationWorkspace,
    ["toolExplorerTitle", "toolExplorerSubtitle"],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.recommendationWorkspace.cropSelection,
    [
      "title",
      "subtitle",
      "primaryLabel",
      "primaryPlaceholder",
      "vegetableOption",
      "vegetableLabel",
      "vegetablePlaceholder",
      "suggestedTitle",
      "suggestedSubtitle",
      "selectedTitle",
      "selectedSubtitle",
      "estimatedCostLabel",
      "marketPriceLabel",
      "familyLabel",
      "predictedTag",
      "selectAction",
      "unlockTitle",
      "unlockSubtitle",
      "lockedMessage",
      "unlockedMessagePrefix",
      "summaryPrefix"
    ],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.recommendationWorkspace.thresholdLabels,
    ["low", "medium", "high", "optimal", "target"],
    targetLanguageCode
  );
  await translateArrayFields(
    localizedSiteData.uiText.recommendationWorkspace.tools,
    ["badge", "title", "description"],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.recommendationWorkspace.fertilizer,
    [
      "backLabel",
      "badge",
      "title",
      "subtitle",
      "autofillLabel",
      "farmSelectionTitle",
      "farmSelectLabel",
      "addFarmLabel",
      "soilChemistryTitle"
    ],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.recommendationWorkspace.fertilizer.sections,
    [
      "organicAlternativesTitle",
      "organicAlternativesSubtitle",
      "applicationTimingTitle",
      "applicationTimingSubtitle",
      "costAnalysisTitle",
      "costAnalysisSubtitle",
      "npkRatioLabel",
      "providesLabel",
      "whyUseLabel",
      "chemicalLabel",
      "organicLabel",
      "fieldAreaLabel"
    ],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.recommendationWorkspace.fertilizer.fieldLabels,
    [
      "nitrogen",
      "phosphorus",
      "potassium",
      "ph",
      "moisture",
      "temperature",
      "conductivity"
    ],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.realtimePanel,
    [
      "title",
      "soilTitle",
      "soilSubtitle",
      "environmentTitle",
      "environmentSubtitle",
      "trendTitle",
      "trendSubtitle",
      "distributionTitle",
      "distributionSubtitle",
      "lastUpdatedLabel",
      "sunlightLabel",
      "temperatureLabel",
      "humidityLabel"
    ],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.realtimePanel.status,
    ["critical", "warning", "optimal"],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.overviewWeather,
    ["title", "subtitle", "chartTitle", "chartSubtitle"],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.overviewWeather.labels,
    ["temperature", "humidity", "flux"],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedSiteData.uiText.overviewWeather.rangeOptions,
    ["24h", "1w", "1m", "3m", "6m", "1y"],
    targetLanguageCode
  );

  return localizedSiteData;
}

async function localizeDashboardData(dashboardData, languageCode) {
  const targetLanguageCode = getSarvamLanguageCode(languageCode);

  if (!hasSarvamConfig() || !targetLanguageCode || languageCode === "en") {
    return dashboardData;
  }

  const localizedDashboardData = cloneDashboardData(dashboardData);

  await translateArrayFields(localizedDashboardData.tabs, ["label"], targetLanguageCode);
  await translateRecordFields(
    localizedDashboardData.overview,
    ["title", "status"],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedDashboardData.overview.soilHealth,
    ["label", "message", "support"],
    targetLanguageCode
  );
  await translateArrayFields(
    localizedDashboardData.overview.soilData,
    ["label"],
    targetLanguageCode
  );
  await translateRecordFields(
    localizedDashboardData.recommendations,
    ["summary"],
    targetLanguageCode
  );
  await translateArrayFields(
    localizedDashboardData.recommendations.tableRows,
    ["thresholdValues", "band"],
    targetLanguageCode
  );
  await translateArrayFields(
    localizedDashboardData.recommendations.organic,
    [
      "title",
      "priority",
      "detail",
      "fertilizer",
      "nutrientContent",
      "priceRange",
      "applicationRate",
      "note"
    ],
    targetLanguageCode
  );
  await translateArrayFields(
    localizedDashboardData.recommendations.inorganic,
    [
      "title",
      "priority",
      "detail",
      "fertilizer",
      "nutrientContent",
      "priceRange",
      "applicationRate",
      "note"
    ],
    targetLanguageCode
  );
  await translateArrayFields(
    localizedDashboardData.realtime.metrics,
    ["label", "change"],
    targetLanguageCode
  );
  await translateArrayFields(
    localizedDashboardData.realtime.feed,
    ["time", "detail"],
    targetLanguageCode
  );

  return localizedDashboardData;
}

module.exports = {
  hasSarvamConfig,
  localizeSiteData,
  localizeDashboardData
};
