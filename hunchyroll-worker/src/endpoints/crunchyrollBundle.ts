import {OpenAPIRoute} from "chanfana";
import {z} from "zod";
import {type AppContext} from "../types";

export class CrunchyrollBundle extends OpenAPIRoute {
    schema = {
        tags: ['Crunchyroll'],
        summary: 'Show JS bundle',
        responses: {
            '200': {
                description: 'Returns if the task was deleted successfully',
                content: {
                    'text/javascript': {
                        schema: z.string(),
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        const cache = caches.default
        let crunchyrollBundle = 'https://static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js';
        const cacheKey = crunchyrollBundle

        const data = await cache.match(cacheKey)

        const resp = await fetch(crunchyrollBundle);
        if (!resp.ok) {
            // Invalid response code from Crunchyroll, we might be in big trouble (O.o)
            return Response.redirect(crunchyrollBundle)
        }

        if (data && data.headers.get('Last-Modified') === resp.headers.get('Last-Modified')) {
            return data
        }

        let text = await resp.text()
            .then(v => (v.replaceAll(/new Worker\(([^)]*)\)/g, `(() => {const w = new Worker($1); window.hunchyrollWorker = w; return w})()`)))

        let respCache = new Response(text, {
            headers: {
                'Content-Type': 'text/javascript',
                'Last-Modified': resp.headers.get('Last-Modified'),
                'Cache-Control': resp.headers.get('Cache-Control') || 'max-age=60,must-revalidate',
            }
        });
        await cache.put(cacheKey, respCache.clone())
        return respCache
    }
}
