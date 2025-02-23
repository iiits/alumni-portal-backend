import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: process.env.SWAGGER_TITLE || 'API Documentation',
            version: process.env.SWAGGER_VERSION || '1.0.0',
            description: process.env.SWAGGER_DESCRIPTION || 'API Documentation',
        },
        servers: [
            {
                url: process.env.SWAGGER_SERVER_URL,
                description: `${process.env.NODE_ENV} server`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: [
        path.join(__dirname, '../docs/schemas/responses.yaml'),
        path.join(__dirname, '../docs/paths/health.yaml'),
        path.join(__dirname, '../docs/schemas/*.yaml'),
        path.join(__dirname, '../docs/paths/*.yaml'),
    ],
};

export const specs = swaggerJsdoc(options);
