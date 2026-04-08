// In src/index.js 


require('dotenv').config({ path: './RESILINK_Server.env' });
require('./v3/loggers.js');

const cors = require('cors');
const path = require('path');
const config = require('./v3/config.js');
const express = require("express");
const rateLimit = require('express-rate-limit');

const { swaggerDocs: V3SwaggerDocs } = require("./v3/swaggerV3.js");
const { initDB } = require('./v3/database/InitDB.js');
const { updateGlobalRecommendationStats, startGlobalRecommendationStatsCron } = require('./v3/database/CronFunction.js');


// .env variable
const PORT = config.PORT;
const IP_ADDRESS = config.IP_ADDRESS;

// ---------------------------------------------------

// Start Express.js && socket.io
const app = express(); 

// Increase the payload size limit for JSON and URL-encoded data
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb', parameterLimit: 10000000 }));

// Add rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per IP
});

app.use('/v3/', limiter);

app.use(express.json());

// Start morgan.js (only for dev)
const morgan = require('morgan');
app.use(morgan('dev'));

// Add CORS middleware
app.use(cors());



// --------------------------------------------------

// all Routes
app.get('/confidentialite', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'Confidentiality.html'));
});

app.get('/specification', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'TECHNICAL_SPECIFICATION.html'));
});

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

const v3RecommendationStatsRoute = require("./v3/routes/RecommendationStatsRoute.js");
app.use("/v3/", v3RecommendationStatsRoute);

const v3RegisteredServersRoute = require("./v3/routes/RegisteredServersRoute.js");
app.use("/v3/", v3RegisteredServersRoute);

const v3FavoriteServersRoute = require("./v3/routes/FavoriteServersRoute.js");
app.use("/v3/", v3FavoriteServersRoute);

(async () => {
  try {
    await initDB();
    await updateGlobalRecommendationStats();
    startGlobalRecommendationStatsCron();

    app.listen(PORT, IP_ADDRESS, () => { 
      console.log(`API is listening on port ${PORT}`);
      V3SwaggerDocs(app, PORT); 
    });

  } catch (e) {
    console.error('Server startup aborted due to DB initialization failure');
    process.exit(1);
  }
})();