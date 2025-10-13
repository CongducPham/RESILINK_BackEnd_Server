require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const Utils = require("./Utils.js");
const AssetTypes = require("./AssetTypeService.js");
const Asset = require("./AssetService.js");
const Contract = require("./ContractService.js");
const UserDB = require("../database/UserDB.js");
const PosumerDB = require("../database/ProsummerDB.js");
const OfferDB = require("../database/OfferDB.js");

const pathODEPAsset = config.PATH_ODEP_ASSET;
const pathODEPContract = config.PATH_ODEP_CONTRACT;

//Retrieves all valid offers for sale or lease in ODEP for RESILINK
const getAllOfferForResilinkCustom = async (url, token) => {

  //Retrieves all data needed to confirm the offers validity
    const allAssetType = await AssetTypes.getAllAssetTypesResilink(token);
    const allAssetResilink = await Asset.getAllAssetResilink(token);
    const allOffer = await Utils.fetchJSONData(
        'GET',
        url + "all", 
        headers = {'accept': 'application/json',
        'Authorization': token});
    var allOfferResilink = {};
    const data = await Utils.streamToJSON(allOffer.body);

    //Checks that none of the functions are error returns by ODEP
    if (allOffer.status == 401 || allAssetType[1] == 401 || allAssetResilink[1] == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllOfferForResilinkCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [allAssetType[1] == 401 ? allAssetType[0] : allAssetResilink[1] == 401 ? allAssetResilink[0] : data, 401];
    } else if(allOffer.status != 200 || allAssetType[1] != 200 || allAssetResilink[1] != 200) {
      getDataLogger.error("error trying to fetch Offer or Asset or AssetType from ODEP", { from: 'getAllOfferFilteredCustom', dataOffer: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [allAssetType[1] != 200 ? allAssetType[0] : allAssetResilink[1] != 200 ? allAssetResilink[0] : data, allOffer.status];
    };

    await OfferDB.getAllOffer(data);

    //For each offer, checks if its validity date has not passed and if there is a quantity above 0 if it is an immaterial offer.
    for (const key in data) {
      const element = data[key];
      if (
        new Date(element['validityLimit']) > new Date() && allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['description'] == "RESILINK" &&
        ( allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] !== null ?  
          (allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] == "measurableByQuantity" ? 
          (element['remainingQuantity'] !== null ? element['remainingQuantity'] > 0 : true) : true) : false
        )
      ) 
      {
        await UserDB.insertUserPhoneNumber(element['offerer'].toString(), element);
        allOfferResilink[element['id'].toString()] = element;
      }
    }

    getDataLogger.info("successful data retrieval", { from: 'getAllOfferFilteredCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [allOfferResilink, allOffer.status];
};

/*Retrieves all valid and suggested offers for sale or lease in ODEP for RESILINK
 *Suggestions are only classic offers randomly selected from the valid ones.
 *A recommendation system is to be implemented instead.
 */
const getSuggestedOfferForResilinkCustom = async (url, owner, token) => {

  //Retrieves all data needed to confirm the offerœs validity
    const allAssetType = await AssetTypes.getAllAssetTypesResilink(token);
    const allAssetResilink = await Asset.getAllAssetResilink(token);
    const allOffer = await Utils.fetchJSONData(
        'GET',
        url + "all", 
        headers = {'accept': 'application/json',
        'Authorization': token});
    var allOfferResilink = {};
    const data = await Utils.streamToJSON(allOffer.body);

    //Checks that none of the functions are error returns by ODEP
    if (allOffer.status == 401 || allAssetType[1] == 401 || allAssetResilink[1] == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getSuggestedOfferForResilinkCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [allAssetType[1] == 401 ? allAssetType[0] : allAssetResilink[1] == 401 ? allAssetResilink[0] : data, 401];
    } else if(allOffer.status != 200 || allAssetType[1] != 200 || allAssetResilink[1] != 200) {
      getDataLogger.error("error trying to fetch Offer or Asset or AssetType from ODEP", { from: 'getSuggestedOfferForResilinkCustom', dataOffer: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [allAssetType[1] != 200 ? allAssetType[0] : allAssetResilink[1] != 200 ? allAssetResilink[0] : data, allOffer.status];
    };

    await OfferDB.getAllOffer(data);

    const validOffers = [];
    const validMapAssets = {};
    //For each offer, checks if its validity date has not passed and if there is a quantity above 0 if it is an immaterial offer.
    for (const key in data) {
      const element = data[key];
      if (
        new Date(element['validityLimit']) > new Date() && allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['description'] == "RESILINK" &&
        ( allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] !== null ?  
          (allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] == "immaterial" ? 
          (element['remainingQuantity'] !== null ? element['remainingQuantity'] > 0 : true) : true) : false
        ) && 
        element['offerer'].toString() !== owner
      ) 
      {
        let idBlock = await PosumerDB.checkIdInBlockedOffers(element['id'].toString(), owner)
        if (!idBlock) {
          await UserDB.insertUserPhoneNumber(element['offerer'].toString(), element);
          validOffers.push(element);
        }
      }
    }

    //Takes 3 random valid offers
    const shuffledOffers = validOffers.sort(() => 0.5 - Math.random());
    const selectedOffers = shuffledOffers.slice(0, 3);
    for (const offer of selectedOffers) {
      validMapAssets[offer['assetId'].toString()] = allAssetResilink[0][offer['assetId'].toString()];
    }
    allOfferResilink['offers'] = validOffers;
    allOfferResilink['assets'] = validMapAssets;

    getDataLogger.info("successful data retrieval", { from: 'getSuggestedOfferForResilinkCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [allOfferResilink, allOffer.status];
};

//Retrieves 3 last valid offers for sale or lease in ODEP for RESILINK
const getLimitedOfferForResilinkCustom = async (url, offerNbr, iteration, token) => {
  // Recovery of necessary data
  const allAssetType = await AssetTypes.getAllAssetTypesResilink(token);
  const allAssetResilink = await Asset.getAllAssetResilink(token);
  const allOffer = await Utils.fetchJSONData(
      'GET',
      url + "all",
      headers = { 'accept': 'application/json', 'Authorization': token }
  );
  
  var allOfferResilink = {};
  const data = await Utils.streamToJSON(allOffer.body);

  // error checking
  if (allOffer.status == 401 || allAssetType[1] == 401 || allAssetResilink[1] == 401) {
      getDataLogger.error('error: Unauthorized', {from: 'getLimitedOfferForResilinkCustom',username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [allAssetType[1] == 401 ? allAssetType[0] : allAssetResilink[1] == 401 ? allAssetResilink[0] : data, 401];
  } else if (allOffer.status != 200 || allAssetType[1] != 200 || allAssetResilink[1] != 200) {
      getDataLogger.error("Error fetching Offer or Asset or AssetType from ODEP", {from: 'getLimitedOfferForResilinkCustom',dataOffer: data,username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [allAssetType[1] != 200 ? allAssetType[0] : allAssetResilink[1] != 200 ? allAssetResilink[0] : data, allOffer.status];
  }

  await OfferDB.getAllOffer(data);

  const validOffers = [];
  const validMapAssets = {};

  // Filter valid offers
  for (const key in data) {
      const element = data[key];
      if (
          new Date(element['validityLimit']) > new Date() && allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['description'] == "RESILINK" &&
          (allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] !== null ?
              (allAssetType[0][allAssetResilink[0][element['assetId'].toString()]['assetType']]['nature'] == "measurableByQuantity" ?
                  (element['remainingQuantity'] !== null ? element['remainingQuantity'] > 0 : true) : true) : false
          )
      ) {
          await UserDB.insertUserPhoneNumber(element['offerer'].toString(), element);
          validOffers.push(element);
      }
  }

  //Retrieve last 3 offers created
  const reversedValidOffers = validOffers.reverse();
  const startIndex = parseInt(iteration) * parseInt(offerNbr);
  const endIndex = startIndex + parseInt(offerNbr);
  const selectedOffers = reversedValidOffers.slice(startIndex, endIndex);

  // Add the assets of valid offers
  for (const offer of selectedOffers) {
      validMapAssets[offer['assetId'].toString()] = allAssetResilink[0][offer['assetId'].toString()];
  }

  allOfferResilink['offers'] = selectedOffers;
  allOfferResilink['assets'] = validMapAssets;

  getDataLogger.info("Successful data retrieval", {from: 'getLimitedOfferForResilinkCustom',username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});

  return [allOfferResilink, allOffer.status];
};


//Retrieves all valid and suggested offers for sale or lease in ODEP for RESILINK
const getBlockedOfferForResilinkCustom = async (url, owner, token) => {

  //Retrieves all data needed to confirm the offers validity
    const allAssetType = await AssetTypes.getAllAssetTypesResilink(token);
    const allAssetResilink = await Asset.getAllAssetResilink(token);
    const allOffer = await Utils.fetchJSONData(
        'GET',
        url + "all", 
        headers = {'accept': 'application/json',
        'Authorization': token});
    var allOfferResilink = {};
    const data = await Utils.streamToJSON(allOffer.body);

    //Checks that none of the functions are error returns by ODEP
    if (allOffer.status == 401 || allAssetType[1] == 401 || allAssetResilink[1] == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getBlockedOfferForResilinkCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [allAssetType[1] == 401 ? allAssetType[0] : allAssetResilink[1] == 401 ? allAssetResilink[0] : data, 401];
    } else if(allOffer.status != 200 || allAssetType[1] != 200 || allAssetResilink[1] != 200) {
      getDataLogger.error("error trying to fetch Offer or Asset or AssetType from ODEP", { from: 'getBlockedOfferForResilinkCustom', dataOffer: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [allAssetType[1] != 200 ? allAssetType[0] : allAssetResilink[1] != 200 ? allAssetResilink[0] : data, allOffer.status];
    };

    let ListidBlock = await PosumerDB.getProsumerBlockedOffers(owner)
    
    const validOffers = [];
    const validMapAssets = {};
    //For each offer, checks if the offer's id is in the blocked offers list
    for (const key in data) {
      const element = data[key];
      let found = false;
      let i = 0;
      while (i <= ListidBlock.length && !found) {
        if(element['id'] == ListidBlock[i]) {
          await UserDB.insertUserPhoneNumber(element['offerer'].toString(), element);
          validOffers.push(element);
          found = true;
        }
        i++
      }
    }

     // Add the offers and assets in a map
     for (const offer of validOffers) {
      validMapAssets[offer['assetId'].toString()] = (allAssetResilink[0][offer['assetId'].toString()])
    }
    allOfferResilink['offers'] = validOffers;
    allOfferResilink['assets'] = validMapAssets;

    getDataLogger.info("successful data retrieval", { from: 'getBlockedOfferForResilinkCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [allOfferResilink, allOffer.status];
};

//Filters valid ODEP offers with filter parameters set
const getAllOfferFilteredCustom = async (url, filter, token) => {    
  try {
    //Retrieves all data required to check values.
    const offerResilink = await getAllOfferForResilinkCustom(url, token);
    const allOffer = offerResilink[0];
    if (offerResilink[1] == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllOfferFilteredCustom', dataReceived: allOffer, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [allOffer, offerResilink[1]];
    }
    const assetResilink = await Asset.getAllAssetResilink(token);
    const allAsset = assetResilink[0];
    if (assetResilink[1] == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllOfferFilteredCustom', dataReceived: allAsset, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
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

        //Checks if the filter has a country property, if so checks if its value is equal to the offer's country
        if(filter.hasOwnProperty("country") && filter["country"] != ""){
          if (allOffer[key]["country"].toLowerCase() != filter["country"].toLowerCase()) {
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
    getDataLogger.info('success filtering data', { from: 'getAllOfferFilteredCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [JSON.stringify(allOfferFiltered), 200];
  } catch (e) {
    getDataLogger.error("filter had a problem", { from: 'getAllOfferFilteredCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return[{error : e}, 500];
  }
};

const getOwnerOfferPurchase = async (url, token) => {
  var allOfferPurchase = [];
  var allAssetPurchase = [];

  const owner = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
  const allContractOwner = await Contract.getContractFromOwner(pathODEPContract, owner, token);
  if (allContractOwner[1] != 200) {
    getDataLogger.error('error: retrieving all owner\'s contracts', { from: 'getOwnerOfferPurchase', dataReceived: allContractOwner[0], username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [allContractOwner[0], allContractOwner[1]];
  }
  if (allContractOwner[0].length > 0 ) {
    const allOffer = await getAllOfferMapped(url, token);
    if (allOffer[1] != 200) {
      getDataLogger.error('error: retrieving all offers', { from: 'getOwnerOfferPurchase', dataReceived: allOffer[0], username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [allOffer[0], allOffer[1]];
    }
    const allAsset = await Asset.getAllAssetResilink(token);
    if (allAsset[1] != 200) {
      getDataLogger.error('error: retrieving all assets', { from: 'getOwnerOfferPurchase', dataReceived: allAsset[0], username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [allAsset[0], allAsset[1]];
    } 

    const allContractPurchased = allContractOwner[0].reduce((acc, contract) => {
      const nameValue = contract["state"];
      if (nameValue !== "cancelled" && /* contract cancelled before ending of the deal */
          nameValue !== 'endOfConsumption' && /* end states of an measurableByQuantity purchase contract */
          nameValue !== "assetReceivedByTheRequestor" && nameValue !== "assetNotReceivedByTheRequestor" && /* end states of an measurableByTime purchase contract */
          nameValue !== "assetNotReturnedToTheOfferer" && nameValue !== "assetReceivedByTheRequestor" && nameValue !== "assetReceivedByTheRequestor" &&/* end states of an measurableByTime rent contract */
          !acc.some(item => item.idContract === contract.idContract)) {
        acc.push(contract);
      }
      return acc;
    }, []);
    // Instead of a for... usage of Promise to make all affectation at the same time
    await Promise.all(allContractPurchased.map(async (data) => {
      await UserDB.insertUserPhoneNumber(
        allOffer[0][parseInt(data['offer'])]['offerer'].toString(),
        allOffer[0][parseInt(data['offer'])]
      );
      allOfferPurchase.push(allOffer[0][parseInt(data['offer'])]);
      allAssetPurchase.push(allAsset[0][data['asset']]);
    }));
    return [{'contracts': allContractPurchased, 'offers': allOfferPurchase, 'assets': allAssetPurchase}, 200];
  } else {
    return [{'contracts': [], 'offers': [], 'assets': []}, allContractOwner[1]];
  }
}

//Retrieves all offer in ODEP
const getAllOwnerOffer = async (url, token) => {
  const response = await Utils.fetchJSONData(
      'GET',
      url + "owner", 
      headers = {'accept': 'application/json',
      'Authorization': token}
  );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getAllOwnerOffer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving all offers', { from: 'getAllOwnerOffer' , data: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    getDataLogger.info('success retrieving all offers', { from: 'getAllOwnerOffer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    await OfferDB.getAllOffer(data);
  }
  return [data, response.status];
};

//Creates an offer in ODEP
const createOffer = async (url, body, token) => {

  if (body['transactionType'] == null || (body['transactionType'] != "sale/purchase" && body['transactionType'] != "rent")) {
      updateDataODEP.error('error transactionType does not match the correct values', { from: 'createOffer', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [{message: 'transactionType does not match the correct values'}, 400]
  }

  const transactionType = body['transactionType'];
  const country = body['country'];
  delete body['transactionType'];
  delete body['country'];

  updateDataODEP.warn('data to send to ODEP', { from: 'createOffer', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
      'POST',
      url, 
      headers = {'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token},
      body);
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    updateDataODEP.error('error: Unauthorize', { from: 'createOffer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    updateDataODEP.error('error creating an offer', { from: 'createOffer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    updateDataODEP.info('success creating an offer', { from: 'createOffer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    await OfferDB.newOffer(data['offerId'], transactionType, country);
  }
  return [data, response.status];
};

//Creates an offer and his asset
const createOfferAsset = async (url, body, token) => {
  //Calls the function to create an asset
  updateDataODEP.warn('data to send to ODEP', { from: 'createOfferAsset', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  const newsAsset = await Asset.createAssetCustom(pathODEPAsset, body['asset'], token);
  if (newsAsset[1] == 401) {
    updateDataODEP.error('error: Unauthorize', { from: 'createOfferAsset', dataReceived: newsAsset[0], username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [newsAsset[0], newsAsset[1]];
  } else if(newsAsset[1] != 200) {
    updateDataODEP.error('error creating one assetType', { from: 'createOfferAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [newsAsset[0], newsAsset[1]];
  } else {
    //Associates the assetId just created with the map containing the offer data 
    body['offer']['assetId'] = newsAsset[0]['assetId']; 
    const newOffer = await createOffer(url, body['offer'], token);
    if (newOffer[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'createOfferAsset', dataReceived: newOffer[0], username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [newOffer[0], newOffer[1]];
    } else if(newOffer[1] != 200) {
      updateDataODEP.error('error creating one assetType', { from: 'createOfferAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [newOffer[0], newOffer[1]];
    } else {
      return [{'asset': newsAsset[0], 'offer': newOffer[0]}, 200];
    }
  }
};

//Retrieves all offer in ODEP
const getAllOffer = async (url, token) => {
  const response = await Utils.fetchJSONData(
      'GET',
      url + "all", 
      headers = {'accept': 'application/json',
      'Authorization': token}
  );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getAllOffer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving all offers', { from: 'getAllOffer' , data: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    getDataLogger.info('success retrieving all offers', { from: 'getAllOffer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    await OfferDB.getAllOffer(data);
  }
  return [data, response.status];
};

//Retrieves all offer in ODEP
const getAllOfferMapped = async (url, token) => {
  var allOffer = {};

  const response = await Utils.fetchJSONData(
      'GET',
      url + "all", 
      headers = {'accept': 'application/json',
      'Authorization': token}
  );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getAllOfferMapped', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving all offers', { from: 'getAllOfferMapped' , data: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else {
    getDataLogger.info('success retrieving all offers', { from: 'getAllOfferMapped', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});

    await OfferDB.getAllOffer(data);
    for (const key in data) {
      const offer = data[key];
      allOffer[offer["id"].toString()] = offer;
    }
    
    return [allOffer, response.status];
  }

};

//Retrieves an offer by id in ODEP
const getOneOffer = async (url, id, token) => {
  const response = await Utils.fetchJSONData(
      'GET',
      url + id, 
      headers = {'accept': 'application/json',
      'Authorization': token}
  );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getOneOffer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving an offer', { from: 'getOneOffer' , data: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    getDataLogger.info('success retrieving an offer', { from: 'getOneOffer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    await OfferDB.getOffer(id, data);
  }
  return [data, response.status];
};

//Updates the offer by id in ODEP
const putOffer = async (url, body, id, token) => {
  
  if (body['transactionType'] == null || (body['transactionType'] != "sale/purchase" && body['transactionType'] != "rent")) {
      updateDataODEP.error('error transactionType does not match the correct values', { from: 'createOffer', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [{message: 'transactionType does not match the correct values'}, 400]
  }

  const transactionType = body['transactionType'];
  const country = body['country'];
  delete body['transactionType'];
  delete body['country'];

  updateDataODEP.warn('data to send to ODEP', { from: 'putOffer', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
      'PUT',
      url + id, 
      headers = {'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token},
      body
  );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    updateDataODEP.error('error: Unauthorize', { from: 'putOffer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    updateDataODEP.error('error updating an offer', { from: 'putOffer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    updateDataODEP.info('success updating an offer', { from: 'putOffer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    await OfferDB.updateOffer(id, transactionType, country);
  }
  return [data, response.status];
};

//Updates the offer and its asset by id in ODEP
const putOfferAsset = async (url, body, id, token) => {

  if (body['offer']['transactionType'] == null || (body['offer']['transactionType'] != "sale/purchase" && body['offer']['transactionType'] != "rent")) {
      updateDataODEP.error('error transactionType does not match the correct values', { from: 'putOfferAsset', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [{message: 'transactionType does not match the correct values'}, 400]
  }

  const putAsset = await Asset.putAssetCustom(pathODEPAsset, body['asset'], body['offer']['assetId'], token);
  if (putAsset[1] == 401) {
    updateDataODEP.error('error: Unauthorize', { from: 'putOfferAsset', dataReceived: newsAsset[0], username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [putAsset[0], putAsset[1]];
  } else if(putAsset[1] != 200) {
    updateDataODEP.error('error updating one asset', { from: 'putOfferAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [putAsset[0], putAsset[1]];
  } else {
    updateDataODEP.warn('data to send to ODEP', { from: 'putOfferAsset', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    
    const transactionType = body['offer']['transactionType'];
    const country = body['offer']['country'];
    delete body['offer']['transactionType'];
    delete body['offer']['country'];
  
    const response = await Utils.fetchJSONData(
      'PUT',
      url + id, 
      headers = {'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token},
      body['offer']
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'putOfferAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else if(response.status != 200) {
      updateDataODEP.error('error updating an offer', { from: 'putOfferAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else {
      updateDataODEP.info('success updating an offer', { from: 'putOfferAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      await OfferDB.updateOffer(id, transactionType, country);
    }
    return [data, response.status];
  }
};

//Deletes an offer by id in ODEP
const deleteOffer = async (url, id, token) => {
  deleteDataODEP.warn('id to used in ODEP', { from: 'deleteOffer', offerId: id, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
      'DELETE',
      url + id, 
      headers = {'accept': 'application/json',
      'Authorization': token}
  );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    deleteDataODEP.error('error: Unauthorize', { from: 'deleteOffer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    deleteDataODEP.error('error deleting an offer', { from: 'deleteOffer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    deleteDataODEP.info('success deleting an offer', { from: 'deleteOffer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    await OfferDB.deleteOffer(id);
  }
  return [data, response.status];
};

module.exports = {
    getAllOfferForResilinkCustom,
    getLimitedOfferForResilinkCustom,
    getSuggestedOfferForResilinkCustom,
    getBlockedOfferForResilinkCustom,
    getAllOfferFilteredCustom,
    getAllOwnerOffer,
    getOwnerOfferPurchase,
    createOffer,
    createOfferAsset,
    getAllOffer,
    getOneOffer,
    putOffer,
    putOfferAsset,
    deleteOffer,
}