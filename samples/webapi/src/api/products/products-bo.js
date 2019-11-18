const paramsUtils = require('../../utils/params-util')

const TABLE_NAME = 'products'

exports = (db, context) => {
    const findAll = () => db.select(TABLE_NAME)
    const findById = (id) => {
        id = paramsUtils.toInt(id, '\'id\' must be a number')
        return db.selectFirst(TABLE_NAME, '', {id})
    }
    return {
        findAll,
        findById,
    }
}