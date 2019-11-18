
exports = (db) => {
    const pingDatabase = () => {
        db.namedQuery('health-ping')
    }

    return {
        pingDatabase
    }
}