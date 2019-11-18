const JString = Java.type('java.lang.String')
const StandardCharsets = Java.type('java.nio.charset.StandardCharsets')

const sendData = (channel, data) => {
    while (data.hasRemaining()) {
        channel.write(data)
    }
}

const headerReturned = (headers) => !headers
    ? ''
    : Object
        .entries(headers)
        .reduce((str, [header, headerValue]) => str + `${header}: ${headerValue}\r\n`, '')

const mountResponse = (channel) => {
    return {
        httpResponse: channel,
        statusCode: 200,
        contentLength: 0,
        contentType: 'text/html',
        charset: 'UTF-8',
        headers: {},

        clean: function () {
            this.headers = {}
            this.contentLength = 0
            this.contentType = 'text/html'
            this.charset = 'utf-8'
        },

        status(code) {
            this.statusCode = code || 200
            return this
        },

        addHeader(key, value) {
            this.headers[key] = value
        },

        /**
         * Escreve em formato *texto* o conteúdo passado no parâmetro *content* como resposta
         * a requisição. Modifica o valor do *content-type* para *'text/html'*.
         * @param {Object} content - dado a ser enviado para o cliente.
         */
        write: function (content) {
            this.html(content)
        },

        plain: function (content) {
            let sizeBody = (StandardCharsets.UTF_8.encode(content)).remaining()
            let response = new JString(`HTTP/1.1 ${this.statusCode}\r\nDate: ${new Date().toString()}\r\nContent-Type: text/plain\r\nContent-Length: ${sizeBody}\r\nServer: thrust\r\nConnection: close\r\n${headerReturned(this.headers)}\r\n${content}`)

            sendData(channel, StandardCharsets.UTF_8.encode(response))
        },

        json: function (data) {
            let body = (typeof (data) === 'object') ? JSON.stringify(data) : data
            let sizeBody = (StandardCharsets.UTF_8.encode(body)).remaining()
            let response = new JString(`HTTP/1.1 ${this.statusCode}\r\nDate: ${new Date().toString()}\r\nContent-Type: application/json\r\nContent-Length: ${sizeBody}\r\nServer: thrust\r\nConnection: close\r\n${headerReturned(this.headers)}\r\n${body}`)

            sendData(channel, StandardCharsets.UTF_8.encode(response))
        },

        html: function (content) {
            let sizeBody = (StandardCharsets.UTF_8.encode(content)).remaining()
            let response = new JString(`HTTP/1.1 ${this.statusCode}\r\nDate: ${new Date().toString()}\r\nContent-Type: text/html\r\nContent-Length: ${sizeBody}\r\nServer: thrust\r\nConnection: close\r\n${headerReturned(this.headers)}\r\n${content}`)

            sendData(channel, StandardCharsets.UTF_8.encode(response))
        },

        binary: function (content) {
            let sizeBody = (StandardCharsets.UTF_8.encode(content)).remaining()
            let response = new JString(`HTTP/1.1 ${this.statusCode}\r\nDate: ${new Date().toString()}\r\n'Content-Type: application/octet-stream\r\nContent-Length: ${sizeBody}\r\nServer: thrust\r\nConnection: close\r\n${headerReturned(this.headers)}\r\n${content}`)

            sendData(channel, StandardCharsets.UTF_8.encode(response))
        },

        sendNoContent: function() {
            this.statusCode = this.statusCode || 202
            let response = new JString(`HTTP/1.1 ${this.statusCode}\r\nDate: ${new Date().toString()}\r\n'Content-Type: text/html\r\nContent-Length: 0\r\nServer: thrust\r\nConnection: close\r\n${headerReturned(this.headers)}\r\n`)
            sendData(channel, StandardCharsets.UTF_8.encode(response))
        },

        /**
         * Objeto que encapsula os métodos de retornos quando ocorre um erro na requisição http.
         * @ignore
         */
        error: {
            /**
             * Escreve em formato *JSON* uma mensagem de erro como resposta a requisição no
             * formato {message: *message*, status: *status*}. Modifica o valor
             * do *content-type* para *'application/json'*.
             * @alias error.json
             * @memberof! http.Response#
             * @instance error.json
             * @param {String} message - mensagem de erro a ser enviada no retorno da chamada do browser.
             * @param {Number} status - (opcional) status de retorno do request htttp.
             * @param {Object} headers - (opcional) configurações a serem definidas no header http.
             */
            json: function (message, status, headers) {
                let code = status || 200
                let body = JSON.stringify({ status, message })
                let textResponse = `HTTP/1.1 ${code}\r\nDate: ${new Date().toString()}\r\nContent-Type: application/json\r\nConnection: close\r\n${headerReturned(this.headers)}`
                
                const appendTextResponse = ([key, value]) => {
                    textResponse += `${key}: ${value}\r\n`
                }
                Object.entries(headers || {}).forEach(appendTextResponse)
                textResponse += '\r\n' + body
                sendData(channel, StandardCharsets.UTF_8.encode(textResponse))
            }
        }
    }
}

exports = mountResponse
