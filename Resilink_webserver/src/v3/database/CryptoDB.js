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