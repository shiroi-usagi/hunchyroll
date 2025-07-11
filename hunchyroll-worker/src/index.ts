import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from 'hono/cors'
import { CrunchyrollBundle } from "./endpoints/crunchyrollBundle";
import { CrunchyrollFetch } from "./endpoints/crunchyrollFetch";
import { CrunchyrollList } from "./endpoints/crunchyrollList";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

app.use(cors({
	origin: ['https://static.crunchyroll.com'],
}))

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: '/docs',
});

// Register OpenAPI endpoints
openapi.get('/crunchy/bundle.js', CrunchyrollBundle);
openapi.get('/crunchy/:id', CrunchyrollList);
openapi.get('/crunchy/:id/:lang', CrunchyrollFetch);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
