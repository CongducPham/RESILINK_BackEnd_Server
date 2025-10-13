// In src/index.js 
const path = require("path");

const bodyParser = require("body-parser");
const cors = require('cors');
require('dotenv').config({ path: './RESILINK_Server.env' });

const config = require('./v1/config.js');

const express = require("express"); 

const { swaggerDocs: V1SwaggerDocs } = require("./v1/swaggerV1.js");

// .env variable
const PORT = config.PORT;
const IP_ADDRESS = config.IP_ADDRESS;

// ---------------------------------------------------

// Start Express.js && socket.io
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
const v1ProsummerRouter = require("./v1/routes/ProsummerRoute.js");
app.use("/v1/", v1ProsummerRouter);

const v1UserRouter = require("./v1/routes/UserRoute.js");
app.use("/v1/", v1UserRouter);

const v1OfferRouter = require("./v1/routes/OfferRoute.js");
app.use("/v1/", v1OfferRouter);

const v1AssetRouter = require("./v1/routes/AssetRoute.js");
app.use("/v1/", v1AssetRouter);

const v1AssetTypeRouter = require("./v1/routes/AssetTypeRoute.js");
app.use("/v1/", v1AssetTypeRouter);

const v1RegulatorRouter = require("./v1/routes/RegulatorRoute.js");
app.use("/v1/", v1RegulatorRouter);

const v1RequestRouter = require("./v1/routes/RequestRoute.js");
app.use("/v1/", v1RequestRouter);

const v1ContractRoute = require("./v1/routes/ContractRoute.js");
app.use("/v1/", v1ContractRoute);       

const v1NewsRoute = require("./v1/routes/NewsRoute.js");
app.use("/v1/", v1NewsRoute);

const v1RatingRoute = require("./v1/routes/RatingRoute.js");
app.use("/v1/", v1RatingRoute);

//start application Express.js
app.listen(PORT, IP_ADDRESS, () => { 
    console.log(`API is listening on port ${PORT} and using ip ${IP_ADDRESS}`);
    V1SwaggerDocs(app, PORT); 
});
