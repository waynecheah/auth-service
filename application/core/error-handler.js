class ApiError extends Error {
    constructor ({ code='UNKNOWN_ERROR', data=null, status=500 }={}, ...params) {
        super(...params)
  

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError)
        }
  
        if (data) {
            this.data = data
        }

        this.code   = code
        this.date   = new Date()
        this.name   = 'ApiError'
        this.status = status
    }
}


export {
    ApiError
}
