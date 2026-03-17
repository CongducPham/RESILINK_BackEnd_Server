const express = require("express");
const router = express.Router();
const FavoriteServersController = require("../controllers/FavoriteServersController.js");
const config = require('../config.js');
const auth = require("../../middlewares/optionalAuth.js");

const tokenRequired = config.TOKEN_REQUIRED;

/**
 * @swagger
 * tags:
 *   name: FavoriteServers
 *   description: Manage user favorite local servers
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FavoriteServers:
 *       type: object
 *       required:
 *         - username
 *       properties:
 *         id:
 *           type: string
 *           description: Username of the owner of this favorite list
 *         servers:
 *           type: array
 *           items:
 *             type: string
 *           description: List of server identifiers added as favorites
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the last update
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the created entity
 *       example:
 *         id: "john"
 *         servers: ["serverA", "serverB"]
 *         lastUpdated: "2025-01-12T14:52:32.123Z"
 *         createdAt: "2025-11-05T10:20:30.456Z"
 */

/**
 * @swagger
 * /v3/favoriteServers:
 *   post:
 *     summary: Create the favorite server list for a user
 *     tags: [FavoriteServers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Username of the owner of this favorite list
 *               servers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: List of server identifiers added as favorites
 *     responses:
 *       200:
 *         description: Favorite list created successfully
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
 *       401:
 *         description: Unauthorized
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
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string 
 */
router.post("/favoriteServers/", auth({ required: true }), FavoriteServersController.createFavoriteServers);

/**
 * @swagger
 * /v3/favoriteServers:
 *   get:
 *     summary: Get all favorite lists
 *     tags: [FavoriteServers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users' favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/FavoriteServers"
 *       401:
 *         description: Unauthorized
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
 *         description: Not found
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
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string 
 */
router.get("/favoriteServers/", auth({ required: true }), FavoriteServersController.getAllFavoriteServers);

/**
 * @swagger
 * /v3/favoriteServers/{username}:
 *   get:
 *     summary: Get a user's favorite server list
 *     tags: [FavoriteServers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         description: Username of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's favorite list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/FavoriteServers"
 *       401:
 *         description: Unauthorized
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
 *         description: Not found
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
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string 
 */
router.get("/favoriteServers/:username", auth({ required: true }), FavoriteServersController.getFavoriteServers);

/**
 * @swagger
 * /v3/favoriteServers/{username}:
 *   put:
 *     summary: Replace the entire favorite list for a user
 *     tags: [FavoriteServers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         description: Username to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               servers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: New list of favorite server identifiers
 *     responses:
 *       200:
 *         description: Favorite list updated
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
 *       401:
 *         description: Unauthorized
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
 *         description: Not found
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
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string 
 */
router.put("/favoriteServers/:username", auth({ required: true }), FavoriteServersController.updateFavoriteServers);

/**
 * @swagger
 * /v3/favoriteServers/{username}/add/{serverName}:
 *   post:
 *     summary: Add a server to a user's favorite list
 *     tags: [FavoriteServers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Owner of the favorite list
 *       - name: serverName
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the server to add
 *     responses:
 *       200:
 *         description: Server added to favorites
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
 *       401:
 *         description: Unauthorized
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
 *         description: Not found
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
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string 
 */
router.post("/favoriteServers/:username/add/:serverName", auth({ required: true }), FavoriteServersController.addFavoriteServer);

/**
 * @swagger
 * /v3/favoriteServers/{username}/remove/{serverName}:
 *   delete:
 *     summary: Remove a server from a user's favorite list
 *     tags: [FavoriteServers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: serverName
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Server removed from favorites
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
 *       401:
 *         description: Unauthorized
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
 *         description: Not found
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
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string 
 */
router.delete("/favoriteServers/:username/remove/:serverName", auth({ required: true }), FavoriteServersController.removeFavoriteServer);

/**
 * @swagger
 * /v3/favoriteServers/{username}:
 *   delete:
 *     summary: Delete the favorite list of a user
 *     tags: [FavoriteServers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorite list deleted
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
 *         description: Unauthorized
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
 *         description: Not found
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
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   code:
 *                       type: number
 *                   message:
 *                       type: string 
 */
router.delete("/favoriteServers/:username", auth({ required: true }), FavoriteServersController.deleteFavoriteServers);

module.exports = router;
