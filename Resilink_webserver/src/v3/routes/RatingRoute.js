/*
*  This file is part of the RESILINK back-end server developed by the PRIMA RESILINK (2022-2026) project. 
* RESILINK (2022-2026) is a project funded by the PRIMA Programme supported by the European Union. The project web site is https://resilink.eu/"
*  
*
*  Copyright (C) 2026 Axel Cazaux, University of Pau, UPPA
*
*  This program is free software: you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  You should have received a copy of the GNU General Public License
*  along with the program.  If not, see <http://www.gnu.org/licenses/>.
*
*****************************************************************************/

const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/RatingController.js");

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
 *                 type: number
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
 *                    type: number
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

router.post('/rating/', ratingController.createRating);

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
 *                  type: number
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

router.put('/rating/:userId/', ratingController.updateRating);

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

router.get('/rating/all', ratingController.getAllRating);

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
 *                    averageRating
 *                      type: number
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

router.get('/rating/average', ratingController.getAverageRating);

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

router.get('/rating/:userId', ratingController.getRatingFromUserId);

/**
 * @swagger
 * /v3/rating/{userId}:
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

router.delete('/rating/:userId', ratingController.deleteRating);

module.exports = router;