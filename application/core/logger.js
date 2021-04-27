'use strict'

function setConsoleJson (replacer, space) {
    if (typeof space === 'number') {
        console.assert(space >= 0, 'invalid space number ' + space)
    } else if (typeof space !== 'string') {
        throw new Error('space argument should be either number of string, not ' + space)
    }

    console.json = function consoleJsonWorker() {
        let args = Array.prototype.slice.call(arguments)

        args = args.map(function (k) {
            if (typeof k === 'object' || Array.isArray(k)) {
                return JSON.stringify(k, replacer, space)
            }

            return k
        })

        console.log.apply(console, args)
    }
}

function ErrorLog (error, errorData=null) {
    const stacks = error.stack.split('\n')
    const { bg: BG, fg: FG, style: SY } = Color
    const x = Color.style.RESET

    console.log('\r\n')
    console.log(BG.RED + FG.WHITE + SY.BLINK, '<<< ERROR >>>', x)

    stacks.map((stack, index) => {
        if (index === 0) {
            if (stack.indexOf('ApiError') !== -1) {
                const message = stack.replace('ApiError:', '')

                console.log(FG.RED + SY.UNDERSCORE + 'ApiError:' + x + FG.RED + message, x)
                return
            }

            console.log(FG.RED, stack, x)
        } else {
            const bold   = (index === 1) ? SY.BRIGHT : ''
            const color1 = bold + SY.DIM + FG.RED
            const color2 = bold + SY.DIM + FG.WHITE
            const text = stack.replace('   ', '').replace('file:///home/api', '')

            console.log(color1, '▼' + x + color2 + text, x)
        }
    })

    if (errorData) {
        console.log(FG.RED + SY.UNDERSCORE + 'Error Details:' + x)
        console.json(errorData)
    }
}

function Log (message, options=null) {
    const {
        blink=false, data=null, danger=false, err=null, info=false, prefix='', success=false, time=true
    } = options || {}
    const { bg: BG, fg: FG, style: SY } = Color
    const x   = Color.style.RESET
    const now = new Date()
    const ts  = (time) ? FG.YELLOW + now.toLocaleString().replace('/'+now.getFullYear(), '')+' '+ x : ''

    if (prefix) {
        message = message.replace('"_', `"${FG.MAGENTA}${SY.BRIGHT}`)
    }

    if (err) {
        if (prefix) {
            message = message.replace('_"', `${FG.RED}"`)
            console.log(ts + BG.RED + FG.WHITE + SY.BRIGHT, prefix, x, FG.RED + message, x)
        } else {
            console.log(ts + BG.RED + FG.WHITE, message, x)
        }
    } else if (danger) {
        const { count=1 } = danger || {}
        const bold = (count === 1) ? SY.BRIGHT : ''

        danger.count = count + 1

        console.log(FG.WHITE + bold + count+')' + x, FG.MAGENTA + bold + message, x)
    } else if (info) {
        if (prefix) {
            message = message.replace('_"', `${FG.CYAN}"`)
            console.log(ts + BG.CYAN + FG.WHITE + SY.BRIGHT, prefix, x, FG.CYAN + message, x)
        } else {
            console.log(ts + BG.CYAN + FG.WHITE, message, x)
        }
    } else if (success) {
        if (prefix) {
            message = message.replace('_"', `${x}${FG.GREEN}"`)
            console.log(ts + BG.GREEN + FG.WHITE + SY.BRIGHT, prefix, x, FG.GREEN + message, x)
        } else {
            console.log(ts + BG.GREEN + FG.WHITE, message, x)
        }
    }

    if (data) {
        console.log(FG.WHITE + SY.DIM)
        console.json(data)
        console.log(x)
    }
}

const Color = {
    bg: {
        BLACK: '\x1b[40m',
        BLUE: '\x1b[44m',
        CYAN: '\x1b[46m',
        GREEN: '\x1b[42m',
        MAGENTA: '\x1b[45m',
        RED: '\x1b[41m',
        WHITE: '\x1b[47m',
        YELLOW: '\x1b[43m'
    },

    fg : {
        BLACK: '\x1b[30m',
        BLUE: '\x1b[34m',
        CYAN: '\x1b[36m',
        GREEN: '\x1b[32m',
        MAGENTA: '\x1b[35m',
        RED: '\x1b[31m',
        WHITE: '\x1b[37m',
        YELLOW: '\x1b[33m'
    },

    style: {
        BLINK: '\x1b[5m',
        BRIGHT: '\x1b[1m',
        DIM: '\x1b[2m',
        HIDDEN: '\x1b[8m',
        RESET: '\x1b[0m',
        REVERSE: '\x1b[7m',
        UNDERSCORE: '\x1b[4m'
    }
}

setConsoleJson(null, 4)


export {
    Color,
    ErrorLog,
    Log
}
