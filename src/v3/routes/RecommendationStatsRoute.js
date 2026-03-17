const express = require("express");
const router = express.Router();
const recommendationStatsController = require("../controllers/RecommendationStatsController.js");
const config = require('../config.js');
const auth = require("../../middlewares/optionalAuth.js");

const tokenRequired = config.TOKEN_REQUIRED;

/**
 * @swagger
 * tags:
 *   name: RecommendationStats
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RecommendationStats:
 *       type: object
 *       properties:
 *         _id:
 *           type: ObjectId
 *           description: "Unique identifier for the recommendation stats document"
 *         name:
 *           type: string
 *           description: "Name or identifier of the recommendation stats (e.g., username)"
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: "Date of the last update"
 *         totalOffersCreated:
 *           type: number
 *           description: "Total number of offers created by the user"
 *         assetType:
 *           type: object
 *           properties:
 *             Fruit:
 *               type: number
 *             Vegetable:
 *               type: number
 *             Crop:
 *               type: number
 *             Machinery:
 *               type: number
 *             Transport:
 *               type: number
 *             Inputs:
 *               type: number
 *             Storage:
 *               type: number
 *             Labor:
 *               type: number
 *             Other services:
 *               type: number
 *           description: "Map of asset categories and their associated counts"
 */

/**
 * @swagger
 * /v3/recommendationstats:
 *   post: 
 *     summary: Create a new RecommendationStats document.
 *     tags: [RecommendationStats]
 *     requestBody:
 *       description: RecommendationStats data.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: 
 *                 type: string
 *               totalOffersCreated: 
 *                 type: number
 *               assetType:
 *                 type: object
 *                 properties:
 *                   Fruit:
 *                     type: number
 *                   Vegetable:
 *                     type: number
 *                   Crop:
 *                     type: number
 *                   Machinery:
 *                     type: number
 *                   Transport:
 *                     type: number
 *                   Inputs:
 *                     type: number
 *                   Storage:
 *                     type: number
 *                   Labor:
 *                     type: number
 *                   Other services:
 *                     type: number
 *     responses:
 *       200:
 *         description: New RecommendationStats document created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecommendationStats'
 *       500:
 *         description: Error from RESILINK server.
 */
router.post('/recommendationstats/', auth({ required: true }), recommendationStatsController.createRecommendationStats);

/**
 * @swagger
 * /v3/recommendationstats:
 *   get:
 *     summary: Retrieve all RecommendationStats documents.
 *     tags: [RecommendationStats]
 *     responses:
 *       200:
 *         description: List of all RecommendationStats.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecommendationStats'
 *       500:
 *         description: Error from RESILINK server.
 */
router.get('/recommendationstats/', auth({ required: true }), recommendationStatsController.getAllRecommendationStats);

/**
 * @swagger
 * /v3/recommendationstats/{name}:
 *   get:
 *     summary: Retrieve a RecommendationStats document by name.
 *     tags: [RecommendationStats]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string 
 *         required: true
 *         description: The name associated with the RecommendationStats document
 *     responses:
 *       200:
 *         description: RecommendationStats found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecommendationStats'
 *       404:
 *         description: RecommendationStats not found.
 *       500:
 *         description: Error from RESILINK server.
 */
router.get('/recommendationstats/:name/', auth({ required: true }), recommendationStatsController.getRecommendationStatsByName);

/**
 * @swagger
 * /v3/recommendationstats/{name}:
 *   put: 
 *     summary: Update a RecommendationStats document by name.
 *     tags: [RecommendationStats]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string 
 *         required: true
 *         description: The name of the RecommendationStats to update
 *     requestBody:
 *       description: Updated RecommendationStats data.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalOffersCreated: 
 *                 type: number
 *               assetType:
 *                 type: object
 *                 properties:
 *                   Fruit:
 *                     type: number
 *                   Vegetable:
 *                     type: number
 *                   Crop:
 *                     type: number
 *                   Machinery:
 *                     type: number
 *                   Transport:
 *                     type: number
 *                   Inputs:
 *                     type: number
 *                   Storage:
 *                     type: number
 *                   Labor:
 *                     type: number
 *                   Other services:
 *                     type: number
 *     responses:
 *       200:
 *         description: Update successful.
 *       500:
 *         description: Error from RESILINK server.
 */
router.put('/recommendationstats/:name/', auth({ required: true }), recommendationStatsController.updateRecommendationStats);

/**
 * @swagger
 * /v3/recommendationstats/{name}:
 *   delete:
 *     summary: Delete a RecommendationStats document by name.
 *     tags: [RecommendationStats]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string 
 *         required: true
 *         description: The name of the RecommendationStats document
 *     responses:
 *       200:
 *         description: Deletion successful.
 *       500:
 *         description: Error from RESILINK server.
 */
router.delete('/recommendationstats/:name/', auth({ required: true }), recommendationStatsController.deleteRecommendationStats);

/**
 * @swagger
 * /v3/recommendationstats/{name}/increment/{assetType}:
 *   patch:
 *     summary: Increment the count of a specific assetType in a RecommendationStats document.
 *     tags: [RecommendationStats]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string 
 *         required: true
 *         description: The name of the RecommendationStats document
 *       - in: path
 *         name: assetType
 *         schema:
 *           type: string 
 *           enum: [Fruit, Vegetable, Crop, Machinery, Transport, Inputs, Storage, Labor, "Other services"]
 *         required: true
 *         description: The asset type whose count will be incremented
 *     responses:
 *       200:
 *         description: Increment successful.
 *       500:
 *         description: Error from RESILINK server.
 */
router.patch('/recommendationstats/:name/increment/:assetType', auth({ required: true }), recommendationStatsController.incrementAssetTypeCount);

module.exports = router;
