import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Code Awakens API',
      version: '1.0.0',
      description: `

## วิธี Authentication

| วิธี | Header | ใช้ตอนไหน |
|------|--------|-----------|
| **Bearer JWT** | \`Authorization: Bearer <token>\` | Production / Clerk Login |
| **Dev User** | \`x-dev-user-id: <any_string>\` | Development bypass (user) |
| **Dev Admin** | \`x-dev-admin-id: <any_string>\` | Development bypass (admin) |

> กด **Authorize** ด้านบนแล้วกรอกค่าที่ต้องการ จากนั้นกด **Try it out** ได้เลย!
      `,
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Local Development Server',
      },
    ],
    tags: [
      { name: 'Profile', description: 'User profile and progression management' },
      { name: 'Tests', description: 'Examination management (Pre-test / Post-test)' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Level Categories', description: 'Level groups and island regions' },
      { name: 'Levels', description: 'Individual level configuration and fetching' },
      { name: 'Guides', description: 'Tutorial and gameplay manual system' },
      { name: 'Patterns', description: 'Map logic patterns and bullet-hell formations' },
      { name: 'Blocks', description: 'Playable code block definitions' },
      { name: 'Victory Conditions', description: 'Win state evaluation criteria' },
      { name: 'Test Cases', description: 'Algorithm validation criteria' },
      { name: 'Weapons', description: 'Robot weapon components configuration' },
      { name: 'Rewards', description: 'Unlockable rewards management' },
      { name: 'Admin Users', description: 'Administrator user management and moderation' },
      { name: 'Dashboard', description: 'Admin dashboard statistics and metrics' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide your Clerk JWT Token here for production mode.'
        },
        devUserAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-dev-user-id',
          description: 'Bypass header for development mode (simulate normal user). Example: "test_dev_user"'
        },
        devAdminAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-dev-admin-id',
          description: 'Bypass header for development mode (simulate admin user). Example: "test_dev_admin"'
        }
      }
    },
    security: [
      { bearerAuth: [] },
      { devUserAuth: [] },
      { devAdminAuth: [] }
    ]
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerUiOptions = {
  customSiteTitle: 'Code Awakens | API Documentation',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    operationsSorter: 'method',
    persistAuthorization: true,
    displayRequestDuration: true,
  }
};

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  console.log('[SWAGGER] API Documentation available at http://localhost:4000/api-docs');
};
