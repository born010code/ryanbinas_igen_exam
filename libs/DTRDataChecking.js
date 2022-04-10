exports.completeData = function( params ) {

	return new Promise((resolve, reject) => {

		var moment = require('moment-timezone');
		var data = params.data;
		var time_in = moment(data.time_in).format("YYYY-MM-DD");
		var time_out = moment(data.time_out).format("YYYY-MM-DD");
		var time_in2 = moment(data.time_in2).format("YYYY-MM-DD");
		var time_out2 = moment(data.time_out2).format("YYYY-MM-DD");
		var ot_in = moment(data.ot_in).format("YYYY-MM-DD");
		var ot_out = moment(data.ot_out).format("YYYY-MM-DD");

		var time_in_ref = moment(data.time_in_ref).format("YYYY-MM-DD");
		var time_out_ref = moment(data.time_out_ref).format("YYYY-MM-DD");
		var time_in2_ref = moment(data.time_in2_ref).format("YYYY-MM-DD");
		var time_out2_ref = moment(data.time_out2_ref).format("YYYY-MM-DD");
		var ot_in_ref = moment(data.ot_in_ref).format("YYYY-MM-DD");
		var ot_out_ref = moment(data.ot_out_ref).format("YYYY-MM-DD");

		var status = data.status;
		var with_schedule = data.with_schedule;
		var with_break = data.with_break;
		var with_ot = data.with_ot;
		var with_night_differential = data.with_night_differential;
		var on_leave = data.on_leave;
		var salary_type = data.salary_type;
		var daily_rate = data.daily_rate || 0;
		var ot_rate = data.ot_rate || 0;
		var nd_rate = data.nd_rate || 0;

		var leaveTypes = [ 'EL', 'VL', 'SL', 'ML', 'PL' ];

		// Check withSchedule and withBreak
		if ( with_break && !with_schedule ) {
			reject( {message: 'You cannot have a break without a schedule.'} );
			return;				
		}

		if ( status == 'Absent' && !with_schedule ) {
			reject( {message: 'You cannot mark an employee absent without a schedule.'} );
			return;				
		}

		if ( status == 'Absent' && on_leave ) {
			reject( {message: 'You cannot mark an employee absent while on leave.'} );
			return;					
		}

		// Check OnLeave
		if ( on_leave && leaveTypes.indexOf(data.leave_type) < 0 ) {
			reject( {message: 'Leave type is required for employee on leave.'} );
			return;						
		}

		// Check OT
		if ( status == 'Absent' && with_ot ) {
			reject( {message: 'You cannot have overtime if status is absent.'} );
			return;					
		}

		if ( with_ot && ot_rate <= 0 ) {
			reject( {message: 'Overtime Rate is required and cannot be 0 or less.'} );
			return;				
		}

		if ( with_ot && on_leave ) {
			reject( {message: 'Employee cannot have overtime while on leave.'} );
			return;					
		}

		// Check Night Diff
		if ( status == 'Absent' && with_night_differential ) {
			reject( {message: 'You cannot have night differential if status is absent.'} );
			return;					
		}

		if ( on_leave && with_night_differential ) {
			reject( {message: 'Employee cannot have night differential while on leave.'} );
			return;					
		}

		if ( with_night_differential && nd_rate <= 0 ) {
			reject( {message: 'Night Differential Percentage Rate is required and cannot be 0 or less.'} );
			return;				
		}

		// Check Daily Rate
		if ( salary_type == 'monthly-fixed' || salary_type == 'bi-monthly-fixed' || salary_type == 'weekly-fixed' ) {
			params.data.daily_rate = 0;
		}

		// Check for missing inputs
		if ( !salary_type ) {
			reject( {message: 'Salary type is required.'} );
			return;				
		}

		if ( salary_type == 'monthly' || salary_type == 'bi-monthly' || salary_type == 'weekly' ) {
			if ( !daily_rate || daily_rate == 0 ) {
				reject( {message: 'Daily Rate is required and cannot be 0 or less.'} );
				return;				
			}
		}

		if ( with_schedule ) {
			if ( !data.time_in_ref ) {
				reject( {message: 'Time in reference is required.'} );
				return;				
			}

			if ( !data.time_out_ref ) {
				reject( {message: 'Time out reference is required.'} );
				return;				
			}
		}

		if ( with_break ) {
			if ( !data.time_in2_ref ) {
				reject( {message: 'Second time in reference is required.'} );
				return;				
			}

			if ( !data.time_out2_ref ) {
				reject( {message: 'Second time out reference is required.'} );
				return;				
			}
		}

		if ( with_ot ) {
			if ( !data.ot_in_ref ) {
				reject( {message: 'Overtime time in reference is required.'} );
				return;				
			}

			if ( !data.ot_out_ref ) {
				reject( {message: 'Overtime time out reference is required.'} );
				return;				
			}
		}

		if ( with_night_differential ) {
			if ( !data.nd_in_ref ) {
				reject( {message: 'Night Differential time in reference is required.'} );
				return;				
			}

			if ( !data.nd_out_ref ) {
				reject( {message: 'Night Differential time out reference is required.'} );
				return;				
			}
		}

		// Check if references have same date
		if ( with_schedule ) {
			if ( data.time_in && time_in != time_in_ref ) {
				reject( {message: 'Time in date is different from its reference.'} );
				return;					
			}

			if ( data.time_out && time_out != time_out_ref ) {
				reject( {message: 'Time out date is different from its reference.'} );
				return;					
			}
		}

		if ( with_break ) {
			if ( data.time_in2 && time_in2 != time_in2_ref ) {
				reject( {message: 'Second time in date is different from its reference.'} );
				return;					
			}

			if ( data.time_out2 && time_out2 != time_out2_ref ) {
				reject( {message: 'Second time out date is different from its reference.'} );
				return;					
			}
		}

		if ( with_ot ) {
			if ( data.ot_in && ot_in != ot_in_ref ) {
				reject( {message: 'Overtime time in date is different from its reference.'} );
				return;					
			}

			if ( data.ot_out && ot_out != ot_out_ref ) {
				reject( {message: 'Overtime time out date is different from its reference.'} );
				return;					
			}
		}

		// Check if more than today
		var today = moment().format("YYYY-MM-DD");
		if ( with_schedule ) {
			if ( moment(time_in_ref).isAfter(today) ){
				reject( {message: 'Time in cannot be more than the date today ' + today} );
				return;					
			}

			if ( moment(time_out_ref).isAfter(today) ){
				reject( {message: 'Time out cannot be more than the date today ' + today} );
				return;					
			}
		}

		if ( with_break ) {
			if ( moment(time_in2_ref).isAfter(today) ){
				reject( {message: 'Second time in cannot be more than the date today ' + today} );
				return;					
			}

			if ( moment(time_out2_ref).isAfter(today) ){
				reject( {message: 'Second time out cannot be more than the date today ' + today} );
				return;					
			}
		}

		if ( with_ot ) {
			if ( moment(ot_in_ref).isAfter(today) ){
				reject( {message: 'Overtime time in cannot be more than the date today ' + today} );
				return;					
			}

			if ( moment(ot_out_ref).isAfter(today) ){
				reject( {message: 'Overtime time out cannot be more than the date today ' + today} );
				return;					
			}
		}

		resolve(params);
		
	}); // End Promise	
}

exports.validateReferences = function( params ) {
	return new Promise(( resolve, reject ) => {

		var moment = require('moment-timezone');
		var data = params.data;

		var time_in_ref = moment(data.time_in_ref).format("YYYY-MM-DD HH:mm:ss");
		var time_out_ref = moment(data.time_out_ref).format("YYYY-MM-DD HH:mm:ss");
		var time_in2_ref = moment(data.time_in2_ref).format("YYYY-MM-DD HH:mm:ss");
		var time_out2_ref = moment(data.time_out2_ref).format("YYYY-MM-DD HH:mm:ss");
		var ot_in_ref = moment(data.ot_in_ref).format("YYYY-MM-DD HH:mm:ss");
		var ot_out_ref = moment(data.ot_out_ref).format("YYYY-MM-DD HH:mm:ss");
		var nd_in_ref = moment(data.nd_in_ref).format("YYYY-MM-DD HH:mm:ss");
		var nd_out_ref = moment(data.nd_out_ref).format("YYYY-MM-DD HH:mm:ss");
		var with_schedule = data.with_schedule;
		var with_break = data.with_break;
		var with_ot = data.with_ot;
		var with_night_differential = data.with_night_differential;

		if ( with_schedule ) {
			if ( time_in_ref >= time_out_ref ) {
				reject({message: 'Time in reference cannot be more than its time out reference.'});
				return;
			}
		}

		if ( with_break ) {

			if ( time_in2_ref <= time_out_ref ) {
				reject({message: 'Second time in reference cannot be less than the first time out reference.'});
				return;
			}

			if ( time_in2_ref >= time_out2_ref ) {
				reject({message: 'Second time in reference cannot be more than its time out reference.'});
				return;
			}
		}

		if ( with_ot ) {
			if ( ot_in_ref >= ot_out_ref ) {
				reject({message: 'Overtime time in reference cannot be more than its time out reference.'});
				return;
			}

			if ( with_schedule && with_break ) {
				if ( ot_in_ref <= time_out2_ref ) {
					reject({message: 'Overtime time in reference cannot be less than the second time out reference.'});
					return;
				}
			}

			if ( with_schedule && !with_break ) {
				if ( ot_in_ref <= time_out_ref ) {
					reject({message: 'Overtime time in reference cannot be less than the first time out reference.'});
					return;
				}
			}

		}

		if ( with_night_differential ) {
			if ( nd_in_ref < time_in_ref ) {
				reject({message: 'Night Differential time in reference cannot be less than the first time in reference.'});
				return;
			}

			if ( nd_out_ref < nd_in_ref ) {
				reject({message: 'Night Differential time out reference cannot be less than the night differential time in reference.'});
				return;	
			}

			if ( !with_break && nd_out_ref > time_out_ref ) {
				reject({message: 'Night Differential time out reference cannot be less than the first time out reference.'});
				return;	
			}

			if ( with_break && nd_out_ref > time_out2_ref ) {
				reject({message: 'Night Differential time out reference cannot be more than the second time out reference.'});
				return;
			}
		}

		// allow time-out to be 24 hours more than time-in
		if ( with_schedule ) {
			var time_in_ref_plus_1day = moment(time_in_ref, 'YYYY-MM-DD HH:mm:ss').add(1, 'd');
			time_in_ref_plus_1day = moment(time_in_ref_plus_1day).format('YYYY-MM-DD HH:mm:ss');

			if ( time_out_ref > time_in_ref_plus_1day ) {
				reject({message: 'Time out reference cannot be more than 24 hours after time in reference.'});
				return;			
			}	
		}

		if ( with_break ) {
			var time_in2_ref_plus_1day = moment(time_in2_ref, 'YYYY-MM-DD HH:mm:ss').add(1, 'd');
			time_in2_ref_plus_1day = moment(time_in2_ref_plus_1day).format('YYYY-MM-DD HH:mm:ss');

			if ( time_out2_ref > time_in2_ref_plus_1day ) {
				reject({message: 'Second Time out reference cannot be more than 24 hours after second time in reference.'});
				return;			
			}
		}

		if ( with_ot ) {
			var ot_in_ref_plus_1day = moment(ot_in_ref, 'YYYY-MM-DD HH:mm:ss').add(1, 'd');
			ot_in_ref_plus_1day = moment(ot_in_ref_plus_1day).format('YYYY-MM-DD HH:mm:ss');

			if ( ot_out_ref > ot_in_ref_plus_1day ) {
				reject({message: 'Overtime time out reference cannot be more than 24 hours after overtime time in reference.'});
				return;			
			}
		}

		resolve( params );

	});
}

exports.hasDTR = function( params ) {

	return new Promise((resolve, reject) => {
		
		const DailyTimeRecordModel  = require('../models/DailyTimeRecord');
		var moment = require('moment-timezone');
		var data = params.data;
		var for_date = data.time_in_ref ? data.time_in_ref : data.time_in2_ref ? data.time_in2_ref : data.ot_in_ref;
		
		if ( !for_date )	{
			reject( {message: 'Please choose a time-in date and time.', error_type: 'warning'} );
			return;
		}

		for_date = moment(for_date).format('YYYY-MM-DD');

		var fromDate = moment().format(for_date + " 00:00:00")
		var toDate = moment().format(for_date + " 23:59:59");

		params.date = {
			from: fromDate,
			to: toDate
		}

		const condition = {
			user_id: params.user._id,
			for_date: { $gte: fromDate, $lte: toDate },
		};

		DailyTimeRecordModel.findOne( condition, function(error, dtr) {

			if ( error ) {
				// reject( error );
				console.log('ERROR(isAlreadyLoggedIn): ', error);
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			// Found a record? This means that the employee already timed in.
			if ( dtr && params.action == 'create' ) {
				reject( {message: 'Sorry you are not allowed to clock in twice.', error_type: 'warning'} );
				return;
			}

			resolve( params );
			
		});

		
	}); // End Promise	
}


getDTRParams  = function ( params ) {
	return new Promise(( resolve, reject ) => {

		var moment = require('moment-timezone');
		var user = params.user;
		var data = params.data;

		params.is_absent = data.status == 'Absent' ? 1 : 0;
		params.with_schedule = data.with_schedule || 0;
		params.with_break = data.with_break || 0;
		params.with_ot = data.with_ot || 0;
		params.with_night_differential = data.with_night_differential || 0;

		params.time_in = moment(data.time_in).format("YYYY-MM-DD HH:mm:ss") || null;
		params.time_in_unix = moment(params.time_in).unix() || 0;
		params.time_in_ref = moment(data.time_in_ref).format("YYYY-MM-DD HH:mm:ss") || null;
		params.time_in_ref_unix = moment(params.time_in_ref).unix() || 0;
		params.time_in_diff = ( params.time_in_unix - params.time_in_ref_unix ) || 0;
		params.time_in_status = params.time_in_diff > 0 ? 'Late' : 'On Time';
		params.is_late = params.time_in_diff > 0 ? 1 : 0;
		params.late1 = params.time_in_diff > 0 ? params.time_in_diff : 0;

		params.time_out = moment(data.time_out).format("YYYY-MM-DD HH:mm:ss") || null;
		params.time_out_unix = moment(params.time_out).unix() || 0;
		params.time_out_ref = moment(data.time_out_ref).format("YYYY-MM-DD HH:mm:ss") || null;
		params.time_out_ref_unix = moment(params.time_out_ref).unix() || 0;
		params.time_out_diff = ( params.time_out_unix - params.time_out_ref_unix ) || 0;
		params.time_out_status = params.time_out_diff < 0 ? 'Undertime' : 'On Time';
		params.is_undertime = params.time_out_diff < 0 ? 1 : 0;
		params.undertime1 = params.time_out_diff < 0 ? params.time_out_diff : 0;

		params.work_to_render1 = params.time_out_ref_unix - params.time_in_ref_unix;
		params.work_rendered1 = params.work_to_render1;
		params.work_rendered1 -= params.late1 + (params.undertime1 * -1);

		params.time_in2 = moment(data.time_in2).format("YYYY-MM-DD HH:mm:ss") || null;
		params.time_in2_unix = moment(params.time_in2).unix() || 0;
		params.time_in2_ref = moment(data.time_in2_ref).format("YYYY-MM-DD HH:mm:ss") || null;
		params.time_in2_ref_unix = moment(params.time_in2_ref).unix() || 0;
		params.time_in2_diff = ( params.time_in2_unix - params.time_in2_ref_unix ) || 0;
		params.time_in2_status = params.time_in2_diff > 0 ? 'Late' : 'On Time';
		params.is_late2 = params.time_in2_diff > 0 ? 1 : 0;
		params.late2 = params.time_in2_diff > 0 ? params.time_in2_diff : 0;

		params.time_out2 = moment(data.time_out2).format("YYYY-MM-DD HH:mm:ss") || null;
		params.time_out2_unix = moment(params.time_out2).unix() || 0;
		params.time_out2_ref = moment(data.time_out2_ref).format("YYYY-MM-DD HH:mm:ss") || null;
		params.time_out2_ref_unix = moment(params.time_out2_ref).unix() || 0;
		params.time_out2_diff = ( params.time_out2_unix - params.time_out2_ref_unix ) || 0;
		params.time_out2_status = params.time_out2_diff < 0 ? 'Undertime' : 'On Time';
		params.is_undertime2 = params.time_out2_diff < 0 ? 1 : 0;
		params.undertime2 = params.time_out2_diff < 0 ? params.time_out2_diff : 0;

		params.work_to_render2 = params.time_out2_ref_unix - params.time_in2_ref_unix;
		params.work_rendered2 = params.work_to_render2;
		params.work_rendered2 -= params.late2 + (params.undertime2 * -1);

		params.ot_in = moment(data.ot_in).format("YYYY-MM-DD HH:mm:ss") || null;
		params.ot_in_unix = moment(params.ot_in).unix() || 0;
		params.ot_in_ref = moment(data.ot_in_ref).format("YYYY-MM-DD HH:mm:ss") || null;
		params.ot_in_ref_unix = moment(params.ot_in_ref).unix() || 0;
		params.ot_in_diff = ( params.ot_in_unix - params.ot_in_ref_unix ) || 0;
		params.ot_is_late = params.ot_in_diff > 0 ? 1 : 0;
		params.ot_in_status = params.ot_is_late ? 'Late' : 'On Time';
		params.ot_late = params.ot_in_diff > 0 ? params.ot_in_diff : 0;

		params.ot_out = moment(data.ot_out).format("YYYY-MM-DD HH:mm:ss") || null;
		params.ot_out_unix = moment(params.ot_out).unix() || 0;
		params.ot_out_ref = moment(data.ot_out_ref).format("YYYY-MM-DD HH:mm:ss") || null;
		params.ot_out_ref_unix = moment(params.ot_out_ref).unix() || 0;
		params.ot_out_diff = ( params.ot_out_unix - params.ot_out_ref_unix ) || 0;
		params.ot_is_undertime = params.ot_out_diff < 0 ? 1 : 0;
		params.ot_out_status = params.ot_is_undertime ? 'Undertime' : 'On Time';
		params.ot_undertime = params.ot_out_diff < 0 ? (params.ot_out_diff * -1) : 0;

		params.ot_work_rendered = params.ot_out_ref_unix - params.ot_in_ref_unix;
		params.ot_work_rendered -= params.ot_late + params.ot_undertime;

		params.nd_in_ref = moment(data.nd_in_ref).format("YYYY-MM-DD HH:mm:ss") || null;
		params.nd_out_ref = moment(data.nd_out_ref).format("YYYY-MM-DD HH:mm:ss") || null;
		params.nd_in_ref_unix = moment(params.nd_in_ref).unix() || 0;
		params.nd_out_ref_unix = moment(params.nd_out_ref).unix() || 0;
		params.nd_late = 0;
		params.nd_undertime = 0;
		params.nd_total_time = moment(params.nd_out_ref).diff(params.nd_in_ref, 'hours', true) || 0;

		params.total_late = params.late1 + params.late2;
		params.total_undertime = (params.undertime1 + params.undertime2) * -1;
		params.work_rendered = params.work_rendered1 + params.work_rendered2;
		params.work_to_render = params.work_to_render1 + params.work_to_render2;
		params.for_date = data.time_in_ref ? data.time_in_ref : data.time_in2_ref ? data.time_in2_ref : data.ot_in_ref;

		resolve(params);
	});
}

exports.dtrValidation = function ( params ) {
	return new Promise(( resolve, reject ) => {

		getDTRParams(params)
		.then( function( result ){
			
		})
		.catch(function(error){
			// Params.error = true;
			// Params.error_type = error.error_type || 'error';
			// Params.msg = error.message || error;
			// res.json( Params );
		});


		var moment = require('moment-timezone');
		var user = params.user;
		var data = params.data;

		if ( params.with_schedule ) {
			if ( !data.time_in && data.time_out ){
				reject( {message: 'You cannot have a time out without a time in.'} );
				return;
			}

			// check if time-out is more than time-in
			if ( data.time_out && params.time_in_unix >= params.time_out_unix ) {
				reject( {message: 'Time in cannot be more than time out.'} );
				return;
			}		

			if ( !data.time_out ) {
				params.time_out = null;
				params.time_out_unix = 0;
				params.time_out_diff = 0;
				params.time_out_status = null;
				params.is_undertime = 0;
				params.undertime1 = 0;
			}

			if ( !data.time_in ) {
				params.time_in = null;
				params.time_in_unix = 0;
				params.time_in_diff = 0;
				params.time_in_status = null;
				params.is_late = 0;
				params.late1 = 0;

				params.time_out = null;
				params.time_out_unix = 0;
				params.time_out_diff = 0;
				params.time_out_status = null;
				params.is_undertime = 0;
				params.undertime1 = 0;

				params.work_rendered1 = 0;
			}
		} else {

			params.time_in = null;
			params.time_in_unix = 0;
			params.time_in_ref = null;
			params.time_in_ref_unix = 0;
			params.time_in_diff = 0;
			params.time_in_status = null;
			params.is_late = 0;
			params.late1 = 0;

			params.time_out = null;
			params.time_out_unix = 0;
			params.time_out_ref = null;
			params.time_out_ref_unix = 0;
			params.time_out_diff = 0;
			params.time_out_status = null;
			params.is_undertime = 0;
			params.undertime1 = 0;

			params.work_to_render1 = 0;
			params.work_rendered1 = 0;
		}

		if ( params.with_break ) {

			if ( data.time_in2 && params.time_in2 <= params.time_out ) {
				reject( {message: 'Second time in cannot be less than the first time out.'} );
				return;
			}

			if ( !data.time_in2 && data.time_out2 ){
				reject( {message: 'You cannot have a second time out without a second time in.'} );
				return;
			}

			if ( data.time_out2 && params.time_out2 < params.time_in2 ) {
				reject( {message: 'Second time out cannot be less than the second time in.'} );
				return;	
			}

			// automatic time_out 
			if ( data.time_in && data.time_in2 && !data.time_out ) {
				params.time_out = params.time_out_ref;
				params.time_out_unix = params.time_out_ref_unix;
				params.time_out_diff = 0;
				params.time_out_status = 'On Time';
				params.is_undertime = 0;
				params.undertime1 = 0
			}

			if ( !data.time_out2 ) {
				params.time_out2 = null;
				params.time_out2_unix = 0;
				params.time_out2_diff = 0;
				params.time_out2_status = null;
				params.is_undertime2 = 0;
				params.undertime2 = 0;
			}

			if ( !data.time_in2 ) {
				params.time_in2 = null;
				params.time_in2_unix = 0;
				params.time_in2_diff = 0;
				params.time_in2_status = null;
				params.is_late2 = 0;
				params.late2 = 0;

				params.time_out2 = null;
				params.time_out2_unix = 0;
				params.time_out2_diff = 0;
				params.time_out2_status = null;
				params.is_undertime2 = 0;
				params.undertime2 = 0;

				params.work_rendered2 = 0;
			}
		} else {
			params.time_in2 = null;
			params.time_in2_unix = 0;
			params.time_in2_ref = null;
			params.time_in2_ref_unix = 0;
			params.time_in2_diff = 0;
			params.time_in2_status = null;
			params.is_late2 = 0;
			params.late2 = 0;

			params.time_out2 = null;
			params.time_out2_unix = 0;
			params.time_out2_ref = null;
			params.time_out2_ref_unix = 0;
			params.time_out2_diff = 0;
			params.time_out2_status = null;
			params.is_undertime2 = 0;
			params.undertime2 = 0;

			params.work_to_render2 = 0;
			params.work_rendered2 = 0;
		}

		if ( params.with_ot ) {
			if ( data.ot_in && !user.allow_ot_late && params.ot_is_late ) {
				reject( {message: 'Employee overtime cannot be late.'} );
				return;
			}

			if ( params.with_break ) {
				if ( data.ot_in && data.ot_in < data.time_out2 ) {
					reject( {message: 'Overtime time in cannot be less than the second time out.'} );
					return;	
				}
			}

			if ( !params.with_break && params.with_schedule ) {
				if ( data.ot_in && data.ot_in < data.time_out ) {
					reject( {message: 'Overtime time in cannot be less than the first time out.'} );
					return;	
				}
			}

			if ( !data.ot_in && data.ot_out ) {
				reject( {message: 'You cannot have an overtime time out without an overtime time in.'} );
				return;
			}

			if ( data.ot_out && params.ot_out < params.ot_in ) {
				reject( {message: 'Overtime time out cannot be less than the overtime time in.'} );
				return;	
			}

			// automatic time_out 
			if ( params.with_break && data.time_in2 && data.ot_in && !data.time_out2 ) {
				params.time_out2 = params.time_out2_ref;
				params.time_out2_unix = params.time_out2_ref_unix;
				params.time_out2_diff = 0;
				params.time_out2_status = 'On Time';
				params.is_undertime2 = 0;
				params.undertime2 = 0
			}

			if ( params.with_schedule && !params.with_break && data.time_in && data.ot_in && !data.time_out ) {
				params.time_out = params.time_out_ref;
				params.time_out_unix = params.time_out_ref_unix;
				params.time_out_diff = 0;
				params.time_out_status = 'On Time';
				params.is_undertime = 0;
				params.undertime = 0
			}

			if ( !data.ot_out ) {
				params.ot_out = null;
				params.ot_out_unix = 0;
				params.ot_out_diff = 0;
				params.ot_out_status = null;
				params.ot_is_undertime = 0;
				params.ot_undertime = 0;
			}

			if ( !data.ot_in ) {
				params.ot_in = null;
				params.ot_in_unix = 0;
				params.ot_in_diff = 0;
				params.ot_in_status = null;
				params.ot_is_late = 0;
				params.ot_late = 0;

				params.ot_out = null;
				params.ot_out_unix = 0;
				params.ot_out_diff = 0;
				params.ot_out_status = null;
				params.ot_is_undertime = 0;
				params.ot_undertime = 0;

				params.ot_work_rendered = 0;
			}
		} else {
			params.ot_in = null;
			params.ot_in_unix = 0;
			params.ot_in_ref = null;
			params.ot_in_ref_unix = 0;
			params.ot_in_diff = 0;
			params.ot_in_status = null;
			params.ot_is_late = 0;
			params.ot_late = 0;

			params.ot_out = null;
			params.ot_out_unix = 0;
			params.ot_out_ref = null;
			params.ot_out_ref_unix = 0;
			params.ot_out_diff = 0;
			params.ot_out_status = null;
			params.ot_is_undertime = 0;
			params.ot_undertime = 0;

			params.ot_work_rendered = 0;
			params.data.ot_rate = 0;
		}

		if ( params.is_absent ) {
			params.time_in = null;
			params.time_in_unix = 0;
			params.time_in_diff = 0;
			params.time_in_status = null;
			params.is_late = 0;
			params.late1 = 0;
			params.time_out = null;
			params.time_out_unix = 0;
			params.time_out_diff = 0;
			params.time_out_status = null;
			params.is_undertime = 0;
			params.undertime1 = 0;
			params.work_rendered1 = 0;

			params.time_in2 = null;
			params.time_in2_unix = 0;
			params.time_in2_diff = 0;
			params.time_in2_status = null;
			params.is_late2 = 0;
			params.late2 = 0;
			params.time_out2 = null;
			params.time_out2_unix = 0;
			params.time_out2_diff = 0;
			params.time_out2_status = null;
			params.is_undertime2 = 0;
			params.undertime2 = 0;
			params.work_rendered2 = 0;

			params.ot_in = null;
			params.ot_in_unix = 0;
			params.ot_in_diff = 0;
			params.ot_in_status = null;
			params.ot_is_late = 0;
			params.ot_late = 0;
			params.ot_out = null;
			params.ot_out_unix = 0;
			params.ot_out_diff = 0;
			params.ot_out_status = null;
			params.ot_is_undertime = 0;
			params.ot_undertime = 0;
			params.ot_work_rendered = 0;
			params.data.ot_rate = 0;

			params.total_late = 0;
			params.total_undertime = 0;
			params.work_rendered = 0;
		}

		if ( data.on_leave ) {
			params.time_in = null;
			params.time_in_unix = 0;
			params.time_in_diff = 0;
			params.time_in_status = null;
			params.is_late = 0;
			params.late1 = 0;
			params.time_out = null;
			params.time_out_unix = 0;
			params.time_out_diff = 0;
			params.time_out_status = null;
			params.is_undertime = 0;
			params.undertime1 = 0;

			params.time_in2 = null;
			params.time_in2_unix = 0;
			params.time_in2_diff = 0;
			params.time_in2_status = null;
			params.is_late2 = 0;
			params.late2 = 0;
			params.time_out2 = null;
			params.time_out2_unix = 0;
			params.time_out2_diff = 0;
			params.time_out2_status = null;
			params.is_undertime2 = 0;
			params.undertime2 = 0;

			params.ot_in = null;
			params.ot_in_unix = 0;
			params.ot_in_diff = 0;
			params.ot_in_status = null;
			params.ot_is_late = 0;
			params.ot_late = 0;
			params.ot_out = null;
			params.ot_out_unix = 0;
			params.ot_out_diff = 0;
			params.ot_out_status = null;
			params.ot_is_undertime = 0;
			params.ot_undertime = 0;
			params.ot_work_rendered = 0;
			params.data.ot_rate = 0;

			params.nd_in_ref = null;
			params.nd_out_ref = null;
			params.nd_in_ref_unix = 0;
			params.nd_out_ref_unix = 0;
			params.nd_late = 0;
			params.nd_undertime = 0;
			params.nd_total_time = 0;
			params.data.nd_rate = 0;

			data.status = 'On Leave';
			params.total_late = 0;
			params.total_undertime = 0;
			params.work_rendered = params.work_to_render;
		}

		// night differential	
		if ( params.with_night_differential ) {
			if ( params.time_in ) {
				params.nd_late = params.time_in > params.nd_in_ref ? moment(params.time_in).diff(params.nd_in_ref, 'hours', true).toFixed(2) : 0;
			} else {
				params.nd_late = params.time_in2 > params.nd_in_ref ? moment(params.time_in2).diff(params.nd_in_ref, 'hours', true).toFixed(2) : 0;
			}

			if ( !params.with_break ) {
				params.nd_undertime = params.time_out < params.nd_out_ref ? moment(params.nd_out_ref).diff(params.time_out, 'hours', true).toFixed(2) : 0;
			} else {
				params.nd_undertime = params.time_out2 < params.nd_out_ref ? moment(params.nd_out_ref).diff(params.time_out2, 'hours', true).toFixed(2) : 0;	
			}

			params.nd_late = parseFloat(params.nd_late);
			params.nd_undertime = parseFloat(params.nd_undertime);
			params.nd_total_time -= (params.nd_late + params.nd_undertime);

		} else {
			params.nd_in_ref = null;
			params.nd_out_ref = null;
			params.nd_in_ref_unix = 0;
			params.nd_out_ref_unix = 0;
			params.nd_late = 0;
			params.nd_undertime = 0;
			params.nd_total_time = 0;
			params.data.nd_rate = 0;
		}

		// prepare data
		var attendance_details = {
			user_id: user._id,
			employee: user._id,
			company_id: user.company_id,
			branch_id: user.branch_id,

			status: data.status,
			is_absent: params.is_absent,
			with_schedule: data.with_schedule,
			with_break: data.with_break,
			with_ot: params.with_ot,
			with_night_differential: params.with_night_differential,

			for_date: params.for_date,
			is_holiday: params.is_holiday,
			is_onleave: data.on_leave,
			leave_type: data.on_leave ? params.type : null,
			salary_type: data.salary_type,
			daily_rate: data.daily_rate || 0,
			ot_rate: params.data.ot_rate || 0,
			nd_rate: params.data.nd_rate || 0,
			reason_for_update: data.reason_for_update || null,

			// time-in
			time_in: params.time_in,
			time_in_ref: params.time_in_ref,
			time_in_unix: params.time_in_unix,
			time_in_ref_unix: params.time_in_ref_unix,
			time_in_diff: params.time_in_diff,
			time_in_status: params.time_in_status,
			is_late: params.is_late,

			// time-out
			time_out: params.time_out,
			time_out_ref: params.time_out_ref,
			time_out_unix: params.time_out_unix,
			time_out_ref_unix: params.time_out_ref_unix,
			time_out_diff: params.time_out_diff * -1,
			time_out_status: params.time_out_status,
			is_undertime: params.is_undertime,

			// time-in2
			time_in2: params.time_in2,
			time_in2_ref: params.time_in2_ref,
			time_in2_unix: params.time_in2_unix,
			time_in2_ref_unix: params.time_in2_ref_unix,
			time_in2_diff: params.time_in2_diff,
			time_in2_status: params.time_in2_status,
			is_late2: params.is_late2,

			// time-out2
			time_out2: params.time_out2,
			time_out2_ref: params.time_out2_ref,
			time_out2_unix: params.time_out2_unix,
			time_out2_ref_unix: params.time_out2_ref_unix,
			time_out2_diff: params.time_out2_diff * -1,
			time_out2_status: params.time_out2_status,
			is_undertime2: params.is_undertime2,

			// ot-in
			ot_in: params.ot_in,
			ot_in_ref: params.ot_in_ref,
			ot_in_unix: params.ot_in_unix,
			ot_in_ref_unix: params.ot_in_ref_unix,
			ot_in_diff: params.ot_in_diff,
			ot_in_status: params.ot_in_status,
			ot_is_late: params.ot_is_late,

			// ot-out
			ot_out: params.ot_out,
			ot_out_ref: params.ot_out_ref,
			ot_out_unix: params.ot_out_unix,
			ot_out_ref_unix: params.ot_out_ref_unix,
			ot_out_diff: params.ot_out_diff * -1,
			ot_out_status: params.ot_out_status,
			ot_is_undertime: params.ot_is_undertime,

			// night differential
			nd_in_ref: params.nd_in_ref,
			nd_out_ref: params.nd_out_ref,
			nd_in_ref_unix: params.nd_in_ref_unix,
			nd_out_ref_unix: params.nd_out_ref_unix,
			nd_late: params.nd_late,
			nd_undertime: params.nd_undertime,
			nd_total_time: params.nd_total_time,

			ot_late: params.ot_late,
			ot_undertime: params.ot_undertime,
			
			total_late: params.total_late,
			total_undertime: params.total_undertime,
			work_rendered: params.work_rendered,
			work_to_render: params.work_to_render,
			ot_work_rendered: params.ot_work_rendered,
		};

		console.log('attendance_details: ', attendance_details);

		// reject( {message: 'Check Data: DTRValidation'} );
		// return;

		params.attendance_details = attendance_details;
		resolve( params );

	}); 
}

exports.getNightDifferential = function( params ) {

	return new Promise((resolve, reject) => {

		var moment = require('moment-timezone');
		const WorkScheduleModel  = require('../models/WorkSchedule');

		var dayOfWeek = moment(params.data.time_in_ref).format('dddd'); // Monday, Sunday, etc.

		// Check if today is working day for this employee.
		var conditions = {
			employee: params.user._id,
			enabled: true,
			day: dayOfWeek
		};

		WorkScheduleModel.findOne(conditions, function(err, workSchedule ) {

			if ( err ) {
				reject( {message: 'An error occurred. Please try again later.', user: params.user});
				return;
			}

			params.workSchedule = workSchedule;
			resolve( params );
		});
	}); // End Promise	
}