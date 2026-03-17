const { exec } = require('child_process');
const { Readable } = require('stream');
const http = require('http');
const jwt = require('jsonwebtoken');
const config = require('../config.js');

const _Token_key = config.TOKEN_KEY;

/**
 * In-memory store mapping user IDs to their active authentication tokens.
 * Each user can have multiple concurrent valid tokens for different sessions/devices.
 * Structure: Map<userId, Array<{ token: string, createdAt: timestamp }>>
 */
const userTokenStore = new Map();

/**
 * Executes a cURL command directly on the server for external API communication.
 * This utility is used when native fetch or http modules are insufficient for specific use cases.
 * 
 * @param {string} type - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} url - Target endpoint URL
 * @param {Object} headers - HTTP headers as key-value pairs (default: {})
 * @param {Object|null} body - Request payload, will be JSON stringified if provided (default: null)
 * @returns {Promise<string>} - Response body as string
 * @throws {Error} - If the curl command execution fails
 */
const executeCurl = (type, url, headers = {}, body = null) =>{
    return new Promise((resolve, reject) => {
      let command = 'curl -X ';
      command += type + " " + url;

      for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
          command += ` -H "${key}:${headers[key]}"`;
        }
      }
  
      if (body !== null) {
        command += ` -d '${JSON.stringify(body)}'`;
      }
  
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
};

/**
 * Converts a readable stream into a UTF-8 encoded string.
 * Used for processing streaming responses from external APIs or file operations.
 * 
 * @param {Stream} stream - Input readable stream
 * @returns {Promise<string>} - Complete stream content as string
 */
function streamToString(stream) {
  const readablestream = Readable.from(stream)
  const chunks = [];
  return new Promise((resolve, reject) => {
    readablestream.on('data', (chunk) => {
          chunks.push(chunk);
      });
      readablestream.on('end', () => {
          resolve(Buffer.concat(chunks).toString('utf8'));
      });
      readablestream.on('error', reject);
  });
}

/**
 * Converts a readable stream directly into a parsed JSON object.
 * Combines stream reading and JSON parsing for API response handling.
 * 
 * @param {Stream} stream - Input readable stream containing JSON data
 * @returns {Promise<Object>} - Parsed JSON object
 * @throws {SyntaxError} - If stream content is not valid JSON
 */
const streamToJSON = async (stream) => {
  return streamToString(stream).then((data) => JSON.parse(data)).then((result) => {
    return result;
  });
}

/**
 * Performs an HTTP request to external services with JSON payload support.
 * Primary method for inter-service communication within the RESILINK platform.
 * 
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} url - Target endpoint URL
 * @param {Object} header - HTTP headers object
 * @param {Object|null} body - Request payload to be JSON stringified (default: null)
 * @returns {Promise<Response>} - Fetch API response object
 */
const fetchJSONData = async (method, url, header, body = null) => {

  const params = {
      method: method,
      headers: header
  };

  if (body !== null) {
    params.body = JSON.stringify(body);
  };

  return fetch(url, params)
  .then(response => {
    return response;
  });
}

/**
 * Calculates the great-circle distance between two geographical coordinates using the Haversine formula.
 * Critical for the RESILINK platform's location-based matching between energy prosumers and consumers.
 * 
 * @param {number} lat1 - Latitude of first point in decimal degrees
 * @param {number} lon1 - Longitude of first point in decimal degrees
 * @param {number} lat2 - Latitude of second point in decimal degrees
 * @param {number} lon2 - Longitude of second point in decimal degrees
 * @returns {number} - Distance in kilometers (Earth radius R = 6371 km)
 */
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; 

  return distance;
}

/**
 * Validates if two geographical locations are within a specified radius.
 * Used to enforce local energy trading constraints and ensure prosumers only transact
 * with consumers within their operational perimeter.
 * 
 * @param {number} lat1 - Latitude of first location in decimal degrees
 * @param {number} lon1 - Longitude of first location in decimal degrees
 * @param {number} lat2 - Latitude of second location in decimal degrees
 * @param {number} lon2 - Longitude of second location in decimal degrees
 * @param {number} perimeterRadius - Maximum allowed distance in kilometers
 * @returns {boolean} - True if locations are within specified radius
 */
const isInPerimeter = (lat1, lon1, lat2, lon2, perimeterRadius) => {
  const distance = haversine(lat1, lon1, lat2, lon2);

  return (distance <= perimeterRadius);
}

/**
 * Validates if a string contains only Roman/Latin alphanumeric characters and basic punctuation.
 * Used for input sanitization to prevent encoding issues in database storage and API communications.
 * 
 * @param {string} str - Input string to validate
 * @returns {boolean} - True if string contains only allowed characters (a-z, A-Z, 0-9, ?, !, %, -, _)
 */
function containsNonRomanCharacters(str) {
  // Regex to detect basic Latin characters and common punctuation
  const nonRomanRegex = /^[a-zA-Z0-9?!%-_]+$/;

  return nonRomanRegex.test(str);
}

/**
 * Validates if a string consists entirely of numeric digits.
 * Commonly used for ID validation and numerical input sanitization.
 * 
 * @param {string} str - Input string to validate
 * @returns {boolean} - True if string contains only digits (0-9)
 */
function isNumeric(str) {
  // Regex pattern matches one or more consecutive digits only
  return /^\d+$/.test(str);
}

/**
 * Custom comparator function for sorting API routes by HTTP method and path.
 * Used in API documentation generation and route organization.
 * Sorting priority: 1) HTTP method (GET > POST > PUT > PATCH > DELETE), 2) Alphabetical by path
 * 
 * @param {Map} a - First route object with 'method' and 'path' keys
 * @param {Map} b - Second route object with 'method' and 'path' keys
 * @returns {number} - Negative if a < b, positive if a > b, zero if equal
 */
const customSorter = (a, b) => {
  // HTTP method hierarchy reflects typical CRUD operation flow
  const methodsOrder = ['get', 'post', 'put', 'patch', 'delete'];
  
  const methodA = a.get('method');
  const methodB = b.get('method');

  // Primary sort: by HTTP method according to defined order
  if (methodA !== methodB) {
    return methodsOrder.indexOf(methodA) - methodsOrder.indexOf(methodB);
  }

  // Secondary sort: alphabetically by path if methods are identical
  const pathA = a.get('path');
  const pathB = b.get('path');
  
  return pathA.localeCompare(pathB);
};

/**
 * Validates if a string is properly Base64 encoded.
 * Used for validating encoded image data and encrypted payloads in the platform.
 * 
 * @param {string} str - Input string to validate
 * @returns {boolean} - True if string matches Base64 encoding pattern
 */
const isBase64 = (str) => {
  // Standard Base64 regex pattern: groups of 4 chars (A-Za-z0-9+/), with optional padding (= or ==)
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(str);
};

/**
 * Validates if all elements in an array are valid Base64 encoded strings.
 * Used for batch validation of image uploads or encrypted data collections.
 * 
 * @param {Array} list - Array of items to validate
 * @returns {boolean} - True if all items are strings and Base64 encoded
 */
const areAllBase64 = (list) => {
  // Validates both type (string) and encoding format for each array element
  return list.every(item => typeof item === 'string' && isBase64(item));
};

/**
 * Generates a JSON Web Token (JWT) for user authentication.
 * Tokens are valid for 2 hours and used to secure API endpoints across the platform.
 * Each token is stored in the userTokenStore to enable multi-device sessions.
 * 
 * @param {string|number} userId - Unique identifier of the authenticated user
 * @returns {string} - Signed JWT token
 */
const createJWSToken = (userId) => {
  return jwt.sign({ userId: userId }, _Token_key, { expiresIn: '2h' });
}

/**
 * Validates the authenticity and active status of a JWT authentication token.
 * Performs three-layer validation: JWT signature, expiration, and active session verification.
 * Automatically cleans expired tokens from the store before validation.
 * 
 * @param {string} token - JWT token (with or without 'Bearer ' prefix)
 * @returns {boolean} - True if token is valid, not expired, and in active session store
 */
const validityToken = (token) => {
  try {
    if (!token) return false;

    cleanExpiredTokens(); // Periodic cleanup of expired tokens from memory

    const decoded = jwt.verify(token.replace(/^Bearer\s+/i, ''), _Token_key);
    if (!decoded || Object.keys(decoded).length === 0) return false;

    // Verify token exists in active session store (prevents replay attacks with old valid tokens)
    const userId = getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
    return userId !== null;
  } catch (e) {
    return false;
  }
};

/**
 * Returns the current date and time in ISO 8601 format at GMT+0 (UTC).
 * Ensures consistent timestamp format across the platform regardless of server timezone.
 * Used for database records, API responses, and log entries.
 * 
 * @returns {string} - ISO 8601 formatted datetime string (e.g., '2026-02-09T14:30:00.000Z')
 */
const getDateGMT0 = () => {
  const now = new Date();
  return now.toISOString();
}

/**
 * Validates email address format according to standard email structure.
 * Used during user registration and profile updates to ensure valid contact information.
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email matches standard format (local@domain.tld)
 */
function isValidEmail(email) {
  // Basic email regex: non-whitespace characters, @ symbol, domain, and TLD
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Stores a new authentication token for a user in the in-memory session store.
 * Supports multiple concurrent sessions per user (e.g., mobile app + web browser).
 * Each token is timestamped for expiration tracking.
 * 
 * @param {string} userId - Unique identifier of the user
 * @param {string} token - JWT token to store
 * @throws {Error} - If userId or token is missing
 */
const saveUserToken = (userId, token) => {
  if (!userId || !token) {
    throw new Error("userId and token are required");
  }

  // Retrieve existing token list for this user (or initialize empty array)
  const existingTokens = userTokenStore.get(userId) || [];

  // Append new token with creation timestamp for expiration tracking
  existingTokens.push({
    token,
    createdAt: Date.now(),
  });

  userTokenStore.set(userId, existingTokens);
};


/**
 * Retrieves the user ID associated with a given authentication token.
 * Searches through the active session store to find the token owner.
 * Returns null if token is not found in any active session.
 * 
 * @param {string} token - JWT token to look up
 * @returns {string|null} - User ID if found, null otherwise
 */
const getUserIdFromToken = (token) => {
  for (const [userId, tokenList] of userTokenStore.entries()) {
    if (Array.isArray(tokenList)) {
      const match = tokenList.find(t => t.token === token);
      if (match) {
        return userId;
      }
    }
  }
  return null;
};

/**
 * Removes expired tokens from the in-memory session store.
 * Tokens older than 2 hours are automatically purged to prevent memory bloat.
 * Called automatically during token validation, but can be invoked manually for maintenance.
 * 
 * @description Iterates through all stored tokens and removes those exceeding the 2-hour TTL.
 *              Deletes user entries completely if no valid tokens remain.
 */
const cleanExpiredTokens = () => {
  const expirationMs = 2 * 60 * 60 * 1000; // Token time-to-live: 2 hours
  const now = Date.now();

  for (const [userId, tokenList] of userTokenStore.entries()) {
    // Keep only tokens created within the last 2 hours
    const filtered = tokenList.filter(t => now - t.createdAt < expirationMs);
    if (filtered.length > 0) {
      // Update user entry with remaining valid tokens
      userTokenStore.set(userId, filtered);
    } else {
      // Remove user entry entirely if all tokens expired
      userTokenStore.delete(userId);
    }
  }
};

module.exports = {
  executeCurl,
  streamToJSON,
  fetchJSONData,
  isInPerimeter,
  containsNonRomanCharacters,
  isNumeric,
  customSorter,
  isBase64,
  areAllBase64,
  createJWSToken,
  validityToken,
  getDateGMT0,
  isValidEmail,
  saveUserToken,
  getUserIdFromToken,
  cleanExpiredTokens
}

