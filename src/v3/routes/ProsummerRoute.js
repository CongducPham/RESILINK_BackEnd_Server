
const express = require("express");
const prosumerController = require("../controllers/ProsummerController.js");
const router = express.Router();
const config = require('../config.js');
const auth = require("../../middlewares/optionalAuth.js");

const tokenRequired = config.TOKEN_REQUIRED;

/**
 * @swagger
 * tags:
 *   name: Prosumer
 *   description: consumer and producteur of the application.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Prosumer:
 *       type: object
 *       required: 
 *         - id
 *       properties:
 *         id: 
 *           type: string
 *           description: Id of the Prosumer
 *         sharingAccount:
 *           type: integer
 *           format: int32
 *           description: Expressed in Sharing Points
 *         balance:
 *           type: number
 *           format: float
 *           description: "Expressed in Account Units (false currency)"
 *         email:
 *           type: string
 *           description: Email of the Prosumer
 *         location: 
 *           type: string
 *           description: "The localization of the user (e.g: 'France/Pau')"
 *         activityDomain:          
 *           type: string
 *           description: "The user's field of activity"
 *         specificActivity:          
 *           type: string
 *           description: "The user's specific activity"
 *         bookMarked: 
 *           type: array
 *           description: "A list of bookmarked News id"
 *           items:
 *             type: string 
 *       example:
 *         id: mKGJSI2
 *         sharingAccount: 100
 *         balance: 254.8
 *         activityDomain: ""
 *         location: ""
 *         email: username@hotmail.com
 *         phoneNumber: 1023456789    
 */

/**
 * @swagger
 * /v3/prosumers/all:
 *   get:
 *     summary: Get all prosumers
 *     tags: [Prosumer]
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Transaction successfully executed
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: string
 *                      sharingAccount:
 *                          type: number
 *                      balance:
 *                          type: number
 *                      activityDomain:
 *                          type: string
 *                      specificActivity:
 *                          type: string
 *                      location:
 *                          type: string
 *                      bookMarked:
 *                          type: array
 *                          items:
 *                              type: string
 *                      blockedOffers:
 *                          type: array
 *                          items:
 *                              type: string
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      code:
 *                          type: number
 *                      message:
 *                          type: string
 *       401:
 *         description: Unhautorized
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      code:
 *                          type: number
 *                      message:
 *                          type: string
 *       500:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
 */
router.get('/prosumers/all', auth({ required: tokenRequired }), prosumerController.getAllProsummer); 

/**
 * @swagger
 * /v3/prosumers/{id}:
 *   get:
 *     summary: Get a prosumer by id
 *     tags: [Prosumer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *     responses:
 *       200:
 *         description: Ok
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 sharingAccount:
 *                   type: number
 *                 balance:
 *                   type: number
 *                 activityDomain:
 *                   type: string
 *                 specificActivity:
 *                   type: string
 *                 location:
 *                   type: string
 *                 bookMarked:
 *                   type: array
 *                   items:
 *                      type: string
 *                 blockedOffers:
 *                   type: array
 *                   items:
 *                      type: string
 *       400:
 *         description: Bad Request 
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      code:
 *                          type: number
 *                      message:
 *                          type: string
 *       401:
 *         description: Unhautorized
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
 *       404:
 *         description: Not Found 
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      code:
 *                          type: number
 *                      message:
 *                          type: string
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

router.get('/prosumers/:id/', auth({ required: tokenRequired }), prosumerController.getOneProsumer);

/**
 * @swagger
 * /v3/prosumers/new:
 *   post: 
 *     summary: Create a new user and his prosumer profil
 *     tags: [Prosumer]
 *     requestBody:
 *       description: The user's informations.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               roleOfUser:
 *                 type: string
 *               email: 
 *                 type: string
 *               password:
 *                 type: string 
 *               phoneNumber:
 *                 type: string
 *               activityDomain:
 *                 type: string
 *               specificActivity:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token of the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                      user:
 *                          type: object
 *                          properties:
 *                              userName:
 *                                 type: string
 *                              firstName:
 *                                 type: string
 *                              lastName:
 *                                 type: string
 *                              roleOfUser:
 *                                 type: string
 *                              email: 
 *                                 type: string
 *                              password:
 *                                 type: string 
 *                              phoneNumber:
 *                                 type: string
 *                      prosumer:
 *                          type: object
 *                          properties:
 *                              message:
 *                                 type: string
 *       400:
 *         description: Bad Request 
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      code:
 *                          type: number
 *                      message:
 *                          type: string
 *       401:
 *         description: Unhautorized
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
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

router.post('/prosumers/new/', auth({ required: true }), prosumerController.createProsumerWithUser);

/**
 * @swagger
 * /v3/prosumers/:
 *   post: 
 *     summary: Create a new prosumer
 *     tags: [Prosumer]
 *     requestBody:
 *       description: The prosumer's informations.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               sharingAccount:
 *                 type: number
 *               balance:
 *                 type: number
 *               activityDomain:
 *                 type: string
 *               specificActivity:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token of the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 sharingAccount:
 *                   type: number
 *                 balance:
 *                   type: number
 *                 activityDomain:
 *                   type: string
 *                 specificActivity:
 *                   type: string
 *                 location:
 *                   type: string
 *                 bookMarked:
 *                   type: array
 *                   items:
 *                      type: string
 *                 blockedOffers:
 *                   type: array
 *                   items:
 *                      type: string
 *       400:
 *         description: Bad Request 
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      code:
 *                          type: number
 *                      message:
 *                          type: string
 *       401:
 *         description: Unhautorized
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
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

router.post('/prosumers/', auth({ required: true }), prosumerController.createProsumer);

/**
 * @swagger
 * /v3/prosumers/{id}/balance:
 *   patch: 
 *     summary: credit a prosumer balance
 *     tags: [Prosumer]
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
 *               accountUnits:
 *                 type: number
 *     responses:
 *       200:
 *         description: Prosumer balance successfully credited.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      code:
 *                          type: number
 *                      message:
 *                          type: string
 *       401:
 *         description: Unhautorized
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
 *       404:
 *         description: Prosumer not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      code:
 *                          type: number
 *                      message:
 *                          type: string
 */

router.patch('/prosumers/:id/balance', auth({ required: true }), prosumerController.patchBalanceProsumer);


/**
 * @swagger
 * /v3/prosumers/{prosumerId}:
 *   put: 
 *     summary: Update an existing user & his prosumer datas in RESILINK
 *     tags: [Prosumer]
 *     parameters:
 *       - in: path
 *         name: prosumerId
 *         schema:
 *           type: string 
 *         required: true
 *         description: ID of user/prosumer to update
 *     requestBody:
 *       description: User and Prosumer data that need to be updated
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: object
 *                 properties:
 *                   userName:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   roleOfUser:
 *                     type: string
 *                   email:
 *                     type: string
 *                   password:
 *                     type: string 
 *                   phoneNumber:
 *                     type: string
 *               prosumer:
 *                 type: object
 *                 properties:
 *                   activityDomain:
 *                     type: string
 *                   specificActivity:
 *                     type: string
 *                   location:
 *                     type: string
 *     responses:
 *       200:
 *         description: Prosumer successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
 *       401:
 *         description: Unhautorized
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
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

router.put('/prosumers/:prosumerId/', auth({ required: true }), prosumerController.putUserProsumerPersonnalData);

/**
 * @swagger
 * /v3/prosumers/{id}/activityDomain:
 *   patch: 
 *     summary: update a prosumer activityDomain
 *     tags: [Prosumer]
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
 *               activityDomain:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prosumer activityDomain successfully credited.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
 *       401:
 *         description: Unhautorized
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
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

router.patch('/prosumers/:id/activityDomain', auth({ required: true }), prosumerController.patchJobProsummer);

/**
 * @swagger
 * /v3/prosumers/{id}/sharingAccount:
 *   patch: 
 *     summary: credit a prosumer sharing account
 *     tags: [Prosumer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: the Prosumer id
 *     requestBody:
 *       description: The prosumer's sharing value.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sharingPoints:
 *                 type: number
 *     responses:
 *       200:
 *         description: Prosumer sharing account successfully credited.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
 *       401:
 *         description: Unhautorized
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      code:
 *                          type: number
 *                      message:
 *                          type: string
 *       404:
 *         description: Prosumer not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      code:
 *                          type: number
 *                      message:
 *                          type: string
 */

router.patch('/prosumers/:id/sharingAccount', auth({ required: true }), prosumerController.patchSharingProsumer);

/**
 * @swagger
 * /v3/prosumers/{id}/addBookmark:
 *   put: 
 *     summary: add an id to the bookmark list of the prosumer
 *     tags: [Prosumer]
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
 *               bookmarkId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prosumer bookmarked list succesfully updated.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 *       401:
 *         description: Unhautorized
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.put('/prosumers/:id/addBookmark', auth({ required: true }), prosumerController.patchBookmarkProsumer);

/**
 * @swagger
 * /v3/prosumers/{id}/blocked-offers/server:
 *   post:
 *     summary: Block an offer from a specific server for multi-server federation support
 *     tags: [Prosumer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The prosumer id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serverName
 *               - offerId
 *             properties:
 *               serverName:
 *                 type: string
 *                 description: Server URL identifier (e.g., 'http://localhost:8080', 'https://server.com')
 *               offerId:
 *                 type: string
 *                 description: Offer ID to block
 *     responses:
 *       200:
 *         description: Offer successfully blocked for the specified server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/prosumers/:id/blocked-offers/server', auth({ required: true }), prosumerController.blockOfferByServer);

/**
 * @swagger
 * /v3/prosumers/{id}/blocked-offers/server/{serverName}:
 *   get:
 *     summary: Get blocked offers for a specific server
 *     tags: [Prosumer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The prosumer id
 *       - in: path
 *         name: serverName
 *         schema:
 *           type: string
 *         required: true
 *         description: Server identifier
 *     responses:
 *       200:
 *         description: Blocked offers for the specified server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blockedOffers:
 *                   type: array
 *                   items:
 *                     type: string
 *                 serverName:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/prosumers/:id/blocked-offers/server/:serverName', auth({ required: true }), prosumerController.getBlockedOffersByServer);

/**
 * @swagger
 * /v3/prosumers/{id}/blocked-offers/all:
 *   get:
 *     summary: Get all blocked offers for all servers
 *     tags: [Prosumer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The prosumer id
 *     responses:
 *       200:
 *         description: Complete map of blocked offers for all servers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blockedOffers:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/prosumers/:id/blocked-offers/all', auth({ required: true }), prosumerController.getAllBlockedOffers);

/**
 * @swagger
 * /v3/prosumers/{id}/blocked-offers/server/{serverName}/{offerId}:
 *   delete:
 *     summary: Unblock an offer from a specific server
 *     tags: [Prosumer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The prosumer id
 *       - in: path
 *         name: serverName
 *         schema:
 *           type: string
 *         required: true
 *         description: Server identifier
 *       - in: path
 *         name: offerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Offer ID to unblock
 *     responses:
 *       200:
 *         description: Offer successfully unblocked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/prosumers/:id/blocked-offers/server/:serverName/:offerId', auth({ required: true }), prosumerController.unblockOfferByServer);

/**
 * @swagger
 * /v3/prosumers/delBookmark/id:
 *   delete: 
 *     summary: delete an id in bookmarked list
 *     tags: [Prosumer]
  *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: The news id
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string 
 *         required: true
 *         description: The owner username
 *     responses:
 *       200:
 *         description: id correctly removed from prosumer bookmarked list.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 *       401:
 *         description: Unhautorized
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.delete('/prosumers/delBookmark/id/', auth({ required: true }), prosumerController.deleteIdBookmarkedList);

/**
 * @swagger
 * /v3/prosumers/{id}/:
 *   delete: 
 *     summary: delete a prosumer
 *     tags: [Prosumer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: the Prosumer id
 *     responses:
 *       200:
 *         description: Prosumer successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
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
 *         description: Unhautorized
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                      message:
 *                          type: string
 *       404:
 *         description: Prosumer not found.
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

router.delete('/prosumers/:id', auth({ required: true }), prosumerController.deleteProsumer);

module.exports = router;
