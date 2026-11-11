#!/usr/bin/env node

import dns from 'node:dns/promises';

const args = process.argv.slice(2);

if (args.includes('-h') || args.includes('--help')) {
  console.log(`
\x1b[1m\x1b[36mIP TRACKER // CLI Precision Geolocation\x1b[0m

\x1b[1mUSAGE:\x1b[0m
  iptrack                    Track your own public IP address
  iptrack <ip-or-domain>     Track a specific IPv4/IPv6 or domain name
  iptrack 8.8.8.8 --json     Output raw JSON
  iptrack --help             Show this help screen

\x1b[1mEXAMPLES:\x1b[0m
  iptrack 1.1.1.1
  iptrack 8.8.8.8
  iptrack github.com
`);
  process.exit(0);
}

const isJson = args.includes('--json');
const targetArg = args.find(a => !a.startsWith('-')) || '';

function getFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '';
  }
}

function getLocalTime(timezone) {
  if (!timezone) return 'Unknown';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'medium',
      hour12: true
    }).format(new Date());
  } catch {
    return 'N/A';
  }
}

async function resolveTarget(input) {
  if (!input) return '';
  const trimmed = input.trim();
  // Check if already an IP
  const isIpv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(trimmed);
  const isIpv6 = trimmed.includes(':');
  if (isIpv4 || isIpv6) {
    return trimmed;
  }
  // Try DNS lookup if it's a domain
  try {
    const res = await dns.lookup(trimmed);
    return res.address;
  } catch {
    return trimmed; // Let API attempt lookup
  }
}

async function fetchGeo(ip) {
  const startTime = Date.now();
  // Primary: ip-api.com
  try {
    const query = ip ? encodeURIComponent(ip) : '';
    const res = await fetch(`http://ip-api.com/json/${query}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
      headers: { 'User-Agent': 'iptrack-cli/1.0' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        data.latencyMs = Date.now() - startTime;
        return data;
      }
    }
  } catch {
    // fallback below
  }

  // Fallback: ipwhois.app
  try {
    const query = ip ? encodeURIComponent(ip) : '';
    const res = await fetch(`https://ipwhois.app/json/${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success !== false) {
        return {
          status: 'success',
          query: data.ip,
          country: data.country,
          countryCode: data.country_code,
          regionName: data.region,
          city: data.city,
          zip: data.postal || data.zip || 'N/A',
          lat: data.latitude,
          lon: data.longitude,
          timezone: data.timezone,
          isp: data.isp,
          org: data.org,
          as: data.asn,
          latencyMs: Date.now() - startTime
        };
      }
    }
  } catch {
    // fallback failed
  }

  throw new Error('Unable to retrieve geolocation for the requested IP address.');
}

async function run() {
  try {
    const resolvedIp = await resolveTarget(targetArg);
    const data = await fetchGeo(resolvedIp);

    if (isJson) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    const flag = getFlag(data.countryCode);
    const localTime = getLocalTime(data.timezone);
    const mapUrl = `https://www.google.com/maps?q=${data.lat},${data.lon}`;

    const dim = '\x1b[2m';
    const bold = '\x1b[1m';
    const reset = '\x1b[0m';
    const cyan = '\x1b[36m';
    const green = '\x1b[32m';
    const yellow = '\x1b[33m';
    const gray = '\x1b[90m';

    const boxWidth = 58;
    const line = '─'.repeat(boxWidth);

    console.log('');
    console.log(`${cyan}┌${line}┐${reset}`);
    console.log(`${cyan}│${reset}  ${bold}IP RADAR // TELEMETRY REPORT${reset}${' '.repeat(boxWidth - 32)}${cyan}│${reset}`);
    console.log(`${cyan}├${line}┤${reset}`);

    const formatRow = (label, val, valColor = '') => {
      const padLabel = label.padEnd(16, ' ');
      // Visual length compensation
      const cleanVal = String(val);
      const rowContent = `  ${gray}${padLabel}${reset} ${valColor}${cleanVal}${reset}`;
      const visibleLength = 2 + 16 + 1 + cleanVal.length;
      const padding = Math.max(0, boxWidth - visibleLength);
      return `${cyan}│${reset}${rowContent}${' '.repeat(padding)}${cyan}│${reset}`;
    };

    console.log(formatRow('Target IP', data.query, `${bold}${green}`));
    console.log(formatRow('Location', `${data.city || 'N/A'}, ${data.regionName || ''}, ${data.country || 'N/A'} ${flag}`.trim(), yellow));
    console.log(formatRow('Postal Code', data.zip || 'N/A'));
    console.log(formatRow('Coordinates', `${data.lat}, ${data.lon}`, cyan));
    console.log(formatRow('Timezone', `${data.timezone || 'N/A'} (${localTime})`));
    console.log(formatRow('ISP', data.isp || 'N/A'));
    console.log(formatRow('Organization', data.org || 'N/A'));
    console.log(formatRow('ASN', data.as || 'N/A', dim));
    console.log(formatRow('Query Latency', `${data.latencyMs} ms`, green));
    console.log(formatRow('Maps Link', mapUrl, `${dim}${cyan}`));

    console.log(`${cyan}└${line}┘${reset}`);
    console.log(`${gray}  Live Web UI: https://ip-tracker-murex-six.vercel.app/?ip=${data.query}${reset}`);
    console.log(`${gray}  Curl query:  curl https://ip-tracker-murex-six.vercel.app/${data.query}${reset}\n`);

  } catch (err) {
    if (isJson) {
      console.error(JSON.stringify({ error: err.message }));
    } else {
      console.error(`\n\x1b[31m[ERROR]\x1b[0m ${err.message}\n`);
    }
    process.exit(1);
  }
}

run();
