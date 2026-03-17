const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/RatingController.js");
const config = require('../config.js');
const auth = require("../../middlewares/optionalAuth.js");

const tokenRequired = config.TOKEN_REQUIRED;

/**
 * @swagger
 * tags:
 *   name: Rating
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Rating:
 *       type: object
 *       properties:
 *         _id:
 *           type: ObjectId
 *           description: "Unique identifier for the rating "
 *         userId:
 *           type: string
 *           description: "The owner id"
 *         rating:
 *           type: string
 *           description: "Value of the rating"
 */

/**
 * @swagger
 * /v3/rating:
 *   post: 
 *     summary: create a rating.
 *     tags: [Rating]
 *     requestBody:
 *       description: rating's value.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: 
 *                 type: string
 *               rating: 
 *                 type: double
 *     responses:
 *       200:
 *         description: New Rating.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 userId: 
 *                    type: string
 *                 rating: 
 *                    type: double
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

router.post('/rating/', auth({ required: true }), ratingController.createRating);

/**
 * @swagger
 * /v3/rating/{userId}:
 *   put: 
 *     summary: update a rating by using a user id.
 *     tags: [Rating]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string 
 *         required: true
 *         description: the Rating id
 *     requestBody:
 *       description: offer's data.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                rating: 
 *                  type: double
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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

router.put('/rating/:userId/', auth({ required: true }), ratingController.updateRating);

/**
 * @swagger
 * /v3/rating/all:
 *   get: 
 *     summary: Get all ratings.
 *     tags: [Rating]
 *     responses:
 *       200:
 *         description: All ratings.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                    _id:
 *                      type: string
 *                    userId: 
 *                      type: string
 *                    rating: 
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

router.get('/rating/all', auth({ required: tokenRequired }), ratingController.getAllRating);

/**
 * @swagger
 * /v3/rating/average:
 *   get: 
 *     summary: Get the rating's average .
 *     tags: [Rating]
 *     responses:
 *       200:
 *         description: rating's average.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                    averageRating:
 *                      type: double
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

router.get('/rating/average', auth({ required: tokenRequired }), ratingController.getAverageRating);

/**
 * @swagger
 * /v3/rating/{userId}:
 *   get: 
 *     summary: Get rating from a user id
 *     tags: [Rating]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string 
 *         required: true
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
 *                    _id:
 *                      type: string
 *                    userId: 
 *                      type: string
 *                    rating: 
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

router.get('/rating/:userId', auth({ required: tokenRequired }), ratingController.getRatingFromUserId);

/**
 * @swagger
 * /v3/rating/{userId}/:
 *   delete: 
 *     summary: delete a rating
 *     tags: [Rating]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string 
 *         required: true
 *     responses:
 *       200:
 *         description: Rating successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
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

router.delete('/news/:userId/', auth({ required: true }), ratingController.deleteRating);

module.exports = router;