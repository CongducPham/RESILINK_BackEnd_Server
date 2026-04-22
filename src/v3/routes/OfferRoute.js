const express = require("express");
const offerController = require("../controllers/OfferController.js");
const router = express.Router();
const config = require('../config.js');
const auth = require("../../middlewares/optionalAuth.js");
const detectServerCall = require("../../middlewares/detectServerCall.js");

const tokenRequired = config.TOKEN_REQUIRED;

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
 *         acceptSharing:
 *           type: boolean
 *           default: true
 *           description: Whether this offer is visible to other RESILINK servers in federated queries. Defaults to true.
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
 * components:
 *   schemas:
 *     OfferItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id:
 *           type: integer
 *         offerer:
 *           type: string
 *           description: Offerer ID
 *         assetId:
 *           type: integer
 *           description: Asset ID
 *         transactionType:
 *           type: string
 *         beginTimeSlot:
 *           type: string
 *           format: date-time
 *           description: Offer start time
 *         endTimeSlot:
 *           type: string
 *           format: date-time
 *           description: Offer end time
 *         validityLimit:
 *           type: string
 *           format: date-time
 *           description: Offer expiration date
 *         publicationDate:
 *           type: string
 *           format: date-time
 *           description: Date of publication
 *         offeredQuantity:
 *           type: number
 *           description: Quantity offered
 *         remainingQuantity:
 *           type: number
 *           format: float
 *           description: Quantity remaining
 *         price:
 *           type: number
 *           description: Offer price
 *         deposit:
 *           type: number
 *           description: Offer deposit
 *         cancellationFee:
 *           type: number
 *           description: Fee for cancellation
 *         paymentMethod:
 *           type: string
 *           enum:
 *             - total
 *             - periodic
 *         paymentFrequency:
 *           type: number
 *         country:
 *           type: string
 *         phoneNumber:
 *           type: string
 *           description: Offerer's phone number
 *         rentInformation:
 *           type: object
 *           description: Information related to renting
 *           properties:
 *             delayMargin:
 *               type: number
 *               description: Delay margin in percentage
 *             lateRestitutionPenalty:
 *               type: number
 *               description: Penalty for late return
 *             deteriorationPenalty:
 *               type: number
 *               description: Penalty for asset deterioration
 *             nonRestitutionPenalty:
 *               type: number
 *               description: Penalty for asset non-restitution
 *     AssetItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id:
 *           type: integer
 *           description: Asset ID
 *         name:
 *           type: string
 *           description: Asset name
 *         description:
 *           type: string
 *           description: Asset description
 *         assetType:
 *           type: string
 *           description: Type of asset (e.g. Inputs1)
 *         owner:
 *           type: string
 *           description: Asset owner ID
 *         multiAccess:
 *           type: boolean
 *         regulatedId:
 *           type: string
 *         totalQuantity:
 *           type: number
 *           description: Total quantity available
 *         remainingQuantity:
 *           type: number
 *           description: Quantity currently available
 *         specificAttributes:
 *           type: array
 *           description: List of specific attributes
 *           items:
 *             type: object
 *             properties:
 *               attributeName:
 *                 type: string
 *                 description: Name of the attribute
 *               value:
 *                 type: string
 *                 description: Value of the attribute
 *         images:
 *           type: array
 *           description: List of asset images
 *           items:
 *             type: string
 *         unit:
 *           type: string
 *           description: Unit of measurement for the asset
 *         createdAt:
 *           type: string
 *           format: date-time
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *     ServerOffersResponse:
 *       type: object
 *       description: Object keyed by server URL, each containing offers and assets
 *       additionalProperties:
 *         type: object
 *         properties:
 *           offers:
 *             type: array
 *             description: List of offers
 *             items:
 *               $ref: '#/components/schemas/OfferItem'
 *           assets:
 *             type: object
 *             description: Map of assets keyed by asset ID
 *             additionalProperties:
 *               $ref: '#/components/schemas/AssetItem'
 */

/**
 * @swagger
 * /v3/offers:
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
 *               transactionType:
 *                 type: string
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
 *               country:
 *                 type: string
 *               acceptSharing:
 *                 type: boolean
 *                 description: Whether this offer is visible to other RESILINK servers (default true)
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
 *                      offerId:
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

router.post('/offers/', auth({ required: true }), offerController.createOffer);

/**
 * @swagger
 * /v3/offers/local/all:
 *   get:
 *     summary: Get all valid offers from local server only (no federation)
 *     description: Returns offers from the current RESILINK instance without querying external servers. Public endpoint accessible with or without authentication.
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Success - Local server offers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerOffersResponse'
 *       400:
 *         description: Bad request.
 *       404:
 *         description: Assets or asset types not found.
 *       500:
 *         description: Error from RESILINK server.
 */
router.get('/offers/local/all', detectServerCall, auth({ required: false }), offerController.getLocalOffersOnly);

/**
 * @swagger
 * /v3/offers/federated/all:
 *   get:
 *     summary: Get federated offers from local server and user's favorite servers
 *     description: Aggregates offers from local RESILINK instance and external favorite servers configured by the authenticated user. Requires authentication.
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Success - Federated offers from multiple servers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerOffersResponse'
 *       400:
 *         description: Bad request.
 *       404:
 *         description: Assets or asset types not found.
 *       500:
 *         description: Error from RESILINK server.
 */
router.get('/offers/federated/all', auth({ required: true }), offerController.getFederatedOffers);


/**
 * @swagger
 * /v3/offers/suggested:
 *   get:
 *     summary: Get valid and suggested offers for a user
 *     tags: [Offer]
 *     parameters:
 *       - in: query
 *         name: offerNbr
 *         required: true
 *         schema:
 *           type: number
 *         description: Number of offers to return
 *       - in: query
 *         name: iteration
 *         required: true
 *         schema:
 *           type: number
 *         description: Iteration index for pagination
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerOffersResponse'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Error from RESILINK server
 */

router.get('/offers/suggested', auth({ required: true }), offerController.getSuggestedOfferForResilinkCustom);

/**
 * @swagger
 * /v3/offers/LimitedOffer:
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
 *       - in: query
 *         name: federated
 *         schema:
 *           type: boolean
 *           default: false
 *         required: false
 *         description: If true, completes the page with offers from favorite federated servers when local offers are insufficient
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerOffersResponse'
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

router.get('/offers/LimitedOffer', auth({ required: true }), offerController.getLimitedOfferForResilinkCustom);

/**
 * @swagger
 * /v3/offers/owner/blockedOffer/local:
 *   get:
 *     summary: Get blocked offers from local server only
 *     description: Retrieves all offers that the authenticated user has blocked on the current RESILINK instance. Use ?includeAssets=true to also retrieve the associated assets. Missing offers or assets are silently skipped.
 *     parameters:
 *       - in: query
 *         name: includeAssets
 *         schema:
 *           type: boolean
 *           default: false
 *         required: false
 *         description: Whether to include associated assets in the response
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerOffersResponse'
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

router.get('/offers/owner/blockedOffer/local/', auth({ required: true }), offerController.getLocalBlockedOffers);

/**
 * @swagger
 * /v3/offers/owner/blockedOffer/federated:
 *   get:
 *     summary: Get blocked offers from local server and user's favorite external servers
 *     description: Retrieves all offers that the authenticated user has blocked across the local RESILINK instance and favorite external servers. Use ?includeAssets=true to also retrieve the associated assets. Missing offers, assets and unreachable servers are silently skipped.
 *     parameters:
 *       - in: query
 *         name: includeAssets
 *         schema:
 *           type: boolean
 *           default: false
 *         required: false
 *         description: Whether to include associated assets in the response
 *     tags: [Offer]
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerOffersResponse'
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

router.get('/offers/owner/blockedOffer/federated/', auth({ required: true }), offerController.getFederatedBlockedOffers);


/**
 * @swagger
 * /v3/offers/byIds:
 *   post:
 *     summary: Retrieve specific offers by their IDs
 *     description: Returns offers matching the provided list of IDs, with optional associated assets. Used internally by external RESILINK servers for federated blocked offers retrieval. Avoids fetching all offers when only a subset is needed.
 *     tags: [Offer]
 *     requestBody:
 *       description: List of offer IDs to retrieve and optional asset inclusion flag
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offerIds
 *             properties:
 *               offerIds:
 *                 type: array
 *                 description: List of offer IDs to retrieve
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               includeAssets:
 *                 type: boolean
 *                 description: Whether to include associated assets in the response
 *                 default: false
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerOffersResponse'
 *       400:
 *         description: Bad request (invalid or missing offerIds).
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

router.post('/offers/byIds', auth({ required: false }), offerController.getOffersByIds);


/**
 * @swagger
 * /v3/offers/local/all/filtered:
 *   post: 
 *     summary: Returns filtered offers from local server only (no federation)
 *     description: Applies filter criteria to offers from the current RESILINK instance. Public endpoint accessible with or without authentication.
 *     tags: [Offer]
 *     requestBody:
 *       description: Filter criteria for offers
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Filter'
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerOffersResponse'
 *       400:
 *         description: Bad request.
 *       404:
 *         description: Assets or asset types not found.
 *       500:
 *         description: Error from RESILINK server.
 */

router.post('/offers/local/all/filtered', detectServerCall, auth({ required: tokenRequired }), offerController.getLocalOffersFiltered);

/**
 * @swagger
 * /v3/offers/federated/all/filtered:
 *   post: 
 *     summary: Returns filtered offers from local server and user's favorite external servers
 *     description: Applies filter criteria locally and sends the same filter to each favorite external RESILINK server for server-side filtering. Requires authentication.
 *     tags: [Offer]
 *     requestBody:
 *       description: Filter criteria for offers
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Filter'
 *     responses:
 *       200:
 *         description: Successful transaction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerOffersResponse'
 *       400:
 *         description: Bad request.
 *       404:
 *         description: Assets or asset types not found.
 *       500:
 *         description: Error from RESILINK server.
 */

router.post('/offers/federated/all/filtered', auth({ required: tokenRequired }), offerController.getFederatedOffersFiltered);

/**
 * @swagger
 * /v3/offers/owner:
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
 *                   transactionType:
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

router.get('/offers/owner/', auth({ required: true }), offerController.getOfferOwner);

/**
 * @swagger
 * /v3/offers/all:
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
 *                   transactionType:
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

router.get('/offers/all/', auth({ required: tokenRequired }), offerController.getAllOffer);

/**
 * @swagger
 * /v3/offers/{id}:
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
 *                 transactionType:
 *                   type: string
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

router.get('/offers/:id/', auth({ required: tokenRequired }), offerController.getOneOffer);

/**
 * @swagger
 * /v3/offers/{id}:
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
 *               transactionType:
 *                 type: string
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

router.put('/offers/:id/', auth({ required: true }), offerController.putOffer);

/**
 * @swagger
 * /v3/offers/{id}/updateOfferAsset:
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
 *                   transactionType:
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

router.put('/offers/:id/updateOfferAsset/', auth({ required: true }), offerController.putOfferAsset);

/**
 * @swagger
 * /v3/offers/createOfferAsset:
 *   post: 
 *     summary: Create a new offer, its asset, and its asset type needed
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
 *                   multiAccess:
 *                     type: boolean
 *                   totalQuantity:
 *                     type: number
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
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
 *                   transactionType:
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


router.post('/offers/createOfferAsset/', auth({ required: true }), offerController.createOfferAsset);

/**
 * @swagger
 * /v3/offers/{id}/:
 *   delete: 
 *     summary: delete an offer (from ODEP)
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

router.delete('/offers/:id/', auth({ required: true }), offerController.deleteOffer);

module.exports = router;