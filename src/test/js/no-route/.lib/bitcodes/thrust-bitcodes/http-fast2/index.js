const HttpFast = Java.type('br.com.softbox.thrust.httpfast.HttpFast')
const resources = {
  routesFilePath: null,
  middlewaresFilePath: null,
  afterRequestFnFilePath: null
}
const setResource = (name, value) => {
    if (value) {
        resources[name] = `${__ROOT_DIR__}/${value}`
    }
}
const setRoutesFilePath = filePath => setResource('routesFilePath', filePath)
const setMiddlewaresFilePath = filePath => setResource('middlewaresFilePath', filePath)
const setAfterRequestFnFilePath = filePath => setResource('afterRequestFnFilePath', filePath)
const toNumberInteger = (n,defaultValue) => Number.isInteger(Number(n)) ? Number(n) : defaultValue
const findCallbackFromArrayReduce = (callback, value) => !callback && typeof value === 'function'
    ? value
    : callback
const startServer = (port, minThreads, maxThreads, callback) => {
	callback = [port, minThreads, maxThreads, callback].reduce(findCallbackFromArrayReduce, null)
	port = toNumberInteger(port, 8778)
	minThreads = toNumberInteger(minThreads, 8)
	maxThreads = toNumberInteger(maxThreads, minThreads)
	const httpServer = HttpFast.startServer(minThreads, maxThreads, __ROOT_DIR__, resources.routesFilePath, resources.middlewaresFilePath, resources.afterRequestFnFilePath)
	if (callback) {
		callback(httpServer)
	}
    httpServer.go(port)
}
const stopServer = () => {
    const httpServer = HttpFast.getInstance()
    if (!httpServer) {
        throw new Error('HttpFastServer was not initiated')
    }
    httpServer.stopServer()
}
exports = {
    setRoutesFilePath,
    setMiddlewaresFilePath,
    setAfterRequestFnFilePath,
    startServer,
    stopServer,
}
