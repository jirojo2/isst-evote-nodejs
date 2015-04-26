var mongoose = require('mongoose');

var VotoSchema = mongoose.Schema({
	_id: Number,
	votacion: { type: Number, ref: 'Votacion' },
	cee: { type: Number, ref: 'CEE' },
	sector: { type: Number, ref: 'Sector' },
	candidato: { type: Number, ref: 'Candidato' },
	timestampEmitido: Number,
	timestamp: Number,
	nonce: Number,
	firma: String
});

VotoSchema.methods.toJSON = function() {
	var obj = this.toObject();
	obj.id = obj._id;
	delete obj._id;
	delete obj.__v;
	return obj;
}

var Voto = mongoose.model('Voto', VotoSchema);
module.exports = Voto;