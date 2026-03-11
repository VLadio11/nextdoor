"""Keyword matching logic.

Performs case-insensitive whole-word substring matching against post content.
"""

import re


class KeywordMatcher:
    def match(self, content: str, keywords: list[str]) -> list[str]:
        """Return the subset of keywords found in content (case-insensitive)."""
        matched = []
        content_lower = content.lower()
        for keyword in keywords:
            pattern = re.escape(keyword.lower())
            if re.search(pattern, content_lower):
                matched.append(keyword)
        return matched
