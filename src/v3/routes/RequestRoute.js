const express = require("express");
const router = express.Router();
const RequestController = require("../controllers/RequestController.js");
const config = require('../config.js');
const auth = require("../../middlewares/optionalAuth.js");

const tokenRequired = config.TOKEN_REQUIRED;

/**
 * @swagger
 * tags:
 *   name: Requests
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Request:
 *       type: object
 *       description: "The prosumer should provide either the requested offer IDs or the requested asset types."
 *       required:
 *         - requestor
 *         - beginTimeSlot
 *         - validityLimit
 *         - transactionType
 *       properties:
 *         requestor:
 *           type: string
 *           description: "The ID of the requestor"
 *         beginTimeSlot:
 *           type: string
 *           format: date-time
 *           description: "The start time slot for the request"
 *         endTimeSlot:
 *           type: string
 *           format: date-time
 *           description: |
 *             "Required in case of:
 *              - immaterial asset
 *              - material asset with rent transaction, representing the restitution date in this case"
 *         validityLimit:
 *           type: string
 *           format: date-time
 *           description: "The expiration date of the request"
 *         transactionType:
 *           type: string
 *           enum:
 *             - sale/purchase
 *             - rent
 *           description: "The type of transaction. Enum values: 'sale/purchase', 'rent'"
 *         offerIds:
 *           type: array
 *           description: "List of requested offer IDs. Required if requesting specific offers"
 *           items:
 *             type: integer
 *             format: int32
 *         assetTypes:
 *           type: array
 *           description: "List of requested asset types. Required if requesting specific asset types"
 *           items:
 *             type: object
 *             properties:
 *               assetTypeName:
 *                 type: string
 *                 description: "The name of the asset type"
 *               maximumPrice:
 *                 type: number
 *                 format: float
 *                 description: |
 *                   "In case of immaterial asset, expressed in Account Units per measuring unit.
 *                    In case of immaterial and not measurable asset or rent of material asset, expressed in Account Units per hour"
 *               maximumDeposit:
 *                 type: number
 *                 format: float
 *                 description: "Deposit ranges between 0 and 100% of the asset price"
 *               requestedQuantity:
 *                 type: number
 *                 format: float
 *                 description: "Required in case of immaterial asset"
 *               requestedSpecificAttributes:
 *                 type: array
 *                 description: "List of requested specific attributes for the asset"
 *                 items:
 *                   type: object
 *                   properties:
 *                     attributeName:
 *                       type: string
 *                       description: "The name of the specific attribute"
 *                     value:
 *                       type: string
 *                       description: |
 *                         "The value format depends on comparisonType:
 *                          - between: [v1;v2]
 *                          - in: {v1;v2;..;vn}
 *                          - conj: {v1;v2;...;vn}
 *                          - disj: {v1;v2;...;vn}
 *                          - in(circle): (<x,y>;R) where <x,y> is the GPS coordinate of the circle center and R is the radius
 *                          - in(rectangle): <x1,y1>;<x2,y2>;<x3,y3> where the vertices are given in this order: top-left, top-right, bottom-right"
 *                     comparisonType:
 *                       type: string
 *                       enum:
 *                         - contains
 *                         - ==
 *                         - <
 *                         - <=
 *                         - >
 *                         - >=
 *                         - between
 *                         - in
 *                         - conj
 *                         - disj
 *                         - in(circle)
 *                         - in(rectangle)
 *                       description: "The type of comparison for the attribute value"
 */

/**
 * @swagger
 * /v3/ODEP/requests:
 *   post:
 *     summary: post a new request
 *     tags: [Requests]
 *     requestBody:
 *       description: offer's data.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestor:
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
 *               transactionType:
 *                 type: string
 *                 enum:
 *                   - sale/purchase
 *                   - rent
 *               offerIds:
 *                 type: array
 *                 items:
 *                   type: number
 *               assetTypes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     assetTypeName:
 *                       type: string
 *                     maximumPrice:
 *                       type: number
 *                     maximumDeposit:
 *                       type: number
 *                     requestedQuantity:
 *                       type: number
 *                     requestedSpecificAttributes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           attributeName:
 *                             type: string
 *                           value:
 *                             type: string
 *                           comparisonType:
 *                             type: string
 *                             enum:
 *                               - contains
 *                               - ==
 *                               - <
 *                               - <=
 *                               - >
 *                               - >=
 *                               - between
 *                               - in
 *                               - conj
 *                               - disj
 *                               - in(circle)
 *                               - in(rectangle)
 *     responses:
 *       201:
 *         description: Request successfully created returning available offers.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  requestId:
 *                      type: number
 *                  message: 
 *                      type: string
 *                  availableOffersCount:
 *                      type: number
 *                  availableOffersIds:
 *                      type: array
 *                      items:
 *                          type: number
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    code:
 *                        type: number
 *                    message:
 *                        type: string
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    code:
 *                        type: number
 *                    message:
 *                        type: string
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.post('/ODEP/requests/', auth({ required: true }), RequestController.createRequest);

/**
 * @swagger
 * /v3/ODEP/requests/all:
 *   get:
 *     summary: Get all requests
 *     tags: [Requests]
 *     responses:
 *       200:
 *         description: Ok.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   requestor:
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
 *                   transactionType:
 *                     type: string
 *                     enum:
 *                       - sale/purchase
 *                       - rent
 *                   offerIds:
 *                     type: array
 *                     items:
 *                       type: number
 *                   assetTypes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         assetTypeName:
 *                           type: string
 *                         maximumPrice:
 *                           type: number
 *                         maximumDeposit:
 *                           type: number
 *                         requestedQuantity:
 *                           type: number
 *                         requestedSpecificAttributes:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               attributeName:
 *                                 type: string
 *                               value:
 *                                 type: string
 *                               comparisonType:
 *                                 type: string
 *                                 enum:
 *                                   - contains
 *                                   - ==
 *                                   - <
 *                                   - <=
 *                                   - >
 *                                   - >=
 *                                   - between
 *                                   - in
 *                                   - conj
 *                                   - disj
 *                                   - in(circle)
 *                                   - in(rectangle)
 *                   requestId:
 *                     type: number
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


router.get('/ODEP/requests/all', auth({ required: true }), RequestController.getAllRequest);

/**
 * @swagger
 * /v3/ODEP/requests/{id}:
 *   get:
 *     summary: Get a request by id
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: the request id
 *     responses:
 *       200:
 *         description: Ok.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestor:
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
 *                 transactionType:
 *                   type: string
 *                   enum:
 *                     - sale/purchase
 *                     - rent
 *                 offerIds:
 *                   type: array
 *                   items:
 *                     type: number
 *                 assetTypes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       assetTypeName:
 *                         type: string
 *                       maximumPrice:
 *                         type: number
 *                       maximumDeposit:
 *                         type: number
 *                       requestedQuantity:
 *                         type: number
 *                       requestedSpecificAttributes:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             attributeName:
 *                               type: string
 *                             value:
 *                               type: string
 *                             comparisonType:
 *                               type: string
 *                               enum:
 *                                 - contains
 *                                 - ==
 *                                 - <
 *                                 - <=
 *                                 - >
 *                                 - >=
 *                                 - between
 *                                 - in
 *                                 - conj
 *                                 - disj
 *                                 - in(circle)
 *                                 - in(rectangle)
 *                 requestId:
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

router.get('/ODEP/requests/:id/', auth({ required: true }), RequestController.getOneRequest);

/**
 * @swagger
 * /v3/ODEP/requests/{id}:
 *   put:
 *     summary: update a request attributes
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: the request id
 *     requestBody:
 *       description: offer's data.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestor:
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
 *               transactionType:
 *                 type: string
 *                 enum:
 *                   - sale/purchase
 *                   - rent
 *               offerIds:
 *                 type: array
 *                 items:
 *                   type: number
 *               assetTypes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     assetTypeName:
 *                       type: string
 *                     maximumPrice:
 *                       type: number
 *                     maximumDeposit:
 *                       type: number
 *                     requestedQuantity:
 *                       type: number
 *                     requestedSpecificAttributes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           attributeName:
 *                             type: string
 *                           value:
 *                             type: string
 *                           comparisonType:
 *                             type: string
 *                             enum:
 *                               - contains
 *                               - ==
 *                               - <
 *                               - <=
 *                               - >
 *                               - >=
 *                               - between
 *                               - in
 *                               - conj
 *                               - disj
 *                               - in(circle)
 *                               - in(rectangle)
 *     responses:
 *       200:
 *         description: Request successfully updated returning available offers.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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

router.put('/ODEP/requests/:id/', auth({ required: true }), RequestController.putRequest);

/**
 * @swagger
 * /v3/ODEP/requests/{id}/:
 *   delete: 
 *     summary: delete a request
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: the offer id
 *     responses:
 *       200:
 *         description: Request successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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


router.delete('/ODEP/requests/:id/', auth({ required: true }), RequestController.deleteRequest);

module.exports = router;
