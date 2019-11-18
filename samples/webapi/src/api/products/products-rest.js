const dbUtil = require('../../utils/database-util')
const productsBO = require('./products-bo')

const { NotFoundError } = require('../../utils/errors')

const findAll = (_, {context}, response) => {
    const products = productsBO(dbUtil.getDb(), context).findAll()
    response.json(products)
}

const findById = (params, {context}, response) => {
    const product = productsBO(dbUtil.getDb(), context).findById(params.id)
    if (!product) {
        throw new NotFoundError('Product not found')
    }
    response.json(product)
}

exports = {
    findAll,
    findById
}