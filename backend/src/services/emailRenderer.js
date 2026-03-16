'use strict';

function escape(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Returns { subject, html, plain } for an alert email.
 */
function renderAlertEmail({ keyword, content, author_name, neighborhood, posted_at, source_url, location_name }) {
  const subject = `[Nextdoor Alert] Keyword match: "${keyword}"`;

  const postedStr = posted_at
    ? new Date(posted_at).toUTCString().replace('GMT', 'UTC')
    : 'Unknown';
  const authorStr = author_name || 'Anonymous';
  const neighborhoodStr = neighborhood || 'Unknown neighborhood';
  const locationStr = location_name || 'Monitored location';
  const urlHtml = source_url ? `<a href="${source_url}">${source_url}</a>` : 'Not available';
  const urlPlain = source_url || 'Not available';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: #2d8653; color: white; padding: 16px 20px; border-radius: 6px 6px 0 0; }
  .header h1 { margin: 0; font-size: 18px; }
  .body { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 6px 6px; }
  .keyword { display: inline-block; background: #fff3cd; border: 1px solid #ffc107; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
  .post-content { background: #f8f9fa; border-left: 4px solid #2d8653; padding: 12px 16px; margin: 16px 0; font-style: italic; }
  .meta { font-size: 13px; color: #666; }
  .meta td { padding: 3px 8px 3px 0; vertical-align: top; }
  .meta td:first-child { font-weight: bold; white-space: nowrap; }
  .footer { margin-top: 24px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Nextdoor Keyword Alert</h1>
  </div>
  <div class="body">
    <p>A new post matching your keyword <span class="keyword">${escape(keyword)}</span> was found in <strong>${escape(locationStr)}</strong>.</p>

    <div class="post-content">${escape(content)}</div>

    <table class="meta">
      <tr><td>Author:</td><td>${escape(authorStr)}</td></tr>
      <tr><td>Neighborhood:</td><td>${escape(neighborhoodStr)}</td></tr>
      <tr><td>Posted:</td><td>${postedStr}</td></tr>
      <tr><td>Source:</td><td>${urlHtml}</td></tr>
    </table>

    <div class="footer">
      This alert was sent by your Nextdoor Monitor. To manage alerts, keywords, and recipients, visit your admin dashboard.
    </div>
  </div>
</body>
</html>`;

  const plain = `Nextdoor Keyword Alert
======================

Keyword matched: ${keyword}
Location: ${locationStr}

Post content:
${content}

Author:        ${authorStr}
Neighborhood:  ${neighborhoodStr}
Posted:        ${postedStr}
Source URL:    ${urlPlain}

---
Manage alerts at your Nextdoor Monitor dashboard.
`;

  return { subject, html, plain };
}

module.exports = { renderAlertEmail };
