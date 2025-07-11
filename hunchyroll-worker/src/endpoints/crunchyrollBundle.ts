import {OpenAPIRoute} from "chanfana";
import {z} from "zod";
import {type AppContext} from "../types";
import {HTTPException} from 'hono/http-exception'

export class CrunchyrollBundle extends OpenAPIRoute {
	schema = {
		tags: ['Crunchyroll'],
		summary: 'Show JS bundle',
		responses: {
			'200': {
				description: 'Returns if the task was deleted successfully',
				content: {
					'text/plain': {
						schema: z.string(),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const resp = await fetch('https://static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js');
		if (!resp.ok) {
			// Invalid response code from Crunchyroll, we might be in big trouble (O.o)
			return Response.redirect('https://static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js')
		}

		let text = await resp.text()
			.then(v => (v.replaceAll(/new Worker\(([^)]*)\)/g, `(() => {const w = new Worker($1); window.hunchyrollWorker = w; return w})()`)))

		return c.text(text)
	}
}
