import swaggerJsDoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Baggags Competition API',
      version: '1.0.0',
      description: 'API for managing users with authentication and role-based access control',
      contact: {
        name: 'API Support',
        email: 'support@baggs.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
        ? 'https://baggs5.onrender.com/'
        : 'http://localhost:9091/',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
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
    security: [{
      bearerAuth: []
    }]
  },
  //apis: [path.join(__dirname, '../routes/*.ts')], // Updated to look for TypeScript files
   apis: ['src/routes/**/*.ts']
};

const swaggerSpec = swaggerJsDoc(options);

export default swaggerSpec; 
