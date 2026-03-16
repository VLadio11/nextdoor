'use strict';

const { v4: uuidv4 } = require('uuid');

const NEIGHBORHOODS = [
  'Maple Heights', 'Riverside Commons', 'Oak Park', 'Sunset Hills',
  'Elmwood', 'Pinecrest', 'Harbor View', 'Willow Creek',
];

const POST_TEMPLATES = [
  'Has anyone seen a {keyword} near {street}? Please let me know.',
  "Heads up neighbors — there's a {keyword} situation on {street}.",
  'Looking for recommendations for {keyword} services in the area.',
  'Anyone else notice the {keyword} on {street} this morning?',
  'Free {keyword} available — first come first served on {street}.',
  'Lost {keyword} last seen near {street}. Please contact me if found.',
  'Community meeting about {keyword} this Saturday at the park.',
  'Warning: {keyword} spotted near {street}. Stay alert.',
  'Does anyone have a {keyword}? Happy to pay. Located on {street}.',
  'Just a reminder about {keyword} rules in our neighborhood.',
];

const STREETS = ['Oak Ave', 'Maple St', 'Cedar Blvd', 'Elm Dr', 'Pine Rd', 'Birch Ln', 'Walnut Way', 'Spruce Ct'];

const NAMES = ['Sarah M.', 'James K.', 'Maria L.', 'David R.', 'Emily S.', 'Carlos T.', 'Nancy W.', 'Brian H.', 'Lisa P.', 'Kevin O.'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Weighted random: values[i] chosen with weights[i] probability. */
function weightedRandom(values, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < values.length; i++) {
    r -= weights[i];
    if (r <= 0) return values[i];
  }
  return values[values.length - 1];
}

function makePost(keyword) {
  const street = pick(STREETS);
  const template = pick(POST_TEMPLATES);
  const content = template.replace('{keyword}', keyword).replace('{street}', street);
  const minutesAgo = Math.floor(Math.random() * 60 * 24 * 7);
  const postedAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  const id = uuidv4();

  return {
    external_id: `sim_${id}`,
    source: 'nextdoor',
    content,
    author_name: pick(NAMES),
    posted_at: postedAt,
    neighborhood: pick(NEIGHBORHOODS),
    source_url: `https://nextdoor.com/p/${id}/`,
    raw_payload: { simulated: true, id },
  };
}

/**
 * Generates synthetic posts that realistically match keyword searches.
 */
async function generatePosts({ keywords }) {
  const posts = [];

  for (const keyword of keywords) {
    // 0–3 posts per keyword, weighted distribution (0: 40%, 1: 35%, 2: 15%, 3: 10%)
    const count = weightedRandom([0, 1, 2, 3], [40, 35, 15, 10]);
    for (let i = 0; i < count; i++) {
      posts.push(makePost(keyword));
    }
  }

  // 0–2 unrelated noise posts
  const noiseCount = Math.floor(Math.random() * 3);
  const noiseKeywords = ['garage sale', 'lost cat', 'free firewood'];
  for (let i = 0; i < noiseCount; i++) {
    posts.push(makePost(pick(noiseKeywords)));
  }

  return posts;
}

module.exports = { generatePosts };
