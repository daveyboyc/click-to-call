const E164_REGEX = /^\+[1-9]\d{6,14}$/;

function isValidE164(value) {
  return typeof value === 'string' && E164_REGEX.test(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

module.exports = {
  E164_REGEX,
  isValidE164,
  isNonEmptyString,
};
