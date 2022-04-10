exports.toFixed = function( number, toFix ) {

	let divisibleWith = 100000,
		toFixed = toFix || 4;
	
	return parseFloat( 
		( ( number * divisibleWith ) / divisibleWith ).toFixed(toFixed)
	); 
};
