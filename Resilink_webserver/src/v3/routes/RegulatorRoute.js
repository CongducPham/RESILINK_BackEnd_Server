const express = require("express");
const regulatorController = require("../controllers/RegulatorController");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Regulator
 *   description: User's State
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Regulator:
 *       type: object
 *       required:
 *         - id
 *         - assetTypes
 *       properties:
 *         id:
 *           type: string
 *           description: "The unique identifier of the regulator"
 *         assetTypes:
 *           type: array
 *           description: "The asset types that the regulator can regulate"
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /v3/ODEP/regulators:
 *   post: 
 *     summary: Create a new Regulator
 *     tags: [Regulator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: 
 *                  type: string
 *               assetTypes : 
 *                  type: array
 *                  items:
 *                    type: string
 *     responses:
 *       201:
 *         description: Regulator successfully created
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
router.post('/ODEP/regulators', regulatorController.createRegulator);

/**
 * @swagger
 * /v3/ODEP/regulators/all:
 *   get:
 *     summary: get all regulators
 *     tags: [Regulator]
 *     responses:
 *       200:
 *         description: Ok
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                     id: 
 *                       type: string
 *                     assetTypes : 
 *                       type: array
 *                       items:
 *                         type: string
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
router.get('/ODEP/regulators/all', regulatorController.getAllRegulator);

/**
 * @swagger
 * /v3/ODEP/regulators/{id}:
 *   get:
 *     summary: Get a regulator by id
 *     tags: [Regulator]
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
 *                  id: 
 *                    type: string
 *                  assetTypes : 
 *                    type: array
 *                    items:
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
router.get('/ODEP/regulators/:id', regulatorController.getOneRegulator);

/**
 * @swagger
 * /v3/ODEP/regulators/{id}:
 *   patch: 
 *     summary: update regulator liste of asset types he is accountable on
 *     tags: [Regulator]
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
 *                assetTypes:
 *                  type: array
 *                  items:
 *                      type: string
 *     responses:
 *       200:
 *         description: Regulator successfully updated
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
router.patch('/ODEP/regulators/:id', regulatorController.patchOneRegulator);

/**
 * @swagger
 * /v3/ODEP/regulators/{id}/:
 *   delete: 
 *     summary: delete a regulator
 *     tags: [Regulator]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string 
 *         required: true
 *     responses:
 *       200:
 *         description: Regulator successfully deleted
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
router.delete('/ODEP/regulators/:id', regulatorController.deleteRegulator);

module.exports = router;

