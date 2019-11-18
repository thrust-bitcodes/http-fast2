const System = Java.type('java.lang.System')
const Thread = Java.type('java.lang.Thread')
const SimpleThrustWorkerManager = Java.type('br.com.softbox.thrust.api.thread.simple.SimpleThrustWorkerManager')
const appWorkerManager = new SimpleThrustWorkerManager()
const APP_DIR = `${__ROOT_DIR__}/..`
const APP_MAIN = `${APP_DIR}/src/index.js`
const initAppManager = () => {
    appWorkerManager.initPool(1, 2, APP_DIR)
    appWorkerManager.hasInitPool = true
}

const appRun = () => {
    if (!appWorkerManager.hasInitPool) {
        initAppManager()
    }
    appWorkerManager.runScript(APP_MAIN)
    Thread.sleep(10000)
}

const exit = (code) => System.exit(code)


exports = {
    appRun,
    exit
}