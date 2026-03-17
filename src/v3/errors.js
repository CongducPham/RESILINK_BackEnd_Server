class UpdateDBError extends Error {
    constructor(message) {
      super(message);
      this.name = 'UpdateDBError';
      this.message = message;
    }
}
  
class InsertDBError extends Error {
    constructor(message) {
      super(message);
      this.name = 'InsertDBError';
      this.message = message;
    }
}

class DeleteDBError extends Error {
    constructor(message) {
      super(message);
      this.name = 'DeleteDBError';
      this.message = message;
    }
}

class getDBError extends Error {
    constructor(message) {
      super(message);
      this.name = 'getDBError';
      this.message = message;
    }
}

class IDNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IDNotFoundError';
    this.message = message;
  }
}

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