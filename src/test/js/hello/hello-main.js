const httpFastServer = require('http-fast2')
httpFastServer.setRoutesFilePath('hello-routes.js')
httpFastServer.setAfterRequestFnFilePath('hello-after.js')
const port = 3000
httpFastServer.startServer(port, 1,10, () => console.log(`Listening on port ${port}`))
console.log('hello-main finished.')