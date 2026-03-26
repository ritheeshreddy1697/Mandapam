const https = require("https");
const {
  GOVERNMENT_API_CACHE_TTL_MS,
  getOrFetchGovernmentApiValue
} = require("./govt-cache");

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const NHB_MIS_URL = "https://www.nhb.gov.in/onlineclient/csrrptmis.aspx";
const NHB_SOURCE_URL = "https://www.nhb.gov.in/onlineclient/csrrptmis.aspx";
const STORAGE_RESULT_LIMIT = 12;
const INDIA_COUNTRY_CODE = "in";
const REQUEST_HEADERS = {
  Accept: "application/json",
  "User-Agent": "AgriCure/1.0 (storage lookup)"
};

function createStorageError(message) {
  const error = new Error(message);
  error.statusCode = 502;
  return error;
}

function requestText(url, options = {}) {
  return requestResponse(url, options).then((response) => response.body);
}

function requestResponse(url, options = {}) {
  const method = options.method || "GET";
  const body = options.body || "";
  const headers = {
    ...REQUEST_HEADERS,
    ...(options.headers || {})
  };

  if (body) {
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method,
        headers
      },
      (response) => {
        let payload = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          payload += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              createStorageError(`Storage lookup request failed with status ${response.statusCode}.`)
            );
            return;
          }

          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: payload
          });
        });
      }
    );

    request.setTimeout(15000, () => {
      request.destroy(createStorageError("Storage lookup request timed out."));
    });
    request.on("error", reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

async function requestJson(url, options = {}) {
  const raw = await requestText(url, options);

  try {
    return JSON.parse(raw);
  } catch {
    throw createStorageError("Storage lookup returned invalid JSON.");
  }
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toNumber(value) {
  const number = Number.parseFloat(String(value || ""));
  return Number.isFinite(number) ? number : null;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(origin, destination) {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(destination.latitude - origin.latitude);
  const deltaLongitude = toRadians(destination.longitude - origin.longitude);
  const latitudeOne = toRadians(origin.latitude);
  const latitudeTwo = toRadians(destination.latitude);
  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(latitudeOne) *
      Math.cos(latitudeTwo) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildMapsUrl(latitude, longitude) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

function buildMapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildOsmUrl(latitude, longitude) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
}

function buildAddressFromNominatim(item = {}) {
  const address = item.address || {};
  const segments = [
    address.road,
    address.suburb || address.neighbourhood,
    address.city || address.town || address.village,
    address.county || address.state_district,
    address.state
  ].filter(Boolean);

  return segments.join(", ") || String(item.display_name || "").trim();
}

function normalizeAreaValue(value) {
  return normalizeText(value).replace(/\bdistrict\b/g, "").trim();
}

function pickTag(tags, keys = []) {
  for (const key of keys) {
    const value = tags?.[key];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function buildAddress(tags = {}) {
  const directAddress = pickTag(tags, ["addr:full", "address"]);

  if (directAddress) {
    return directAddress;
  }

  const segments = [
    pickTag(tags, ["addr:housenumber"]),
    pickTag(tags, ["addr:street"]),
    pickTag(tags, ["addr:suburb", "addr:neighbourhood"]),
    pickTag(tags, ["addr:city", "addr:town", "addr:village"]),
    pickTag(tags, ["addr:district"]),
    pickTag(tags, ["addr:state"])
  ].filter(Boolean);

  return segments.join(", ");
}

function normalizeWebsiteUrl(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized}`;
}

function extractCoordinates(element) {
  const latitude = toNumber(element?.lat ?? element?.center?.lat);
  const longitude = toNumber(element?.lon ?? element?.center?.lon);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    latitude,
    longitude
  };
}

function buildPublishedPriceLabel(tags = {}) {
  const directPrice = pickTag(tags, ["charge", "price", "tariff", "rate", "rental"]);

  if (directPrice) {
    return directPrice;
  }

  const fee = pickTag(tags, ["fee"]);

  if (normalizeText(fee) === "yes") {
    return "Charges apply";
  }

  if (normalizeText(fee) === "no") {
    return "No fee listed";
  }

  return "Not publicly listed";
}

function buildAvailabilityLabel(tags = {}) {
  const publishedValue = pickTag(tags, [
    "availability",
    "vacancy",
    "capacity:free",
    "booking",
    "occupancy"
  ]);

  return publishedValue || "Not publicly listed";
}

function buildCapacityLabel(tags = {}) {
  const capacity = pickTag(tags, [
    "capacity:cold_storage",
    "storage:capacity",
    "capacity"
  ]);

  return capacity || "";
}

function isColdStorageRecord(tags = {}) {
  const coldSignals = [
    pickTag(tags, ["name"]),
    pickTag(tags, ["storage"]),
    pickTag(tags, ["building"]),
    pickTag(tags, ["description"])
  ]
    .join(" ")
    .toLowerCase();

  return (
    coldSignals.includes("cold storage") ||
    coldSignals.includes("coldstore") ||
    coldSignals.includes("cold room") ||
    coldSignals.includes("cold chain") ||
    normalizeText(tags.storage) === "cold storage" ||
    normalizeText(tags.storage) === "refrigerated"
  );
}

function uniqueStorages(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${normalizeText(item.name)}:${item.latitude.toFixed(5)}:${item.longitude.toFixed(5)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildFallbackName(displayName) {
  const firstSegment = String(displayName || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)[0];

  return firstSegment || "Cold storage facility";
}

function matchesAreaValue(actualValue, expectedValue) {
  const actual = normalizeAreaValue(actualValue);
  const expected = normalizeAreaValue(expectedValue);

  if (!expected) {
    return true;
  }

  if (!actual) {
    return false;
  }

  return actual === expected || actual.includes(expected) || expected.includes(actual);
}

function filterStoragesByArea(storages, options = {}) {
  const expectedState = options.stateName || "";
  const expectedDistrict = options.districtName || "";

  return storages.filter((storage) => {
    const stateHaystack = [
      storage.stateName,
      storage.address,
      storage.name
    ]
      .filter(Boolean)
      .join(" ");
    const districtHaystack = [
      storage.districtName,
      storage.address,
      storage.name
    ]
      .filter(Boolean)
      .join(" ");
    const stateMatches = matchesAreaValue(stateHaystack, expectedState);

    if (!stateMatches) {
      return false;
    }

    if (!expectedDistrict) {
      return true;
    }

    return matchesAreaValue(districtHaystack, expectedDistrict);
  });
}

function extractHiddenField(html, id) {
  const match = String(html || "").match(
    new RegExp(`id="${id}" value="([^"]*)"`)
  );

  return match ? match[1] : "";
}

function parseSetCookieHeaders(headers) {
  const cookies = Array.isArray(headers) ? headers : headers ? [headers] : [];

  return cookies
    .map((entry) => String(entry).split(";")[0])
    .filter(Boolean)
    .join("; ");
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseNhbStateOptions(html) {
  const selectMatch = String(html || "").match(
    /<select name="drpState" id="drpState">([\s\S]*?)<\/select>/
  );

  if (!selectMatch) {
    return [];
  }

  const options = [];
  const optionPattern = /<option value="([^"]+)">([\s\S]*?)<\/option>/g;
  let match;

  while ((match = optionPattern.exec(selectMatch[1]))) {
    const value = decodeHtml(match[1]).trim();
    const label = decodeHtml(match[2]).trim();

    if (!value || !label || normalizeText(label) === "all") {
      continue;
    }

    options.push({
      code: value,
      name: label
    });
  }

  return options;
}

function resolveNhbStateCode(options, stateName) {
  const normalizedTarget = normalizeText(stateName);

  const match = options.find((option) => normalizeText(option.name) === normalizedTarget);
  return match?.code || "";
}

function parseNhbDistrictRows(html, stateName) {
  const rows = [];
  const rowPattern =
    /<tr>\s*<td class="listValueText"[^>]*>\d+<\/td><td class="listValueText"[^>]*>([\s\S]*?)<\/td><td class="listValuenumber"[\s\S]*?>[\s\S]*?>(\d+)<\/a>/g;
  let match;

  while ((match = rowPattern.exec(String(html || "")))) {
    const districtName = decodeHtml(match[1]).replace(/<[^>]+>/g, "").trim();
    const storageCount = Number.parseInt(match[2], 10);

    if (!districtName || !Number.isFinite(storageCount) || storageCount <= 0) {
      continue;
    }

    rows.push({
      districtName,
      stateName,
      storageCount
    });
  }

  return rows;
}

function buildNhbSummaryStorageItem(row) {
  const query = `cold storage ${row.districtName}, ${row.stateName}`;

  return {
    id: `nhb-${normalizeText(row.stateName)}-${normalizeText(row.districtName)}`,
    name: `${row.districtName} cold storages`,
    address: `${row.districtName}, ${row.stateName}`,
    districtName: row.districtName,
    stateName: row.stateName,
    phone: "",
    website: "",
    priceLabel: "Not publicly listed",
    availabilityLabel: `${row.storageCount} registered cold storages`,
    capacityLabel: "NHB district registry",
    latitude: null,
    longitude: null,
    distanceKm: null,
    mapsUrl: buildMapsSearchUrl(query),
    sourceUrl: NHB_SOURCE_URL,
    source: "National Horticulture Board"
  };
}

function formatStorageElement(element, options = {}) {
  const tags = element?.tags || {};
  const coordinates = extractCoordinates(element);

  if (!coordinates || !isColdStorageRecord(tags)) {
    return null;
  }

  const name =
    pickTag(tags, ["name", "operator", "brand"]) ||
    "Cold storage facility";
  const address = buildAddress(tags);
  const distanceKm = options.origin
    ? Number(calculateDistanceKm(options.origin, coordinates).toFixed(1))
    : null;

  return {
    id: `${element.type || "feature"}-${element.id || name}`,
    name,
    address,
    phone: pickTag(tags, ["phone", "contact:phone"]),
    website: normalizeWebsiteUrl(pickTag(tags, ["website", "contact:website"])),
    priceLabel: buildPublishedPriceLabel(tags),
    availabilityLabel: buildAvailabilityLabel(tags),
    capacityLabel: buildCapacityLabel(tags),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    distanceKm,
    mapsUrl: buildMapsUrl(coordinates.latitude, coordinates.longitude),
    sourceUrl: buildOsmUrl(coordinates.latitude, coordinates.longitude),
    source: "OpenStreetMap"
  };
}

function buildViewbox(latitude, longitude, radiusMeters) {
  const latitudeDelta = radiusMeters / 111320;
  const longitudeDelta =
    radiusMeters / (111320 * Math.cos(toRadians(latitude || 0)) || 111320);

  return {
    left: Number((longitude - longitudeDelta).toFixed(6)),
    top: Number((latitude + latitudeDelta).toFixed(6)),
    right: Number((longitude + longitudeDelta).toFixed(6)),
    bottom: Number((latitude - latitudeDelta).toFixed(6))
  };
}

function buildViewboxFromBoundingBox(boundingBox) {
  if (!Array.isArray(boundingBox) || boundingBox.length !== 4) {
    return null;
  }

  const [south, north, west, east] = boundingBox.map(toNumber);

  if ([south, north, west, east].some((value) => value === null)) {
    return null;
  }

  return {
    left: west,
    top: north,
    right: east,
    bottom: south
  };
}

function formatNominatimStorageItem(item, options = {}) {
  const address = item?.address || {};
  const latitude = toNumber(item?.lat);
  const longitude = toNumber(item?.lon);

  if (latitude === null || longitude === null) {
    return null;
  }

  const nameCandidate =
    String(item?.name || "").trim() ||
    String(item?.display_name || "").trim();

  if (!/cold\s*storage|coldstore|cold room|cold chain/i.test(nameCandidate)) {
    return null;
  }

  const distanceKm = options.origin
    ? Number(
        calculateDistanceKm(options.origin, {
          latitude,
          longitude
        }).toFixed(1)
      )
    : null;

  return {
    id: `${item.place_id || item.osm_id || nameCandidate}`,
    name: buildFallbackName(nameCandidate),
    address: buildAddressFromNominatim(item),
    districtName:
      address.county ||
      address.state_district ||
      address.city_district ||
      address.city ||
      address.town ||
      address.village ||
      "",
    stateName: address.state || "",
    phone: "",
    website: "",
    priceLabel: "Not publicly listed",
    availabilityLabel: "Not publicly listed",
    capacityLabel: "",
    latitude,
    longitude,
    distanceKm,
    mapsUrl: buildMapsUrl(latitude, longitude),
    sourceUrl: buildOsmUrl(latitude, longitude),
    source: "OpenStreetMap"
  };
}

async function fetchNominatimStorages({
  query,
  latitude,
  longitude,
  radiusMeters,
  viewbox,
  limit
}) {
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: String(limit),
    addressdetails: "1",
    dedupe: "1",
    countrycodes: INDIA_COUNTRY_CODE,
    q: query
  });

  if (viewbox) {
    params.set(
      "viewbox",
      `${viewbox.left},${viewbox.top},${viewbox.right},${viewbox.bottom}`
    );
    params.set("bounded", "1");
  } else if (latitude !== undefined && longitude !== undefined && radiusMeters) {
    const derivedViewbox = buildViewbox(latitude, longitude, radiusMeters);
    params.set(
      "viewbox",
      `${derivedViewbox.left},${derivedViewbox.top},${derivedViewbox.right},${derivedViewbox.bottom}`
    );
    params.set("bounded", "1");
  }

  const payload = await requestJson(`${NOMINATIM_BASE_URL}/search?${params.toString()}`);
  const items = Array.isArray(payload) ? payload : [];

  return uniqueStorages(
    items
      .map((item) =>
        formatNominatimStorageItem(item, {
          origin:
            latitude !== undefined && longitude !== undefined
              ? {
                  latitude,
                  longitude
                }
              : null
        })
      )
      .filter(Boolean)
  )
    .sort((left, right) => {
      if (left.distanceKm === null && right.distanceKm === null) {
        return left.name.localeCompare(right.name);
      }

      if (left.distanceKm === null) {
        return 1;
      }

      if (right.distanceKm === null) {
        return -1;
      }

      return left.distanceKm - right.distanceKm || left.name.localeCompare(right.name);
    })
    .slice(0, limit);
}

async function geocodeArea(query) {
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
    countrycodes: INDIA_COUNTRY_CODE,
    q: query
  });
  const payload = await requestJson(`${NOMINATIM_BASE_URL}/search?${params.toString()}`);
  const match = Array.isArray(payload) ? payload[0] : null;

  if (!match) {
    return null;
  }

  const latitude = toNumber(match.lat);
  const longitude = toNumber(match.lon);
  const boundingBox = Array.isArray(match.boundingbox) ? match.boundingbox : [];
  const viewbox = buildViewboxFromBoundingBox(boundingBox);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    latitude,
    longitude,
    viewbox,
    label: match.display_name || query
  };
}

async function getNhpStateOptions() {
  const cacheKey = "storages:nhb:state-options";

  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const response = await requestResponse(NHB_MIS_URL);
      return {
        cookies: parseSetCookieHeaders(response.headers["set-cookie"]),
        viewState: extractHiddenField(response.body, "__VIEWSTATE"),
        viewStateGenerator: extractHiddenField(response.body, "__VIEWSTATEGENERATOR"),
        viewStateEncrypted: extractHiddenField(response.body, "__VIEWSTATEENCRYPTED"),
        states: parseNhbStateOptions(response.body)
      };
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

async function fetchNhbDistrictSummary(stateName) {
  const cacheKey = `storages:nhb:districts:${normalizeText(stateName)}`;

  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const nhbConfig = await getNhpStateOptions();
      const stateCode = resolveNhbStateCode(nhbConfig.states, stateName);

      if (!stateCode) {
        return [];
      }

      const formBody = new URLSearchParams({
        __VIEWSTATE: nhbConfig.viewState,
        __VIEWSTATEGENERATOR: nhbConfig.viewStateGenerator,
        __VIEWSTATEENCRYPTED: nhbConfig.viewStateEncrypted,
        drpState: stateCode,
        drpDateStatus: "All",
        DrpNHBAssisted: "All",
        btnSearch: "Search"
      }).toString();

      const response = await requestResponse(NHB_MIS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: nhbConfig.cookies,
          Referer: NHB_MIS_URL,
          Origin: "https://www.nhb.gov.in"
        },
        body: formBody
      });

      return parseNhbDistrictRows(response.body, stateName);
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

function buildNearbyCacheKey(latitude, longitude, limit) {
  return `storages:nearby:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${limit}`;
}

function buildAreaCacheKey(stateName, districtName, limit) {
  return `storages:area:${normalizeText(stateName)}:${normalizeText(districtName)}:${limit}`;
}

async function getNearbyStorages({ latitude, longitude, limit = 6 }) {
  const numericLimit = clamp(Number(limit) || 6, 1, STORAGE_RESULT_LIMIT);
  const cacheKey = buildNearbyCacheKey(latitude, longitude, numericLimit);

  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const radiusMeters = 25000;
      const items = await fetchNominatimStorages({
        query: "cold storage",
        latitude,
        longitude,
        radiusMeters,
        limit: numericLimit
      });

      return {
        query: {
          latitude,
          longitude,
          radiusMeters,
          mode: "nearby"
        },
        items,
        source: {
          facilities: "Nominatim / OpenStreetMap",
          geocoding: "Browser geolocation",
          note: "Price and availability are only shown when the public source publishes them."
        }
      };
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

async function getAreaStorages({ stateName, districtName, limit = 10 }) {
  const numericLimit = clamp(Number(limit) || 10, 1, STORAGE_RESULT_LIMIT);
  const cacheKey = buildAreaCacheKey(stateName, districtName, numericLimit);

  return getOrFetchGovernmentApiValue(
    cacheKey,
    async () => {
      const districtQueryLabel = [districtName, stateName, "India"].filter(Boolean).join(", ");
      const stateQueryLabel = [stateName, "India"].filter(Boolean).join(", ");
      let queryMeta = null;
      let items = [];
      let districtFallbackApplied = false;

      if (districtName) {
        const districtArea = await geocodeArea(districtQueryLabel);

        if (districtArea) {
          queryMeta = districtArea;
          items = await fetchNominatimStorages({
            query: "cold storage",
            viewbox: districtArea.viewbox || undefined,
            latitude: districtArea.latitude,
            longitude: districtArea.longitude,
            radiusMeters: districtArea.viewbox ? undefined : 25000,
            limit: numericLimit
          });
        }

        if (items.length === 0) {
          items = await fetchNominatimStorages({
            query: `cold storage in ${districtQueryLabel}`,
            limit: numericLimit
          });
        }

        items = filterStoragesByArea(items, {
          stateName,
          districtName
        });

        if (items.length === 0) {
          items = await fetchNominatimStorages({
            query: `cold storage ${districtQueryLabel}`,
            limit: numericLimit
          });

          items = filterStoragesByArea(items, {
            stateName,
            districtName
          });
        }

        if (items.length === 0) {
          const stateArea = await geocodeArea(stateQueryLabel);

          if (stateArea) {
            queryMeta = stateArea;
            items = await fetchNominatimStorages({
              query: "cold storage",
              viewbox: stateArea.viewbox || undefined,
              latitude: stateArea.latitude,
              longitude: stateArea.longitude,
              radiusMeters: stateArea.viewbox ? undefined : 45000,
              limit: numericLimit
            });
          }

          if (items.length === 0) {
            items = await fetchNominatimStorages({
              query: `cold storage in ${stateQueryLabel}`,
              limit: numericLimit
            });
          }

          items = filterStoragesByArea(items, {
            stateName
          });
          districtFallbackApplied = true;
        }
      } else {
        const stateArea = await geocodeArea(stateQueryLabel);

        if (stateArea) {
          queryMeta = stateArea;
          items = await fetchNominatimStorages({
            query: "cold storage",
            viewbox: stateArea.viewbox || undefined,
            latitude: stateArea.latitude,
            longitude: stateArea.longitude,
            radiusMeters: stateArea.viewbox ? undefined : 45000,
            limit: numericLimit
          });
        }

        if (items.length === 0) {
          items = await fetchNominatimStorages({
            query: `cold storage in ${stateQueryLabel}`,
            limit: numericLimit
          });
        }

        items = filterStoragesByArea(items, {
          stateName
        });
      }

      if (items.length === 0) {
        const nhbRows = await fetchNhbDistrictSummary(stateName);

        if (districtName) {
          const districtRows = nhbRows.filter((row) =>
            matchesAreaValue(row.districtName, districtName)
          );

          if (districtRows.length > 0) {
            items = districtRows.slice(0, numericLimit).map(buildNhbSummaryStorageItem);
          } else {
            items = nhbRows.slice(0, numericLimit).map(buildNhbSummaryStorageItem);
            districtFallbackApplied = nhbRows.length > 0;
          }
        } else {
          items = nhbRows.slice(0, numericLimit).map(buildNhbSummaryStorageItem);
        }
      }

      return {
        query: {
          stateName,
          districtName,
          label: queryMeta?.label || districtQueryLabel,
          latitude: queryMeta?.latitude ?? null,
          longitude: queryMeta?.longitude ?? null,
          mode: "area",
          districtFallbackApplied
        },
        items,
        source: {
          facilities:
            items[0]?.source === "National Horticulture Board"
              ? "National Horticulture Board"
              : "Nominatim / OpenStreetMap",
          geocoding:
            items[0]?.source === "National Horticulture Board" ? "NHB MIS" : "Nominatim",
          note:
            items[0]?.source === "National Horticulture Board"
              ? "Showing official NHB district cold storage registry counts for this state."
              : "Price and availability are only shown when the public source publishes them."
        }
      };
    },
    GOVERNMENT_API_CACHE_TTL_MS
  );
}

module.exports = {
  getNearbyStorages,
  getAreaStorages
};
