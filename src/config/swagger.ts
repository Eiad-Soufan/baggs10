import swaggerJsDoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Management API',
      version: '1.0.0',
      description: 'API for managing users with authentication and role-based access control',
    },
    servers: [
      {
        url: 'http://localhost:9091',
        description: 'Development server',
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
  apis: [path.join(__dirname, '../routes/*.ts')], // Updated to look for TypeScript files
};

const swaggerSpec = swaggerJsDoc(options);

export default swaggerSpec; 