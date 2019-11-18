const dbm = require('database')
const fs = require('filesystem')
const configUtil = require('./config-util')
const Paths = Java.type('java.nio.file.Paths')

const DB_SQLS = Paths.get(__ROOT_DIR__, 'sqls').toString()
const cfgDatabase = {}

const getCfgDatabase =() => {
    if (!cfgDatabase.cfg) {
        const cfg = configUtil.getDatabaseConfig()
        if (!cfg) {
            throw new Error('No database configuration on "config.json"')
        }
        cfgDatabase.cfg = cfg
    }
    return cfgDatabase.cfg
}

const getSqlQueryFile = (query) => {
    if (!query.endsWith('.sql')) {
        query = query + '.sql'
    }
    const sqlFile = Paths.get(DB_SQLS, query).toString()
    if (!fs.exists(sqlFile)) {
        throw new Error('Query not found: ' + query)
    }
    return sqlFile
}

const namedQuery = (db) => (query, params) => {
    const sqlFile = getSqlQueryFile(query)
    const sql = fs.readAll(sqlFile, 'utf-8')

    return db.execute(sql, params)
}

const selectFirst = (db) => (...args) => {
    const list = db.select(...args)
    return list && list.length ? list[0] : null
}

const getDb = () => {
    const dbConfig = getCfgDatabase()
    const db = dbm.createDbInstance(dbConfig)
    db.namedQuery = namedQuery(db)
    db.selectFirst = selectFirst(db)
    return db
}

exports = {
    getDb
}
