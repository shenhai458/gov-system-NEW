import app from "../server/app.js";

export default async function handler(req: any, res: any) {
  try {
    const proto = (req.headers["x-forwarded-proto"] || "https") as string;
    const host = (req.headers.host || "") as string;
    const url = `${proto}://${host}${req.url}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      const v = Array.isArray(value) ? value.join(", ") : String(value);
      headers.set(key, v);
    }

    let body: BodyInit | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      body = Buffer.concat(chunks);
    }

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    const response = await app.fetch(request);

    res.status(response.status);
    response.headers.forEach((v, k) => {
      res.setHeader(k, v);
    });
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  } catch (err) {
    console.error("[api/trpc] handler error:", err);
    res.status(500).setHeader("Content-Type", "application/json").end(
      JSON.stringify({ error: "Internal Server Error", message: String(err) })
    );
  }
}