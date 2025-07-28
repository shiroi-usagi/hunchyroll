import {Bool, OpenAPIRoute, Str} from "chanfana";
import {z} from "zod";
import {type AppContext} from "../types";

export class CrunchyrollList extends OpenAPIRoute {
    schema = {
        tags: ['Crunchyroll'],
        summary: 'Lists subtitles for a given Crunchyroll video id.',
        request: {
            params: z.object({
                id: Str({description: 'Crunchyroll ID'}),
            }),
        },
        responses: {
            '200': {
                description: 'Returns a list of subtitles for the given Cruchyroll video id.',
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

        switch (id) {
            case 'GY0973WVY':
                return {
                    items: [
                        {
                            lang: 'hu-HU',
                            url: `https://files.hunchyroll.com/GY0973WVY-HU_hu.txt`,
                        },
                    ],
                };
            default:
                return {
                    items: [],
                }
        }
    }
}
