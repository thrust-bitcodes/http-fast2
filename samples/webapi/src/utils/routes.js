exports = [
    // Auth
    ['/api/v1/auth/login', 'src/api/auth/auth-rest/login', {method: 'POST'}],
    // Health
    ['/api/health', 'src/api/health/health-rest/getHealth', {method: 'GET'}],
    ['/api/health/version', 'src/api/health/health-rest/getVersion', {method: 'GET'}],
    // Products
    ['/api/v1/products/find-all', 'src/api/products/products-rest/findAll', {method: 'GET', roles: ['product-view']}],
    ['/api/v1/products/find/:id', 'src/api/products/products-rest/findById', {method: 'GET', roles: ['web']}]
]