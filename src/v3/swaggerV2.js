const fs = require('fs');
const path = require('path');

// ---------------------------------------------------
// ---------------------------------------------------

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const {customSorter} = require("./services/Utils.js");
const config = require('./config.js');

// Path to the folder containing route files
const routesPath = path.join(__dirname, './routes');

// Exclude these files from the swagger page display
const excludedFiles = ['RequestRoute.js', 'RegulatorRoute.js', 'ContractRoute.js'];

// Dynamically generate the list of files to include
const apiFiles = fs.readdirSync(routesPath)
  .filter(file => !excludedFiles.includes(file))
  .map(file => path.join(routesPath, file));

// Basic Meta Informations about our API
let options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Resilink Mid-plateform",
        version: "3.0.0",
        description:
          "API to perform calculations or add information between the Orange API and the mobile application. [More documentation](https://resilink-dp.org/RESILINKMid-platformAPIDocumentation.pdf)",
        license: {
          name: "",
        },
        contact: {
          name: "Axel Cazaux, LIUPPA",
          email: "axel.cazaux@univ-pau.fr",
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          networkKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Resilink-Network-Key'
          }
        }
      },
      security: [{
        bearerAuth: []
      }]
    },
    apis: apiFiles
};

// ---------------------------------------------------

// Function to setup our docs
const swaggerDocs = (app, port) => {
    // Add servers to options
    options.definition.servers = [
        {
            url: config.SWAGGER_URL, 
        },
    ];

    // Docs in JSON format
    const swaggerSpec = swaggerJSDoc(options);  

    // Swagger UI options
    const swaggerUiOpts = {
      swaggerOptions: {
        filter: true, // Enables filtering/searching through API endpoints
        docExpansion: "list", // Expands the documentation into a list format by default
        defaultModelsExpandDepth: 2, // Controls the depth of models expansion
        defaultModelExpandDepth: 3, // Controls the depth of the default model expansion 
        operationsSorter: customSorter // Sort operations with custom sorting (by HTTP method, then alphabetically)
      },
      explorer: false // set to true if you need a search Bar in case of numerous method.
    };

    // Route-Handler to visit our docs
    // Add Swagger UI options
    app.use(
        "/v3/api-docs", 
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, swaggerUiOpts)
        );
      
    // Make our docs in JSON format available
    app.get(
        "/v3/api-docs.json",
        (req, res) => {
          res.setHeader("Content-Type", "application/json");
          res.send(swaggerSpec);
        }
        );
        console.log(swaggerSpec);
      
    console.log(`Docs are available on https://${config.SWAGGER_URL}/v3/api-docs [Version 3]`);
};  

// ---------------------------------------------------
// ---------------------------------------------------

module.exports = { swaggerDocs };

// ---------------------------------------------------
// ---------------------------------------------------
