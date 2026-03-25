const fs = require("fs");
const path = require("path");

const GOVERNMENT_API_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const CACHE_DIRECTORY = path.join(__dirname, ".cache");
const CACHE_FILE_PATH = path.join(CACHE_DIRECTORY, "govt-api-cache.json");

const memoryCache = new Map();
const inflightRequests = new Map();

let cacheLoaded = false;
let diskWriteScheduled = false;

function ensureCacheLoaded() {
  if (cacheLoaded) {
    return;
  }

  cacheLoaded = true;

  try {
    const raw = fs.readFileSync(CACHE_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return;
    }

    Object.entries(parsed).forEach(([key, entry]) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        typeof entry.createdAt !== "number" ||
        !Object.prototype.hasOwnProperty.call(entry, "value")
      ) {
        return;
      }

      memoryCache.set(key, {
        createdAt: entry.createdAt,
        value: entry.value
      });
    });
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Unable to read government API cache from disk.", error);
    }
  }
}

function scheduleDiskWrite() {
  if (diskWriteScheduled) {
    return;
  }

  diskWriteScheduled = true;

  setTimeout(() => {
    diskWriteScheduled = false;
    persistCacheToDisk();
  }, 0);
}

function persistCacheToDisk() {
  try {
    fs.mkdirSync(CACHE_DIRECTORY, { recursive: true });
    const payload = Object.fromEntries(memoryCache.entries());
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(payload, null, 2));
  } catch (error) {
    console.warn("Unable to persist government API cache to disk.", error);
  }
}

function deleteCacheEntry(cacheKey) {
  ensureCacheLoaded();

  if (memoryCache.delete(cacheKey)) {
    scheduleDiskWrite();
  }
}

function getGovernmentApiCacheEntry(cacheKey, maxAgeMs = GOVERNMENT_API_CACHE_TTL_MS) {
  ensureCacheLoaded();

  const entry = memoryCache.get(cacheKey);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.createdAt > maxAgeMs) {
    deleteCacheEntry(cacheKey);
    return null;
  }

  return entry;
}

function getGovernmentApiCachedValue(cacheKey, maxAgeMs = GOVERNMENT_API_CACHE_TTL_MS) {
  const entry = getGovernmentApiCacheEntry(cacheKey, maxAgeMs);
  return entry ? entry.value : null;
}

function setGovernmentApiCachedValue(cacheKey, value) {
  ensureCacheLoaded();

  memoryCache.set(cacheKey, {
    createdAt: Date.now(),
    value
  });
  scheduleDiskWrite();
  return value;
}

async function getOrFetchGovernmentApiValue(cacheKey, fetchValue, maxAgeMs = GOVERNMENT_API_CACHE_TTL_MS) {
  const cachedEntry = getGovernmentApiCacheEntry(cacheKey, maxAgeMs);

  if (cachedEntry) {
    return cachedEntry.value;
  }

  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const request = Promise.resolve()
    .then(fetchValue)
    .then((value) => setGovernmentApiCachedValue(cacheKey, value))
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, request);
  return request;
}

module.exports = {
  GOVERNMENT_API_CACHE_TTL_MS,
  getGovernmentApiCacheEntry,
  getGovernmentApiCachedValue,
  setGovernmentApiCachedValue,
  getOrFetchGovernmentApiValue
};
