class RestError extends Error {
    constructor(statusCode, msg) {
        super(msg)
        this.statusCode = statusCode || 500
        Error.captureStackTrace(this, RestError)
    }
}

class NotFoundError extends RestError {
    constructor(msg) {
        super(404, msg || 'Error 404: URI not found')
    }
}

class InvalidTypeError extends RestError {
    constructor(msg) {
        super(500, msg)
    }
}

exports = {
    RestError,
    NotFoundError,
    InvalidTypeError
}