"""HTML and plain-text email template renderer for alert notifications."""

from datetime import datetime


def render_alert_email(
    keyword: str,
    content: str,
    author_name: str | None,
    neighborhood: str | None,
    posted_at: datetime | None,
    source_url: str | None,
    location_name: str | None,
) -> tuple[str, str]:
    """Return (subject, html_body, plain_body) for an alert email."""
    subject = f"[Nextdoor Alert] Keyword match: \"{keyword}\""

    posted_str = posted_at.strftime("%b %d, %Y %H:%M UTC") if posted_at else "Unknown"
    author_str = author_name or "Anonymous"
    neighborhood_str = neighborhood or "Unknown neighborhood"
    location_str = location_name or "Monitored location"
    url_html = f'<a href="{source_url}">{source_url}</a>' if source_url else "Not available"
    url_plain = source_url or "Not available"

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
  .header {{ background: #2d8653; color: white; padding: 16px 20px; border-radius: 6px 6px 0 0; }}
  .header h1 {{ margin: 0; font-size: 18px; }}
  .body {{ border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 6px 6px; }}
  .keyword {{ display: inline-block; background: #fff3cd; border: 1px solid #ffc107; padding: 2px 8px; border-radius: 4px; font-weight: bold; }}
  .post-content {{ background: #f8f9fa; border-left: 4px solid #2d8653; padding: 12px 16px; margin: 16px 0; font-style: italic; }}
  .meta {{ font-size: 13px; color: #666; }}
  .meta td {{ padding: 3px 8px 3px 0; vertical-align: top; }}
  .meta td:first-child {{ font-weight: bold; white-space: nowrap; }}
  .footer {{ margin-top: 24px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }}
</style>
</head>
<body>
  <div class="header">
    <h1>Nextdoor Keyword Alert</h1>
  </div>
  <div class="body">
    <p>A new post matching your keyword <span class="keyword">{keyword}</span> was found in <strong>{location_str}</strong>.</p>

    <div class="post-content">{_escape(content)}</div>

    <table class="meta">
      <tr><td>Author:</td><td>{_escape(author_str)}</td></tr>
      <tr><td>Neighborhood:</td><td>{_escape(neighborhood_str)}</td></tr>
      <tr><td>Posted:</td><td>{posted_str}</td></tr>
      <tr><td>Source:</td><td>{url_html}</td></tr>
    </table>

    <div class="footer">
      This alert was sent by your Nextdoor Monitor. To manage alerts, keywords, and recipients, visit your admin dashboard.
    </div>
  </div>
</body>
</html>"""

    plain = f"""Nextdoor Keyword Alert
======================

Keyword matched: {keyword}
Location: {location_str}

Post content:
{content}

Author:        {author_str}
Neighborhood:  {neighborhood_str}
Posted:        {posted_str}
Source URL:    {url_plain}

---
Manage alerts at your Nextdoor Monitor dashboard.
"""

    return subject, html, plain


def _escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
