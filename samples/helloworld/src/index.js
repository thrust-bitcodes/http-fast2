const httpFastServer = require('http-fast2')

const init = () => {
    httpFastServer.setRoutesFilePath('src/utils/routes.js')
    httpFastServer.setMiddlewaresFilePath('src/utils/middlewares.js')
    httpFastServer.setAfterRequestFnFilePath('src/utils/middlewareAfterResponse.js')
    httpFastServer.startServer(3000, 1)
}

init()

