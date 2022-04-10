exports.toFields = function( text, seperator = ',', toArray = true ) {

	seperator = seperator || ' ';
	text = text || '';
	text = text.replace(/,/g, seperator, -1);

	if ( toArray ) text = text ? text.split( seperator ) : [] ;

	return text;
};


exports.toSort = function( text, seperator = ',' ) {

	seperator = seperator || ' ';
	text = text || '';
	text = text.replace(/,/g, seperator, -1);

	text = text ? text.split( seperator ) : [] ;

	let obj = {};
	if ( text.length ) {
		for (var i = 0; i < text.length; i++) {
			let val = text[i].split(':');
			obj[val[0]] = val[1] ? parseInt(val[1]) : 1;
		}
	}

	return obj;
};