const majesty = require('majesty')
const httpClient = require('http-client')
const appWorkerRun = require('../app-worker-run')

const URL = 'http://localhost:3000'

const exec = (describe, it, beforeEach, afterEach, expect, should, assert) => {
    
    describe('Products tests', () => {
        it('Should list all products' , () => {
                let response = httpClient.post(`${URL}/api/v1/auth/login`, {user: 'admin', password: 'admin'})
                    .contentType('application/json')
                    .fetch()
                if (response.code !== 200) {
                    throw new Error('No response code: ' + response.code)
                }
                let header = response.headers
                let cookie = header['Set-Cookie'].split(';')[0]
                response = httpClient.get(`${URL}/api/v1/products/find-all`)
                    .headers({Cookie: cookie})
                    .fetch()
                const list = response.body
                const product = list[0]
                if (!product.id) {
                    throw new Error('No product id')
                }
        })
    })
}

try {
    appWorkerRun.appRun()
    const testResults = majesty.run(exec)
    console.log(testResults.success.length, " scenarios executed with success :-)")
    console.log(testResults.failure.length, " scenarios executed with fail :-(")
    testResults.failure.forEach(fail => console.log(`[${fail.scenarion}] => ${fail.exception}`))
} finally {
    appWorkerRun.exit(0)
}
