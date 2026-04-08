// In src/index.js 
const path = require("path");

const bodyParser = require("body-parser");
const cors = require('cors');
require('dotenv').config({ path: './RESILINK_Server.env' });

const config = require('./v3/config.js');

const express = require("express"); 

const { swaggerDocs: V3SwaggerDocs } = require("./v3/swaggerV3.js");
const { initDB } = require('./v3/database/InitDB.js');

// .env variable
const PORT = config.PORT;
const IP_ADDRESS = config.IP_ADDRESS;

// ---------------------------------------------------

// Start Express.js
const app = express(); 

//change request size limit for taking images
app.use(bodyParser.json({limit: '4mb'}));
app.use(bodyParser.urlencoded({ limit: '4mb', extended: true , parameterLimit: 10000000}));

app.use(express.json());

// Start morgan.js (only for dev)
const morgan = require('morgan');
app.use(morgan('dev'));

// Add CORS middleware
app.use(cors());

app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// --------------------------------------------------

// all Routes
const v3ProsummerRouter = require("./v3/routes/ProsummerRoute.js");
app.use("/v3/", v3ProsummerRouter);

const v3UserRouter = require("./v3/routes/UserRoute.js");
app.use("/v3/", v3UserRouter);

const v3OfferRouter = require("./v3/routes/OfferRoute.js");
app.use("/v3/", v3OfferRouter);

const v3AssetRouter = require("./v3/routes/AssetRoute.js");
app.use("/v3/", v3AssetRouter);

const v3AssetTypeRouter = require("./v3/routes/AssetTypeRoute.js");
app.use("/v3/", v3AssetTypeRouter);

const v3RegulatorRouter = require("./v3/routes/RegulatorRoute.js");
app.use("/v3/", v3RegulatorRouter);

const v3RequestRouter = require("./v3/routes/RequestRoute.js");
app.use("/v3/", v3RequestRouter);

const v3ContractRoute = require("./v3/routes/ContractRoute.js");
app.use("/v3/", v3ContractRoute);       

const v3NewsRoute = require("./v3/routes/NewsRoute.js");
app.use("/v3/", v3NewsRoute);

const v3RatingRoute = require("./v3/routes/RatingRoute.js");
app.use("/v3/", v3RatingRoute);

//start application Express.js

(async () => {
  try {
    await initDB();

    app.listen(PORT, IP_ADDRESS, () => { 
        console.log(`API is listening on port ${PORT} and using ip ${IP_ADDRESS}`);
        V3SwaggerDocs(app, PORT);
    });

  } catch (e) {
    console.error('Server startup aborted due to DB initialization failure');
    process.exit(1);
  }
})();