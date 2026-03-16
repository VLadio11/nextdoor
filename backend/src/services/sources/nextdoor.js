'use strict';

const axios = require('axios');
const { settings } = require('../../config');
const { logger } = require('../../logger');
const { generatePosts } = require('./simulator');

let _token = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiry - 60_000) return _token;

  const resp = await axios.post(
    'https://auth.nextdoor.com/v2/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: settings.nextdoorApiKey,
      client_secret: settings.nextdoorApiSecret,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  _token = resp.data.access_token;
  _tokenExpiry = Date.now() + (resp.data.expires_in || 3600) * 1000;
  return _token;
}

/**
 * Fetches posts from the Nextdoor API (or simulator if SIM_MODE=true).
 */
async function fetchPosts({ latitude, longitude, radius_km, keywords }) {
  if (settings.simMode) {
    logger.info('fetch_posts_simulated', { lat: latitude, lng: longitude });
    return generatePosts({ keywords });
  }

  const token = await getToken();
  const msPerReq = Math.ceil(60_000 / settings.nextdoorRequestsPerMinute);
  const posts = [];

  for (const keyword of keywords) {
    try {
      const resp = await axios.get('https://api.nextdoor.com/v2/search/posts', {
        headers: { Authorization: `Bearer ${token}` },
        params: { query: keyword, latitude, longitude, radius_km },
      });

      for (const item of resp.data.posts || []) {
        posts.push({
          external_id: String(item.id),
          source: 'nextdoor',
          content: item.body || '',
          author_name: item.author?.name || null,
          posted_at: item.created_at || null,
          neighborhood: item.neighborhood?.name || null,
          source_url: item.url || null,
          raw_payload: item,
        });
      }
    } catch (err) {
      logger.warning('nextdoor_api_error', { keyword, error: err.message });
    }

    await new Promise((r) => setTimeout(r, msPerReq));
  }

  return posts;
}

module.exports = { fetchPosts };
