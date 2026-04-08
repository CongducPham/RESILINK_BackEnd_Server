const { exec } = require('child_process');
const { Readable } = require('stream');
const http = require('http');
const jwt = require('jsonwebtoken');
const config = require('../config.js');

const Token_key = config.TOKEN_KEY;

// ODEP token associated with its user (unique)
const userTokenStore = new Map();

/**
 * Executes an HTTP request using a cURL command in a child process.
 * Headers and body default to empty object and null respectively if not provided.
 *
 * @param {string} type - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {string} url - Target URL for the request
 * @param {Object} headers - HTTP headers to include (default: {})
 * @param {Object|null} body - Request body to send as JSON (default: null)
 * @returns {Promise<string>} - Raw response string from the cURL command
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
 * Converts a Readable stream into a UTF-8 string.
 *
 * @param {Stream} stream - The readable stream to convert
 * @returns {Promise<string>} - The stream content as a string
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
 * Converts a Readable stream into a parsed JSON object.
 *
 * @param {Stream} stream - The readable stream to parse
 * @returns {Promise<Object>} - The parsed JSON object
 */
const streamToJSON = async (stream) => {
  return streamToString(stream).then((data) => JSON.parse(data)).then((result) => {
    return result;
  });
}

/**
 * Makes an HTTP request using the native fetch API with the specified method, URL, headers and body.
 *
 * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {string} url - Target URL for the request
 * @param {Object} header - HTTP headers to include
 * @param {Object|null} body - Request body to send as JSON (default: null)
 * @returns {Promise<Response>} - The fetch Response object
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
 * Calculates the great-circle distance in kilometers between two geographical points
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of the first point in degrees
 * @param {number} lon1 - Longitude of the first point in degrees
 * @param {number} lat2 - Latitude of the second point in degrees
 * @param {number} lon2 - Longitude of the second point in degrees
 * @returns {number} - Distance between the two points in kilometers
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
 * Checks whether two geographical points are within a given radius.
 *
 * @param {number} lat1 - Latitude of the first point in degrees
 * @param {number} lon1 - Longitude of the first point in degrees
 * @param {number} lat2 - Latitude of the second point in degrees
 * @param {number} lon2 - Longitude of the second point in degrees
 * @param {number} perimeterRadius - Maximum allowed distance in kilometers
 * @returns {boolean} - True if the points are within the radius, false otherwise
 */
const isInPerimeter = (lat1, lon1, lat2, lon2, perimeterRadius) => {
  const distance = haversine(lat1, lon1, lat2, lon2);

  return (distance <= perimeterRadius);
}

/**
 * Checks whether a string contains only characters from the basic Latin alphabet, digits, and common symbols.
 * Used to detect non-Roman character input (Arabic, Chinese, Japanese, etc.).
 *
 * @param {string} str - The string to check
 * @returns {boolean} - True if the string contains only Roman characters, false otherwise
 */
function containsNonRomanCharacters(str) {
  // Regex to detect basic non-Latin characters (including Arabic, Chinese, Japanese, etc.)  
  const nonRomanRegex = /^[a-zA-Z0-9?!%-_]+$/;

  return nonRomanRegex.test(str);
}

/**
 * Checks whether a string contains only digit characters.
 *
 * @param {string} str - The string to check
 * @returns {boolean} - True if the string is numeric, false otherwise
 */
function isNumeric(str) {
  // Use a regex to check if the string contains only digits
  return /^\d+$/.test(str);
}

/**
 * Custom comparator for sorting route entries by HTTP method order then path alphabetically.
 * HTTP methods are ordered as: GET, POST, PUT, PATCH, DELETE.
 *
 * @param {Map} a - First route entry Map with 'method' and 'path' keys
 * @param {Map} b - Second route entry Map with 'method' and 'path' keys
 * @returns {number} - Negative, zero, or positive sort order value
 */
const customSorter = (a, b) => {
  // Sort by HTTP method (order: GET, POST, PUT, PATCH, DELETE) first
  const methodsOrder = ['get', 'post', 'put', 'patch', 'delete'];
  
  const methodA = a.get('method');
  const methodB = b.get('method');

  // If the methods are different, sort by method
  if (methodA !== methodB) {
    return methodsOrder.indexOf(methodA) - methodsOrder.indexOf(methodB);
  }

  // If the methods are the same, the paths are sorted alphabetically.
  const pathA = a.get('path');
  const pathB = b.get('path');
  
  return pathA.localeCompare(pathB);
};

/**
 * Checks whether a string is valid Base64-encoded data.
 *
 * @param {string} str - The string to check
 * @returns {boolean} - True if the string is valid Base64, false otherwise
 */
const isBase64 = (str) => {
  // Regex to check if a string is base64 encoded
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(str);
};

/**
 * Checks whether all items in a list are valid Base64-encoded strings.
 *
 * @param {Array<any>} list - The list of items to check
 * @returns {boolean} - True if every item is a valid Base64 string, false otherwise
 */
const areAllBase64 = (list) => {
  // Check that all list elements are strings and comply with Base64 format
  return list.every(item => typeof item === 'string' && isBase64(item));
};

/**
 * Validates whether a string represents a valid geographical point in "<lat,lon>" format.
 * Latitude must be in [-90, 90] and longitude in [-180, 180].
 *
 * @param {string} str - The string to validate
 * @returns {boolean} - True if the string is a valid geographical point, false otherwise
 */
const isValidGeographicalPoint = (str) => {
  const regex = /^<\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*>$/;

  const match = str.match(regex);
  if (!match) return false;

  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);

  // Validate latitude and longitude ranges
  const isLatValid = lat >= -90 && lat <= 90;
  const isLonValid = lon >= -180 && lon <= 180;

  return isLatValid && isLonValid;
};

/**
 * Creates a signed JWT token containing the user ID, valid for 2 hours.
 *
 * @param {string} userId - The user ID to embed in the token payload
 * @returns {string} - The signed JWT token string
 */
const createJWSToken = (userId) => {
  return jwt.sign({ userId: userId }, secretKey, { expiresIn: '2h' });
};

/**
 * Verifies whether a JWT token is valid and not expired.
 *
 * @param {string} token - The JWT token string to verify
 * @returns {boolean} - True if the token is valid, false if it is expired or invalid
 */
const validityToken = (token) => {
  try { 
    const decoded = jwt.verify(token, secretKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Stores a user authentication token in memory, associated with their user ID.
 *
 * @param {string} userId - The user ID to associate with the token
 * @param {string} token - The authentication token to store
 * @returns {void}
 */
const saveUserToken = (userId, token) => {
  if (!userId || !token) {
    throw new Error("userId and token are required");
  }
  userTokenStore.set(userId, token);
};

/**
 * Looks up the user ID associated with a given authentication token in the in-memory store.
 *
 * @param {string} token - The authentication token to look up
 * @returns {string|null} - The associated user ID, or null if not found
 */
const getUserIdFromToken = (token) => {
  for (const [userId, storedToken] of userTokenStore.entries()) {
    if (storedToken === token) {
      return userId;
    }
  }
  return null;
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
  isValidGeographicalPoint,
  createJWSToken,
  validityToken,
  saveUserToken,
  getUserIdFromToken
}

