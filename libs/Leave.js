exports.isHoliday = function( params ) {

	return new Promise((resolve, reject) => {
		
		const HolidayModel  = require('../models/Holiday');
		var moment = require('moment-timezone');

		if ( !params.date )	{
			reject( {message: 'Please choose a date.', error_type: 'warning'} );
			return;
		}

		var date = moment(params.date).format('YYYY-MM-DD');

		var conditions = {
			date: date,
			company_id: params.company_id,
			branch_id: params.branch_id
		}

		HolidayModel.findOne( conditions, function(error, holiday) {

			if ( error ) {
				// reject( error );
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( holiday ) {
				reject( {message: 'This date is a holiday.'} );
				return;	
			}

			resolve();
			
		});

		
	}); // End Promise	
}

exports.hasLeave = function( params ) {

	return new Promise((resolve, reject) => {
		
		const LeaveModel  = require('../models/Leave');
		var moment = require('moment-timezone');

		var conditions = {
			date: params.date,
			user_id: params.user_id,
			status: 'approved'
		}

		LeaveModel.findOne( conditions, function(error, leave) {

			if ( error ) {
				// reject( error );
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( leave ) {
				reject( {message: 'This employee has an existing leave on the same date.'} );
				return;	
			}

			resolve();
			
		});

		
	}); // End Promise	
}

exports.checkLeaveCredit = function( params ) {

	return new Promise((resolve, reject) => {

		console.log('here @ checkLeaveCredit');
		
		const UserModel  = require('../models/User');
		var moment = require('moment-timezone');

		var conditions = {
			_id: params.user_id,
			company_id: params.company_id,
			branch_id: params.branch_id
		}

		var fields = '+leave_credits';

		UserModel.findOne( conditions, function(error, user) {

			if ( error ) {
				// reject( error );
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( !user ) {
				reject( {message: ErrorMsgs.err_0004} );
				return;	
			}

			if ( !user.leave_credits.length ) {
				reject( {message: 'Employee does not have enough leave credits.'} );
				return;	
			}

			let existingLeaveType = false;

			for ( var i = 0; i < user.leave_credits.length; i++ ) {

				if ( user.leave_credits[i].type == params.type ) {
					existingLeaveType = true;
				}

				if ( user.leave_credits[i].type == params.type && user.leave_credits[i].credit <= 0 ) {
					reject( {message: 'Employee does not have enough leave credits.'} );
					return;	
				}
			}

			if ( !existingLeaveType ) {
				reject( {message: 'Employee does not have enough leave credits.'} );
				return;	
			}

			resolve( params );
			
		}).select(fields);

		
	}); // End Promise	
}

exports.createLeave = function( params ) {

	return new Promise((resolve, reject) => {
		
		const LeaveModel  = require('../models/Leave');
		var moment = require('moment-timezone');

		var LeaveDetail = new LeaveModel({
			user_id: params.user_id,
			employee: params.user_id,
			date: params.date,
			type: params.type,
			reason: params.reason,
			company_id: params.company_id,
			branch_id: params.branch_id
		});

		// Validate the input first.
		LeaveDetail.validate( function(error) {

			if ( error ) {

				reject( {
					message: 'Unable to add to leaves.',
					form_errors: error
				});
				return;
			}

			// Now save data into db.
			LeaveDetail.save( function(err, leave) {

				if ( err ) {
					reject( {
						message: 'Something went wrong. Please try again later.',
						error: err
					});
					return;
				}

				resolve( leave );

			});


		});

		
		
	}); // End Promise	
}

exports.updateUserCredit = function( params ) {

	return new Promise((resolve, reject) => {

		console.log('here @ updateUserCredit');
		
		const UserModel  = require('../models/User');
		var moment = require('moment-timezone');

		var conditions = {
			_id: params.user_id,
			company_id: params.company_id,
			branch_id: params.branch_id
		}

		var fields = '+leave_credits';

		UserModel.findOne( conditions, function(error, user) {

			if ( error ) {
				// reject( error );
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( !user ) {
				reject( {message: ErrorMsgs.err_0004} );
				return;	
			}

			for ( var i = 0; i < user.leave_credits.length; i++ ) {

				if ( user.leave_credits[i].type == params.type ) {
					user.leave_credits[i].pending += 1;
				}

			}

			user.save( function (err, user){

				if ( err ) {
					reject( { message: ErrorMsgs.err_0001 } );
					return;	
				}

				if ( !user ) {
					reject( { message: ErrorMsgs.err_0004 } );
					return;	
				}

				resolve( params );
				
			});

		}).select(fields);

		
	}); // End Promise	
}

exports.updateUserLeave = function( params ) {
	return new Promise((resolve, reject) => {

		console.log('here @ updateUserLeave');
		
		const UserModel  = require('../models/User');
		var moment = require('moment-timezone');

		var conditions = {
			_id: params.user_id,
			company_id: params.company_id,
			branch_id: params.branch_id
		}

		var fields = '+leave_credits';

		UserModel.findOne( conditions, function(error, user) {

			if ( error ) {
				// reject( error );
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( !user ) {
				reject( {message: ErrorMsgs.err_0004} );
				return;	
			}

			for ( var i = 0; i < user.leave_credits.length; i++ ) {

				if ( user.leave_credits[i].type == params.type ) {
					user.leave_credits[i].credit -= 1;
					user.leave_credits[i].used += 1;
				}	
			}

			user.save( function (err, user){

				if ( err ) {
					reject( { message: ErrorMsgs.err_0001 } );
					return;	
				}

				if ( !user ) {
					reject( { message: ErrorMsgs.err_0004 } );
					return;	
				}

				resolve( params );
				
			});

		}).select(fields);

		
	}); // End Promise	
}