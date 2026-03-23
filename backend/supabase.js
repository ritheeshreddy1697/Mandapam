const { loadEnv } = require("./env");
const {
  buildDashboardData,
  buildSiteData,
  defaultSiteData,
  defaultSoilReport,
  defaultSensorReadings
} = require("./data");

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

let fallbackStatePayload = {
  selectedLanguage: defaultSiteData.selectedLanguage
};
let fallbackSoilReport = {
  ...defaultSoilReport
};
let fallbackSensorReadings = defaultSensorReadings.map((reading) => ({
  ...reading
}));

function buildRestUrl(resourcePath, query = {}) {
  const url = new URL(`/rest/v1/${resourcePath}`, SUPABASE_URL);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function supabaseRequest(resourcePath, options = {}) {
  const {
    method = "GET",
    query,
    body,
    prefer = undefined
  } = options;

  if (!hasSupabaseConfig) {
    throw new Error("Supabase credentials are not configured.");
  }

  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    Accept: "application/json"
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (prefer) {
    headers.Prefer = prefer;
  }

  const response = await fetch(buildRestUrl(resourcePath, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Supabase request failed (${response.status} ${response.statusText}): ${errorText}`
    );
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

function logWarning(scope, error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[supabase:${scope}] ${message}`);
}

function mergeSitePayload(existingPayload = {}, patch = {}) {
  const mergedPayload = {
    ...existingPayload,
    ...patch
  };

  if (patch.profile) {
    mergedPayload.profile = {
      ...(existingPayload.profile || {}),
      ...patch.profile
    };
  }

  return mergedPayload;
}

function mergeLatestSensorReadings(existingReadings = [], nextReadings = []) {
  const latestReadings = new Map();

  [...existingReadings, ...nextReadings].forEach((reading) => {
    if (!reading || !reading.sensor_name) {
      return;
    }

    const currentReading = latestReadings.get(reading.sensor_name);
    const currentTimestamp = Date.parse(currentReading?.recorded_at || "");
    const nextTimestamp = Date.parse(reading.recorded_at || "");

    if (
      !currentReading ||
      !Number.isFinite(currentTimestamp) ||
      (Number.isFinite(nextTimestamp) && nextTimestamp >= currentTimestamp)
    ) {
      latestReadings.set(reading.sensor_name, { ...reading });
    }
  });

  return Array.from(latestReadings.values()).sort((left, right) =>
    String(left.sensor_name).localeCompare(String(right.sensor_name))
  );
}

function buildFallbackDashboard() {
  return buildDashboardData({
    soilReport: fallbackSoilReport,
    sensorReadings: fallbackSensorReadings
  });
}

async function getDashboardStateRow() {
  const rows = await supabaseRequest("dashboard_state", {
    query: {
      select: "*",
      id: "eq.1",
      limit: "1"
    }
  });

  return Array.isArray(rows) ? rows[0] || null : null;
}

async function getSiteData() {
  if (!hasSupabaseConfig) {
    return buildSiteData(fallbackStatePayload);
  }

  try {
    const stateRow = await getDashboardStateRow();
    const payload = stateRow?.payload || fallbackStatePayload;
    fallbackStatePayload = {
      ...fallbackStatePayload,
      ...payload
    };
    return buildSiteData(payload);
  } catch (error) {
    logWarning("site-data", error);
    return buildSiteData(fallbackStatePayload);
  }
}

async function getDashboardData() {
  if (!hasSupabaseConfig) {
    return buildFallbackDashboard();
  }

  try {
    const [soilRows, sensorRows] = await Promise.all([
      supabaseRequest("latest_soil_report", {
        query: {
          select: "*",
          limit: "1"
        }
      }),
      supabaseRequest("latest_sensor_readings", {
        query: {
          select: "*",
          order: "sensor_name.asc"
        }
      })
    ]);

    fallbackSoilReport = Array.isArray(soilRows)
      ? soilRows[0] || fallbackSoilReport
      : fallbackSoilReport;
    fallbackSensorReadings =
      Array.isArray(sensorRows) && sensorRows.length > 0
        ? sensorRows.map((reading) => ({ ...reading }))
        : fallbackSensorReadings;

    return buildDashboardData({
      soilReport: fallbackSoilReport,
      sensorReadings: fallbackSensorReadings
    });
  } catch (error) {
    logWarning("dashboard", error);
    return buildFallbackDashboard();
  }
}

async function persistSiteState(sitePatch, allowFallbackOnError = false) {
  const nextFallbackPayload = mergeSitePayload(fallbackStatePayload, sitePatch);

  if (!hasSupabaseConfig) {
    fallbackStatePayload = nextFallbackPayload;
    return buildSiteData(fallbackStatePayload);
  }

  try {
    const existingRow = await getDashboardStateRow();
    const mergedPayload = mergeSitePayload(
      existingRow?.payload || fallbackStatePayload,
      sitePatch
    );
    const rows = await supabaseRequest("dashboard_state", {
      method: "POST",
      query: {
        on_conflict: "id",
        select: "*"
      },
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        id: 1,
        payload: mergedPayload
      }
    });

    const savedPayload =
      Array.isArray(rows) && rows[0]?.payload ? rows[0].payload : mergedPayload;
    fallbackStatePayload = mergeSitePayload(fallbackStatePayload, savedPayload);

    return buildSiteData(savedPayload);
  } catch (error) {
    if (allowFallbackOnError) {
      fallbackStatePayload = nextFallbackPayload;
      logWarning("site-state-update", error);
      return buildSiteData(fallbackStatePayload);
    }

    throw error;
  }
}

async function updateSelectedLanguage(language) {
  return persistSiteState({ selectedLanguage: language }, true);
}

async function updateSiteSettings(sitePatch) {
  return persistSiteState(sitePatch, false);
}

async function createSoilReport(soilReport) {
  if (!hasSupabaseConfig) {
    fallbackSoilReport = {
      ...fallbackSoilReport,
      ...soilReport
    };

    return {
      soilReport: fallbackSoilReport,
      dashboard: buildFallbackDashboard()
    };
  }

  const rows = await supabaseRequest("soil_reports", {
    method: "POST",
    query: {
      select: "*"
    },
    prefer: "return=representation",
    body: soilReport
  });

  const savedSoilReport =
    Array.isArray(rows) && rows[0] ? rows[0] : { ...soilReport };
  fallbackSoilReport = {
    ...fallbackSoilReport,
    ...savedSoilReport
  };

  return {
    soilReport: savedSoilReport,
    dashboard: await getDashboardData()
  };
}

async function createSensorReadings(sensorReadings) {
  if (!hasSupabaseConfig) {
    fallbackSensorReadings = mergeLatestSensorReadings(
      fallbackSensorReadings,
      sensorReadings
    );

    return {
      sensorReadings: fallbackSensorReadings,
      dashboard: buildFallbackDashboard()
    };
  }

  const rows = await supabaseRequest("sensor_readings", {
    method: "POST",
    query: {
      select: "*"
    },
    prefer: "return=representation",
    body: sensorReadings
  });

  const savedSensorReadings =
    Array.isArray(rows) && rows.length > 0
      ? rows.map((reading) => ({ ...reading }))
      : sensorReadings.map((reading) => ({ ...reading }));
  fallbackSensorReadings = mergeLatestSensorReadings(
    fallbackSensorReadings,
    savedSensorReadings
  );

  return {
    sensorReadings: savedSensorReadings,
    dashboard: await getDashboardData()
  };
}

module.exports = {
  getSiteData,
  getDashboardData,
  updateSelectedLanguage,
  updateSiteSettings,
  createSoilReport,
  createSensorReadings,
  hasSupabaseConfig
};
