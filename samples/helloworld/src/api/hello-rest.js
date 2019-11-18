const hello = (_, __, response) => {
    response.json('Hello world')
}

const helloName = (params, request, response) => {
    const name = params.name || 'fulano'
    let id
    if (request.context && request.context.initTime) {
        console.log('[hello-name] Getting id from request')
        id = request.context.initTime.getTime()
    } else {
        console.log('[hello-name]  Creating new id')
        id = new Date().getTime()
    }
    response.json({
        id,
        name
    })
}

const helloRequest = (_, request, response) => {
    response.json(request)
}

const helloParam = (params, _, response) => {
    const name = params.name || 'ciclano'
    response.plain(`Hello from ${name}.`)
}

const hello500 = (_, __, response) => {
    response.status(500).json({
        id: new Date().getTime(),
        msg: 'Hello 500'
    })
}

const bye = () => {
    throw new Error("Bye bye")
}

exports = {
    hello,
    helloName,
    helloParam,
    helloRequest,
    hello500,
    bye
}