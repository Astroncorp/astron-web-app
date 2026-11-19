module.exports = {
    apps: [
        {
            name: 'webapp',
            port: '3000',
            exec_mode: 'fork',
            script: './.output/server/index.mjs'
        }
    ]
}