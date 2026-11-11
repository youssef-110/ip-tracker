export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let targetIp = url.searchParams.get('ip') || '';

  // Extract from path if routed like /8.8.8.8
  const pathPart = url.pathname.replace(/^\/api\/lookup/, '').replace(/^\//, '').trim();
  if (!targetIp && pathPart && pathPart !== 'api' && pathPart !== 'lookup' && pathPart !== 'favicon.ico') {
    targetIp = pathPart;
  }

  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const acceptHeader = (req.headers['accept'] || '').toLowerCase();
  const format = url.searchParams.get('format') || '';

  const isCurlOrCli =
    userAgent.includes('curl') ||
    userAgent.includes('wget') ||
    userAgent.includes('httpie') ||
    userAgent.includes('powershell') ||
    acceptHeader.includes('text/plain') ||
    format === 'text';

  // If a browser visits /8.8.8.8 directly, redirect to /?ip=8.8.8.8 so they see the full web app
  if (!isCurlOrCli && acceptHeader.includes('text/html') && targetIp && !url.searchParams.has('raw')) {
    return res.redirect(302, `/?ip=${encodeURIComponent(targetIp)}`);
  }

  // If no target IP provided, extract visitor IP from headers
  if (!targetIp) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      targetIp = forwarded.split(',')[0].trim();
    } else if (req.headers['x-real-ip']) {
      targetIp = req.headers['x-real-ip'].trim();
    }
  }

  const isJson =
    format === 'json' ||
    (!isCurlOrCli && acceptHeader.includes('application/json'));

  const startTime = Date.now();
  let data = null;

  try {
    const query = targetIp ? encodeURIComponent(targetIp) : '';
    const response = await fetch(
      `http://ip-api.com/json/${query}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
      { headers: { 'User-Agent': 'iptrack-web/1.0' } }
    );

    if (response.ok) {
      const json = await response.json();
      if (json.status === 'success') {
        data = {
          ...json,
          latencyMs: Date.now() - startTime
        };
      }
    }
  } catch (e) {
    // fallback
  }

  // Fallback if primary fails
  if (!data) {
    try {
      const query = targetIp ? encodeURIComponent(targetIp) : '';
      const response = await fetch(`https://ipwhois.app/json/${query}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success !== false) {
          data = {
            status: 'success',
            query: json.ip,
            country: json.country,
            countryCode: json.country_code,
            regionName: json.region,
            city: json.city,
            zip: json.postal || json.zip || 'N/A',
            lat: json.latitude,
            lon: json.longitude,
            timezone: json.timezone,
            isp: json.isp,
            org: json.org,
            as: json.asn,
            latencyMs: Date.now() - startTime
          };
        }
      }
    } catch (e) {
      // both failed
    }
  }

  if (!data) {
    if (isCurlOrCli) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(404).send(`Error: Unable to locate IP address [${targetIp || 'current'}]\n`);
    }
    return res.status(404).json({ error: 'IP lookup failed' });
  }

  // Terminal Output for curl / CLI
  if (isCurlOrCli && !url.searchParams.get('json')) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    let flag = '';
    if (data.countryCode && data.countryCode.length === 2) {
      flag = String.fromCodePoint(...data.countryCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
    }

    let localTime = 'N/A';
    if (data.timezone) {
      try {
        localTime = new Intl.DateTimeFormat('en-US', {
          timeZone: data.timezone,
          dateStyle: 'medium',
          timeStyle: 'medium',
          hour12: true
        }).format(new Date());
      } catch {}
    }

    const host = req.headers.host || 'iptrack.vercel.app';
    const textOutput = `
┌──────────────────────────────────────────────────────────┐
│  IP RADAR // TELEMETRY REPORT                          │
├──────────────────────────────────────────────────────────┤
│  Target IP        ${(data.query || '').padEnd(39)}│
│  Location         ${(`${data.city || 'N/A'}, ${data.regionName || ''}, ${data.country || 'N/A'} ${flag}`).padEnd(39)}│
│  Postal Code      ${(data.zip || 'N/A').padEnd(39)}│
│  Coordinates      ${(`${data.lat}, ${data.lon}`).padEnd(39)}│
│  Timezone         ${(`${data.timezone || 'N/A'} (${localTime})`).padEnd(39)}│
│  ISP              ${(data.isp || 'N/A').padEnd(39)}│
│  Organization     ${(data.org || 'N/A').padEnd(39)}│
│  ASN              ${(data.as || 'N/A').padEnd(39)}│
│  Query Latency    ${(`${data.latencyMs} ms`).padEnd(39)}│
│  Maps Link        https://www.google.com/maps?q=${data.lat},${data.lon}
└──────────────────────────────────────────────────────────┘
  Web UI: https://${host}/?ip=${data.query}
  Query another: curl https://${host}/1.1.1.1
`;
    return res.status(200).send(textOutput);
  }

  // JSON Output
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(data);
}
