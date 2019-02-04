const express = require('express')
const homeRoute = require('./routes/homeRoute')

const server = express()

// Middleware
server.use(express.static('public'))
server.use(express.urlencoded({extended: false}))

server.use('/', homeRoute)

module.exports = server