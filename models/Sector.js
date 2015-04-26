var mongoose = require('mongoose');

var SectorSchema = mongoose.Schema({
	_id: Number,
	nombre: String,
	ponderacion: Number,
	votacion: { type: Number, ref: 'Votacion' }
});

SectorSchema.methods.toJSON = function() {
	var obj = this.toObject();
	obj.id = obj._id;
	delete obj._id;
	delete obj.__v;
	return obj;
}

var Sector = mongoose.model('Sector', SectorSchema);
module.exports = Sector;