import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

function safePath(urlPath) {
  const clean = urlPath === "/" ? "/index.html" : urlPath;
  const resolved = normalize(join(root, clean));
  if (!resolved.startsWith(normalize(root))) {
    throw new Error("Path escape blocked.");
  }
  return resolved;
}

createServer(async (req, res) => {
  try {
    const filePath = safePath(new URL(req.url, `http://${req.headers.host}`).pathname);
    const body = await readFile(filePath);
    const type = contentTypes[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`EVE-Lite server running at http://127.0.0.1:${port}`);
});
