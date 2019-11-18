exports = (error, params, request, response) => {
    if (error) {
        response.json({
            error: `${error}`,
            description: 'Unexpected error'
        })
    } else {
        const now = new Date()
        const elapsedTime = now - request.context.initTime.getTime() 
        console.log(`=> Middleware: After response. ET: ${elapsedTime} ms`)
    }
}