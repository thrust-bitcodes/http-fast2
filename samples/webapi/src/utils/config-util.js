const CONFIG_JSON = `${__ROOT_DIR__}/config.json`
const configJson = {}

const getDatabaseConfig = () => getConfig().database
const getServerConfig = () => getConfig().server

exports = {
    getDatabaseConfig,
    getServerConfig,
}