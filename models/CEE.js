var mongoose = require('mongoose');

var CEESchema = mongoose.Schema({
	_id: Number,
	nombre: String,
	calvePublica: String
});

CEESchema.methods.toJSON = function() {
	var obj = this.toObject();
	obj.id = obj._id;
	delete obj._id;
	delete obj.__v;
	return obj;
}

var CEE = mongoose.model('CEE', CEESchema);
module.exports= CEE;