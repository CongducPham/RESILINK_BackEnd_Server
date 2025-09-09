const express = require("express");
const assetTypeController = require("../controllers/AssetTypeController.js");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AssetType
 */

 /**
 * @swagger
 * components:
 *   schemas:
 *     AssetType:
 *       type: object
 *       required:
 *         - description
 *         - nature
 *         - subjectOfQuantity
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           description: "Description of the asset type"
 *         nature:
 *           type: string
 *           enum:
 *             - measurableByQuantity
 *             - measurableByTime
 *           description: "The nature of the asset."
 *         unit:
 *           type: string
 *         subjectOfQuantity:
 *           type: boolean
 *           description: "Indicates if the asset is subjectOfQuantity (true/false)"
 *         regulator:
 *           type: string
 *           description: "The regulator associated with the asset, if applicable"
 *         sharingIncentive:
 *           type: boolean
 *           description: "Indicates if there is a sharing incentive for the asset (true/false)"
 *         assetDataModel:
 *           type: array
 *           description: "A list of specific attributes for the asset"
 *           items:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - mandatory
 *             properties:
 *               name:
 *                 type: string
 *                 description: "The name of the specific attribute"
 *               type:
 *                 type: string
 *                 enum:
 *                   - string
 *                   - numeric
 *                   - boolean
 *                   - listAsset
 *                   - geographicPoint
 *                 description: "The type of the specific attribute. Enum values: 'string', 'numeric', 'boolean', 'listAsset', 'geographicPoint'"
 *               mandatory:
 *                 type: string
 *                 enum:
 *                   - true
 *                   - false
 *                 description: "Indicates if this attribute is mandatory (Enum: 'true', 'false')"
 *               valueList:
 *                 type: string
 *                 description: "The list of values if hasValueList is true. Example: 'value1,value2,value3'"
 */

/**
 * @swagger
 * /v1/assetTypes/all:
 *   get:
 *     summary: Get all asset types
 *     tags: [AssetType]
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
 *                      name:
 *                        type: string
 *                      description:
 *                        type: string
 *                      nature:
 *                        type: string
 *                        enum:
 *                          - measurableByQuantity
 *                          - measurableByTime
 *                      unit:
 *                        type: string
 *                      subjectOfQuantity:
 *                        type: boolean
 *                      regulator:
 *                        type: string
 *                      sharingIncentive:
 *                        type: boolean
 *                      assetDataModel:
 *                        type: array
 *                        items:
 *                            type: object
 *                            properties:
 *                                name:
 *                                    type: string
 *                                type:
 *                                    type: string
 *                                mandatory:
 *                                    type: string
 *                                    enum:
 *                                      - true
 *                                      - false
 *                                valueList:
 *                                    type: string
 *                                    example: "Value1,Value2,Value3"
 *       400:
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
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

router.get('/assetTypes/all', assetTypeController.getAllAssetTypes);

/**
 * @swagger
 * /v1/assetTypes/{id}:
 *   get:
 *     summary: Get an asset type by id
 *     tags: [AssetType]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *         description: the assetType id
 *     responses:
 *       200:
 *         description: Ok
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name: 
 *                    type: string
 *                 description:
 *                    type: string
 *                 nature : 
 *                    type: string
 *                    enum:
 *                     - measurableByQuantity
 *                     - measurableByTime
 *                 unit:
 *                    type: string
 *                 subjectOfQuantity:
 *                    type: boolean
 *                 regulator:
 *                    type: string
 *                 sharingIncentive:
 *                    type: boolean
 *                 assetDataModel: 
 *                    type: array
 *                    items:
 *                        type: object
 *                        properties:
 *                            name:
 *                                type: string
 *                            type:
 *                                type: string
 *                            mandatory:
 *                                type: string
 *                                enum:
 *                                    - true
 *                            valueList:
 *                                type: string
 *                                example: "Value1,Value2,Value3"
 *       400:
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
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

router.get('/assetTypes/:id/', assetTypeController.getOneAssetTypes);

/**
 * @swagger
 * /v1/assetTypes/{id}:
 *   put:
 *     summary: update asset type attributes
 *     tags: [AssetType]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *     requestBody:
 *       description: The prosumer's informations.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                  type: string
 *               nature : 
 *                  type: string
 *                  enum:
 *                   - measurableByQuantity
 *                   - measurableByTime
 *               unit:
 *                  type: string
 *               subjectOfQuantity:
 *                  type: boolean
 *               regulator:
 *                  type: string
 *               sharingIncentive:
 *                  type: boolean
 *               assetDataModel: 
 *                  type: array
 *                  items:
 *                      type: object
 *                      properties:
 *                          name:
 *                              type: string
 *                          type:
 *                              type: string
 *                          mandatory:
 *                              type: string
 *                              enum:
 *                                  - true
 *                                  - false
 *                          valueList:
 *                              type: string
 *                              example: "Value1,Value2,Value3"
 *     responses:
 *       200:
 *         description: AssetType successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
 *       400:
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
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

router.put('/assetTypes/:id/', assetTypeController.putAssetTypes);

/**
 * @swagger
 * /v1/assetTypes/{id}/:
 *   delete: 
 *     summary: delete an asset type
 *     tags: [AssetType]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *     responses:
 *       200:
 *         description: AssetType successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
 *       400:
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
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

router.delete('/assetTypes/:id/', assetTypeController.deleteAssetTypes);

/**
 * @swagger
 * /v1/assetTypes/all/mapFormat/:
 *   get:
 *     summary: Get all asset types but with the asset type as a key with his value associate
 *     tags: [AssetType]
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
 *                      name:
 *                        type: string
 *                      description:
 *                        type: string
 *                      nature:
 *                        type: string
 *                        enum:
 *                          - measurableByQuantity
 *                          - measurableByTime
 *                      unit:
 *                        type: string
 *                      subjectOfQuantity:
 *                        type: boolean
 *                      regulator:
 *                        type: string
 *                      sharingIncentive:
 *                        type: boolean
 *                      assetDataModel:
 *                        type: array
 *                        items:
 *                            type: object
 *                            properties:
 *                                name:
 *                                    type: string
 *                                type:
 *                                    type: string
 *                                mandatory:
 *                                    type: string
 *                                    enum:
 *                                      - true
 *                                      - false
 *                                valueList:
 *                                    type: string
 *                                    example: "Value1,Value2,Value3"
 *       400:
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
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

router.get('/assetTypes/all/mapFormat', assetTypeController.getAllAssetTypesResilink)

/**
 * @swagger
 * /v1/assetTypes:
 *   post: 
 *     summary: Create a new assetType
 *     tags: [AssetType]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: 
 *                  type: string
 *               description:
 *                  type: string
 *               nature : 
 *                  type: string
 *                  enum:
 *                   - measurableByQuantity
 *                   - measurableByTime
 *               unit:
 *                  type: string
 *               subjectOfQuantity:
 *                  type: boolean
 *               regulator:
 *                  type: string
 *               sharingIncentive:
 *                  type: boolean
 *               assetDataModel: 
 *                  type: array
 *                  items:
 *                      type: object
 *                      properties:
 *                          name:
 *                              type: string
 *                          type:
 *                              type: string
 *                          mandatory:
 *                              type: string
 *                              enum:
 *                                  - true
 *                                  - false
 *                          valueList:
 *                              type: string
 *                              example: "Value1,Value2,Value3"
 *     responses:
 *       200:
 *         description: AssetType successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
 *       400:
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                      type: string
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

router.post('/assetTypes/', assetTypeController.createAssetTypes);

module.exports = router;