var mongoose = require('mongoose');

var VotacionSchema = mongoose.Schema({
	_id: Number,
	nombre: String,
	fechaInicio: Date,
	fechaFin: Date
});

VotacionSchema.methods.toJSON = function() {
	var obj = this.toObject();
	obj.id = obj._id;
	delete obj._id;
	delete obj.__v;
	return obj;
}

var Votacion = mongoose.model('Votacion', VotacionSchema);
module.exports = Votacion;