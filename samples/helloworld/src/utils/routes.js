const API_ROOT_DIR='src/api'
exports = [
    // Route 1
    ['/api/hello', `${API_ROOT_DIR}/hello-rest/hello`],
    // Route 2
    ['/api/hello-name/:name', `${API_ROOT_DIR}/hello-rest/helloName`],
    // Route 3
    ['/api/hello-param',`${API_ROOT_DIR}/hello-rest/helloParam`],
    // Route 4
    ['/api/hello-request',`${API_ROOT_DIR}/hello-rest/helloRequest`],
    // Route 5
    ['/api/hello500',`${API_ROOT_DIR}/hello-rest/hello500`],
    // Route 6
    ['/api/bye',`${API_ROOT_DIR}/hello-rest/bye`]
]