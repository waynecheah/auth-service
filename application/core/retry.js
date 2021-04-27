
'use strict'

class Retry {
    constructor ({ current=0, increment=1000, log=null, name='process', waitTime=3000 }={}) {
        this.current   = current
        this.increment = increment
        this.log       = log
        this.name      = name
        this.process   = null
        this.waitTime  = waitTime
    }

    cancel () {
        if (this.process) {
            clearTimeout(this.process)
            this.process = null
        }
    }

    do (fn, options=null) {
        if (typeof fn != 'function') return

        const { name='', increment=true } = options || {}
        const time = (this.current * this.increment) + this.waitTime
        const processName = name || this.name

        if (increment) this.current++

        this.cancel()

        if (
            this.log &&
            typeof this.log === 'function' &&
            this.log.length >= 1
        ) {
            this.log(`Retry ${processName} x${this.current} in ${time}ms`, {
                info: true,
                prefix: `Retry.do`
            })
        }

        this.process = setTimeout(() => {
            this.process = null
            fn()
        }, time)
    }

    reset () {
        this.cancel()
        this.current = 0
    }
}


export {
    Retry
}
