const express = require("express");
const router = express.Router();
const contractController = require("../controllers/ContractController.js");

/**
 * @swagger
 * tags:
 *   name: Contracts
 */

/****************************************************************************************************************
 * 
 * All contract cases are defined below for detailed documentation
 * - Contract
 * - ImmaterialContract
 * - PurchaseMaterialContract
 * - RentMaterialContract
 * 
 ****************************************************************************************************************/

/**
 * @swagger
 * components:
 *   schemas:
 *     Contract:
 *       type: object
 *       description: "Data for a created contract"
 *       properties:
 *         idContract:
 *           type: integer
 *           format: int32
 *           description: "The ID of the contract"
 *         offer:
 *           type: string
 *           description: "The offer associated with the contract"
 *         Request:
 *           type: string
 *           description: "The request associated with the contract"
 *         asset:
 *           type: string
 *           description: "The asset associated with the contract"
 *         state:
 *           type: string
 *           description: "The current state of the contract"
 *         quantityToDeliver:
 *           type: number
 *           description: "The quantity to be delivered"
 *         deliveredQuantity:
 *           type: number
 *           format: float
 *           description: "The quantity that has been delivered"
 *         consumedQuantity:
 *           type: number
 *           description: "The quantity that has been consumed"
 *         creationDate:
 *           type: string
 *           format: date-time
 *           description: "The date the contract was created"
 *         offerer:
 *           type: string
 *           description: "The ID of the offerer"
 *         requester:
 *           type: string
 *           description: "The ID of the requester"
 *         assetType:
 *           type: string
 *           description: "The type of asset involved in the contract"
 *         price:
 *           type: number
 *           format: float
 *           description: "The price associated with the contract"
 *         deposit:
 *           type: number
 *           format: float
 *           description: "The deposit required for the contract"
 *         cancellationFee:
 *           type: number
 *           format: float
 *           description: "The fee for canceling the contract"
 *         beginTimeSlot:
 *           type: string
 *           format: date-time
 *           description: "The start time of the scheduled time slot"
 *         endTimeSlot:
 *           type: string
 *           format: date-time
 *           description: "The end time of the scheduled time slot"
 *         effectiveBeginTimeSlot:
 *           type: string
 *           format: date-time
 *           description: "The actual start time of the time slot"
 *         effectiveEndTimeSlot:
 *           type: string
 *           format: date-time
 *           description: "The actual end time of the time slot"
 *         rentInformation:
 *           type: object
 *           description: "Required information in case of rent"
 *           properties:
 *             delayMargin:
 *               type: number
 *               format: float
 *               description: "A percentage of the rental period"
 *             lateRestitutionPenality:
 *               type: number
 *               format: float
 *               description: "A percentage of the asset price for late restitution"
 *             deteriorationPenality:
 *               type: number
 *               format: float
 *               description: "A percentage of the asset price for deterioration"
 *             nonRestitutionPenality:
 *               type: number
 *               format: float
 *               description: "A percentage of the asset price for non-restitution"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ContractmeasurableByQuantityCase:
 *       type: object
 *       required:
 *         - state
 *       properties:
 *         state:
 *           type: string
 *           description: "The new state of the contract"
 *           enum:
 *             - beginDelivery
 *             - beginConsumption
 *             - endDelivery
 *             - endConsumption
 *           example: endDelivery
 *         quantity:
 *           type: number
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ContractmeasurableByTimeCase:
 *       type: object
 *       required:
 *         - state
 *       properties:
 *         state:
 *           type: string
 *           description: "The new state of the contract"
 *           enum:
 *             - beginDelivery
 *             - beginConsumption
 *             - endDelivery
 *             - endConsumption
 *           example: endDelivery
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RentContractMaterialCase:
 *       type: object
 *       required:
 *         - state
 *         - delayPeriod
 *         - deterioration
 *       properties:
 *         state:
 *           type: string
 *           description: "The new state of the contract"
 *           enum:
 *             - assetDeliveredByTheOfferer
 *             - assetReceivedByTheRequestor
 *             - assetNotReceivedByTheRequestor
 *             - assetReturnedByTheRequestor
 *             - assetReturnedToTheOfferer
 *             - assetNotReturnedToTheOfferer
 *           example: assetReturnedToTheOfferer
 *         delayPeriod:
 *           type: integer
 *           format: int32
 *           description: "Indicates the period of delay, required if the state is 'assetReturnedToTheOfferer'"
 *         deterioration:
 *           type: boolean
 *           description: "Indicates whether the asset is deteriorated or not, required if the state is 'assetReturnedToTheOfferer'"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PurchaseContractMaterialCase:
 *       type: object
 *       required:
 *         - state
 *       properties:
 *         state:
 *           type: string
 *           description: "The new state of the contract"
 *           enum:
 *             - assetDeliveredByTheOfferer
 *             - assetReceivedByTheRequestor
 *             - assetNotReceivedByTheRequestor
 *           example: assetDeliveredByTheOfferer
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ContractImmaterialCase:
 *       type: object
 *       required:
 *         - state
 *       properties:
 *         state:
 *           type: string
 *           description: "The new state of the contract"
 *           enum:
 *             - beginDelivery
 *             - endDelivery
 *             - endOfConsumption
 *           example: endDelivery
 *         quantity:
 *           type: number
 *           format: float
 *           description: "Required in measurable cases if the state is 'endDelivery' or 'endOfConsumption'"
 */

/**
 * @swagger
 * /v1/contracts:
 *   post: 
 *     summary: Create a new asset (from ODEP)
 *     tags: [Contracts]
 *     requestBody:
 *       description: The assetType's data.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                offerId:
 *                  type: integer
 *                requestId:
 *                  type: integer
 *                receivingAssetID:
 *                  type: integer
 *     responses:
 *       200:
 *         description: Contract created and pre-payment executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 contractId:
 *                   type: number
 *                 requestId:
 *                   type: number
 *                 offerId:
 *                   type: number
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


router.post('/contracts/', contractController.createContract);

/**
 * @swagger
 * /v1/contracts/all:
 *   get: 
 *     summary: Get all contracts by the admin (from ODEP)
 *     tags: [Contracts]
 *     responses:
 *       200:
 *         description: Ok
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idContract:
 *                     type: number
 *                   offer:
 *                     type: string
 *                   Request:
 *                     type: string
 *                   asset:
 *                     type: string
 *                   state:
 *                     type: string
 *                   quantityToDeliver:
 *                     type: number
 *                   deliveredQuantity:
 *                     type: number
 *                   consumedQuantity:
 *                     type: number
 *                   creationDate:
 *                     type: string
 *                     format: date-time
 *                   offerer:
 *                     type: string
 *                   requester:
 *                     type: string
 *                   assetType:
 *                     type: string
 *                   price:
 *                     type: number
 *                   deposit:
 *                     type: number
 *                   cancellationFee:
 *                     type: number
 *                   beginTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   endTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   effectiveBeginTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   effectiveEndTimeSlot:
 *                     type: string
 *                     format: date-time
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
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                       type: string
 */

router.get('/contracts/all', contractController.getAllContract);

/**
 * @swagger
 * /v1/contracts/owner/ongoing/:
 *   get: 
 *     summary: Get ongoing contracts by owner
 *     tags: [Contracts]
 *     responses:
 *       200:
 *         description: Ok
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idContract:
 *                     type: number
 *                   offer:
 *                     type: string
 *                   Request:
 *                     type: string
 *                   asset:
 *                     type: string
 *                   state:
 *                     type: string
 *                   quantityToDeliver:
 *                     type: number
 *                   deliveredQuantity:
 *                     type: number
 *                   consumedQuantity:
 *                     type: number
 *                   creationDate:
 *                     type: string
 *                     format: date-time
 *                   offerer:
 *                     type: string
 *                   requester:
 *                     type: string
 *                   assetType:
 *                     type: string
 *                   price:
 *                     type: number
 *                   deposit:
 *                     type: number
 *                   cancellationFee:
 *                     type: number
 *                   beginTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   endTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   effectiveBeginTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   effectiveEndTimeSlot:
 *                     type: string
 *                     format: date-time
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
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                       type: string
 */

router.get('/contracts/owner/ongoing/', contractController.getOwnerContractOngoing);

/**
 * @swagger
 * /v1/contracts/owner:
 *   get: 
 *     summary: Get contracts by owner (from ODEP)
 *     tags: [Contracts]
 *     responses:
 *       200:
 *         description: Ok
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idContract:
 *                     type: number
 *                   offer:
 *                     type: string
 *                   Request:
 *                     type: string
 *                   asset:
 *                     type: string
 *                   state:
 *                     type: string
 *                   quantityToDeliver:
 *                     type: number
 *                   deliveredQuantity:
 *                     type: number
 *                   consumedQuantity:
 *                     type: number
 *                   creationDate:
 *                     type: string
 *                     format: date-time
 *                   offerer:
 *                     type: string
 *                   requester:
 *                     type: string
 *                   assetType:
 *                     type: string
 *                   price:
 *                     type: number
 *                   deposit:
 *                     type: number
 *                   cancellationFee:
 *                     type: number
 *                   beginTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   endTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   effectiveBeginTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   effectiveEndTimeSlot:
 *                     type: string
 *                     format: date-time
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
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                       type: string
 */

router.get('/contracts/owner', contractController.getContractFromOwner);

/**
 * @swagger
 * /v1/contracts/{id}:
 *   get: 
 *     summary: Get a contract by id (from ODEP)
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *     responses:
 *       200:
 *         description: Token of the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *                 properties:
 *                   idContract:
 *                     type: number
 *                   offer:
 *                     type: string
 *                   Request:
 *                     type: string
 *                   asset:
 *                     type: string
 *                   state:
 *                     type: string
 *                   quantityToDeliver:
 *                     type: number
 *                   deliveredQuantity:
 *                     type: number
 *                   consumedQuantity:
 *                     type: number
 *                   creationDate:
 *                     type: string
 *                     format: date-time
 *                   offerer:
 *                     type: string
 *                   requester:
 *                     type: string
 *                   assetType:
 *                     type: string
 *                   price:
 *                     type: number
 *                   deposit:
 *                     type: number
 *                   cancellationFee:
 *                     type: number
 *                   beginTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   endTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   effectiveBeginTimeSlot:
 *                     type: string
 *                     format: date-time
 *                   effectiveEndTimeSlot:
 *                     type: string
 *                     format: date-time
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
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                       type: string
 */

router.get('/contracts/:id/', contractController.getOneContract);

/**
 * @swagger
 * /v1/contracts/measurableByQuantityContract/{id}:
 *   patch: 
 *     summary: update the state of a purchase contract in case of material asset and adjust the payment accordingly (from ODEP)
 *     description: |
 *        In case of measurableByQuantity asset, this method allows the offerer to update the state of the contract to "beginDelivery".
 *        Also, it allows him to update the state to "endDelivery" and giving the delivered quantity. It allows also the requestor to update the state to "beginConsumption" or "endConsumption" and giving 
 *        the consumed quantity. According to the min (delivered,consumed, matched) quantity, this method will adjust the payment by crediting the offerer balance and debiting the requestor balance.
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                state:
 *                  type: string
 *     responses:
 *       200:
 *         description: Contract successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                       type: string
 *       404:
 *         description: Contract not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                       type: string
 */

router.patch('/contracts/measurableByQuantityContract/:id/', contractController.patchMeasurableByQuantityContract);

/**
 * @swagger
 * /v1/contracts/measurableByTimeContract/{id}:
 *   patch: 
 *     summary: update the state of a rent contract in case of material asset and adjust the payment accordingly (from ODEP)
 *     description: |
 *        In case of measurableByTime asset, this method allows the offerer to update the state of the contract to "beginDelivery".
 *        Also, it allows him to update the state to "endDelivery" and giving the delivered quantity. It allows also the requestor to update the state to "endConsumption" and giving the consumed quantity. 
 *        According to the min (delivered,consumed, matched) quantity, this method will adjust the payment by crediting the offerer balance and debiting the requestor balance.
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                state:
 *                  type: string
 *                delayPeriod:
 *                  type: number
 *                deterioration:
 *                  type: boolean
 *     responses:
 *       200:
 *         description: Contract successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                       type: string
 *       404:
 *         description: Contract not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                       type: string
 */

router.patch('/contracts/measurableByTimeContract/:id/', contractController.patchMeasurableByTimeContract);

/**
 * @swagger
 * /v1/contracts/cancelContract/{id}:
 *   patch: 
 *     summary: cancel a contract before or after its execution (from ODEP)
 *     description: |
 *      This methods allows to an offerer or a requestor to cancel a contract befor or after its execution.
 *       In case of a cancellation before the contract execution, it will update the state of the contract to "cancelled" and will debit the balance of the cancellation initiator by the "cancellationFee" to the benefit of the other prosumer.
 *       In case of a cancellation after the contract execution, it will update the state of the contract to "endDelivery", if the cancellation is perfomed by the offerer, or to "endOfUse", if the cancellation is perfomed by the requestor.
 *       This methods allows also to the cancellation initiator to indicate the effective quantity,in case of immaterial asset, in order to adjust payment accordingly. In case of an immaterial not measurable asset, it will adjust payment according to the effective period.
 *       Finally, this method will make the concerned offer and request available again for the matching.
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                quantity:
 *                  type: number
 *     responses:
 *       200:
 *         description: Contract successfully cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                       type: string
 *       404:
 *         description: Contract not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                       type: string
 */

router.patch('/contracts/cancelContract/:id/', contractController.patchContractCancel);

module.exports = router;