// In src/index.js 

const cors = require('cors');
const path = require('path');
const config = require('./v1/config.js');

const express = require("express"); 

const { swaggerDocs: V1SwaggerDocs } = require("./v1/swaggerV1.js");

// .env variable
const PORT = config.PORT;

// ---------------------------------------------------

// Start Express.js && socket.io
const app = express(); 

//change request size limit for taking images
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb', parameterLimit: 10000000 }));

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

app.listen(PORT, '0.0.0.0', () => { 
    console.log(`API is listening on port ${PORT}`);
    V1SwaggerDocs(app, PORT); 
});
