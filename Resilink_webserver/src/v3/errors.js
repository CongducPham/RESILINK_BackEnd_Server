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