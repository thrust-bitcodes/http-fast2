const parseValue = (value) => {
    if (value === 'true') {
        return true
    }
    if (value === 'false') {
        return false
    }
    return isNaN(value) ? value : Number(value)
}
const parseKey = (params, skey, value) => {
    let k 
    let ko 
    let patt = /\w+|\[\w*\]/g
    let key = patt.exec(skey)[0]
    let p = params
    while ((ko = patt.exec(skey)) != null) {
        k = ko.toString().replace(/\[|\]/g, '')
        let m = k.match(/\d+/gi)
        if ((m != null && m.toString().length === k.length) || ko === '[]') {
            k = parseInt(k)
            p[key] = p[key] || []
        } else {
            p[key] = p[key] || {}
        }
        p = p[key]
        key = k
    }
    if (typeof (key) === 'number' && isNaN(key)) {
        p.push(parseValue(value))
    } else {
        p[key] = parseValue(value)
    }
}
const parseParam = (params) => (sparam) => {
    const unescapedSParam = unescape(sparam)
    const firstEqualIndex = unescapedSParam.indexOf('=')
    if (firstEqualIndex >= 0) {
        const paramKey = unescapedSParam.substr(0, firstEqualIndex)
        const paramValue = unescapedSParam.substr(firstEqualIndex + 1)
        parseKey(params, paramKey, paramValue)
    }
}
const parseParams = (strParams, contentType) => {
    let params = {}
    if (strParams) {
        if (contentType && contentType.startsWith('application/json')) {
            params = JSON.parse(strParams)
        } else if (contentType.startsWith('multipart/form-data')) {
            params = strParams
        } else {
            const arrParams = strParams.split('&')
            arrParams.forEach(parseParam(params))
        }
    }
    return params
}

exports = parseParams
