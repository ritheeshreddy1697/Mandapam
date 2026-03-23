const fs = require("fs");
const path = require("path");

let loaded = false;

function normalizeValue(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadEnv() {
  if (loaded) {
    return;
  }

  const envPath = path.join(__dirname, "..", ".env");

  if (!fs.existsSync(envPath)) {
    loaded = true;
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");

  content.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1);

    if (!process.env[key]) {
      process.env[key] = normalizeValue(value);
    }
  });

  loaded = true;
}

module.exports = {
  loadEnv
};
