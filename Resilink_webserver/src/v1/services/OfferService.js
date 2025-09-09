require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataResilink = winston.loggers.get('DeleteDataODEPLogger');

const Utils = require("./Utils.js");
const AssetTypes = require("./AssetTypeService.js");
const Asset = require("./AssetService.js");
const UserDB = require("../database/UserDB.js");
const PosumerDB = require("../database/ProsummerDB.js");
const OfferDB = require("../database/OfferDB.js");


//Retrieves all valid offers for sale or lease in ODEP for RESILINK
const getAllOfferForResilinkCustom = async (token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllOfferForResilinkCustom', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }
    
    const userProfil = await UserDB.getUserByToken(token.replace(/^Bearer\s+/i, ''));

    //Retrieves all data needed to confirm the offers validity
    const allAssetType = await AssetTypes.getAllAssetTypesResilink(token);
    const allAssetResilink = await Asset.getAllAssetResilink(token);
    const allOffer = await OfferDB.getAllOffers();

     //Checks that none of the functions are error returns by ODEP
     if (allAssetType[1] == 401 || allAssetResilink[1] == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllOfferForResilinkCustom', tokenUsed: token == null ? "Token not given" : token});
      return [allAssetType[1] == 401 ? allAssetType[0] : allAssetResilink[1] == 401 ? allAssetResilink[0] : {message: 'Unauthorize'}, 401];
    } else if(allAssetType[1] != 200 || allAssetResilink[1] != 200) {
      getDataLogger.error("error trying to fetch Offer or Asset or AssetType from ODEP", { from: 'getAllOfferForResilinkCustom', dataOffer: {assetType: allAssetType[0], asset: allAssetResilink[0]}, tokenUsed: token.replace(/^Bearer\s+/i, '')});
      return [allAssetType[1] != 200 ? allAssetType[0] : allAssetResilink[1] != 200 ? allAssetResilink[0] : {message: 'error retrievieng all offers'}, 404];
    };

    var allOfferResilink = [];
    //For each offer, checks if its validity date has not passed and if there is a quantity above 0 if it is an immaterial offer.
    for (const element of allOffer) {
      if (
        new Date(element['validityLimit']) > new Date() && 
        ( allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] !== null ?  
          (allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] == "immaterial" ? 
          (element['remainingQuantity'] !== null ? element['remainingQuantity'] > 0 : true) : true) : false
        ) 
      ) 
      {
        let idBlock = await PosumerDB.checkIdInBlockedOffers(element['offerId'].toString(), userProfil['userName'])
        if (!idBlock) {
          await UserDB.insertUserPhoneNumber(element['offerer'].toString(), element);
          allOfferResilink[element['offerId'].toString()] = element;
        }
      }
    }
    getDataLogger.info("successful data retrieval", { from: 'getAllOfferFilteredCustom', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    return [allOfferResilink, 200];
  } catch (e) {
    getDataLogger.error("error data retrieval", { from: 'getAllOfferFilteredCustom', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    throw(e)
  }
};

//Retrieves all valid suggested offers for sale or lease in ODEP for RESILINK
const getSuggestedOfferForResilinkCustom = async (owner, token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getSuggestedOfferForResilinkCustom', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    //Retrieves all data needed to confirm the offerœs validity
    const allAssetType = await AssetTypes.getAllAssetTypesResilink(token);
    const allAssetResilink = await Asset.getAllAssetResilink(token);
    const allOffer = await OfferDB.getAllOffers();

    //Checks that none of the functions are error returns by ODEP
    if (allAssetType[1] == 401 || allAssetResilink[1] == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getSuggestedOfferForResilinkCustom', tokenUsed: token == null ? "Token not given" : token});
      return [allAssetType[1] == 401 ? allAssetType[0] : allAssetResilink[1] == 401 ? allAssetResilink[0] : {message: 'Unauthorize'}, 401];
    } else if(allAssetType[1] != 200 || allAssetResilink[1] != 200) {
      getDataLogger.error("error trying to fetch Offer or Asset or AssetType", { from: 'getSuggestedOfferForResilinkCustom', dataOffer: {assetType: allAssetType[0], asset: allAssetResilink[0]}, tokenUsed: token.replace(/^Bearer\s+/i, '')});
      return [allAssetType[1] != 200 ? allAssetType[0] : allAssetResilink[1] != 200 ? allAssetResilink[0] : {message: 'error retrievieng all offers'}, 404];
    };

    const validOffers = [];
    const validMapAssets = {};
    //For each offer, checks if its validity date has not passed and if there is a quantity above 0 if it is an immaterial offer.
    for (const element of allOffer) {
      if (
        new Date(element['validityLimit']) > new Date() && 
        ( allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] !== null ?  
          (allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] == "immaterial" ? 
          (element['remainingQuantity'] !== null ? element['remainingQuantity'] > 0 : true) : true) : false
        ) && 
        element['offerer'].toString() !== owner
      ) 
      {
        let idBlock = await PosumerDB.checkIdInBlockedOffers(element['offerId'].toString(), owner)
        if (!idBlock) {
          await UserDB.insertUserPhoneNumber(element['offerer'].toString(), element);
          validOffers.push(element);
        }
      }
    }

    // Add the last 3 valid offers to allOfferResilink
    for (const offer of validOffers) {
      validMapAssets[offer['assetId'].toString()] = (allAssetResilink[0][offer['assetId'].toString()])
    }
    let allOfferResilink = {};
    allOfferResilink['offers'] = validOffers;
    allOfferResilink['assets'] = validMapAssets;

    getDataLogger.info("successful data retrieval", { from: 'getSuggestedOfferForResilinkCustom', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    return [allOfferResilink, 200];
  } catch (e) {
    getDataLogger.error("error data retrieval", { from: 'getSuggestedOfferForResilinkCustom', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    throw(e)
  }
};

//Retrieves limited number of valid offers for sale or lease in ODEP for RESILINK
const getLimitedOfferForResilinkCustom = async (offerNbr, iteration, token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getLimitedOfferForResilinkCustom', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    const userProfil = await UserDB.getUserByToken(token.replace(/^Bearer\s+/i, ''));

    //Retrieves all data needed to confirm the offers validity
    const allAssetType = await AssetTypes.getAllAssetTypesResilink(token);
    const allAssetResilink = await Asset.getAllAssetResilink(token);
    const allOffer = await OfferDB.getAllOffers();

    //Checks that none of the functions are error returns by ODEP
    if (allAssetType[1] == 401 || allAssetResilink[1] == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getLimitedOfferForResilinkCustom', tokenUsed: token == null ? "Token not given" : token});
      return [allAssetType[1] == 401 ? allAssetType[0] : allAssetResilink[1] == 401 ? allAssetResilink[0] : {message: 'Unauthorize'}, 401];
    } else if(allAssetType[1] != 200 || allAssetResilink[1] != 200) {
      getDataLogger.error("error trying to fetch Offer or Asset or AssetType", { from: 'getLimitedOfferForResilinkCustom', dataOffer: {assetType: allAssetType[0], asset: allAssetResilink[0]}, tokenUsed: token.replace(/^Bearer\s+/i, '')});
      return [allAssetType[1] != 200 ? allAssetType[0] : allAssetResilink[1] != 200 ? allAssetResilink[0] : {message: 'error retrievieng all offers'}, 404];
    };

    const validOffers = [];
    const validMapAssets = {};
    //For each offer, checks if its validity date has not passed and if there is a quantity above 0 if it is an immaterial offer.
    for (const key in allOffer) {
      const element = allOffer[key];
      if (
        new Date(element['validityLimit']) > new Date() && 
        ( allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] !== null ?  
          (allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] == "immaterial" ? 
          (element['remainingQuantity'] !== null ? element['remainingQuantity'] > 0 : true) : true) : false
        ) 
      ) 
      {
        let idBlock = await PosumerDB.checkIdInBlockedOffers(element['offerId'].toString(), userProfil['userName'])
        if (!idBlock) {
          await UserDB.insertUserPhoneNumber(element['offerer'].toString(), element);
          validOffers.push(element);
        }
      }
    }
    // Reverse the order of valid offers
    const reversedValidOffers = validOffers.reverse();

    // Calculation of start and end indices
    const startIndex = parseInt(iteration) * parseInt(offerNbr);
    const endIndex = startIndex + parseInt(offerNbr);

    // Offers selection based on iteration and number of offers
    const selectedOffers = reversedValidOffers.slice(startIndex, endIndex);

    // Add the assets of valid offers
    for (const offer of selectedOffers) {
      validMapAssets[offer['assetId'].toString()] = (allAssetResilink[0][offer['assetId'].toString()])
    }

    let allOfferResilink = {};
    allOfferResilink['offers'] = selectedOffers;
    allOfferResilink['assets'] = validMapAssets;

    getDataLogger.info("successful data retrieval", { from: 'getLimitedOfferForResilinkCustom', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    return [allOfferResilink, 200];
  } catch (e) {
    getDataLogger.error("error data retrieval", { from: 'getLimitedOfferForResilinkCustom', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    throw(e)
  }
};

//Retrieves all valid and suggested offers for sale or lease in ODEP for RESILINK
const getBlockedOfferForResilinkCustom = async (owner, token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getBlockedOfferForResilinkCustom', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    //Retrieves all data needed to confirm the offers validity
    const allAssetResilink = await Asset.getAllAssetResilink(token);
    const allOffer = await OfferDB.getAllOffers();
    let ListidBlock = await PosumerDB.getProsumerBlockedOffers(owner)
    
    const validOffers = [];
    const validMapAssets = {};
    //For each offer, checks if its validity date has not passed and if there is a quantity above 0 if it is an immaterial offer.
    for (const element of allOffer) {
      let found = false;
      let i = 0;
      while (i <= ListidBlock.length && !found) {
        if(element['offerId'] == ListidBlock[i]) {
          await UserDB.insertUserPhoneNumber(element['offerer'].toString(), element);
          validOffers.push(element);
          found = true;
        }
        i++
      }
    }

     // Add the number of valid offers to allOfferResilink
     for (const offer of validOffers) {
      validMapAssets[offer['assetId'].toString()] = (allAssetResilink[0][offer['assetId'].toString()])
    }
    let allOfferResilink = {};
    allOfferResilink['offers'] = validOffers;
    allOfferResilink['assets'] = validMapAssets;

    getDataLogger.info("successful data retrieval", { from: 'getBlockedOfferForResilinkCustom', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    return [allOfferResilink, 200];
  } catch (e) {
    getDataLogger.error("error data retrieval", { from: 'getBlockedOfferForResilinkCustom', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    throw e
  }
};

//Filters valid ODEP offers with filter parameters set
const getAllOfferFilteredCustom = async (filter, token) => {    
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllOfferFilteredCustom', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }
    
    //Retrieves all data required to check values.
    const offerResilink = await getAllOfferForResilinkCustom(token);
    const allOffer = offerResilink[0];
    if (offerResilink[1] == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllOfferFilteredCustom', dataReceived: allOffer, tokenUsed: token == null ? "Token not given" : token});
      return [allOffer, offerResilink[1]];
    }
    const assetResilink = await Asset.getAllAssetResilink(token);
    const allAsset = assetResilink[0];
    if (assetResilink[1] == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllOfferFilteredCustom', dataReceived: allAsset, tokenUsed: token == null ? "Token not given" : token});
      return [allAsset, assetResilink[1]];
    }

    //Checks for each offer whether it does not meet one of the conditions expressed in the filter map.
    const allOfferFiltered = [];
    var isCompatible = true;

    for (const key in allOffer) {
      isCompatible = true;
      //If filter is is not existant then all offers are pushed
      if (filter !== null) {
        //Checks if the filter has an “assetType” property and if so, checks if the offer's asset is identical 
        if(filter.hasOwnProperty("assetType")){
          if (typeof filter["assetType"] !== "string") {
            var i = 0;
            var notFound = true;
            
            while ( i <= filter["assetType"].length && notFound) {
              if (allOffer[key]["assetType"] == filter["assetType"][i]) {
                notFound = false;
              }
              i++;
            };
            if (notFound) {
              isCompatible = false;
              continue;
            };
          } else {
            if (allAsset[allOffer[key]["assetId"]]["assetType"].replaceAll(/\d+/g, '') != filter["assetType"]) {
              isCompatible = false;
              continue;
            }
          }
        };

        /*
         * Checks if the filter has a “properties” property
         * properties is a list of objects that are specifications of an assetType
         * Checks if the offer's assetType has the same specification
         */
        if(filter.hasOwnProperty("properties")){
          if(allAsset[allOffer[key]["assetId"]].hasOwnProperty("specificAttributes")) {
            if (Object.keys(filter["properties"]).length > 0 && 
                filter["properties"].every(
                  attr2 => allAsset[allOffer[key]["assetId"]]["specificAttributes"].some(attr1 => attr1.attributeName.toUpperCase() == attr2.attributeName.toUpperCase() && 
                  attr1.value.toUpperCase() == attr2.value.toUpperCase())
                ) == false) {
              isCompatible = false;
              continue;
            }
          } else {
            isCompatible = false;
            continue;
          }
        };

        /*
         * Checks if the Filter map has the key latitude and no key cityVillag 
         * If their is a key cityVillage, it takes priority over latitude
         * if the conditions are met, then it is associated with longitude and distance and 
         * Checks whether offers are within the perimeter given by the filter.
         */
        if(filter.hasOwnProperty("latitude") && !filter.hasOwnProperty("cityVillage")){
            if(allAsset[allOffer[key]["assetId"]]["specificAttributes"] !== undefined) {
              const gpsAttribute = allAsset[allOffer[key]["assetId"]]["specificAttributes"].find(attribute => attribute.attributeName === "GPS");
              if (gpsAttribute !== undefined) {
                const regex = /<(-?\d+\.\d+),(-?\d+\.\d+)>/;
                const match = gpsAttribute["value"].match(regex);
                if(match !== undefined && match !== null) {
                  var pointInCircle = Utils.isInPerimeter(filter["latitude"], filter["longitude"], parseFloat(match[1]), parseFloat(match[2]), filter["distance"]);
                  if(!pointInCircle) {
                    isCompatible = false;
                    continue;
                  }
                } else {
                  isCompatible = false;
                  continue;
                }
              } else {
                isCompatible = false;
                continue;
              }
            } else {
              isCompatible = false;
              continue;
            }
        }

        if (filter.hasOwnProperty("cityVillage")) {
          if (allAsset[allOffer[key]["assetId"]].hasOwnProperty("specificAttributes")) {
            if (allAsset[allOffer[key]["assetId"]]["specificAttributes"].some(
            attr1 => attr1.attributeName === "City/Village" && 
            attr1.value.toLowerCase().includes(filter["cityVillage"].toLowerCase()) === false)) {
              isCompatible = false;
              continue;
            } else {
            }
          } else {
            isCompatible = false;
            continue;
          }
        }

        //Checks if the filter has a “name” property, if so checks if its value is included in the asset name or description
        if(filter.hasOwnProperty("name")){
          if (!(allAsset[allOffer[key]["assetId"]]["name"].toLowerCase().includes(filter["name"].toLowerCase()) 
          || allAsset[allOffer[key]["assetId"]]["description"].toLowerCase().includes(filter["name"].toLowerCase()))) {
            isCompatible = false;
            continue;
          }
        };

        //Checks if the filter has a “minPrice” property, if so checks that its value is lower than the offer price
        if(filter.hasOwnProperty("minPrice")){
          if (allOffer[key]["price"] < filter["minPrice"]) {
            isCompatible = false;
            continue;
          }
        };

        //Checks if the filter has a “maxPrice” property, if so checks that its value is greater than the offer price
        if(filter.hasOwnProperty("maxPrice")){
          if (allOffer[key]["price"] > filter["maxPrice"]) {
            isCompatible = false;
            continue;
          }
        };

        //Checks if the filter has a “maxQuantity” property, if so checks that its value is greater than the quantity remaining in an offer.
        if(filter.hasOwnProperty("maxQuantity")){
          if (allOffer[key]["remainingQuantity"] < filter["maxQuantity"]) {
            isCompatible = false;
            continue;
          }
        }

        //Checks if the filter has a “minQuantity” property, if so checks that its value is less than the quantity remaining in an offer.
        if(filter.hasOwnProperty("minQuantity")){
          if (allOffer[key]["remainingQuantity"] < filter["minQuantity"]) {
            isCompatible = false;
            continue;
          }
        }
    
        //Check if the filter has a “minDate” property, if so check that its value is less than the offer start date.
        if(filter.hasOwnProperty("minDate")){
          if (allOffer[key]["validityLimit"] < filter["minDate"]) {
            isCompatible = false;
            continue;
          }
        };

        //Check if the filter has a “maxDate” property, if so check that its value is less than the offer end date.
        if(filter.hasOwnProperty("maxDate")){
          if (allOffer[key]["validityLimit"] > filter["maxDate"]) {
            isCompatible = false;
            continue;
          }
        };

        //Checks if the filter has a “transactionType” property, if so checks that its value is equal to the offer's transaction type
        if(filter.hasOwnProperty("transactionType")){
          if (allAsset[allOffer[key]["assetId"]]["transactionType"] != filter["transactionType"]) {
            isCompatible = false;
            continue;
          }
        };

        //If the offer values match what the filter requests, push the offer to the response list 
        if(isCompatible) {
          allOfferFiltered.push(allOffer[key]); 
        };
      } else {
        allOfferFiltered.push(allOffer[key]); 
      }
    };
    getDataLogger.info('success filtering data', { from: 'getAllOfferFilteredCustom', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    return [JSON.stringify(allOfferFiltered), 200];
  } catch (e) {
    getDataLogger.error("filter had a problem", { from: 'getAllOfferFilteredCustom', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    return[{error : e}, 500];
  }
};

const getOwnerOfferPurchase = async (Username, token) => {
  return [[], 200]
}

//Retrieves all offers from a user in ODEP.
const getAllOfferOwnerCustom = async (Username, token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllOfferOwnerCustom', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    const allAssetType = await AssetTypes.getAllAssetTypesResilink(token);
    const allAssetResilink = await Asset.getAllAssetResilink(token);
    const allOffer = await OfferDB.getAllOffers();

    var allOfferOwner = {};
    //Checks if the creator is the user in parameter
    for (const offer of allOffer) {
      if (offer["offerer"] === Username &&
        (allAssetType[0][allAssetResilink[0][offer['assetId'].toString()]['assetType']]['nature'] == "immaterial" ? 
              (offer['remainingQuantity'] !== null ? offer['remainingQuantity'] > 0 : true) : true)
      ) {
        allOfferOwner[offer["offerId"].toString()] = offer;
      }
    }
    getDataLogger.info('success retrieving owner offers', { from: 'getAllOfferOwnerCustom', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    return [allOfferOwner, 200];
  } catch (e) {
    getDataLogger.error("error retrieving owner offers", {from: 'getAllOfferOwnerCustom', dataReceiver: e.message});
    throw e;
  }
};

//Creates an offer in ODEP
const createOffer = async (body, token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'createOffer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    const assetExist = await Asset.getOneAsset(body['assetId'], token);
    if(assetExist[1] != 200) {
      updateDataODEP.error('error finding asset associated to offer', { from: 'createOffer', dataToSend: body, tokenUsed: token.replace(/^Bearer\s+/i, '')});
      return [{message: 'error finding asset' + body['assetId'] + 'associated to offer '}, 404]
    }

    updateDataODEP.warn('data to create a new offer', { from: 'createOffer', dataToSend: body, tokenUsed: token.replace(/^Bearer\s+/i, '')});
    const data = await OfferDB.newOffer(body);
    updateDataODEP.info("success creating an offer in RESILINK", {from: 'createOffer'});

    return [data, 200];   
  } catch (e) {
    updateDataODEP.error("error creating an offer in RESILINK", {from: 'createOffer', dataReceiver: e.message});
    throw e;
  }
};

//Creates an offer, his asset and asset type associated 
const createOfferAsset = async (body, token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'createOfferAsset', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    updateDataODEP.warn('data for creation', { from: 'createOfferAsset', dataToSend: body, tokenUsed: token.replace(/^Bearer\s+/i, '')});
    const newsAsset = await Asset.createAssetWithAssetTypeCustom(body['asset'], token);
    if (newsAsset[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'createOfferAsset', dataReceived: newsAsset[0], tokenUsed: token == null ? "Token not given" : token});
      return [newsAsset[0], newsAsset[1]];
    } else if(newsAsset[1] != 200) {
      updateDataODEP.error('error creating one assetType', { from: 'createOfferAsset', tokenUsed: token.replace(/^Bearer\s+/i, '')});
      return [newsAsset[0], newsAsset[1]];
    } else {
      //Associates the assetId just created with the map containing the offer data 
      body['offer']['assetId'] = newsAsset[0]['asset']['id']; 
      const newOffer = await createOffer(body['offer'], token);
      if (newOffer[1] == 401) {
        updateDataODEP.error('error: Unauthorize', { from: 'createOfferAsset', dataReceived: newOffer[0], tokenUsed: token == null ? "Token not given" : token});
        return [newOffer[0], newOffer[1]];
      } else if(newOffer[1] != 200) {
        updateDataODEP.error('error creating one assetType', { from: 'createOfferAsset', tokenUsed: token.replace(/^Bearer\s+/i, '')});
        return [newOffer[0], newOffer[1]];
      } else {
        return [{'asset': newsAsset[0], 'offer': newOffer[0]}, 200];
      }
    }
  } catch (e) {
    deleteDataResilink.error("error creating an offer/asset/assetType in RESILINK", {from: 'createOfferAsset', dataReceiver: e.message});
    throw e;
  }
  //Calls the function to create an asset and his asset type
  
};

//Retrieves all offer in ODEP
const getAllOffer = async (token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllOffer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    const data = await OfferDB.getAllOffers();
    deleteDataResilink.info("success retrieving all offers in RESILINK", {from: 'getAllOffer'});

    return [data, 200];   
  } catch (e) {
    deleteDataResilink.error("error retrieving all offers in RESILINK", {from: 'getAllOffer', dataReceiver: e.message});
    throw e;
  }
};

//Retrieves all offer in ODEP
const getAllOfferMapped = async (token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllOfferMapped', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    var allOfferOwner = {};

    const data = await OfferDB.getAllOffers();
    deleteDataResilink.info("success retrieving all offers in RESILINK", {from: 'getAllOfferMapped'});

    for (const key in data) {
      const offer = data[key];
      allOfferOwner[offer["offerId"].toString()] = offer;
    }

    return [allOfferOwner, 200];   
  } catch (e) {
    deleteDataResilink.error("error retrieving all offers in RESILINK", {from: 'getAllOfferMapped', dataReceiver: e.message});
    throw e;
  }
};

//Retrieves an offer by id in ODEP
const getOneOffer = async (id, token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getOneOffer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    const data = await OfferDB.getOneOffer(id);
    getDataLogger.info("success retrieving the offer in RESILINK", {from: 'getOneOffer'});

    return [data, 200];   
  } catch (e) {
    getDataLogger.error("error retrieving an offer in RESILINK", {from: 'getOneOffer', dataReceiver: e.message});
    throw e;
  }
};

//Updates the offer by id in ODEP
const putOffer = async (body, id, token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'putOffer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    const userProfil = await UserDB.getUserByToken(token.replace(/^Bearer\s+/i, ''));
    if (userProfil['userName'] != "admin" && userProfil['userName'] != body['offerer'] ) {
      updateDataODEP.error('error: not the owner or administrator', { from: 'putOffer', dataReceived: "Unauthorize", tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "not the owner or administrator"}, 401];
    }

    updateDataODEP.warn('new data', { from: 'putOffer', dataToSend: body, tokenUsed: token == null ? "Token not given" : token});
    const putAsset = await Asset.putAsset(body['asset'], body['offer']['assetId'], token);
    await OfferDB.updateOfferById(id, body['offer']);
    deleteDataResilink.info("success updating the offer in RESILINK", {from: 'putOffer'});

    return [{message: "success updating the offer"}, 200];   
  } catch (e) {
    deleteDataResilink.error("error updating an offer in RESILINK", {from: 'putOffer', dataReceiver: e.message});
    throw e;
  }
};

//Updates the offer and its asset by id in ODEP
const putOfferAsset = async (body, id, token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'putOfferAsset', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    const userProfil = await UserDB.getUserByToken(token.replace(/^Bearer\s+/i, ''));
    if (userProfil['userName'] != "admin" && userProfil['userName'] != body['offer']['offerer'] ) {
      updateDataODEP.error('error: not the owner or administrator', { from: 'putOfferAsset', dataReceived: "Unauthorize", tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "not the owner or administrator"}, 401];
    }

    updateDataODEP.warn('new data', { from: 'putOfferAsset', dataToSend: body, tokenUsed: token == null ? "Token not given" : token});
    const putAsset = await Asset.putAsset(body['asset'], body['offer']['assetId'], token);
    if (putAsset[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'putOfferAsset', dataReceived: newsAsset[0], tokenUsed: token == null ? "Token not given" : token});
      return [putAsset[0], putAsset[1]];
    } else if(putAsset[1] != 200) {
      updateDataODEP.error('error updating one asset', { from: 'putOfferAsset', tokenUsed: token.replace(/^Bearer\s+/i, '')});
      return [putAsset[0], putAsset[1]];
    } else {

      await OfferDB.updateOfferById(id, body['offer']);
      deleteDataResilink.info("success updating the offer in RESILINK", {from: 'putOfferAsset'});

      return [{message: "success updating the offer and the asset"}, 200];
    }    
  } catch (e) {
    deleteDataResilink.error("error updating an offer account in RESILINK", {from: 'putOfferAsset', dataReceiver: e.message});
    throw e;
  }
};

//Deletes an offer by id in ODEP
const deleteOffer = async (id, token) => {
  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'deleteOffer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    const offerToDelete = await getOneOffer(id, token);

    const userProfil = await UserDB.getUserByToken(token.replace(/^Bearer\s+/i, ''));
    if (userProfil['userName'] != "admin" && userProfil['userName'] != offerToDelete[0]['offerer'] ) {
      getDataLogger.error('error: not the owner or administrator', { from: 'deleteOffer', dataReceived: "Unauthorize", tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "not the owner or administrator"}, 401];
    }

    await OfferDB.deleteOfferById(id);
    deleteDataResilink.info("success deleting the offer in RESILINK", {from: 'deleteOffer'});

    return [{message: "success deleting the offer " + id }, 200];
  } catch (e) {
    deleteDataResilink.error("error deleting an offer account in RESILINK", {from: 'deleteOffer', dataReceiver: e.message});
    throw e;
  }
};

module.exports = {
    getAllOfferForResilinkCustom,
    getLimitedOfferForResilinkCustom,
    getSuggestedOfferForResilinkCustom,
    getBlockedOfferForResilinkCustom,
    getAllOfferFilteredCustom,
    getAllOfferOwnerCustom,
    getOwnerOfferPurchase,
    createOffer,
    createOfferAsset,
    getAllOffer,
    getOneOffer,
    putOffer,
    putOfferAsset,
    deleteOffer,
}