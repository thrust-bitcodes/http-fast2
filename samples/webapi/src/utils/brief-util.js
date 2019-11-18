const fs = require('filesystem')

const BRIEFJSON = `${__ROOT_DIR__}/brief.json`
const briefData = {}

const getBriefJson = () => {
    if (!briefData.json) {
        briefData.json = fs.readJson(BRIEFJSON, 'utf-8')
    }
    return briefData.json
}

const getVersion = () => {
    return getBriefJson().version
}

exports = {
    getBriefJson,
    getVersion,
}