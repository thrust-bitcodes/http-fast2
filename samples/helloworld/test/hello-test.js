const httpClient = require('http-client')
const BASE_URL = 'http://localhost:3000'

const testHello = () => {
    const route = '/api/hello'
    console.log(`Testing ${route}`)
    const url = `${BASE_URL}${route}`
    const response = httpClient
        .get(url)
        .charset('UTF-8')
        .contentType('application/json')
        .fetch()
    console.log('Resposta: ')

    if (response.code === 200) {
        console.log('  Response: OK')
        const body = response.body
        console.log('  Has body? ', !!body)
    }
}

testHello()



