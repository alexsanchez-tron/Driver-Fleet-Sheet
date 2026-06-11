exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const body = JSON.parse(event.body);
    const incoming = body.fields || {};

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
      'Photos',
    ];

    const fields = {};
    for (const key of allowed) {
      if (incoming[key] !== undefined) fields[key] = incoming[key];
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
      return {
        statusCode: airtableRes.status,
        headers,
        body: JSON.stringify({ error: data.error?.message || 'Airtable error', type: data.error?.type }),
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ id: data.id, success: true }) };
  } catch (err) {
    console.error('Submit error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
