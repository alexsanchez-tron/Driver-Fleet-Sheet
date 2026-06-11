exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { getStore } = require('@netlify/blobs');
    const body = JSON.parse(event.body);
    const { filename, contentType, data } = body;

    const buffer = Buffer.from(data, 'base64');
    const key = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const store = getStore('fleet-photos');
    await store.set(key, buffer, { metadata: { contentType } });

    // Netlify Blobs public URL format
    const siteUrl = (process.env.URL || '').replace(/\/$/, '');
    const publicUrl = `${siteUrl}/.netlify/blobs/fleet-photos/${key}?api_key=public`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: publicUrl, key }),
    };
  } catch (err) {
    console.error('Upload error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
