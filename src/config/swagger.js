
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');

const userYamlPath = path.join(__dirname, '../docs/user.yaml');
const leaveYamlPath = path.join(__dirname, '../docs/leave.yaml');

const userSpec = yaml.load(fs.readFileSync(userYamlPath, 'utf8'));
const leaveSpec = yaml.load(fs.readFileSync(leaveYamlPath, 'utf8'));


const mergedSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Leave Management API',
    version: '1.0.0',
    description: 'API documentation for Leave Management System',
  },
  servers: [
    {
      url: 'http://localhost:5000',
    },
  ],
  paths: {
    ...userSpec.paths,
    ...leaveSpec.paths,
  },
  components: {
    ...(userSpec.components || {}),
    ...(leaveSpec.components || {}),
  },
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(mergedSpec));
};

module.exports = setupSwagger;
