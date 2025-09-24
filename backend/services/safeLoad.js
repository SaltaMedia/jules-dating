function safeRequire(path, fallback = null) {
  try {
    // CommonJS require is fine here; adjust if using ESM
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(path);
  } catch (e) {
    console.warn(`WARN: Failed to load ${path}. Using fallback.`, e.message);
    return fallback;
  }
}

module.exports = { safeRequire };
