export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const incoming = body.fields || {};

    // Only send fields that exist in your Airtable table — exact names must match
    const fields = {};
    const allowed = [
      'Submission Type',
      'Driver Name',
      'Vehicle',
      'Timestamp',
      'Odometer',
      'Fuel Level',
      'Front Condition',
      'Driver Side Condition',
      'Passenger Side Condition',
      'Rear Condition',
      'Windows & Mirrors',
      'Damage Notes',
      'Interior Checklist',
      'Safety / Equipment Checklist',
      'Tires',
      'Driver Signed',
    ];

    for (const key of allowed) {
      if (incoming[key] !== undefined) {
        fields[key] = incoming[key];
      }
    }

    console.log('Sending to Airtable:', JSON.stringify(fields, null, 2));

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Inspections`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await airtableRes.json();
    console.log('Airtable response:', JSON.stringify(data, null, 2));

    if (!airtableRes.ok) {
      return res.status(airtableRes.status).json({
        error: data.error?.message || 'Airtable error',
        type: data.error?.type,
        details: data,
      });
    }

    return res.status(200).json({ id: data.id, success: true });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
