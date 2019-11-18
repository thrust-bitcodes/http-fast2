const dbUtil = require('../../utils/database-util')
const briefUtils = require('../../utils/brief-util')
const healthBO = require('./health-bo')

const getVersion = (_,__,response) => {
    const version = briefUtils.getVersion()
    response.json({
        version
    })
}

const getHealth = (_,__, response) => {
    healthBO(dbUtil.getDb()).pingDatabase()
    response.json({ status: 'success' })
}

exports = {
    getVersion,
    getHealth
}