var mongoose = require('mongoose');

var CandidatoSchema = mongoose.Schema({
	_id: Number,
	nombre: String,
	apellidos: String,
	nif: String,
	votacion: { type: Number, ref: 'Votacion' }
});

CandidatoSchema.methods.toJSON = function() {
	var obj = this.toObject();
	obj.id = obj._id;
	delete obj._id;
	delete obj.__v;
	return obj;
}

var Candidato = mongoose.model('Candidato', CandidatoSchema);
module.exports = Candidato;