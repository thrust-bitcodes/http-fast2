const auth = require('auth')

const configAuth = () => {
    auth.notAuthenticatedUrls(['/api/health', '/api/health/*', '/api/v1/auth/*'])
}

const getAuth = () => {
    if (!auth.hasConfig) {
        configAuth()
        auth.hasConfig = true
    }
    return auth
}

exports = (...args) => getAuth().middleware(...args)