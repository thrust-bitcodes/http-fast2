const JString = Java.type('java.lang.String')
const URLDecoder = Java.type('java.net.URLDecoder')
const StandardCharsets = Java.type('java.nio.charset.StandardCharsets')
const FileOutputStream = Java.type('java.io.FileOutputStream')
const File = Java.type('java.io.File')
const Thread = Java.type('java.lang.Thread')

const charset = 'UTF-8'
const charsetEncoding = StandardCharsets.UTF_8

const reFormDataField = /Content-Disposition:\sform-data;\sname="(\w+)"/mi
const reFormDataFile = /Content-Disposition:\sform-data;\sname="([^"]+)";\s+(filename)="([^"]*)"/mi
const reFormDataContentType = /Content-type:\s(.+)/mi

const fail = (message) => {
    throw Error(message || 'Fail do parse HTTP request')
}

const mountHeader = (textHeaders) => {
    const headers = {}

    for (let i = 1; i < textHeaders.length; i++) {
        let p = 0
        let hdr = textHeaders[i].split(/:\s*/g)
        let key = hdr[p++]

        if (key === 'Host') {
            headers[key] = hdr[p++]
            headers['Port'] = hdr[p] || '80'
        } else {
            if (hdr.length > 2) {
                hdr.shift()
                headers[key] = hdr.join(':')
            } else {
                headers[key] = hdr[p]
            }
        }
    }

    return headers
}

const findHeader = (headers, headerName) => {
    const upperCaseName = headerName.toUpperCase()
    const header = Object.keys(headers).filter(value => value.toUpperCase() === upperCaseName)
    if (header) {
        return headers[header]
    }
}

const mountCookiesObj = (cookiesStr) => {
    const cookiesObject = {}

    if (cookiesStr === undefined) {
        return cookiesObject
    }
    const cookiesArray = cookiesStr.split('; ')
    cookiesArray.forEach(cookieStr => {
        const cookieContentArray = cookieStr.split('=')
        const cookieKey = cookieContentArray[0]
        cookieContentArray.shift()
        cookiesObject[cookieKey] = cookieContentArray.join('=')
    })

    return cookiesObject
}

const locationParser = (locationText) => {
    locationText = locationText || ''
    const split = locationText.split('?')

    const parseQueryString = () => split[1]
    const parseUrn = () => split[0]

    return {
        location: locationText,
        parseQueryString,
        parseUrn
    }
}

const BufferReader = (httpChannel, buffer) => {
    let totalBytesRead = buffer.limit()

    const slice = (start, end, walkPosition) => {
        const startPostition = end ? start : buffer.position()
        const endPosition = end || buffer.position() + start

        if (buffer.limit() < endPosition) {
            return false
        }

        if (walkPosition && endPosition > buffer.position()) {
            buffer.position(endPosition)
        }

        return new JString(buffer.array(), startPostition, endPosition - startPostition, charsetEncoding)
    }

    const readString = (start, end) => slice(start, end, true)

    let contentIndex = 0
    let lasContent
    const findOnBuffer = (content) => {
        if (lasContent !== content) {
            contentIndex = 0
        }
        lasContent = content
        while (buffer.position() < buffer.limit()) {
            let byte = buffer.get();
            if (content.charCodeAt(contentIndex) === byte) {
                if (contentIndex === content.length - 1) {
                    contentIndex = 0
                    return true;
                }
                contentIndex = contentIndex + 1
            } else {
                contentIndex = 0
                if (content.charCodeAt(contentIndex) === byte) {
                    contentIndex = 1
                }
            }
        }

        return false
    }

    const getContentIndex = () => {
        return contentIndex
    }

    const readMoreFromChannel = () => {
        buffer.clear()
        const bytesRead = httpChannel.read(buffer)
        buffer.flip()
        totalBytesRead = totalBytesRead + bytesRead
        return bytesRead
    }

    const writeOnChannel = (content) => httpChannel.write(StandardCharsets.UTF_8.encode(content))

    const getTotalBytesRead = () => totalBytesRead

    return {
        readString,
        slice,
        findOnBuffer,
        readMoreFromChannel,
        writeOnChannel,
        position: buffer.position,
        limit: buffer.limit,
        array: buffer.array,
        bytesRead: buffer.limit,
        totalBytesRead: getTotalBytesRead,
        contentIndex: getContentIndex
    }
}

const multipartContentReader = (bufferReader, boundary) => {
    const read = (header) => {
        if (!bufferReader.findOnBuffer('\r\n')) {
            return undefined
        }

        if (header.metadata.filename) {
            return readFile(header.metadata.filename)
        }

        return readParam()
    }

    const readParam = () => {
        const contentStartIndex = bufferReader.position()
        if (bufferReader.findOnBuffer(boundary)) {
            return {
                param: bufferReader.readString(contentStartIndex, bufferReader.position() - boundary.length)
            }
        }
        // TODO: Tratar erro
    }

    const readFile = (filename) => {
        let file = File.createTempFile(filename, '-upload')
        const stream = new FileOutputStream(file)
        try {
            const contentStartIndex = bufferReader.position()
            if (bufferReader.findOnBuffer(boundary)) {
                stream.write(bufferReader.array(), contentStartIndex, bufferReader.position() - boundary.length - contentStartIndex)
            } else {
                stream.write(bufferReader.array(), contentStartIndex, bufferReader.bytesRead() - contentStartIndex)
                while (bufferReader.readMoreFromChannel() > 0 && !bufferReader.findOnBuffer(boundary)) {
                    stream.write(bufferReader.array(), 0, bufferReader.bytesRead())
                }
                if (bufferReader.bytesRead() <= 0) {
                    fail()
                }
                stream.write(bufferReader.array(), 0, bufferReader.position() - boundary.length)
            }
        } finally {
            stream.close()
        }

        return {
            tempFileName: file.getPath(),
            file
        }
    }

    return {
        read
    }
}

const multipartHeaderReader = (bufferReader) => {
    const hasMore = () => bufferReader.slice(2) !== '--'

    const hasContentType = () => bufferReader.slice(2) !== '\r\n'

    const readContentDisposition = () => {
        const lineBreak = bufferReader.readString(2)
        if (lineBreak === '\r\n') {
            const contentDispositionStartIndex = bufferReader.position()
            if (bufferReader.findOnBuffer('\r\n')) {
                return bufferReader.readString(contentDispositionStartIndex, bufferReader.position() - 2)
            }
        }
        fail()
    }

    const readContentType = () => {
        if (hasContentType()) {
            const contentTypeStartIndex = bufferReader.position()
            if (bufferReader.findOnBuffer('\r\n')) {
                return bufferReader.readString(contentTypeStartIndex, bufferReader.position())
            }

            fail()
        }

        return undefined
    }

    const extractMetadata = (contentDisposition, contentType) => {
        if (contentType) {
            const groups = reFormDataFile.exec(contentDisposition)
            if (groups == null) {
                fail()
            }

            const groupsType = reFormDataContentType.exec(contentType)
            if (groupsType == null) {
                fail()
            }

            return {
                name: groups[1],
                filename: groups[3],
                'Content-Type': groupsType[1]
            }
        }

        const groups = reFormDataField.exec(contentDisposition)
        if (groups == null) {
            fail()
        }
        return {
            name: groups[1]
        }
    }

    const read = () => {
        const contentDisposition = readContentDisposition()
        const contentType = readContentType()
        const metadata = extractMetadata(contentDisposition, contentType)

        return {
            metadata,
            contentDisposition,
            contentType
        }
    }

    return {
        read,
        hasMore
    }
}

const multipartReader = (bufferReader, header) => {
    let firstTimeRead = true
    const boundaryLimit = '\r\n--'
    const boundary = header.contentType.replace('multipart/form-data; boundary=', '')

    const headerReader = multipartHeaderReader(bufferReader)
    const contentReader = multipartContentReader(bufferReader, boundaryLimit + boundary)

    const readHeader = () => {
        return headerReader.read()
    }

    const expectData = (header) => {
        const expect = findHeader(header.headers, 'expect')
        if (expect !== '100-continue') {
            return false
        }

        bufferReader.writeOnChannel('HTTP/1.1 100 Continue')
        let countWait = 0;
        while (bufferReader.readMoreFromChannel() === 0) {
            if (countWait > 30) {
                fail('Timeout waiting data')
            }
            Thread.sleep(100)
            countWait = countWait + 1
        }
        return true
    }

    const moveBufferPosition = () => {
        if (firstTimeRead) {
            firstTimeRead = false
            if (expectData(header)) {
                bufferReader.findOnBuffer('--' + boundary)
            } else {
                bufferReader.findOnBuffer(boundaryLimit + boundary)
            }
        }
    }

    const readContent = (header) => contentReader.read(header)

    const hasMore = () => {
        moveBufferPosition()
        return headerReader.hasMore()
    }

    const next = () => {
        moveBufferPosition()
        const header = readHeader()
        const content = readContent(header)
        return {
            header,
            content
        }
    }

    return {
        hasMore,
        next
    }
}

exports = (httpChannel, buffer) => {
    const bufferReader = BufferReader(httpChannel, buffer)
    const processFormDataRequest = (header) => {
        const multipart = multipartReader(bufferReader, header)
        const qs = {}
        while (multipart.hasMore()) {
            const part = multipart.next()

            if (part.header.metadata.filename) {
                qs.files = qs.files || {}
                qs.files[part.header.metadata.name] = {
                    name: part.header.metadata.name,
                    filename: part.header.metadata.filename,
                    tempFileName: part.content.tempFileName,
                    file: part.content.file,
                    'Content-Type': part.header.metadata['Content-Type']
                }
            } else {
                qs[part.header.metadata.name] = part.content.param
            }
        }
        buffer.clear()
        buffer.flip()
        return qs
    }

    const readQueryString = (header, rawRequestData) => {
        const contentType = header.contentType
        if (contentType.startsWith('multipart/form-data')) {
            return processFormDataRequest(header)
        }

        const textBody = rawRequestData.body
        if (textBody && textBody !== '') {
            return contentType.startsWith('application/json') ? textBody : URLDecoder.decode(textBody, charset)
        } else {
            const queryString = header.location.queryString
            return queryString ? URLDecoder.decode(queryString, charset) : ''
        }
    }

    const extractHeaderAndBody = () => {
        const textRequest = new JString(buffer.array(), 0, buffer.limit(), charsetEncoding)
        const headerAndBody = textRequest.split('\r\n\r\n')
        return {
            request: textRequest,
            header: headerAndBody[0],
            body: headerAndBody[1]
        }
    }

    const parseHeader = (rawRequestData) => {
        const textHeaders = rawRequestData.header.split('\r\n')
        const headers = mountHeader(textHeaders)
        const contentType = findHeader(headers, 'Content-Type') || ''



        const methodAndUri = (textHeaders[0] || '').split(' ')
        const httpMethod = methodAndUri[0] || 'GET'
        const location = locationParser(methodAndUri[1])

        return {
            contentType,
            headers,
            httpMethod,
            location: {
                raw: location.location,
                urn: location.parseUrn(),
                queryString: location.parseQueryString()
            }
        }
    }

    const processRequest = () => {
        const rawRequestData = extractHeaderAndBody()
        const header = parseHeader(rawRequestData)
        const queryString = readQueryString(header, rawRequestData)

        buffer.clear()
        buffer.flip()

        return {
            httpRequest: httpChannel,
            queryString,
            rest: header.location.urn,
            contentType: header.contentType,
            method: header.httpMethod,
            requestURI: header.location.raw,
            pathInfo: '',
            scheme: '',
            host: header.headers.Host,
            port: header.headers.Port,
            cookies: mountCookiesObj(header.headers.Cookie || header.headers.cookie),
            headers: header.headers,
            contextPath: '',
            servletPath: ''
        }
    }

    return processRequest()
}
