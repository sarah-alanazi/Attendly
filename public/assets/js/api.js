export async function apiFetch(url, { method="GET", data=null, headers={} } = {}) {
    const opts = { method, headers: { ...headers } };
  
    if (data && method !== "GET") {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(data);
    }
  
    const res = await fetch(url, opts);
  
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  
    if (!res.ok) {
      const msg = (json && (json.error || json.message)) || `Request failed (${res.status})`;
      throw new Error(msg);
    }
  
    return json;
  }
  