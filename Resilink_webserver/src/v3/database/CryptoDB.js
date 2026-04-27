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

const crypto = require('crypto');
const config = require('../config.js');

const _encryptionKey = Buffer.from(config.ENCRYPTION_KEY, 'hex');

if (!_encryptionKey) {
  throw new Error('Encryption key is missing');
}

/**
 * Encrypts a string using AES-256-CBC with a random IV.
 * Returns the IV and encrypted data concatenated with a colon separator.
 *
 * @param {string} entity - The plaintext string to encrypt
 * @returns {string} - The encrypted string in format "iv:encryptedData"
 */
function encryptAES(entity) {

  // Generate a 16-byte initialization vector (IV)
    const iv = crypto.randomBytes(16);

    // Create a cipher with aes-256-cbc, the key must be in Buffer and the IV must be passed.
    const cipher = crypto.createCipheriv('aes-256-cbc', _encryptionKey, iv);

    let encrypted = cipher.update(entity, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return the IV and encrypted data (the IV is required for decryption)
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts an AES-256-CBC encrypted string produced by encryptAES.
 * Expects the input in format "iv:encryptedData".
 *
 * @param {string} encryptedEntity - The encrypted string to decrypt
 * @returns {string} - The original plaintext string
 */
function decryptAES(encryptedEntity) {
  
    // Separate IV and encrypted content
    const parts = encryptedEntity.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];

    // Create a decipher with aes-256-cbc, use key and IV
    const decipher = crypto.createDecipheriv('aes-256-cbc', _encryptionKey, iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = {
    encryptAES,
    decryptAES
  }