
const express = require("express");
const prosumerController = require("../controllers/ProsummerController.js");
const router = express.Router();

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
 *         specificActivity: ""
 *         location: ""
 *         email: username@hotmail.com
 *         phoneNumber: 1023456789    
 */

/**
 * @swagger
 * /v1/ODEP/prosumers/all:
 *   get:
 *     summary: Get all prosumers without RESILINK DB data
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
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The prosumer's unique identifier
 *                   sharingAccount:
 *                     type: number
 *                     description: The number of sharing accounts the prosumer has
 *                   balance:
 *                     type: number
 *                     description: The balance of the prosumer's account
 *       400:
 *         description: Bad Request
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
 *         description: Not Found
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

router.get('/ODEP/prosumers/all', prosumerController.getAllProsummer); 

/**
 * @swagger
 * /v1/prosumers/all:
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
 *                        type: string
 *                      specificActivity:
 *                        type: string
 *                      location:
 *                          type: string
 *                      bookMarked:
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
router.get('/prosumers/all', prosumerController.getAllProsummerCustom); 

/**
 * @swagger
 * /v1/ODEP/prosumers/{id}:
 *   get:
 *     summary: Get a prosumer by id without RESILINK DB data
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

router.get('/ODEP/prosumers/:id/', prosumerController.getOneProsumer);

/**
 * @swagger
 * /v1/prosumers/{id}:
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

router.get('/prosumers/:id/', prosumerController.getOneProsummerCustom);

/**
 * @swagger
 * /v1/prosumers/new:
 *   post: 
 *     summary: Create a new Prosumer
 *     tags: [Prosumer]
 *     requestBody:
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
 *               properties:   # Correction here (indentation)
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad Request 
 *         content:
 *           application/json:
 *             schema:
 *               type: object   # Changed from array to object
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

router.post('/prosumers/new/', prosumerController.createProsumer);

/**
 * @swagger
 * /v1/prosumers/newAccount:
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
 *               gps:
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
 *         description: unhautorized 
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

router.post('/prosumers/newAccount/', prosumerController.createProsumerCustom);

/**
 * @swagger
 * /v1/ODEP/prosumers/{id}/:
 *   delete: 
 *     summary: delete a prosumer only in ODEP
 *     tags: [Prosumer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
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

router.delete('/ODEP/prosumers/:id', prosumerController.deleteOneProsummer);

/**
 * @swagger
 * /v1/ODEP/prosumers/{id}/balance:
 *   patch: 
 *     summary: credit a prosumer balance in ODEP
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

router.patch('/ODEP/prosumers/:id/balance', prosumerController.patchBalanceProsumer);


/**
 * @swagger
 * /v1/prosumers/{prosumerId}:
 *   put: 
 *     summary: Update an existing user in ODEP and RESILINK
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
 *       401:
 *         description: Unauthorized.
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

router.put('/prosumers/:prosumerId/', prosumerController.putUserProsumerPersonnalData);

/**
 * @swagger
 * /v1/prosumers/{id}/activityDomain:
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
 *         description: Prosumer balance successfully credited.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
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

router.patch('/prosumers/:id/activityDomain', prosumerController.patchActivityDomainProsummer);

/**
 * @swagger
 * /v1/ODEP/prosumers/{id}/sharingAccount:
 *   patch: 
 *     summary: credit a prosumer sharing account in ODEP
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

router.patch('/ODEP/prosumers/:id/sharingAccount', prosumerController.patchSharingProsumer);

/**
 * @swagger
 * /v1/prosumers/{id}/addBookmark:
 *   patch: 
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

router.patch('/prosumers/:id/addBookmark', prosumerController.patchBookmarkProsumer);

/**
 * @swagger
 * /v1/prosumers/{id}/addBlockedOffer:
 *   patch: 
 *     summary: add an id to the blocked offers list of the prosumer
 *     tags: [Prosumer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: username
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               offerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prosumer blocked offers list succesfully updated.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
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

router.patch('/prosumers/:id/addBlockedOffer', prosumerController.patchBlockedOfferProsumer);

/**
 * @swagger
 * /v1/prosumers/delBlockedOffer/id:
 *   delete: 
 *     summary: delete an id in blocked offers list
 *     tags: [Prosumer]
  *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: The offer id
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string 
 *         required: true
 *         description: The owner username
 *     responses:
 *       200:
 *         description: id correctly removed from prosumer blocked offers list.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
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

router.delete('/prosumers/delBlockedOffer/id/', prosumerController.deleteIdBlockedOfferList);

/**
 * @swagger
 * /v1/prosumers/delBookmark/id:
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

router.delete('/prosumers/delBookmark/id/', prosumerController.deleteIdBookmarkedList);

/**
 * @swagger
 * /v1/prosumers/{id}/:
 *   delete: 
 *     summary: delete a prosumer in ODEP and RESILINK DB
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
 *         description: Prosumer successfully deleted in ODEP & RESILINK
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

router.delete('/prosumers/:id', prosumerController.deleteProsumerODEPRESILINK);

module.exports = router;
