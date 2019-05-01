const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SEED = require('../config/config').SEED;

const app = express();
const Usuario = require('../models/usuario');

//google
const CLIENT_ID = require('../config/config').CLIENT_ID;
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

// IMPORT MEDDLEWARE QUE TIENE EL TOKEN
var mdAutentication= require( '../middlewares/autenticacion')


// ==============================
//Renueva TOKEN Automaticamente
// ==============================
app.get( '/renuevatoken', mdAutentication.verificaToken, ( req, res)=>{

    var token = jwt.sign({ usuario: req.usuario }, SEED, { expiresIn: 14400 }); // 4 horas

    res.status(200).json({
        ok:true,
        token:token
    });
});







// ==============================
// Autenticacion Por GOOGLE
// ==============================

async function verify( token ) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });

    const payload = ticket.getPayload();
    //const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];
   
    return {
        nombre: payload.name,
        email : payload.email,
        img : payload.picture,
        profile : payload.profile,
        google: true
    }
}
  //verify().catch(console.error);



app.post('/google', async(req, res) => {

    var token = req.body.token;
    
    var googleUser = await verify (token)
                    .catch(err=>{
                        return res.status(403).json({
                            ok: false,
                            mensaje: 'Token no valido',
                            errors: err
                        });
                    });
    
    Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {

        if (err) {

            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        if (usuarioDB) {
            if ( usuarioDB.google === false ) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debe usar una autenticacion normal',
                    errors: err
                });
            }else{
                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id,
                    menu: obtenerMenu(usuarioDB.role)
                });
            }           
        }else{
            // el usuario no existe hay que crearlo
            var usuario = new Usuario();

            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = ':)';

            usuario.save( (err, usuarioDB )=>{

                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id,
                    menu: obtenerMenu(usuarioDB.role)
                });
            });
        }
    });            

    // res.status(200).json({
    //     ok: true,
    //     mensaje: 'Google ok',
    //     googleUser
    // });

});






// ==============================
// Autenticacion Normal
// ==============================

app.post('/', (req, res) => {

    var body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password',
                errors: err
            });
        }

        // Crear un token!!!
        usuarioDB.password = ':)';

        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id,
            menu: obtenerMenu(usuarioDB.role)
        });

    })


});


// =======================================================
// Protegiendo el menu de usuario que solo puede ver ADMIN
// =======================================================

function obtenerMenu(ROLE){
   var menu = [
        {
          titulo:'Principal',
          icono: 'mdi mdi-gauge',
          submenu: [
            { titulo: 'Dashboard', url: '/dashboard' },
            { titulo: 'ProgressBar', url: '/progress' },
            { titulo: 'Graficas', url: '/graficas1' },
            { titulo: 'Promesas', url: '/promesas' },
            { titulo: 'Rxjs', url: '/rxjs' },
          ]
        },
        {
          titulo:'Mantenimientos',
          icono: 'mdi mdi-folder-lock-open',
          submenu: [
            // { titulo: 'Usuarios', url: '/usuarios' },
            { titulo: 'Hospitales', url: '/hospitales' },
            { titulo: 'Médicos', url: '/medicos' },
          ]
        }
      ];
      if (ROLE === 'ADMIN_ROLE') {
          menu[1].submenu.unshift( { titulo: 'Usuarios', url: '/usuarios' } );
      }

      return menu;
     
}




module.exports = app;