const mountRouter = () => {
    const applicationDirectory = './'
    const middlewares = []

    let afterRequestFn
    const vrouteMetadata = {}
    const vroutes = {
        '/': (_, __, response) => {
            response.contentType = 'text/html; charset=utf-8'
            response.write('<H1>Thrust is running!!!</H1>')
        }
    }

    const addRoute = (virtualRoute, realRoute, metadata) => {
        vroutes[virtualRoute] = realRoute
        if (metadata) {
            vrouteMetadata[virtualRoute] = metadata
        }
    }

    const mapVirtualRoutes = (routesFilePath) => {
    	if (routesFilePath) {
    		const routes = require(routesFilePath)
    		routes.forEach(routeArr => addRoute(...routeArr))
    	}
    }

    const addMiddleware = (middleware) => {
        if (typeof middleware === 'function') {
            middlewares.push(middleware)
        } else if (typeof middleware === 'object' && typeof middleware.middleware === 'function') {
            middlewares.push(middleware.middleware)
        } else {
            throw new Error('A middleware must be a function or contain a function called \'middleware\'')
        }
    }

    const mapMiddlewares = (middlewaresFilePath) => {
        if (middlewaresFilePath) {
            const middlewares = require(middlewaresFilePath)
            middlewares.forEach(addMiddleware)
        }
    }

    const loadAfterRequestFn = (afterRequestFnFilePath) => {
        if (afterRequestFnFilePath) {
            const afterReqFn = require(afterRequestFnFilePath)
            if (afterReqFn) {
                afterRequestFn = afterReqFn
            }
        }
    }

    const process = (requestParams, request, response) => {
        try {
            const params = requestParams || {}
            const route = findRoute(params, request)
            if (route.metadata) {
                request.metadata = route.metadata
            }
            const checkOkMiddFncReduce = (flag, middFnc) => {
                flag = (flag === undefined) ? true : flag
                return flag && middFnc(params, request, response)
            }
            const isItOK = middlewares.reduce(checkOkMiddFncReduce, true)
            if (isItOK) {
                try {
                    processRoute(route, params, request, response)
                    if (afterRequestFn) {
                        afterRequestFn(undefined, params, request, response)
                    }
                } catch (e) {
                    if (afterRequestFn) {
                        afterRequestFn(e, params, request, response)
                    }
                }
            }
        } finally {
            if (request.queryString && request.queryString.files) {
                Object.keys(request.queryString.files).forEach((key) => {
                    let file
                    try {
                        file = request.queryString.files[key].file
                        if (file && file.exists() && !file.delete()) {
                            throw new Error('Internal error: file not deleted')
                        }
                    } catch (e) {
                        console.error(`Falha remover o arquivo temporario ${file && file.getName()}`, e)
                    }
                })
            }
        }

        // let mimes = ['text/html', 'text/xml', 'text/plain', 'text/javascript', 'application/javascript', 'application/json']
        // let httpResponse = response.httpResponse

        // httpResponse.setStatus(response.status)
        // httpResponse.setContentType(response.contentType)
        // httpResponse.setCharacterEncoding(response.charset)

        // for (let key in response.headers) {
        //     httpResponse.setHeader(key, response.headers[key])
        // }

        // let type = response.contentType.split(';')[0]

        // if (mimes.indexOf(type) >= 0) {
        //     let sout = (response.contentType.indexOf('json') >= 0)
        //         ? response.toJson()
        //         : response.toString()

        //     httpResponse.setContentLength(sout.getBytes(Charset.forName(response.charset)).length)
        //     httpResponse.getWriter().println(sout)
        //     httpResponse.flushBuffer()
        // } else {
        //     let ops = httpResponse.getOutputStream()

        //     httpResponse.setContentLength(response.contentLength)
        //     ops.write(response.out[0])
        //     ops.flush()
        // }
    }

    const processRoute = (route, params, request, response) => {
        if (typeof (route.rrota) === 'function') {
            route.rrota(params, request, response)
        } else {
            runMethodOnModule(route.rrota, params, request, response)
        }
    }

    const runMethodOnModule = (rrota, params, request, response) => {
        let path = applicationDirectory
            .concat(rrota)
            .replace(/^\//, '')
            .split('/')
        let methodName = path.pop()
        let routeModule
        try {
            routeModule = require(__ROOT_DIR__ + '/' + path.join('/') + '.js')
        } catch (e) {
            response.error.json('Error 404: URI not found.', 404)
            return
        }
        let fncMetodo = routeModule[methodName]
        if (!fncMetodo) {
            let moduleMethod = routeModule[request.method.toUpperCase()]

            if (!request || !request.method || !routeModule || !moduleMethod || !moduleMethod[methodName]) {
                response.error.json('Error 404: URI not found.', 404)
                return
            }
            fncMetodo = moduleMethod[methodName]
        }
        fncMetodo(params, request, response)
    }

    const findRoute = (params, request) => {
        let nurl = request
            .rest
            .replace(/\/$/g, '').replace('//', '/')
        let keys = Object.keys(vroutes)
        let vrota
        let rrota
        let metadata

        let splitRoute = nurl
            .replace(/^\//, '')
            .split('/')

        nurl = (nurl === '')
            ? '/'
            : nurl
        vrota = ['/' + splitRoute.shift()].join('')

        if (vrota.charAt(1) === '@' && keys.indexOf(vrota) >= 0) {
            rrota = vroutes[vrota]
            metadata = vrouteMetadata[vrota]
            rrota = rrota.concat((splitRoute.length === 0)
                ? ''
                : ['/', splitRoute.shift()].join(''))
        } else if (keys.indexOf(nurl) >= 0) { 
            // É simplesmente um virtual path?
            rrota = vroutes[nurl]
            metadata = vrouteMetadata[nurl]
        } else { 
            // Ou é uma rota com placeholder ou é uma url do tipo ../modulo/metodo
            let vrout = keys.map((rt, index) => ({
                    rota: rt.replace(/:(\w+)/g, '(.+)'),
                    index: index
                })
            ).filter((rotaIndex) => new RegExp('^' + rotaIndex.rota + '$').test(nurl))[0]

            // É uma rota com placeholder? 
            if (vrout !== undefined) {
                vrota = keys[vrout.index]
                metadata = vrouteMetadata[vrota]
                rrota = (vrout)
                    ? vroutes[vrota]
                    : rrota

                let mat
                let regIds = /:(\w+)/gi
                let ids = []

                while ((mat = regIds.exec(vrota)) !== null) {
                    ids.push(mat[1])
                }

                let values = nurl
                    .match(vrout.rota)
                    .slice(1)

                for (let i = 0; i < ids.length; i++) {
                    params[ids[i]] = values[i]
                }
            } else {
                // Não, é uma rota do tipo ../module/method 
                rrota = nurl
            }
        }

        return {
            rrota,
            metadata
        }
    }

    return {
        mapVirtualRoutes,
        mapMiddlewares,
        loadAfterRequestFn,
        process
    }
}

exports = mountRouter()
