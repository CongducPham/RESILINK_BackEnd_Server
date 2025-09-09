const { exec } = require('child_process');
const { Readable } = require('stream');
const http = require('http');
const jwt = require('jsonwebtoken');
const config = require('../config.js');

const _Token_key = config.TOKEN_KEY;

// ODEP token associated with its user (unique)
const userTokenStore = new Map();

/*
  Function to run a Curl command directly in the server
  If the headers and body variables are not defined, they will take the value of an empty object and null respectively.
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

//Converts a stream into a character string.
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

//Converts a stream into a JSON object.
const streamToJSON = async (stream) => {
  return streamToString(stream).then((data) => JSON.parse(data)).then((result) => {
    return result;
  });
}

//Makes an HTTP request with the specified method, URL, headers and body, and returns the response.
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

/*
 * Calculates the distance in kilometers between two geographical points specified by their latitudes and longitudes.
 * R represents the Earth's radius in kilometers and distance is in kilometers
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

//Checks whether the distance between 2 geographical points is too far apart
const isInPerimeter = (lat1, lon1, lat2, lon2, perimeterRadius) => {
  const distance = haversine(lat1, lon1, lat2, lon2);

  return (distance <= perimeterRadius);
}

//Checks if a string is a string containing only Roman characters 
function containsNonRomanCharacters(str) {
  // Regex to detect basic non-Latin characters (including Arabic, Chinese, Japanese, etc.)  
  const nonRomanRegex = /^[a-zA-Z0-9?!%-_]+$/;

  return nonRomanRegex.test(str);
}

//Checks if a string is a string containing only digits characters 
function isNumeric(str) {
  // Use a regex to check if the string contains only digits
  return /^\d+$/.test(str);
}

// Fonction de tri personnalisée
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

const isBase64 = (str) => {
  // Regex to check if a string is base64 encoded
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(str);
};

const areAllBase64 = (list) => {
  // Check that all list elements are strings and comply with Base64 format
  return list.every(item => typeof item === 'string' && isBase64(item));
};

const createJWSToken = (userId) => {
  return jwt.sign({ userId: userId }, _Token_key, { expiresIn: '2h' });
}

const validityToken = (token) => {
  try {
    if (token != null && token != "") {
      const decoded = jwt.verify(token.replace(/^Bearer\s+/i, ''), _Token_key);
      if (!decoded || Object.keys(decoded).length === 0) {
        // If 'decoded' is null, undefined or an empty object, the token is invalid.
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  } catch (e) {
    throw e;
  }
}

const getDateGMT0 = () => {

  const now = new Date();
  return now.toISOString();
}

function isValidEmail(email) {
  // Expression régulière pour valider un email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

const saveUserToken = (userId, token) => {
  if (!userId || !token) {
    throw new Error("userId and token are required");
  }
  userTokenStore.set(userId, token);
};

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
  createJWSToken,
  validityToken,
  getDateGMT0,
  isValidEmail,
  saveUserToken,
  getUserIdFromToken
}

