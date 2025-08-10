import { nanoid } from 'nanoid'

interface Env {
  DB: D1Database
  R2: R2Bucket
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    const { pathname } = url

    if (req.method === 'POST' && pathname === '/start') {
      // Define an interface for the request body, e.g., at the top of the file or in a types file:
      // interface StartRequestBody { prompt?: string; skipConsultation?: boolean; /* any other fields */ }
      const body = await req.json<StartRequestBody>();
      const promptValue = body.prompt;
      const prompt = (typeof promptValue === 'string') ? promptValue : '';
      const id = nanoid()
      const slug = slugify(id)

      await env.DB.prepare(
        'INSERT INTO projects (id, prompt, status) VALUES (?1, ?2, "running")'
      ).bind(slug, prompt).run()

      return new Response(JSON.stringify({ id: slug }), {
        headers: { 'content-type': 'application/json' },
      })
    }

    const projectMatch = pathname.match(/^\/project\/([\w-]+)/)
    if (projectMatch) {
      const id = projectMatch[1]
      const project = await env.DB.prepare(
        'SELECT * FROM projects WHERE id=?1'
      ).bind(id).first()
      if (!project) return new Response('Not found', { status: 404 })
      return new Response(JSON.stringify(project), {
        headers: { 'content-type': 'application/json' },
      })
    }

    const reportMatch = pathname.match(/^\/report\/([\w-]+)/)
    if (reportMatch) {
      const id = reportMatch[1]
      const obj = await env.R2.get(`${id}.html`)
      if (!obj) return new Response('Not found', { status: 404 })
      return new Response(obj.body, { headers: { 'content-type': 'text/html' } })
    }

    return new Response('Not found', { status: 404 })
  },
}
