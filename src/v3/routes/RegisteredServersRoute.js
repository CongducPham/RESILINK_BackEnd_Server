const express = require("express");
const router = express.Router();
const registeredServersController = require("../controllers/RegisteredServersController.js");
const config = require('../config.js');
const auth = require("../../middlewares/optionalAuth.js");
const serverAuth = require('../../middlewares/serverAuth.js');

const tokenRequired = config.TOKEN_REQUIRED;

/**
 * @swagger
 * tags:
 *   name: RegisteredServers
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisteredServer:
 *       type: object
 *       properties:
 *         _id:
 *           type: ObjectId
 *         serverName:
 *           type: string
 *           description: "Friendly name of the server"
 *         serverUrl:
 *           type: string
 *           description: "Base URL of the server"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /v3/registeredservers:
 *   post:
 *     summary: Register a new server.
 *     tags: [RegisteredServers]
 *     security:
 *       - networkKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serverName:
 *                 type: string
 *               serverUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Server registered.
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
router.post('/registeredservers/', serverAuth, registeredServersController.createRegisteredServer);

/**
 * @swagger
 * /v3/registeredservers/global:
 *   post:
 *     summary: Register a new server in main server.
 *     tags: [RegisteredServers]
 *     security:
 *       - networkKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serverName:
 *                 type: string
 *               serverUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Server registered.
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
router.post('/registeredservers/global', serverAuth, registeredServersController.createGlobalRegisteredServer);

/**
 * @swagger
 * /v3/registeredservers:
 *   get:
 *     summary: Retrieve all registered servers.
 *     tags: [RegisteredServers]
 *     responses:
 *       200:
 *         description: List of servers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/RegisteredServer"
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
router.get('/registeredservers/', auth({ required: tokenRequired }), registeredServersController.getAllRegisteredServers);

/**
 * @swagger
 * /v3/registeredservers/global:
 *   get:
 *     summary: Retrieve all registered servers in main server.
 *     tags: [RegisteredServers]
 *     responses:
 *       200:
 *         description: List of servers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/RegisteredServer"
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
router.get('/registeredservers/global', auth({ required: tokenRequired }), registeredServersController.getAllGlobalRegisteredServers);

/**
 * @swagger
 * /v3/registeredservers/{serverName}:
 *   get:
 *     summary: Retrieve a server by name.
 *     tags: [RegisteredServers]
 *     parameters:
 *       - name: serverName
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Server found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/RegisteredServer"
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
router.get('/registeredservers/:serverName/', auth({ required: tokenRequired }), registeredServersController.getRegisteredServerByName);

/**
 * @swagger
 * /v3/registeredservers/{serverName}:
 *   put:
 *     summary: Update server by name.
 *     tags: [RegisteredServers]
 *     parameters:
 *       - name: serverName
 *         in: path
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serverUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated successfully.
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
router.put('/registeredservers/:serverName/', auth({ required: true }), registeredServersController.updateRegisteredServer);

/**
 * @swagger
 * /v3/registeredservers/{serverName}:
 *   delete:
 *     summary: Delete a registered server.
 *     tags: [RegisteredServers]
 *     parameters:
 *       - name: serverName
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Deleted.
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
router.delete('/registeredservers/:serverName/', auth({ required: true }), registeredServersController.deleteRegisteredServer);

module.exports = router;
