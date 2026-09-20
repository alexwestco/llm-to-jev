import { createReadStream, statSync } from "node:fs"
import { createServer } from "node:http"
import { extname, resolve, sep } from "node:path"

const root = process.cwd()
const port = Number(process.env.PORT || 3002)
const host = process.env.HOST || (process.env.DYNO ? "0.0.0.0" : "127.0.0.1")
const contentTypes = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml" }

createServer((request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1)
  const path = resolve(root, relativePath)

  if (path !== root && !path.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden")
    return
  }

  try {
    if (!statSync(path).isFile()) throw new Error("Not a file")
    response.writeHead(200, { "Content-Type": `${contentTypes[extname(path)] || "application/octet-stream"}; charset=utf-8` })
    createReadStream(path).pipe(response)
  } catch {
    response.writeHead(404).end("Not found")
  }
}).listen(port, host, () => console.log(`LLMtoJev running at http://${host}:${port}`))
