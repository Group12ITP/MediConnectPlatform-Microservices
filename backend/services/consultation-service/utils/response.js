/**
 * Standard API Response Helpers
 * Ensures every response shape is consistent:
 * { ok, message, data? }
 *
 * Works with or without i18n middleware (res.__ is optional).
 * If res.__ is available, the key is translated; otherwise the raw key
 * string is used as the message — this keeps standalone microservices
 * working without having to configure i18n.
 */

const t = (res, key) =>
  typeof res.__ === "function" ? res.__(key) : key;

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {string} key    - i18n translation key OR plain message string
 * @param {*}      data   - payload to include (optional)
 * @param {number} code   - HTTP status code (default 200)
 */
exports.success = (res, key, data = null, code = 200) => {
  const payload = {
    ok:      true,
    message: t(res, key),
  };
  if (data !== null && data !== undefined) {
    payload.data = data;
  }
  return res.status(code).json(payload);
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} key    - i18n translation key OR plain message string
 * @param {number} code   - HTTP status code (default 400)
 * @param {*}      extra  - optional extra fields merged into response
 */
exports.error = (res, key, code = 400, extra = {}) => {
  const payload = {
    ok:      false,
    message: t(res, key),
    ...extra,
  };
  return res.status(code).json(payload);
};
