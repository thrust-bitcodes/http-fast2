exports = (err, param, req, res) => {
    if (err) {
        res.status(500).json({
        	description: 'Unknown error',
        	detail: err.message || ''
        })
    }
}
