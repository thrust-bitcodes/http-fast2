const httpServer = require('http-fast2')
const configUtil = require('./utils/config-util')

const loadServerCfg = () => {
    const serverCfg = configUtil.getServerConfig()
    const serverPort = serverCfg.port || 3000
    const minThreads = serverCfg.minThreads || 1
    const maxThreads = serverCfg.maxThreads || 2

    return { serverPort, minThreads, maxThreads }
}

const init = () => {
    const { serverPort, minThreads, maxThreads } = loadServerCfg()
    
    httpServer.setRoutesFilePath('src/utils/routes.js')
    httpServer.setMiddlewaresFilePath('src/utils/middlewares.js')
    httpServer.setAfterRequestFnFilePath('src/utils/middlewareBeforeResponse.js')

    httpServer.startServer(serverPort, minThreads, maxThreads, () => console.log(`webapi listening on port ${serverPort}.`))
}

init()