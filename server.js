var mongoose = require('mongoose');
var express = require('express');
var async = require('async');

var Modelo = require('./models')

// express middleware
var bodyParser = require('body-parser');
var morgan = require('morgan');

// express app instance
var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// log
app.use(morgan('dev'))

// express routes
app.get('/', function(req, res) {
    res.send('hello world');
});

app.post('/voto', function(req, res) {
    // Just eat the vote, do not validate anything
    var voto = new Modelo.Voto({
        _id: Modelo.generarId(),
        timestamp: Date.now(),
        votacion: req.body.votacion_id,
        cee: req.body.cee_id,
        sector: req.body.sector_id,
        candidato: req.body.candidato_id,
        nonce: req.body.nonce,
        firma: req.body.firma
    });

    voto.save(function(err) {
        if (err) {
            res.json({ nonce: req.body.nonce, respuesta: 'rechazado por error', timestamp: Date.now() });
        }
        res.json({ nonce: req.body.nonce, respuesta: 'ok', timestamp: Date.now() });
    })
});

app.get('/resultados', function(req, res) {
    var votacion = null;
    var candidatos = [];
    var sectores = [];
    var resultados = {
        votosEmitidos: {},
        votosBlanco: {},
        candidatos: []
    };
    async.waterfall([
        function findVotacion(cb) {
            Modelo.Votacion
                .findOne()
                .where('_id').equals(req.query.id)
                .exec(cb)
        },
        function findCandidatos(_votacion, cb) {
            votacion = _votacion;
            Modelo.Candidato
                .find()
                .where('votacion').equals(votacion.id)
                .exec(cb)
        },
        function findSectores(_candidatos, cb) {
            candidatos = _candidatos;
            Modelo.Sector
                .find()
                .where('votacion').equals(votacion.id)
                .exec(cb)
        },
        function findBlanco(_sectores, cb) {
            sectores = _sectores;
            var blanco = null;
            candidatos.forEach(function(candidato) {
                if (candidato.nif == 'blanco')
                    blanco = candidato;
            });
            cb(blanco === null ? true : null, blanco);
        },
        function findBlancosPorSector(_blanco, cb) {
            blanco = _blanco;
            async.each(sectores, function(sector, cb2) {
                Modelo.Voto
                    .count()
                    .where('votacion').equals(votacion.id)
                    .where('sector').equals(sector.id)
                    .where('candidato').equals(blanco.id)
                    .exec(function(err, count) {
                        if (err) return cb2(err);
                        resultados.votosBlanco[sector.nombre] = count;
                        cb2();
                    })
            }, cb)
        },
        function findVotosPorSector(cb) {
            async.each(sectores, function(sector, cb2) {
                Modelo.Voto
                    .count()
                    .where('votacion').equals(votacion.id)
                    .where('sector').equals(sector.id)
                    .exec(function(err, count) {
                        if (err) return cb2(err);
                        resultados.votosEmitidos[sector.nombre] = count;
                        cb2();
                    })
            }, cb)
        },
        function doRecuento(cb) {
            async.eachSeries(candidatos, function(candidato, cb2) {
                var votosPorSector = {};
                var totalPonderado = 0;
                async.each(sectores, function(sector, cb3) {
                    Modelo.Voto
                        .count()
                        .where('votacion').equals(votacion.id)
                        .where('candidato').equals(candidato.id)
                        .where('sector').equals(sector.id)
                        .exec(function(err, count) {
                            if (err) {
                                return cb3(err);
                            }
                            if (candidato.id != blanco.id) {
                                var validos = resultados.votosEmitidos[sector.nombre] - resultados.votosBlanco[sector.nombre];
                                if (validos == 0) {
                                    count = 1;
                                    validos = 2;
                                }
                                totalPonderado += count * sector.ponderacion / validos;
                                votosPorSector[sector.nombre] = count;
                                //console.log("%s %s, %d de %d votos válidos, %d ponderado", candidato.nombre, sector.nombre, count, validos, totalPonderado)
                            }
                            cb3();
                        })
                }, function(err) {
                    if (candidato.id != blanco.id)
                    resultados.candidatos.push({
                        nombre: candidato.nombre,
                        totalPonderado: totalPonderado,
                        votos: votosPorSector
                    });
                    cb2(err);
                });
            }, cb);
        }
    ], function(err) {
        if (err) {
            console.log(err);
            return res.json({ err: err });
        }
        res.json(resultados);
    });
});

app.post('/sync', function(req, res) {
    // Create CEE and other models

    var cee = null;
    var votacion = null;
    var blanco = null;
    var candidatos = [];
    var sectores = [];

    var censo = [
        {
            nombre: 'grupoA',
            censo: 1820,
            ponderacion: 0.51
        },
        {
            nombre: 'grupoB',
            censo: 2297,
            ponderacion: 0.16
        },
        {
            nombre: 'grupoC',
            censo: 39450,
            ponderacion: 0.24
        },
        {
            nombre: 'grupoD',
            censo: 2569,
            ponderacion: 0.09
        }
    ];

    async.series([
        function(cb) {
            cee = new Modelo.CEE({
                _id: Modelo.generarId(),
                nombre: 'CEE de prueba',
                clavePublica: req.body.key
            });
            cee.save(cb);
        },
        function(cb) {
            votacion = new Modelo.Votacion({
                _id: Modelo.generarId(),
                nombre: 'Votación de prueba'
            });
            votacion.save(cb);
        },
        function(cb) {
            blanco = new Modelo.Candidato({
                _id: Modelo.generarId(),
                votacion: votacion.id,
                nombre: 'blanco',
                apellidos: 'blanco',
                nif: 'blanco'
            });
            blanco.save(cb);
        },
        function(cb) {
            async.each(['CandidatoA', 'CandidatoB'], function(nombre, cb2) {
                var Candidato = new Modelo.Candidato({
                    _id: Modelo.generarId(),
                    votacion: votacion.id,
                    nombre: nombre,
                    apellidos: nombre,
                    nif: 'test'
                });
                candidatos.push(Candidato);
                Candidato.save(cb2);  
            }, cb)
        },
        function(cb) {
            async.each(censo, function(grupo, cb2) {
                var Sector = new Modelo.Sector({
                    _id: Modelo.generarId(),
                    votacion: votacion.id,
                    nombre: grupo.nombre,
                    ponderacion: grupo.ponderacion
                });
                sectores.push(Sector);
                Sector.save(cb2);  
            }, cb)
        }
    ], function(err) {
        if (err) {
            console.log(err);
            return res.json(err);
        }

        var respuesta = {
            votacion: votacion,
            cee: cee,
            blanco: blanco,
            candidatos: candidatos,
            sectores: sectores,
            censo: sectores.reduce(function(obj, sector) {
                censo.forEach(function(c) {
                    if (sector.nombre == c.nombre)
                        obj[sector.id] = c.censo;
                });
                return obj;
            }, {})
        };

        res.json(respuesta);
    })
});

// Connect to mongodb
mongoose.connect('mongodb://localhost/isst-evote');

// Launch express app
app.listen(process.env.PORT || 3000);