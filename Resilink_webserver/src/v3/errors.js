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

/**
 * Custom error thrown when a database update operation fails.
 *
 * @param {string} message - Description of the update failure
 */
class UpdateDBError extends Error {
    constructor(message) {
      super(message);
      this.name = 'UpdateDBError';
      this.message = message;
    }
}
  
/**
 * Custom error thrown when a database insert operation fails.
 *
 * @param {string} message - Description of the insert failure
 */
class InsertDBError extends Error {
    constructor(message) {
      super(message);
      this.name = 'InsertDBError';
      this.message = message;
    }
}

/**
 * Custom error thrown when a database delete operation fails.
 *
 * @param {string} message - Description of the delete failure
 */
class DeleteDBError extends Error {
    constructor(message) {
      super(message);
      this.name = 'DeleteDBError';
      this.message = message;
    }
}

/**
 * Custom error thrown when a database read/get operation fails.
 *
 * @param {string} message - Description of the read failure
 */
class getDBError extends Error {
    constructor(message) {
      super(message);
      this.name = 'getDBError';
      this.message = message;
    }
}

/**
 * Custom error thrown when a given ID cannot be found in a list or collection.
 *
 * @param {string} message - Description of the missing ID context
 */
class IDNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IDNotFoundError';
    this.message = message;
  }
}

/**
 * Custom error thrown when a request body fails validation.
 *
 * @param {string} message - Description of the validation failure
 */
class notValidBody extends Error {
  constructor(message) {
    super(message);
    this.name = 'notValidBody';
    this.message = message;
  }
}

module.exports = {
  getDBError,
  DeleteDBError,
  UpdateDBError,
  InsertDBError,
  IDNotFoundError,
  notValidBody
};