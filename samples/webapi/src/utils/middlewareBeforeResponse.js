exports = (error, _, __, response) => {
    if (error) {
        let statusCode = error.statusCode || 500
        let message = error.message || 'Unknown error'
        console.error('Error:', error)
        response.status(statusCode).json({ message })
    }
}