import {Bool, OpenAPIRoute, Str} from "chanfana";
import {z} from "zod";
import {type AppContext} from "../types";

export class CrunchyrollList extends OpenAPIRoute {
    schema = {
        tags: ['Crunchyroll'],
        summary: 'List Tasks',
        request: {
            params: z.object({
                id: Str({description: 'Crunchyroll ID'}),
            }),
        },
        responses: {
            '200': {
                description: 'Returns a list of tasks',
                content: {
                    'application/json': {
                        schema: z.object({
                            items: z.array(z.object({
                                lang: Str(),
                                urls: Str(),
                            })),
                        }),
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>();

        const {id} = data.params;

        if (id !== 'G9DUE19E9') {
            return {
                items: [],
            }
        }

        return {
            items: [
                {
                    lang: 'hu-HU',
                    url: `https://yum.example.com:8787/crunchy/${id}/hu-HU`,
                },
            ],
        };
    }
}
