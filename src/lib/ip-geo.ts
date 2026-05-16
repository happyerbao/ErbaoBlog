export interface GeoInfo {
  country: string;
  city: string;
}

const geoCache = new Map<string, GeoInfo | null>();

export async function lookupGeo(ip: string): Promise<GeoInfo | null> {
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return null; // local/private IP
  }

  const cached = geoCache.get(ip);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`);
    const data = await response.json();
    if (data.status === "fail") {
      geoCache.set(ip, null);
      return null;
    }
    const result: GeoInfo = { country: data.country, city: data.city };
    geoCache.set(ip, result);
    return result;
  } catch {
    geoCache.set(ip, null);
    return null;
  }
}
