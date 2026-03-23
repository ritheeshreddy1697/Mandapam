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

loadEnv();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "..", "public");

const mimeTypes = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".svg": "image/svg+xml; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
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

    if (name !== undefined) {
      profilePatch.name = name;
    }

    if (role !== undefined) {
      profilePatch.role = role;
    }

    if (farm !== undefined) {
      profilePatch.farm = farm;
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

function serveFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        serveFile(res, path.join(publicDir, "index.html"));
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

  const requestedFile = pathname === "/" ? "index.html" : pathname.slice(1);
  const resolvedPath = path.resolve(publicDir, requestedFile);

  if (!resolvedPath.startsWith(publicDir)) {
    sendJson(res, 403, { error: "Access denied." });
    return;
  }

  serveFile(res, resolvedPath);
});

server.listen(PORT, () => {
  console.log(`Agricure server running on http://localhost:${PORT}`);
});
