exports.Candidato = require('./Candidato.js');
exports.CEE = require('./CEE.js');
exports.Sector = require('./Sector.js');
exports.Votacion = require('./Votacion.js');
exports.Voto = require('./Voto.js');

exports.generarId = function() {
	return parseInt(Math.random()*1000000000, 10);
}