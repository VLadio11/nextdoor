'use strict';

/**
 * Returns the subset of keywords whose phrase appears (case-insensitive)
 * anywhere in content.
 */
function matchKeywords(content, keywords) {
  const lower = content.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()));
}

module.exports = { matchKeywords };
