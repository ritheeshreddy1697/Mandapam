const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { loadEnv } = require("./env");
const {
  buildDashboardData,
  defaultSoilReport,
  defaultSensorReadings,
  supportedLanguageCodes
} = require("./data");
const {
  getSiteData,
  getDashboardData,
  updateSelectedLanguage,
  updateSiteSettings,
  createSoilReport,
  createSensorReadings,
  hasSupabaseConfig
} = require("./supabase");
const { generateChatReply } = require("./gemini");
const {
  getAgmarknetCropInsights,
  getAgmarknetCropPriceReport,
  getAgmarknetLocations
} = require("./agmarknet");
const { getPpqsAdvisoriesForCrop } = require("./ppqs");
const { getVikaspediaSchemeInsights } = require("./vikaspedia");

loadEnv();
const PORT = process.env.PORT || 3000;
const distDir = path.join(__dirname, "..", "dist");
const clientDir = distDir;
const clientIndexPath = path.join(clientDir, "index.html");

const mimeTypes = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".mjs": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".svg": "image/svg+xml; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const sensorMetricFields = [
  {
    apiKeys: ["moisture"],
    targetKey: "moisture",
    label: "moisture"
  },
  {
    apiKeys: ["humidity"],
    targetKey: "humidity",
    label: "humidity"
  },
  {
    apiKeys: ["rootZoneTemperature", "root_zone_temperature"],
    targetKey: "root_zone_temperature",
    label: "rootZoneTemperature"
  },
  {
    apiKeys: ["batteryReserve", "battery_reserve"],
    targetKey: "battery_reserve",
    label: "batteryReserve"
  },
  {
    apiKeys: ["packetsDelayed", "packets_delayed"],
    targetKey: "packets_delayed",
    label: "packetsDelayed"
  },
  {
    apiKeys: ["uplinkLatency", "uplink_latency"],
    targetKey: "uplink_latency",
    label: "uplinkLatency"
  }
];

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=UTF-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendHtml(res, statusCode, markup) {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=UTF-8",
    "Content-Length": Buffer.byteLength(markup)
  });
  res.end(markup);
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickField(payload, keys) {
  const key = keys.find((candidate) =>
    Object.prototype.hasOwnProperty.call(payload, candidate)
  );

  return key ? payload[key] : undefined;
}

function collectRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      resolve(body);
    });

    req.on("error", reject);
  });
}

async function parseJsonBody(req) {
  const body = await collectRequestBody(req);

  try {
    return JSON.parse(body || "{}");
  } catch (error) {
    throw createHttpError(400, "Invalid request payload.");
  }
}

function readTextField(value, label, options = {}) {
  const {
    required = false,
    allowNull = false,
    maxLength = 120
  } = options;

  if (value === undefined) {
    if (required) {
      throw createHttpError(400, `${label} is required.`);
    }

    return undefined;
  }

  if (value === null) {
    if (allowNull) {
      return null;
    }

    throw createHttpError(400, `${label} must be a string.`);
  }

  if (typeof value !== "string") {
    throw createHttpError(400, `${label} must be a string.`);
  }

  const normalized = value.trim();

  if (!normalized) {
    if (allowNull) {
      return null;
    }

    if (required) {
      throw createHttpError(400, `${label} is required.`);
    }

    return undefined;
  }

  return normalized.slice(0, maxLength);
}

function readNumericField(value, label, options = {}) {
  const {
    required = false,
    allowNull = false
  } = options;

  if (value === undefined) {
    if (required) {
      throw createHttpError(400, `${label} is required.`);
    }

    return undefined;
  }

  if (value === null || value === "") {
    if (allowNull) {
      return null;
    }

    if (required) {
      throw createHttpError(400, `${label} is required.`);
    }

    return undefined;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw createHttpError(400, `${label} must be a valid number.`);
  }

  return numericValue;
}

function readTimestampField(value, label) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw createHttpError(400, `${label} must be a valid date string.`);
  }

  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.valueOf())) {
    throw createHttpError(400, `${label} must be a valid date string.`);
  }

  return timestamp.toISOString();
}

function parseSitePatch(payload) {
  if (!isPlainObject(payload)) {
    throw createHttpError(400, "Site update payload must be a JSON object.");
  }

  const patch = {};
  const brand = readTextField(pickField(payload, ["brand"]), "brand", {
    maxLength: 60
  });
  const title = readTextField(pickField(payload, ["title"]), "title", {
    maxLength: 80
  });
  const subtitle = readTextField(pickField(payload, ["subtitle"]), "subtitle", {
    maxLength: 180
  });
  const selectedLanguageValue = pickField(payload, [
    "selectedLanguage",
    "language"
  ]);

  if (brand !== undefined) {
    patch.brand = brand;
  }

  if (title !== undefined) {
    patch.title = title;
  }

  if (subtitle !== undefined) {
    patch.subtitle = subtitle;
  }

  if (selectedLanguageValue !== undefined) {
    const selectedLanguage = readTextField(
      selectedLanguageValue,
      "selectedLanguage",
      {
        maxLength: 10
      }
    );

    if (!supportedLanguageCodes.includes(selectedLanguage)) {
      throw createHttpError(400, "Unsupported language.");
    }

    patch.selectedLanguage = selectedLanguage;
  }

  const profilePayload = pickField(payload, ["profile"]);

  if (profilePayload !== undefined) {
    if (!isPlainObject(profilePayload)) {
      throw createHttpError(400, "profile must be a JSON object.");
    }

    const profilePatch = {};
    const name = readTextField(pickField(profilePayload, ["name"]), "profile.name", {
      maxLength: 80
    });
    const role = readTextField(pickField(profilePayload, ["role"]), "profile.role", {
      maxLength: 80
    });
    const farm = readTextField(pickField(profilePayload, ["farm"]), "profile.farm", {
      maxLength: 120
    });
    const landSize = readTextField(
      pickField(profilePayload, ["landSize", "land_size"]),
      "profile.landSize",
      {
        maxLength: 40
      }
    );
    const state = readTextField(pickField(profilePayload, ["state"]), "profile.state", {
      maxLength: 80
    });
    const district = readTextField(
      pickField(profilePayload, ["district"]),
      "profile.district",
      {
        maxLength: 80
      }
    );

    if (name !== undefined) {
      profilePatch.name = name;
    }

    if (role !== undefined) {
      profilePatch.role = role;
    }

    if (farm !== undefined) {
      profilePatch.farm = farm;
    }

    if (landSize !== undefined) {
      profilePatch.landSize = landSize;
    }

    if (state !== undefined) {
      profilePatch.state = state;
    }

    if (district !== undefined) {
      profilePatch.district = district;
    }

    if (Object.keys(profilePatch).length > 0) {
      patch.profile = profilePatch;
    }
  }

  if (Object.keys(patch).length === 0) {
    throw createHttpError(400, "No valid site fields were provided.");
  }

  return patch;
}

function parseSoilReportPayload(payload) {
  if (!isPlainObject(payload)) {
    throw createHttpError(400, "Soil report payload must be a JSON object.");
  }

  const report = {
    farm_name:
      readTextField(pickField(payload, ["farmName", "farm_name"]), "farmName", {
        maxLength: 120
      }) || defaultSoilReport.farm_name,
    nitrogen: readNumericField(pickField(payload, ["nitrogen"]), "nitrogen", {
      required: true
    }),
    phosphorus: readNumericField(
      pickField(payload, ["phosphorus"]),
      "phosphorus",
      {
        required: true
      }
    ),
    potassium: readNumericField(pickField(payload, ["potassium"]), "potassium", {
      required: true
    }),
    ph: readNumericField(pickField(payload, ["ph"]), "ph", {
      required: true
    }),
    electrical_conductivity: readNumericField(
      pickField(payload, [
        "electricalConductivity",
        "electrical_conductivity"
      ]),
      "electricalConductivity",
      {
        required: true
      }
    ),
    soil_moisture: readNumericField(
      pickField(payload, ["soilMoisture", "soil_moisture"]),
      "soilMoisture",
      {
        required: true
      }
    ),
    soil_temperature: readNumericField(
      pickField(payload, ["soilTemperature", "soil_temperature"]),
      "soilTemperature",
      {
        required: true
      }
    ),
    recorded_at:
      readTimestampField(pickField(payload, ["recordedAt", "recorded_at"]), "recordedAt") ||
      new Date().toISOString()
  };

  const organicMatter = readNumericField(
    pickField(payload, ["organicMatter", "organic_matter"]),
    "organicMatter",
    {
      allowNull: true
    }
  );
  const recommendationNote = readTextField(
    pickField(payload, ["recommendationNote", "recommendation_note"]),
    "recommendationNote",
    {
      allowNull: true,
      maxLength: 320
    }
  );
  const healthScore = readNumericField(
    pickField(payload, ["healthScore", "health_score"]),
    "healthScore",
    {
      allowNull: true
    }
  );
  const reportStatus = readTextField(
    pickField(payload, ["reportStatus", "report_status"]),
    "reportStatus",
    {
      allowNull: true,
      maxLength: 40
    }
  );

  report.organic_matter =
    organicMatter !== undefined ? organicMatter : defaultSoilReport.organic_matter;

  if (recommendationNote !== undefined) {
    report.recommendation_note = recommendationNote;
  }

  if (healthScore !== undefined) {
    report.health_score = healthScore;
  }

  if (reportStatus !== undefined) {
    report.report_status = reportStatus;
  }

  const derivedOverview = buildDashboardData({
    soilReport: {
      ...defaultSoilReport,
      ...report
    },
    sensorReadings: defaultSensorReadings
  }).overview;

  if (report.health_score == null) {
    report.health_score = derivedOverview.soilHealth.score;
  }

  if (report.report_status == null) {
    report.report_status = derivedOverview.status;
  }

  if (report.recommendation_note == null) {
    report.recommendation_note = derivedOverview.soilHealth.message;
  }

  return report;
}

function parseSensorReading(payload, index) {
  if (!isPlainObject(payload)) {
    throw createHttpError(400, `Sensor reading ${index + 1} must be a JSON object.`);
  }

  const reading = {
    sensor_name: readTextField(
      pickField(payload, ["sensorName", "sensor_name"]),
      "sensorName",
      {
        required: true,
        maxLength: 80
      }
    ),
    recorded_at:
      readTimestampField(pickField(payload, ["recordedAt", "recorded_at"]), "recordedAt") ||
      new Date().toISOString()
  };

  let hasMetricValue = false;

  sensorMetricFields.forEach((field) => {
    const value = readNumericField(
      pickField(payload, field.apiKeys),
      field.label,
      {
        allowNull: true
      }
    );

    if (value !== undefined) {
      reading[field.targetKey] = value;
      hasMetricValue = hasMetricValue || value !== null;
      return;
    }

    reading[field.targetKey] = null;
  });

  if (!hasMetricValue) {
    throw createHttpError(
      400,
      `Sensor reading ${index + 1} must include at least one numeric measurement.`
    );
  }

  return reading;
}

function parseSensorReadingsPayload(payload) {
  const readings = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.readings)
      ? payload.readings
      : [payload];

  if (!Array.isArray(readings) || readings.length === 0) {
    throw createHttpError(400, "At least one sensor reading is required.");
  }

  return readings.map((reading, index) => parseSensorReading(reading, index));
}

function parseChatHistory(payload) {
  if (payload === undefined) {
    return [];
  }

  if (!Array.isArray(payload)) {
    throw createHttpError(400, "history must be an array.");
  }

  return payload.slice(-10).map((entry, index) => {
    if (!isPlainObject(entry)) {
      throw createHttpError(400, `history item ${index + 1} must be an object.`);
    }

    const role = readTextField(pickField(entry, ["role"]), `history[${index}].role`, {
      required: true,
      maxLength: 20
    });
    const text = readTextField(pickField(entry, ["text"]), `history[${index}].text`, {
      required: true,
      maxLength: 2000
    });

    if (!["user", "assistant", "model"].includes(role)) {
      throw createHttpError(
        400,
        `history item ${index + 1} has an unsupported role.`
      );
    }

    return { role, text };
  });
}

function parseChatPayload(payload) {
  if (!isPlainObject(payload)) {
    throw createHttpError(400, "Chat payload must be a JSON object.");
  }

  return {
    message: readTextField(pickField(payload, ["message", "prompt"]), "message", {
      required: true,
      maxLength: 2000
    }),
    history: parseChatHistory(pickField(payload, ["history"]))
  };
}

function sendMissingBuildPage(res) {
  sendHtml(
    res,
    503,
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Frontend Build Required</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: Arial, sans-serif;
        background: #f4efe3;
        color: #17212b;
      }

      main {
        max-width: 640px;
        padding: 32px;
        border-radius: 24px;
        background: #ffffff;
        box-shadow: 0 20px 50px rgba(22, 34, 57, 0.08);
      }

      code {
        padding: 2px 6px;
        border-radius: 8px;
        background: #eef4e7;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Frontend build required</h1>
      <p>The React frontend was not found in <code>dist/</code>.</p>
      <p>Run <code>npm run build</code> and then restart the server.</p>
    </main>
  </body>
</html>`
  );
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        if (filePath === clientIndexPath) {
          sendMissingBuildPage(res);
          return;
        }

        serveFile(res, clientIndexPath);
        return;
      }

      sendJson(res, 500, { error: "Unable to load the requested resource." });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
    res.end(content);
  });
}

function sendRouteError(res, error, fallbackMessage) {
  sendJson(res, error.statusCode || 500, {
    error: error.message || fallbackMessage
  });
}

function logWarning(scope, error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[server:${scope}] ${message}`);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  if (pathname === "/api/site-data" && req.method === "GET") {
    try {
      const siteData = await getSiteData();
      sendJson(res, 200, siteData);
    } catch (error) {
      sendRouteError(res, error, "Unable to load site data.");
    }
    return;
  }

  if (pathname === "/api/dashboard" && req.method === "GET") {
    try {
      const dashboardData = await getDashboardData();
      sendJson(res, 200, dashboardData);
    } catch (error) {
      sendRouteError(res, error, "Unable to load dashboard data.");
    }
    return;
  }

  if (pathname === "/api/site-data" && ["PATCH", "POST"].includes(req.method)) {
    try {
      const payload = await parseJsonBody(req);
      const sitePatch = parseSitePatch(payload);
      const siteData = await updateSiteSettings(sitePatch);

      sendJson(res, 200, {
        message: "Site settings updated.",
        siteData,
        source: hasSupabaseConfig ? "supabase" : "fallback"
      });
    } catch (error) {
      sendRouteError(res, error, "Unable to update site settings.");
    }
    return;
  }

  if (pathname === "/api/soil-reports" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const soilReport = parseSoilReportPayload(payload);
      const result = await createSoilReport(soilReport);

      sendJson(res, 201, {
        message: "Soil report saved.",
        soilReport: result.soilReport,
        dashboard: result.dashboard,
        source: hasSupabaseConfig ? "supabase" : "fallback"
      });
    } catch (error) {
      sendRouteError(res, error, "Unable to save soil report.");
    }
    return;
  }

  if (pathname === "/api/sensor-readings" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const sensorReadings = parseSensorReadingsPayload(payload);
      const result = await createSensorReadings(sensorReadings);

      sendJson(res, 201, {
        message: "Sensor readings saved.",
        sensorReadings: result.sensorReadings,
        dashboard: result.dashboard,
        source: hasSupabaseConfig ? "supabase" : "fallback"
      });
    } catch (error) {
      sendRouteError(res, error, "Unable to save sensor readings.");
    }
    return;
  }

  if (pathname === "/api/preferences/language" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const requestedLanguage = readTextField(
        pickField(payload, ["language", "selectedLanguage"]),
        "language",
        {
          required: true,
          maxLength: 10
        }
      );

      if (!supportedLanguageCodes.includes(requestedLanguage)) {
        throw createHttpError(400, "Unsupported language.");
      }

      const siteData = await updateSelectedLanguage(requestedLanguage);
      sendJson(res, 200, {
        message: "Language preference updated.",
        selectedLanguage: siteData.selectedLanguage,
        source: hasSupabaseConfig ? "supabase" : "fallback"
      });
    } catch (error) {
      sendRouteError(res, error, "Unable to update language preference.");
    }
    return;
  }

  if (pathname === "/api/chat" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const chatRequest = parseChatPayload(payload);
      const result = await generateChatReply(chatRequest);

      sendJson(res, 200, result);
    } catch (error) {
      sendRouteError(res, error, "Unable to generate chatbot response.");
    }
    return;
  }

  if (pathname === "/api/agmarknet/prices" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const cropKeys = Array.isArray(payload?.cropKeys)
        ? payload.cropKeys
            .map((value) => readTextField(value, "crop key", { maxLength: 60 }))
            .filter(Boolean)
        : [];

      if (cropKeys.length === 0) {
        throw createHttpError(400, "At least one crop key is required.");
      }

      const stateName = readTextField(pickField(payload, ["stateName", "state"]), "stateName", {
        maxLength: 80
      });
      const districtName = readTextField(
        pickField(payload, ["districtName", "district"]),
        "districtName",
        {
          maxLength: 80
        }
      );
      const insights = await getAgmarknetCropInsights(cropKeys, {
        stateName,
        districtName
      });
      sendJson(res, 200, {
        source: "agmarknet",
        insights
      });
    } catch (error) {
      logWarning("agmarknet-prices", error);
      sendRouteError(res, error, "Unable to load Agmarknet crop prices.");
    }
    return;
  }

  if (pathname === "/api/agmarknet/locations" && req.method === "GET") {
    try {
      const locations = await getAgmarknetLocations();
      sendJson(res, 200, locations);
    } catch (error) {
      logWarning("agmarknet-locations", error);
      sendRouteError(res, error, "Unable to load Agmarknet locations.");
    }
    return;
  }

  if (pathname === "/api/agmarknet/report" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const cropKey = readTextField(
        pickField(payload, ["cropKey"]),
        "cropKey",
        {
          required: true,
          maxLength: 60
        }
      );
      const stateName = readTextField(pickField(payload, ["stateName", "state"]), "stateName", {
        maxLength: 80
      });
      const districtName = readTextField(
        pickField(payload, ["districtName", "district"]),
        "districtName",
        {
          maxLength: 80
        }
      );
      const report = await getAgmarknetCropPriceReport({
        cropKey,
        stateName,
        districtName
      });

      sendJson(res, 200, {
        source: "agmarknet",
        report
      });
    } catch (error) {
      logWarning("agmarknet-report", error);
      sendRouteError(res, error, "Unable to load Agmarknet crop report.");
    }
    return;
  }

  if (pathname === "/api/ppqs/advisories" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const cropKey = readTextField(
        pickField(payload, ["cropKey"]),
        "cropKey",
        {
          required: true,
          maxLength: 60
        }
      );
      const advisories = await getPpqsAdvisoriesForCrop(cropKey);

      sendJson(res, 200, advisories);
    } catch (error) {
      logWarning("ppqs-advisories", error);
      sendRouteError(res, error, "Unable to load PPQS advisories.");
    }
    return;
  }

  if (pathname === "/api/vikaspedia/schemes" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const stateName = readTextField(pickField(payload, ["stateName", "state"]), "stateName", {
        maxLength: 80
      });
      const schemes = await getVikaspediaSchemeInsights(stateName || "");

      sendJson(res, 200, schemes);
    } catch (error) {
      logWarning("vikaspedia-schemes", error);
      sendRouteError(res, error, "Unable to load government schemes.");
    }
    return;
  }

  const requestedFile = pathname === "/" ? "index.html" : pathname.slice(1);
  const resolvedPath = path.resolve(clientDir, requestedFile);

  if (!resolvedPath.startsWith(clientDir)) {
    sendJson(res, 403, { error: "Access denied." });
    return;
  }

  serveFile(res, resolvedPath);
});

server.listen(PORT, () => {
  console.log(`Agricure server running on http://localhost:${PORT}`);
});
