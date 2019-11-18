exports = {
    hello(params, req, res) {
        const name = params.name
        console.log(`js.hello(name=${name},header ? ${!!req.headers['x-name']}`)
        if (!name) {
            return res.status(500).json({
                err: 1,
                msg: 'No name'
            })
        }
        if (req.headers['x-name']) {
            return res.plain(`|${name}|`)
        }
        res.json({
            hello: name
        })
    },
    helloBody(params, req, res) {
    	const x = params.x
    	const y = params.y
    	if (!x) {
    		throw new Error('No x')
    	}
    	if (!y) {
    		throw new Error('No y')
    	}
    	const z = x + y
    	console.log(`js.helloBody(x=${x},y=${y})=>${z}`)
    	res.json({z})
    },
    helloBody2(params, req, res) {
    	const info = params.info
    	const len = info === undefined || info === null ? -1 : ('' + info).length
    	return res.json({len})
    },
    bye(params, _, res) {
        try {
            const key = Number(params.key) || 0
            if (key !== 1) {
                res.status(500).json({
                    err: 'invalid key'
                })
            } else {
                const httpFast = require('http-fast2')
                httpFast.stopServer()
                res.status(202).sendNoContent()
            }
        } catch (e) {
            console.error(e)
            res.status(500).json({
                msg: e.message
            })
        }
        
    }
}
