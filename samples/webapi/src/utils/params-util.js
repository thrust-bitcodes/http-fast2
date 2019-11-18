const { InvalidTypeError } = require('./errors')

const toInt = (value, msg) => {
    msg = msg || 'Expected a number'
    const i = parseInt(value)
    if (Number.isNaN(i)) {
        throw new InvalidTypeError(msg)
    }
    return i
}

exports = {
    toInt
}