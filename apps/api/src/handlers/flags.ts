import { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import { categoryValues, RiskFlagSchema } from '@risk-scan/types';
import { getFlagsByTicker, getFlagsFiltered, getLatestFlags, } from '@risk-scan/etl';

const FlagsQuerySchema = z.object({
    tickers: z.string().optional(),
    category: z.enum(categoryValues).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    useCreatedAt: z.coerce.boolean().optional(),
});

export function registerFlagsHandlers(app: FastifyInstance) {
    app.get(
        '/flags',
        {
            schema: {
                querystring: FlagsQuerySchema,
                response: {200: {type: 'array', items: RiskFlagSchema}},
            },
        },
        async (req) => {
            const parsed = FlagsQuerySchema.parse(req.query);
            const tickers = parsed.tickers?.split(',');
            return getFlagsFiltered({...parsed, tickers});
        }
    );

    app.get(
        '/flags/latest',
        {
            config: {expiresIn: 60},
            schema: {
                response: {200: {type: 'array', items: RiskFlagSchema}},
            },
        },
        () => getLatestFlags()
    );

    app.get(
        '/flags/:ticker',
        {
            config: {expiresIn: 300},
            schema: {
                params: {ticker: {type: 'string'}},
                response: {200: {type: 'array', items: RiskFlagSchema}},
            },
        },
        (req) => getFlagsByTicker((req.params as any).ticker)
    );
}
