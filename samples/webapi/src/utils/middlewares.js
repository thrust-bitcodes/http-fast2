const Generators = Java.type('com.fasterxml.uuid.Generators')
const authentication = require('./authentication')

const authenticationMiddleware = (...args) => authentication(...args)

const getRequestContext =  (request) => {
    if (!request.context) {
        request.context = {}
    }
    return request.context
}

const validateMethodFromMetadata = (_, request, response) => {
    const method = request.metadata && request.metadata.method
    if (method && request.method !== method) {
        response.status(404).json('Error 404: URI not found')
        return false
    }
    return true
}

const setRequestIdOnRequest = (_, request) => {
    const uuid = Generators.timeBasedGenerator().generate()
    getRequestContext(request).requestId = `${uuid}`
    return true
}

exports = [
    authenticationMiddleware,
    validateMethodFromMetadata,
    setRequestIdOnRequest
]