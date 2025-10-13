const express = require("express");
const offerController = require("../controllers/OfferController.js");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Offer
 */

/****************************************************************************************************************
 * 
 * The offer and his filter are defined below for detailed documentation
 * 
 ****************************************************************************************************************/

/**
 * @swagger
 * components:
 *   schemas:
 *     OfferData:
 *       type: object
 *       required:
 *         - offerer
 *         - assetId
 *         - beginTimeSlot
 *         - endTimeSlot
 *         - validityLimit
 *         - price
 *         - cancellationFee
 *       properties:
 *         id:
 *           type: integer
 *           description: ID of the offer
 *         offerer:
 *           type: string
 *           description: The offerer id
 *         assetId:
 *           type: integer
 *           description: ID of the asset
 *         transactionType:
 *           type: string
 *           enum:
 *             - rent
 *             - sale/purchase
 *           description: Defines the type of transaction ("rent" or "sale/purchase")
 *         beginTimeSlot:
 *           type: string
 *           format: date-time
 *           description: Start date/time of the offer
 *         endTimeSlot:
 *           type: string
 *           format: date-time
 *           description: |
 *             Required in case of:
 *               - immaterial asset
 *               - material asset with rent transaction, represents the restitution date
 *         validityLimit:
 *           type: string
 *           format: date-time
 *           description: The expiration date of the offer
 *         publicationDate:
 *           type: string
 *           format: date-time
 *           description: The date/time when the offer was published
 *         offeredQuantity:
 *           type: number
 *           format: float
 *           description: Required in case of immaterial asset
 *         remainingQuantity:
 *           type: number
 *           format: float
 *           description: Required in case of immaterial asset. The remaining quantity of the asset available in the offer
 *         price:
 *           type: number
 *           format: float
 *           description: |
 *             In case of immaterial asset, it is expressed in Account Units per measuring unit.
 *             In case of immaterial and not measurable asset or for rent of material asset, it is expressed in Account Units per hour.
 *         deposit:
 *           type: number
 *           format: float
 *           description: Deposit for the offer, ranges between 0 and 100% of the asset price
 *         phoneNumber:
 *           type: string
 *           description: Offer owner phone number (data provided by GET method only)
 *         cancellationFee:
 *           type: number
 *           format: float
 *           description: Fee to be paid in case of offer cancellation
 *         paymentMethod:
 *           type: string
 *           enum:
 *             - total
 *             - periodic
 *           description: "Type of payment"
 *         paymentFrequency:
 *           type: number
 *           description: "Payment frequency for periodic payments"
 *         country:
 *           type: string
 *           description: The country where the offer comes from
 *         rentInformation:
 *           type: object
 *           description: Required information in case of rent
 *           properties:
 *             delayMargin:
 *               type: number
 *               format: float
 *               description: A percentage of the rental period
 *             lateRestitutionPenality:
 *               type: number
 *               format: float
 *               description: A percentage of the asset price
 *             deteriorationPenality:
 *               type: number
 *               format: float
 *               description: A percentage of the asset price
 *             nonRestitutionPenality:
 *               type: number
 *               format: float
 *               description: A percentage of the asset price
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Filter:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: "The name or description of the offer being filtered"
 *         assetType:
 *           type: string
 *           description: "The assetType of the offer being filtered"
 *         transactionType:
 *           type: string
 *           enum:
 *             - sale/purchase
 *             - rent
 *           description: "The type of transaction"
 *         latitude:
 *           type: string
 *           description: "Geographical point representing latitude of the search location"
 *         longitude:
 *           type: string
 *           description: "Geographical point representing longitude of the search location; mandatory if latitude is provided"
 *         distance:
 *           type: integer
 *           description: "Maximum distance between the geographical point given by latitude and longitude and the user. If the user is farther than the specified distance, the offer is not considered"
 *         minPrice:
 *           type: number
 *           description: "The minimum price  of the offer being filtered"
 *         maxPrice:
 *           type: number
 *           description: "The maximum price  of the offer being filtered"
 *         minQuantity:
 *           type: number
 *           description: "The minimum quantity  of the offer being filtered"
 *         maxQuantity:
 *           type: number
 *           description: "The maximum quantity  of the offer being filtered"
 *         minDate:
 *           type: string
 *           format: date-time
 *           description: "The earliest date/time of the offer being filtered (format: YYYY-MM-DDTHH:MM:SS.sssZ)"
 *         maxDate:
 *           type: string
 *           format: date-time
 *           description: "The latest date/time  of the offer being filtered (format: YYYY-MM-DDTHH:MM:SS.sssZ)"
 *         properties:
 *           type: array
 *           description: "A list of additional properties for filtering, where each entry contains an attribute name and its corresponding value"
 *           items:
 *             type: object
 *             properties:
 *               attributeName:
 *                 type: string
 *                 description: "The name of the specific attribute"
 *               value:
 *                 type: string
 *                 description: "The value corresponding to the attribute name"
 */

/**
 * @swagger
 * /v1/offers:
 *   post: 
 *     summary: create a new offer
 *     tags: [Offer]
 *     requestBody:
 *       description: offer's data.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assetId:
 *                 type: integer
 *               beginTimeSlot: 
 *                 type: string
 *                 format: date-time
 *               endTimeSlot: 
 *                 type: string
 *                 format: date-time
 *               validityLimit: 
 *                 type: string
 *                 format: date-time
 *               offeredQuantity:
 *                 type: number
 *               price:
 *                 type: number
 *               deposit:
 *                 type: number
 *               cancellationFee:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum:
 *                   - total
 *                   - periodic
 *               paymentFrequency:
 *                 type: number
 *               transactionType:
 *                 type: string
 *               country:
 *                 type: string
 *               rentInformation:
 *                 type: object
 *                 properties:
 *                   delayMargin:
 *                     type: number
 *                   lateRestitutionPenalty:
 *                     type: number
 *                   deteriorationPenalty:
 *                     type: number
 *                   nonRestitutionPenalty:
 *                     type: number
 *     responses:
 *       200:
 *         description: Offer successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                      id:
 *                          type: number
 *                      message:
 *                          type: string
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.post('/offers/', offerController.createOffer);

/**
 * @swagger
 * /v1/offers/all/Mapped:
 *   get:
 *     summary: Get mapped valid offers in RESILINK perspective
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   offerer:
 *                     type: string
 *                   assetId:
 *                     type: integer
 *                   beginTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   endTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   validityLimit: 
 *                     type: string
 *                     format: date-time
 *                   publicationDate: 
 *                     type: string
 *                     format: date-time
 *                   offeredQuantity:
 *                     type: number
 *                   remainingQuantity:
 *                     type: number
 *                   price:
 *                     type: number
 *                   deposit:
 *                     type: number
 *                   cancellationFee:
 *                     type: number
 *                   paymentMethod:
 *                     type: string
 *                     enum:
 *                       - total
 *                       - periodic
 *                   paymentFrequency:
 *                     type: number
 *                   transactionType:
 *                     type: string
 *                   country:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   rentInformation:
 *                     type: object
 *                     properties:
 *                       delayMargin:
 *                         type: number
 *                       lateRestitutionPenalty:
 *                         type: number
 *                       deteriorationPenalty:
 *                         type: number
 *                       nonRestitutionPenalty:
 *                         type: number
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.get('/offers/all/Mapped', offerController.getAllOfferResilinkCustom);

/**
 * @swagger
 * /v1/offers/suggested/{id}:
 *   get:
 *     summary: Get valid and suggested offers for a user 
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true 
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   offerer:
 *                     type: string
 *                   assetId:
 *                     type: integer
 *                   beginTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   endTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   validityLimit: 
 *                     type: string
 *                     format: date-time
 *                   publicationDate: 
 *                     type: string
 *                     format: date-time
 *                   offeredQuantity:
 *                     type: number
 *                   remainingQuantity:
 *                     type: number
 *                   price:
 *                     type: number
 *                   deposit:
 *                     type: number
 *                   cancellationFee:
 *                     type: number
 *                   paymentMethod:
 *                     type: string
 *                     enum:
 *                       - total
 *                       - periodic
 *                   paymentFrequency:
 *                     type: number
 *                   transactionType:
 *                     type: string
 *                   country:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   rentInformation:
 *                     type: object
 *                     properties:
 *                       delayMargin:
 *                         type: number
 *                       lateRestitutionPenalty:
 *                         type: number
 *                       deteriorationPenalty:
 *                         type: number
 *                       nonRestitutionPenalty:
 *                         type: number
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.get('/offers/suggested/:id', offerController.getSuggestedOfferForResilinkCustom);

/**
 * @swagger
 * /v1/offers/LimitedOffer:
 *   get:
 *     summary: Get multiple valid offers (per definable range) with their assets in the RESILINK perspective
 *     parameters:  
 *       - in: query
 *         name: offerNbr
 *         schema:
 *           type: number 
 *         required: true 
 *         description: number of offers
 *       - in: query
 *         name: iteration
 *         schema:
 *           type: number 
 *         required: true
 *         description: iteration of the list of offers to be retrieved from all available offers
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 offers:
 *                   type: array
 *                   description: List of offers
 *                   items:
 *                     type: object
 *                     properties:
 *                       offerer:
 *                         type: string
 *                         description: Offerer ID
 *                       assetId:
 *                         type: integer
 *                         description: Asset ID
 *                       beginTimeSlot: 
 *                         type: string
 *                         format: date-time
 *                         description: Offer start time
 *                       endTimeSlot: 
 *                         type: string
 *                         format: date-time
 *                         description: Offer end time
 *                       validityLimit: 
 *                         type: string
 *                         format: date-time
 *                         description: Offer expiration date
 *                       publicationDate: 
 *                         type: string
 *                         format: date-time
 *                         description: Date of publication
 *                       offeredQuantity:
 *                         type: number
 *                         description: Quantity offered
 *                       remainingQuantity:
 *                         type: number
 *                         format: float
 *                         description: Quantity remaining
 *                       price:
 *                         type: number
 *                         description: Offer price
 *                       deposit:
 *                         type: number
 *                         description: Offer deposit
 *                       cancellationFee:
 *                         type: number
 *                         description: Fee for cancellation
 *                       paymentMethod:
 *                         type: string
 *                         enum:
 *                           - total
 *                           - periodic
 *                       paymentFrequency:
 *                         type: number
 *                       transactionType:
 *                         type: string
 *                       country:
 *                         type: string
 *                       phoneNumber:
 *                         type: string
 *                         description: Offerer's phone number
 *                       rentInformation:
 *                         type: object
 *                         description: Information related to renting
 *                         properties:
 *                           delayMargin:
 *                             type: number
 *                             description: Delay margin in percentage
 *                           lateRestitutionPenalty:
 *                             type: number
 *                             description: Penalty for late return
 *                           deteriorationPenalty:
 *                             type: number
 *                             description: Penalty for asset deterioration
 *                           nonRestitutionPenalty:
 *                             type: number
 *                             description: Penalty for asset non-restitution
 *                 assets:
 *                   type: object
 *                   description: Map of assets where each key is an asset ID
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Asset ID
 *                       name:
 *                         type: string
 *                         description: Asset name
 *                       description:
 *                         type: string
 *                         description: Asset description
 *                       assetType:
 *                         type: string
 *                         description: Type of asset (e.g. Inputs1)
 *                       owner:
 *                         type: string
 *                       multiAccess:
 *                         type: boolean
 *                       regulatedId:
 *                         type: string
 *                       totalQuantity:
 *                         type: number
 *                         description: Total quantity available
 *                       remainingQuantity:
 *                         type: number
 *                         description: Quantity currently available
 *                       specificAttributes:
 *                         type: array
 *                         description: List of specific attributes
 *                         items:
 *                           type: object
 *                           properties:
 *                             attributeName:
 *                               type: string
 *                               description: Name of the attribute
 *                             value:
 *                               type: string
 *                               description: Value of the attribute
 *                       images:
 *                         type: array
 *                         description: List of asset images
 *                         items:
 *                           type: string
 *                       unit:
 *                         type: string
 *                         description: Unit of measurement for the asset
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.get('/offers/LimitedOffer', offerController.getLimitedOfferForResilinkCustom);

/**
 * @swagger
 * /v1/offers/owner/blockedOffer/{id}:
 *   get:
 *     summary: Get a prosumer blocked offers with assets data in RESILINK perspective
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: the prosummer id
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 offers:
 *                   type: array
 *                   description: List of offers
 *                   items:
 *                     type: object
 *                     properties:
 *                       offerer:
 *                         type: string
 *                         description: Offerer ID
 *                       assetId:
 *                         type: integer
 *                         description: Asset ID
 *                       beginTimeSlot: 
 *                         type: string
 *                         format: date-time
 *                         description: Offer start time
 *                       endTimeSlot: 
 *                         type: string
 *                         format: date-time
 *                         description: Offer end time
 *                       validityLimit: 
 *                         type: string
 *                         format: date-time
 *                         description: Offer expiration date
 *                       publicationDate: 
 *                         type: string
 *                         format: date-time
 *                         description: Date of publication
 *                       offeredQuantity:
 *                         type: number
 *                         description: Quantity offered
 *                       remainingQuantity:
 *                         type: number
 *                         format: float
 *                         description: Quantity remaining
 *                       price:
 *                         type: number
 *                         description: Offer price
 *                       deposit:
 *                         type: number
 *                         description: Offer deposit
 *                       cancellationFee:
 *                         type: number
 *                         description: Fee for cancellation
 *                       paymentMethod:
 *                         type: string
 *                         enum:
 *                           - total
 *                           - periodic
 *                       paymentFrequency:
 *                         type: number
 *                       transactionType:
 *                         type: string
 *                       country:
 *                         type: string
 *                       phoneNumber:
 *                         type: string
 *                         description: Offerer's phone number
 *                       rentInformation:
 *                         type: object
 *                         description: Information related to renting
 *                         properties:
 *                           delayMargin:
 *                             type: number
 *                             description: Delay margin in percentage
 *                           lateRestitutionPenalty:
 *                             type: number
 *                             description: Penalty for late return
 *                           deteriorationPenalty:
 *                             type: number
 *                             description: Penalty for asset deterioration
 *                           nonRestitutionPenalty:
 *                             type: number
 *                             description: Penalty for asset non-restitution
 *                 assets:
 *                   type: object
 *                   description: Map of assets where each key is an asset ID
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Asset ID
 *                       name:
 *                         type: string
 *                         description: Asset name
 *                       description:
 *                         type: string
 *                         description: Asset description
 *                       assetType:
 *                         type: string
 *                         description: Type of asset (e.g. Inputs1)
 *                       owner:
 *                         type: string
 *                       multiAccess:
 *                         type: boolean
 *                       regulatedId:
 *                         type: string
 *                       totalQuantity:
 *                         type: number
 *                         description: Total quantity available
 *                       remainingQuantity:
 *                         type: number
 *                         description: Quantity currently available
 *                       specificAttributes:
 *                         type: array
 *                         description: List of specific attributes
 *                         items:
 *                           type: object
 *                           properties:
 *                             attributeName:
 *                               type: string
 *                               description: Name of the attribute
 *                             value:
 *                               type: string
 *                               description: Value of the attribute
 *                       images:
 *                         type: array
 *                         description: List of asset images
 *                         items:
 *                           type: string
 *                       unit:
 *                         type: string
 *                         description: Unit of measurement for the asset
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.get('/offers/owner/blockedOffer/:id/', offerController.getBlockedOfferForResilinkCustom);

/**
 * @swagger
 * /v1/offers/all/resilink/filtered:
 *   post: 
 *     summary: Returns the list of offers after custom sorting
 *     tags: [Offer]
 *     requestBody:
 *       description: prerequisites for the offer.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               assetType:
 *                 type: string
 *               transactionType:
 *                 type: string
 *               country:
 *                 type: string
 *               latitude:
 *                 type: string
 *               longitude:
 *                 type: string
 *               distance:
 *                 type: integer
 *               minPrice:
 *                 type: number
 *               maxPrice:
 *                 type: number
 *               minQuantity:
 *                 type: number
 *               maxQuantity:
 *                 type: number
 *               minDate:
 *                 type: string
 *               maxDate:
 *                 type: string
 *               properties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     attributeName:
 *                       type: string
 *                     value:
 *                       type: string
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                   publicationDate:
 *                     type: string
 *                     format: date-time
 *                   remainingQuantity:
 *                     type: number
 *                   offerer:
 *                     type: string
 *                   assetId:
 *                     type: integer
 *                   beginTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   endTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   validityLimit: 
 *                     type: string
 *                     format: date-time
 *                   offeredQuantity:
 *                     type: number
 *                   price:
 *                     type: number
 *                   deposit:
 *                     type: number
 *                   cancellationFee:
 *                     type: number
 *                   paymentMethod:
 *                     type: string
 *                     enum:
 *                       - total
 *                       - periodic
 *                   paymentFrequency:
 *                     type: number
 *                   transactionType:
 *                     type: string
 *                   country:
 *                     type: string
 *                   rentInformation:
 *                     type: object
 *                     properties:
 *                       delayMargin:
 *                         type: number
 *                       lateRestitutionPenalty:
 *                         type: number
 *                       deteriorationPenalty:
 *                         type: number
 *                       nonRestitutionPenalty:
 *                         type: number
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.post('/offers/all/resilink/filtered/', offerController.getOfferFiltered);

/**
 * @swagger
 * /v1/offers/owner:
 *   get:
 *     summary: Get all offers from a prosumer
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   offerer:
 *                     type: string
 *                   assetId:
 *                     type: integer
 *                   beginTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   endTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   validityLimit:
 *                     type: string
 *                     format: date-time
 *                   publicationDate:
 *                     type: string
 *                     format: date-time
 *                   offeredQuantity:
 *                     type: number
 *                   remainingQuantity:
 *                     type: number
 *                   price:
 *                     type: number
 *                   deposit:
 *                     type: number
 *                   cancellationFee:
 *                     type: number
 *                   paymentMethod:
 *                     type: string
 *                     enum:
 *                       - total
 *                       - periodic
 *                   paymentFrequency:
 *                     type: number
 *                   transactionType:
 *                     type: string
 *                   country:
 *                     type: string
 *                   rentInformation:
 *                     type: object
 *                     properties:
 *                       delayMargin:
 *                         type: number
 *                       lateRestitutionPenality:
 *                         type: number
 *                       deteriorationPenality:
 *                         type: number
 *                       nonRestitutionPenality:
 *                         type: number
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.get('/offers/owner/', offerController.getAllOwnerOffer);

/**
 * @swagger
 * /v1/offers/owner/purchase:
 *   get:
 *     summary: Get all offers purchased from a prosumer
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contracts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idContract:
 *                         type: integer
 *                       state:
 *                         type: string
 *                       creationDate:
 *                         type: string
 *                         format: date-time
 *                       transactionType:
 *                         type: string
 *                       offerer:
 *                         type: string
 *                       offer:
 *                         type: string
 *                       asset:
 *                         type: string
 *                       requester:
 *                         type: string
 *                       Request:
 *                         type: string
 *                       price:
 *                         type: number
 *                       deposit:
 *                         type: number
 *                       cancellationFee:
 *                         type: number
 *                       quantityToDeliver:
 *                         type: number
 *                       deliveredQuantity:
 *                         type: number
 *                       consumedQuantity:
 *                         type: number
 *                       beginTimeSlot:
 *                         type: string
 *                         format: date-time
 *                       endTimeSlot:
 *                         type: string
 *                         format: date-time
 *                       effectiveBeginTimeSlot:
 *                         type: string
 *                         format: date-time
 *                       effectiveEndTimeSlot:
 *                         type: string
 *                         format: date-time
 *                       rentInformation:
 *                         type: object
 *                         properties:
 *                           delayMargin:
 *                             type: number
 *                           lateRestitutionPenality:
 *                             type: number
 *                           deteriorationPenality:
 *                             type: number
 *                           nonRestitutionPenality:
 *                             type: number
 *                 offers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       offerer:
 *                         type: string
 *                       assetId:
 *                         type: integer
 *                       beginTimeSlot:
 *                         type: string
 *                         format: date-time
 *                       endTimeSlot:
 *                         type: string
 *                         format: date-time
 *                       validityLimit:
 *                         type: string
 *                         format: date-time
 *                       publicationDate:
 *                         type: string
 *                         format: date-time
 *                       offeredQuantity:
 *                         type: number
 *                       remainingQuantity:
 *                         type: number
 *                       price:
 *                         type: number
 *                       deposit:
 *                         type: number
 *                       cancellationFee:
 *                         type: number
 *                       paymentMethod:
 *                         type: string
 *                         enum:
 *                           - total
 *                           - periodic
 *                       paymentFrequency:
 *                         type: number
 *                       transactionType:
 *                         type: string
 *                       country:
 *                         type: string
 *                       rentInformation:
 *                         type: object
 *                         properties:
 *                           delayMargin:
 *                             type: number
 *                           lateRestitutionPenality:
 *                             type: number
 *                           deteriorationPenality:
 *                             type: number
 *                           nonRestitutionPenality:
 *                             type: number
 *                       phoneNumber:
 *                         type: string
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.get('/offers/owner/purchase/', offerController.getOwnerOfferPurchase);

/**
 * @swagger
 * /v1/offers/all:
 *   get:
 *     summary: Get all offers
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                   publicationDate:
 *                     type: string
 *                     format: date-time
 *                   remainingQuantity:
 *                     type: number
 *                   offerer:
 *                     type: string
 *                   assetId:
 *                     type: integer
 *                   beginTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   endTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   validityLimit: 
 *                     type: string
 *                     format: date-time
 *                   offeredQuantity:
 *                     type: number
 *                   price:
 *                     type: number
 *                   deposit:
 *                     type: number
 *                   cancellationFee:
 *                     type: number
 *                   paymentMethod:
 *                     type: string
 *                     enum:
 *                       - total
 *                       - periodic
 *                   paymentFrequency:
 *                     type: number
 *                   transactionType:
 *                     type: string
 *                   country:
 *                     type: string
 *                   rentInformation:
 *                     type: object
 *                     properties:
 *                       delayMargin:
 *                         type: number
 *                       lateRestitutionPenalty:
 *                         type: number
 *                       deteriorationPenalty:
 *                         type: number
 *                       nonRestitutionPenalty:
 *                         type: number
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.get('/offers/all/', offerController.getAllOffer);

/**
 * @swagger
 * /v1/offers/{id}:
 *   get:
 *     summary: Get an offers by id
 *     tags: [Offer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: the offer id
 *     responses:
 *       200:
 *         description: offer.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                 publicationDate:
 *                   type: string
 *                   format: date-time
 *                 remainingQuantity:
 *                   type: number
 *                 offerer:
 *                   type: string
 *                 assetId:
 *                   type: integer
 *                 beginTimeSlot: 
 *                   type: string
 *                   format: date-time
 *                 endTimeSlot: 
 *                   type: string
 *                   format: date-time
 *                 validityLimit: 
 *                   type: string
 *                   format: date-time
 *                 offeredQuantity:
 *                   type: number
 *                 price:
 *                   type: number
 *                 deposit:
 *                   type: number
 *                 cancellationFee:
 *                   type: number
 *                 paymentMethod:
 *                   type: string
 *                   enum:
 *                     - total
 *                     - periodic
 *                 paymentFrequency:
 *                   type: number
 *                 transactionType:
 *                   type: string
 *                 country:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 rentInformation:
 *                   type: object
 *                   properties:
 *                     delayMargin:
 *                       type: number
 *                     lateRestitutionPenalty:
 *                       type: number
 *                     deteriorationPenalty:
 *                       type: number
 *                     nonRestitutionPenalty:
 *                       type: number
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.get('/offers/:id/', offerController.getOneOffer);

/**
 * @swagger
 * /v1/offers/{id}:
 *   put: 
 *     summary: update an offer attributes
 *     tags: [Offer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: the offer id
 *     requestBody:
 *       description: The assetType's data.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               offerer: 
 *                 type: string
 *               assetId:
 *                 type: integer
 *               beginTimeSlot: 
 *                 type: string
 *                 format: date-time
 *               endTimeSlot: 
 *                 type: string
 *                 format: date-time
 *               validityLimit: 
 *                 type: string
 *                 format: date-time
 *               offeredQuantity:
 *                 type: number
 *               price:
 *                 type: number
 *               deposit:
 *                 type: number
 *               cancellationFee:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum:
 *                   - total
 *                   - periodic
 *               paymentFrequency:
 *                 type: number
 *               transactionType:
 *                 type: string
 *               country:
 *                 type: string
 *               rentInformation:
 *                 type: object
 *                 properties:
 *                   delayMargin:
 *                     type: number
 *                   lateRestitutionPenalty:
 *                     type: number
 *                   deteriorationPenalty:
 *                     type: number
 *                   nonRestitutionPenalty:
 *                     type: number
 *     responses:
 *       200:
 *         description: Offer successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                      message:
 *                          type: string
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.put('/offers/:id/', offerController.putOffer);

/**
 * @swagger
 * /v1/offers/{id}/updateOfferAsset:
 *   put: 
 *     summary: update offer's and asset's attributes
 *     tags: [Offer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: the offer id
 *     requestBody:
 *       description: The assetType's data.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               asset:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   assetType:
 *                     type: string
 *                   multiAccess:
 *                     type: boolean
 *                   totalQuantity:
 *                     type: number
 *                   images:
 *                     type: string
 *                   unit:
 *                     type: string
 *                   specificAttributes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         attributeName:
 *                           type: string
 *                         value:
 *                           type: string
 *               offer:
 *                 type: object
 *                 properties:
 *                   offerer:
 *                     type: string
 *                   assetId:
 *                     type: integer
 *                   beginTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   endTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   validityLimit: 
 *                     type: string
 *                     format: date-time
 *                   offeredQuantity:
 *                     type: number
 *                   price:
 *                     type: number
 *                   deposit:
 *                     type: number
 *                   cancellationFee:
 *                     type: number
 *                   paymentMethod:
 *                     type: string
 *                     enum:
 *                       - total
 *                       - periodic
 *                   paymentFrequency:
 *                     type: number
 *                   transactionType:
 *                     type: string
 *                   country:
 *                     type: string
 *                   rentInformation:
 *                     type: object
 *                     properties:
 *                       delayMargin:
 *                         type: number
 *                       lateRestitutionPenalty:
 *                         type: number
 *                       deteriorationPenalty:
 *                         type: number
 *                       nonRestitutionPenalty:
 *                         type: number
 *     responses:
 *       200:
 *         description: Offer successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                      message:
 *                          type: string
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.put('/offers/:id/updateOfferAsset/', offerController.putOfferAsset);

/**
 * @swagger
 * /v1/offers/createOfferAsset:
 *   post: 
 *     summary: Create a new offer and its asset
 *     tags: [Offer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               asset:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   assetType:
 *                     type: string
 *                   totalQuantity:
 *                     type: number
 *                   multiAccess:
 *                     type: boolean
 *                   images:
 *                     type: string
 *                   unit: 
 *                     type: string
 *                   specificAttributes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         attributeName:
 *                           type: string
 *                         value:
 *                           type: string
 *               offer:
 *                 type: object
 *                 properties:
 *                   offerer:
 *                     type: string
 *                   beginTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   endTimeSlot: 
 *                     type: string
 *                     format: date-time
 *                   validityLimit: 
 *                     type: string
 *                     format: date-time
 *                   offeredQuantity:
 *                     type: number
 *                   price:
 *                     type: number
 *                   deposit:
 *                     type: number
 *                   cancellationFee:
 *                     type: number
 *                   paymentMethod:
 *                     type: string
 *                     enum:
 *                       - total
 *                       - periodic
 *                   paymentFrequency:
 *                     type: number
 *                   transactionType:
 *                     type: string
 *                   country:
 *                     type: string
 *                   rentInformation:
 *                     type: object
 *                     properties:
 *                       delayMargin:
 *                         type: number
 *                       lateRestitutionPenalty:
 *                         type: number
 *                       deteriorationPenalty:
 *                         type: number
 *                       nonRestitutionPenalty:
 *                         type: number
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 asset:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                 offer:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *       400:
 *         description: Invalid offer data.
 *       500:
 *         description: Some server error.
 */


router.post('/offers/createOfferAsset/', offerController.createOfferAsset);

/**
 * @swagger
 * /v1/offers/{id}/:
 *   delete: 
 *     summary: delete an offer
 *     tags: [Offer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *     responses:
 *       200:
 *         description: Offer successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                      message:
 *                          type: string
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 message:
 *                   type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.delete('/offers/:id/', offerController.deleteOffer);

module.exports = router;