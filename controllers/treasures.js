'use strict';

const express = require('express');
const router = express.Router();

// Libs
var ErrorMsgs = require('../constants/ErrorMsgs');
var Sequelize = require('sequelize');

// Models declarations
const Treasure  = require('../models').Treasure;
const MoneyValue  = require('../models').MoneyValue;

// Variables
var ApiParams = require('../constants/ApiParams');
var Params = new ApiParams().params;


// Middleware that is specific to this router.
router.use( function timeLog (req, res, next) {
	Params = new ApiParams().params;
	next()
});


// INDEX
router.get('/', function (req, res) {
	
	// var latitude = parseFloat(14.552036595352455);
    // var longitude = parseFloat(121.01696118771324);

	var latitude = parseFloat(req.query.latitude) || null;
	var longitude = parseFloat(req.query.longitude) || null;
	var radiusInputInKM = parseInt(req.query.radius) || null;
	var amt = (req.query.amt) || null;

	let includesParams = [];

	// Do not allow other values for lat and long.
	if ( latitude !== 14.552036595352455 || 
		 longitude !== 121.01696118771324 ) {
			
		Params.error = true;
		Params.msg = ErrorMsgs.err_0005 + ' Longitude or Latitude is not valid.';
		res.json( Params );
		return;
	}

	// Do not allow other values for radius except for 1 and 10
	if ( !(radiusInputInKM === 1 || radiusInputInKM === 10) ) {
		Params.error = true;
		Params.msg = ErrorMsgs.err_0005 + ' Radius must be 1 or 10 only.';
		res.json( Params );
		return;
	}

	// Do not allow other values for amt.
	console.log('Amount: ' + amt);
	if ( amt !== null ) {
		// Check if whole number
		if ( amt % 1 != 0) {
			Params.error = true;
			Params.msg = ErrorMsgs.err_0005 + ' Amount is not valid. Must be whole number.';
			res.json( Params );
			return;
		}

		if ( amt < 10 || amt > 30  ) {
			Params.error = true;
			Params.msg = ErrorMsgs.err_0005 + ' Amount is not valid. Must be between 10 to 30.';
			res.json( Params );
			return;
		}

		// Now create a conditions and params for query
		includesParams.push( {
			model: MoneyValue,
			separate: false,
			required: true,
			order: [
				['amt']
			],
			where: [Sequelize.where( Sequelize.col('amt'), '<=', amt) ],
			limit: 1,
		});
   }
   	
    var startLocation = Sequelize.literal(`ST_GeomFromText('POINT(${longitude} ${latitude})', 4326)`);
    var endLocation = Sequelize.literal(`POINT(longitude, latitude)`);
	var radius = radiusInputInKM / 111; // This will convert the result to KM approximately.

	// Let's go. 
	Treasure.findAll({
		include: includesParams,
		attributes: {
			include: [
				[Sequelize.fn('ST_Distance', startLocation, endLocation)  ,'distance'] 
			]
		},
		order: Sequelize.col('id'),
		having: [
			Sequelize.where( Sequelize.col('distance'), '<=', radius),
		],
		
		logging: console.log
    })
    .then(function(results) {
		Params.error = false;
		Params.results = results;
		Params.results_count = results.length;
		res.json( Params );
		return;
    }, function (err) {
		Params.error = true;
		Params.msg = err;
		res.json( Params );
		return;
	});
});

module.exports = router;
