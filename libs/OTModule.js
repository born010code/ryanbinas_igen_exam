exports.updateOT = function( conditions, data ) {
	
	return new Promise((resolve, reject) => {

		// // Is user exist?
		const OvertimeModel  = require('../models/Overtime');
		const SystemLogModel  = require('../models/SystemLog');
		var opts = { runValidators: true, new: true };

		OvertimeModel.findOneAndUpdate(conditions, data, opts, function (error, result) {

			if ( error ) {
				//console.log('ERROR(updateOT): ', error);
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( !result ) {
				reject( {message: 'Unable to find overtime record.'} );
				return;
			}

			resolve( result );

		})
		.populate('employee');



	}); // End Promise	
};

exports.validateOT = function( params ) {
	
	return new Promise((resolve, reject) => {

		var moment = require('moment-timezone');
		let currTime = moment().format("YYYY-MM-DD HH:mm:ss");
		let currTimeUnix = moment(currTime, "YYYY-MM-DD HH:mm:ss").unix();
		let time_in = moment(params.time_in).format("YYYY-MM-DD HH:mm:ss");
		let time_in_unix = moment(time_in).unix();
		let time_out = moment(params.time_out).format("YYYY-MM-DD HH:mm:ss");
		let time_out_unix = moment(time_out).unix();
		let for_date = moment(params.time_in).format("YYYY-MM-DD");
		let added12Hours = moment(params.time_in).add(12, 'hours').format("YYYY-MM-DD HH:mm:ss");

		if ( time_in_unix <= currTimeUnix || time_out_unix <= currTimeUnix ) {
			reject( {message: 'Time-in or time-out cannot be the same or less than the current time and date.'} );
			return;
		}

		if ( time_in_unix >= time_out_unix ) {
			reject( {message: 'Time-in cannot be the same or more than time-out.'} );
			return;
		}

		if ( time_out > added12Hours ) {
			reject( {message: 'Overtime cannot be more than 12 hours.'} );
			return;
		}

		if ( params.with_ot_rate && params.ot_rate <= 0 ) {
			reject( {message: 'Overtime rate cannot be 0 or less.'} );
			return;	
		}

		if ( !params.with_ot_rate ) {
			params.ot_rate = 0;
		}

		var data = {
			for_date: for_date,
			time_in: time_in,
			time_in_unix: time_in_unix,
			time_out: time_out,
			time_out_unix: time_out_unix,
			with_ot_rate: params.with_ot_rate,
			ot_rate: params.ot_rate,
		};

		resolve( data );


	}); // End Promise	
};

exports.checkApprover = function( conditions, status ) {
	
	return new Promise((resolve, reject) => {

		const SupervisorMemberModel  = require('../models/SupervisorMember');

		//console.log('conditions', conditions);

		SupervisorMemberModel.findOne(conditions, function(err, result) {

			if ( err ) {
				//console.log('ERROR(checkApprover): ', error);
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( !result ) {
				reject( {message: 'You are not allowed to ' + status + ' this overtime.'} );
				return;
			}

			resolve( result );

		});


	}); // End Promise	
};

exports.updateDTR = function( params ) {
	
	return new Promise((resolve, reject) => {

		const DTRModel  = require('../models/DailyTimeRecord');
		var moment = require('moment-timezone');
		var opts = { runValidators: true, new: true };

		let fromDate = moment(params.time_in).format("YYYY-MM-DD 00:00:00");
   		let toDate = moment(params.time_in).format("YYYY-MM-DD 23:59:59");

		var conditions = {
			user_id: params.employee._id,
			for_date: { $gte: fromDate, $lte: toDate },
			is_absent: 0
		};
		
		var data = {
			ot_in_ref: params.time_in,
			ot_in_ref_unix: params.time_in_unix,
			ot_out_ref: params.time_out,
			ot_out_ref_unix: params.time_out_unix,
			with_ot: true
		};

		DTRModel.findOne(conditions, function(err, result) {

			if ( err ) {
				//console.log('ERROR(updateDTR): ', error);
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( result ) {

				DTRModel.findOneAndUpdate(conditions, data, opts, function (error, result) {

					if ( error ) {
						//console.log('ERROR(updateDTR): ', error);
						reject( {message: 'An error occurred. Please try again later.'} );
						return;
					}

					if ( !result ) {
						reject( {message: 'Unable to find overtime record.'} );
						return;
					}


				});
			}

			resolve( params );

		});


	}); // End Promise	
};