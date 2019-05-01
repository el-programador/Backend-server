//lo usaremos como modelo para crear y probarlo rapidamente las otras rutas

var express = require('express');

var app = express();


app.get('/', (req, res, next) => {

    res.status(200).json({
        ok: true,
        mensaje: 'Peticion realizada correctamente'
    });

});

module.exports = app;