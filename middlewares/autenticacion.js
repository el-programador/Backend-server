var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;


// ==========================================
//  Verificar token
// ==========================================
exports.verificaToken = function(req, res, next) {

    var token = req.query.token;

    jwt.verify(token, SEED, (err, decoded) => {

        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token incorrecto',
                errors: err
            });
        }

        req.usuario = decoded.usuario;

        next();


    });

}

// ==========================================
//  Verificar ADMIN
// ==========================================
exports.verificaADMIN_ROLE = function(req, res, next) {

    var usuario = req.usuario;
    
        if (usuario.role === 'ADMIN_ROLE') {

            next();
            return;
           
        }else{
            // sino es admin
            return res.status(401).json({
                ok: false,
                mensaje: 'Token incorrecto - No es Admin',
                errors:{ message: 'No tienes permisos de Aministrador'}
            });
        }  
}


// ==========================================
//  Verificar ADMIN o Mismo usuario
// ==========================================
exports.verificaADMIN_ROLE_O_mismoUsuario = function(req, res, next) {

    var usuario = req.usuario;
    var id = req.params.id;

        if (usuario.role === 'ADMIN_ROLE' || usuario._id === id) {

            next();
            return;
           
        }else{
            // sino es admin
            return res.status(401).json({
                ok: false,
                mensaje: 'Token incorrecto - No es Admin- ni el mismo usuario',
                errors:{ message: 'No tienes permisos de Aministrador ni eres el mismo usuario'}
            });
        }  

}