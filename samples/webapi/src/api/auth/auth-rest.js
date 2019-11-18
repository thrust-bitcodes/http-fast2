const auth = require('auth')

const login = (params, request, response) => {
    if (params.user === 'admin' && params.password == 'admin') {
        const user = {
            id: 123,
            appId: 'sample-webapi',
            roles: ['admin', 'web', 'product-view']
        }
        auth.createAuthentication(params, request, response, user.id, user.appId, user)
        return response.json({success: true})
    } 
        
    response.status(401).json({success: false, errCode: 321})
}

exports = {
    login
}