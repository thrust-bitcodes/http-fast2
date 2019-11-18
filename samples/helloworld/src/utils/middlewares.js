const getContext = (request) => {
    if (!request.context) {
        request.context =  {}
    }
    return request.context
}
const addInitTime = (params, request, response) => {
    const now = new Date()
    console.log('=> Middleware: Setting init time:', now)
    getContext(request).initTime = now
    return true
}

exports = [
    addInitTime
]