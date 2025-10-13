// ---------------------------------------------------
// ---------------------------------------------------

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const {customSorter} = require("./services/Utils.js");
const config = require('./config.js');

// Basic Meta Informations about our API
let options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Resilink Mid-plateform",
        version: "1.0.0",
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
          }
        }
      },
      security: [{
        bearerAuth: []
      }]
    },
    apis: ["./src/v1/routes/*.js"]
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
        "/v1/api-docs", 
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, swaggerUiOpts)
        );
      
    // Make our docs in JSON format available
    app.get(
        "/v1/api-docs.json",
        (req, res) => {
          res.setHeader("Content-Type", "application/json");
          res.send(swaggerSpec);
        }
        );
        console.log(swaggerSpec);
      
    console.log(`Docs are available on https://resilink-api.onrender.com/v1/api-docs [Version 1]`);
};  

// ---------------------------------------------------
// ---------------------------------------------------

module.exports = { swaggerDocs };

// ---------------------------------------------------
// ---------------------------------------------------
