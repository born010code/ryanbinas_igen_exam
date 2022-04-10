// TODO: extend UserLib instead.
exports.getUser = function( condition ) {
	
	return new Promise((resolve, reject) => {

		// Is user exist?
		const UserModel  = require('../models/User');

		UserModel.findOne(condition, function(error, user) {

			if ( error ) {
				console.log('ERROR(getUser): ', error);
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( !user ) {
				reject( {message: 'Unable to find employee record.'} );
				return;
			}
			
			resolve( user );
			
		});
	}); // End Promise	
};

exports.hasWorkSchedule = function( params ) {

	return new Promise((resolve, reject) => {

		console.log('hasWorkSchedule');
		// console.log(params);
		
		var moment = require('moment-timezone');
		const WorkScheduleModel  = require('../models/WorkSchedule');

		var dayOfWeek = moment().format('dddd'); // Monday, Sunday, etc.

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

			console.log('workSchedule',workSchedule);

			if ( !workSchedule  ) {
				reject({message: 'Sorry but you don\'t have work scheduled today.', user: params.user});
			}

			params.workSchedule = workSchedule;
			resolve( params );
		});
	}); // End Promise	
}

exports.hasDesignation = function( params ) {

	return new Promise((resolve, reject) => {

		console.log('hasDesignation');

		var moment = require('moment-timezone');
		const UserDesignationModel  = require('../models/UserDesignation');

		var dayOfWeek = moment().format('dddd'); // Monday, Sunday, etc.

		var conditions = {
			employee: params.user._id,
			branch_id: params.user.branch_id,
			status: 'approved',
			day: dayOfWeek
		}

		UserDesignationModel.findOne(conditions, function(err, designation ) {

			if ( err ) {
				reject( {message: 'An error occurred. Please try again later.', user: params.user});
				return;
			}

			if ( !designation  ) {
				params.hasDesignation = false;
			} else {
				
				// params.designation = designation.designation;
				// Override current workSchedule by designation time.
				if ( designation.designation.with_time ) {
					params.hasDesignation = true;
					params.workSchedule = designation.designation;
				} else {
					params.hasDesignation = false;
				}
			}

			resolve( params );
		}).populate('designation');
	}); // End Promise	
}


exports.isAlreadyLoggedIn = function( params ) {

	return new Promise((resolve, reject) => {
		console.log('isAlreadyLoggedIn', params);
		// Is user exist?
		const DailyTimeRecordModel  = require('../models/DailyTimeRecord');
		var moment = require('moment-timezone');


		var fromTime = moment().format("YYYY-MM-DD 00:00:00")
		var toTime = moment().format("YYYY-MM-DD HH:mm:ss");
		var dayOfWeek = moment().format('dddd');

		var condition = {
			user_id: params.user._id,
			for_date: { $gt: fromTime, $lt: toTime }
		};

		// check if with break
		let with_break = params.workSchedule.with_break;

		if ( params.action === 'time-in2' ) {

			if ( !with_break ) {
				reject( {message: 'Sorry but you don\'t have 2nd work scheduled today.', user: params.user});
				return;
			}

			// Check if trying to login for 2nd work schedule but 1st work schedule not yet ended.
			let timeOutRef = moment().format("YYYY-MM-DD " + params.workSchedule.time_out + ":00");
			let timeOutRefUnix = moment(timeOutRef).unix();

			let currentTime = moment().format("YYYY-MM-DD HH:mm:ss");
			let currentTimeUnix = moment(currentTime, "YYYY-MM-DD HH:mm:ss").unix();

			if ( currentTimeUnix <= timeOutRefUnix ) {
				reject( {message: 'You are not allowed to login yet. Please login after ' + params.workSchedule.time_out + ":00", user: params.user});
				return;	
			}

			// Check if user clocked-out or not for login1.
			let fromTime = moment().format("YYYY-MM-DD 00:00:00");
			let toTime = moment().format("YYYY-MM-DD HH:mm:ss");

			let condition_timedOut = {
				user_id: params.user._id,
				time_out: null,
				time_in_unix: { $gt: 0 },
				for_date: { $gte: fromTime, $lte: toTime },
			}

			// TODO: To seperate these processes.
			// User haven't clocked-out yet? Time him out automatically.
			DailyTimeRecordModel.findOne( condition_timedOut, function(error, dtr) {

				if ( error ) {
					// reject( error );
					console.log('ERROR(isAlreadyLoggedIn): ', error);
					reject( {message: 'An error occurred. Please try again later.', user: params.user});
					return;
				}

				// Found a result? autoTimeOut
				if ( dtr ) {

					// let ymd = moment().format("YYYY-MM-DD");
					// let timeOutRef = ymd + ' ' + params.workSchedule.time_out + ':00';
					// 	timeOutRef = moment(timeOutRef).format("YYYY-MM-DD HH:mm:ss");
					// let timeOutRefUnix = moment(timeOutRef, "YYYY-MM-DD HH:mm:ss").unix();

					// Check if employee is late or not.
					let time_out_status = 'On Time';

					// Prepare data.
					let data = {
						time_out: timeOutRef,
						time_out_ref: timeOutRef,
						time_out_unix: timeOutRefUnix,
						time_out_ref_unix: timeOutRefUnix,
						time_out_status: time_out_status,
						time_out_diff: 0,
					};

					DailyTimeRecordModel.findOneAndUpdate({_id: dtr._id}, data, {new: true}, function(error, DTR) {
						if ( error ) {
							reject( {message: 'Something went wrong. Please try again later.', user: params.user});
							return;
						}
					});
				}
			});	

			condition.time_in2_unix = { $gt: 0 };

		} else if ( params.action === 'overtime-in' ) {
			condition.ot_in = { $gt: 0 };
		} else {
			condition.time_in = { $gt: 0 };
		}


		DailyTimeRecordModel.findOne( condition, function(error, dtr) {
			if ( error ) {
				console.log('ERROR(isAlreadyLoggedIn): ', error);
				reject( {message: 'An error occurred. Please try again later.', user: params.user});
				return;
			}

			// Found a record? This means that the employee already timed in.
			if ( dtr ) {

				if ( !with_break ) {
					reject( {message: 'Sorry you have already clocked-in.', error_type: 'warning', user: params.user});
					return;
				} else {

					if ( params.action === 'time-in2' ) {
						reject( {message: 'Sorry you have already clocked-in from your 2nd work schedule.', error_type: 'warning', user: params.user});
						return;
					} else if ( params.action == 'overtime' ) {
						reject( {message: 'Sorry you have already clocked-in from your overtime schedule.', error_type: 'warning', user: params.user});
						return;
					} else {
						reject( {message: 'Sorry you have already clocked-in from your 1st work schedule.', error_type: 'warning', user: params.user});
						return;
					}
				}
			}
			resolve( params );
		});
	}); // End Promise	
}

exports.login = function( params ) {
	return new Promise((resolve, reject) => {
		console.log('login params: ', params);
		const DailyTimeRecordModel  = require('../models/DailyTimeRecord');
		const moment = require('moment-timezone');

		let dayOfWeek = moment().format('dddd'); // Monday, Sunday, etc.
		let ymd = moment().format("YYYY-MM-DD");
		let currTime = moment().format("YYYY-MM-DD HH:mm:ss");
		let currTimeUnix = moment(currTime, "YYYY-MM-DD HH:mm:ss").unix();

		let timeinRef = ymd + ' ' + params.workSchedule.time_in + ':00';
		let timeOutRef = ymd + ' ' + params.workSchedule.time_out + ':00';
		let timeinRefUnix = moment(timeinRef, "YYYY-MM-DD HH:mm:ss").unix();
		let timeOutRefUnix = moment(timeOutRef, "YYYY-MM-DD HH:mm:ss").unix();

		let timein2Ref = params.workSchedule.time_in2 ? ymd + ' ' + params.workSchedule.time_in2 + ':00' : null;
		let timeout2Ref = params.workSchedule.time_out2 ? ymd + ' ' + params.workSchedule.time_out2 + ':00' : null;
		let timein2RefUnix = timein2Ref ? moment(timein2Ref, "YYYY-MM-DD HH:mm:ss").unix() : null;
		let timeout2RefUnix = timeout2Ref ? moment(timeout2Ref, "YYYY-MM-DD HH:mm:ss").unix() : null;


		let work_to_render = 0, work_to_render1 = 0, 
			work_to_render2 = 0, work_rendered1 = 0, 
			work_rendered2 = 0;

		let with_break = params.workSchedule.with_break;

		if ( with_break ) {
			work_to_render2 = work_rendered2 = timeout2RefUnix - timein2RefUnix;
			work_to_render1 = work_rendered1 = timeOutRefUnix - timeinRefUnix;
		} else {
			work_to_render1 = work_rendered1 = timeOutRefUnix - timeinRefUnix;
		}

		work_to_render = work_to_render1 + work_to_render2;

		if ( params.action === 'time-in' ) {

			let time_in = currTime;
			let time_in_unix = currTimeUnix;

			let timeinDiff = ( currTimeUnix - timeinRefUnix );
				timeinDiff = (timeinDiff > 0 ? timeinDiff : 0);

			let time_in_status = timeinDiff ? 'Late' : 'On Time';
			let is_late = timeinDiff ? 1 : 0;
			let total_late = timeinDiff;

			if ( currTimeUnix > timeOutRefUnix ) {

				if ( with_break ) {
					reject( {message: 'Your 1st work schedule has already ended. Please login to your 2nd work schedule instead.', user: params.user});
					return;
				} else {
					reject( {message: 'Sorry but you are already marked as absent today.', user: params.user});
					return;					
				}
			}

			// Let's create an attendance record.


			var dailySalaryTypes = [
				'monthly',
				'bi-monthly',
				'weekly'
			];

			let isDaily = ( dailySalaryTypes.indexOf(params.user.salary_type) >= 0 ) ? true : false;
			let dailyRate = isDaily ? params.workSchedule.rate : null;

			let DTR = new DailyTimeRecordModel({
				user_id: params.user._id,
				employee: params.user._id,
				company_id: params.user.company_id,
				branch_id: params.user.branch_id,
				is_holiday: params.is_holiday,
				is_absent: 0,
				status: 'Present',

				time_in: time_in,
				time_in_unix: time_in_unix,
				time_in_ref: timeinRef,
				time_in_ref_unix: timeinRefUnix,
				time_in_status: time_in_status,
				time_in_diff: timeinDiff,
				is_late: is_late,
				with_break: with_break,
				total_late: total_late,

				time_in2_ref: timein2Ref,
				time_in2_ref_unix: timein2RefUnix,

				time_out_ref: timeOutRef,
				time_out_ref_unix: timeOutRefUnix,

				time_out2_ref: timeout2Ref,
				time_out2_ref_unix: timeout2RefUnix,

				with_ot: params.with_ot,
				ot_in_ref: params.with_ot ? params.overtime.time_in : null,
				ot_in_ref_unix: params.with_ot ? params.overtime.time_in_unix : 0,
				ot_out_ref: params.with_ot ? params.overtime.time_out : null,
				ot_out_ref_unix: params.with_ot ? params.overtime.time_out_unix : 0,

				work_rendered: work_rendered1 - total_late,
				work_to_render: work_to_render,

				salary_type: params.user.salary_type,
				daily_rate: dailyRate,

				designation: params.hasDesignation ? params.workSchedule._id : null,
			});

			// Validate the input first.
			DTR.validate( function(error) {
				if ( error ) {
					console.log('ERROR(login)1: ', error);
					reject( {message: 'An error occurred. Please try again later.', user: params.user});
					return;
				}

			    DTR.save(function(err) {
			        if (err) {
						console.log('ERROR(login)2: ', error);
			        	reject( {message: 'An error occurred. Please try again later.', user: params.user});
						return;
					}

					// Successfully created DTR.
					let msg = with_break ?
						'You have successfully clocked-in from your 1st work schedule.':
						'You have successfully clocked-in.';
					
					params.dtr = DTR;
					params.msg = msg;

					resolve( params );
					return;
			    });
			});
		} else if ( params.action === 'time-in2' ) {

			// Check if user try to time-in2 but he has no break.
			if ( !with_break ) {
				reject( {message: 'Sorry but you don\'t have 2nd work scheduled today.', user: params.user});
				return;
			}

			let time_in2 = currTime;
			let time_in2_unix = currTimeUnix;
			

			let timein2Diff = currTimeUnix - timein2RefUnix;
				timein2Diff  = timein2Diff > 0 ? timein2Diff : 0;
			let time_in2_status = timein2Diff ? 'Late' : 'On Time';
			let is_late2 = timein2Diff ? 1 : 0;

			let fromTime = moment().format("YYYY-MM-DD 00:00:00");
			let toTime = moment().format("YYYY-MM-DD HH:mm:ss");

			// Prepare conditions.
			// check if user has login1
			const condition = {
				user_id: params.user._id,
				time_in_unix: { $gt: 0 },
				for_date: { $gte: fromTime, $lte: toTime },
				time_in2: null
			};

			// Get DTR for login.
			DailyTimeRecordModel.findOne( condition, function(error, dtr) {

				if ( error ) {
					console.log('ERROR(isAlreadyLoggedOut): ', error);
					reject( {message: 'An error occurred. Please try again later.', user: params.user});
					return;
				}

				// Found a record.
				if ( dtr ) {
					// Check if already end of working hours.
					if ( currTimeUnix > timeout2RefUnix ) {
						reject( {message: 'Sorry but your 2nd work schedule has already ended.', user: params.user});
						return;
					}

					let total_late = timein2Diff + dtr.total_late;

					let login_params = {
						time_in2: time_in2,
						time_in2_unix: time_in2_unix,
						time_in2_ref: timein2Ref,
						time_in2_ref_unix: timein2RefUnix,
						time_in2_status: time_in2_status,
						time_in2_diff: timein2Diff,
						is_late2: is_late2,
						with_break: with_break,
						total_late: total_late,
						work_rendered: work_to_render - (dtr.total_undertime + total_late),
					};

					// update record
					DailyTimeRecordModel.findOneAndUpdate({_id: dtr._id}, login_params, {new: true}, function(error, DTR) {

						if ( error ){
							reject( {message: 'Unable to clock in at this time. Please try again later.', user: params.user});
							return;
						} else {

							// Successfully created DTR.

							console.log('ayos!!!', params);
							let msg = 'You have successfully clocked-in from your 2nd work schedule.';
							params.dtr = DTR;
							params.msg = msg;
							
							resolve( params );
							return;
						}
					});

				} else {
					// Check if already end of working hours.
					if ( currTimeUnix > timeout2RefUnix ) {
						reject( {message: 'Sorry but you are already marked as absent today.', user: params.user});
						return;
					}

					let total_late = timein2Diff;

					let DTR = new DailyTimeRecordModel({
						user_id: params.user._id,
						employee: params.user._id,
						company_id: params.user.company_id,
						branch_id: params.user.branch_id,
						is_holiday: params.is_holiday,
						is_absent: 0,
						status: 'Present',


						time_in_ref: timeinRef,
						time_in_ref_unix: timeinRefUnix,

						time_in2_ref: timein2Ref,
						time_in2_ref_unix: timein2RefUnix,

						time_out_ref: timeOutRef,
						time_out_ref_unix: timeOutRefUnix,

						time_out2_ref: timeout2Ref,
						time_out2_ref_unix: timeout2RefUnix,


						time_in2: time_in2,
						time_in2_unix: time_in2_unix,
						time_in2_ref: timein2Ref,
						time_in2_ref_unix: timein2RefUnix,
						time_in2_status: time_in2_status,
						time_in2_diff: timein2Diff,
						is_late2: is_late2,
						with_break: with_break,
						total_late: total_late,

						with_ot: params.with_ot,
						ot_in_ref: params.with_ot ? params.overtime.time_in : null,
						ot_in_ref_unix: params.with_ot ? params.overtime.time_in_unix : 0,
						ot_out_ref: params.with_ot ? params.overtime.time_out : null,
						ot_out_ref_unix: params.with_ot ? params.overtime.time_out_unix : 0,

						work_rendered: work_rendered2 - total_late,
						work_to_render: work_to_render,

						salary_type: params.user.salary_type,
					});

					// Validate the input first.
					DTR.validate( function(error) {

						if ( error ) {
							console.log('ERROR(login)3: ', error);
							reject( {message: 'An error occurred. Please try again later.', user: params.user});
							return;
						}

					    DTR.save(function(err) {
					        if (err) {
								console.log('ERROR(login3)4: ', error);
					        	reject( {message: 'An error occurred. Please try again later.', user: params.user});
								return;
							}

							let msg = 'You have successfully clocked-in from your 2nd work schedule.';
							
							params.msg = msg;
							params.dtr = DTR;
							
							resolve( params );
							return;
					    });
					});
				}
			});
		} else if ( params.action == 'overtime-in' ) {
			if ( !params.with_ot ) {
				reject( {message: 'You are not allowed to render overtime today.'});
				return;				
			}

			let fromTime = moment().format("YYYY-MM-DD 00:00:00");
			let toTime = moment().format("YYYY-MM-DD HH:mm:ss");

			let ot_in = currTime;
			let ot_in_unix = currTimeUnix;
			let ot_in_ref = params.overtime.time_in;
			let ot_in_ref_unix = params.overtime.time_in_unix;
			let ot_in_diff = ( ot_in_unix - ot_in_ref_unix );
			let ot_is_late = ot_in_diff >= 0 ? 1 : 0;
			let ot_in_status = ot_is_late ? 'Late' : 'On Time';

			if ( currTimeUnix > params.overtime.time_out_unix ) {
				reject( {message: 'Sorry, but you are already marked as absent on your overtime.', user: params.user});
				return;
			}

			if ( !params.user.allow_ot_late && ot_is_late ) {
				reject( {message: 'Sorry, but you are not allowed to be late on your overtime.', user: params.user});
				return;	
			}

			var conditions = {
				user_id: params.user._id,
				time_in_unix: { $gt: 0 },
				for_date: { $gte: fromTime, $lte: toTime },
				ot_in: null,
				with_ot: true
			};

			DailyTimeRecordModel.findOne( conditions, function(error, dtr) {
				if ( error ) {
					console.log('ERROR(loginOT): ', error);
					reject( {message: 'An error occurred. Please try again later.', user: params.user});
					return;
				}

				if ( dtr ) {

					let overtime = {
						ot_in: ot_in,
						ot_in_unix: ot_in_unix,
						ot_in_diff: ot_in_diff,
						ot_is_late: ot_is_late,
						ot_in_status: ot_in_status,
					};

					// update DTR
					DailyTimeRecordModel.findOneAndUpdate({_id: dtr._id}, overtime, {new: true}, function(error, DTR) {

						if ( error ){
							reject( {message: 'Unable to clock in at this time. Please try again later.', user: params.user});
							return;
						} else {

							// Successfully created DTR.
							let msg = 'You have successfully clocked-in from your overtime schedule.';
							
							params.msg = msg;
							params.dtr = DTR;
							resolve( params );
							return;
						}
					});
				} else {
					// create DTR
					let DTR = new DailyTimeRecordModel ({
						user_id: params.user._id,
						employee: params.user._id,
						company_id: params.user.company_id,
						branch_id: params.user.branch_id,
						is_holiday: params.is_holiday,
						is_absent: 0,
						status: 'Present',

						with_ot: params.with_ot,
						ot_in: ot_in,
						ot_in_unix: ot_in_unix,
						ot_in_ref: ot_in_ref,
						ot_in_ref_unix: ot_in_ref_unix,
						ot_in_diff: ot_in_diff,
						ot_is_late: ot_is_late,
						ot_in_status: ot_in_status,

						ot_out_ref: params.overtime.time_out,
						ot_out_ref_unix: params.overtime.time_out_unix
					});

					DTR.validate( function(error) {

						if ( error ) {
							console.log('ERROR(loginOT): ', error);
							reject( {message: 'An error occurred. Please try again later.', user: params.user});
							return;
						}

					    DTR.save(function(err) {
					        if (err) {
								console.log('ERROR(login3): ', error);
					        	reject( {message: 'An error occurred. Please try again later.', user: params.user});
								return;
							}

							// Successfully created DTR.
							let msg = 'You have successfully clocked-in from your overtime schedule.';

							params.msg = msg;
							params.dtr = DTR;
							resolve( params );
							return;
					    });
					});
				}

			});
		}
	}); // End Promise	
}


exports.isAlreadyLoggedOut = function( params ) {
	return new Promise((resolve, reject) => {
		const DailyTimeRecordModel  = require('../models/DailyTimeRecord');
		var moment = require('moment-timezone');

		var fromTime = moment().format("YYYY-MM-DD 00:00:00")
		var toTime = moment().format("YYYY-MM-DD HH:mm:ss");

		const condition = {
			user_id: params.user._id,
			for_date: { $gt: fromTime, $lt: toTime }
		};

		if ( params.action === 'time-out2' ) {
			condition.time_in2_unix = { $gt: 0 };
		} else if ( params.action === 'overtime-out' ) {
			condition.ot_in_unix = { $gt: 0 };
		} else {
			condition.time_in_unix = { $gt: 0 };
		}

		// check if with break
		let dayOfWeek = moment().format('dddd'); // Monday, Sunday, etc.
		let with_break = params.workSchedule.with_break;

		// Get DTR for login.
		DailyTimeRecordModel.findOne( condition, function(error, dtr) {
			if ( error ) {
				reject( {message: 'An error occurred. Please try again later.', user: params.user});
				return;
			}

			// Found a record? This means that the employee already timed in.
			if ( dtr ) {
				// Check if already clocked-out or not.
				if ( params.action === 'time-out2' ) {
					if ( dtr.time_out2 !== null ) {
						reject( {message: 'Sorry you have already clocked-out from your 2nd work schedule.' , error_type: 'warning', user: params.user});
						return;
					}
				} else if ( params.action === 'overtime-out' ) {
					if ( dtr.ot_out !== null ) {
						reject( {message: 'Sorry you have already clocked-out from your overtime schedule.' , error_type: 'warning', user: params.user});
						return;
					}
				} else {
					if ( dtr.time_out !== null ) {
						if ( with_break ) {
							reject( {message: 'Sorry you have already clocked-out from your 1st work schedule.' , error_type: 'warning', user: params.user});
							return;
						} else {
							reject( {message: 'Sorry you have already clocked-out.' , error_type: 'warning', user: params.user});
							return;
						} 
					}
				}

				resolve( params );
				return;
			}

			// Employee havent logged in yet. Prompt him.
			if ( params.action === 'time-out2' ) {
				reject( {message: 'Sorry you haven\'t clock in yet from your 2nd work schedule. Please clock in instead.', error_type: 'warning', user: params.user});
				return;
			} else if ( params.action === 'overtime-out' ) {
				reject( {message: 'Sorry you haven\'t clock in yet from your overtime schedule. Please clock in instead.', error_type: 'warning', user: params.user});
				return;
			} else {
				if ( with_break ) {
					reject( {message: 'Sorry you haven\'t clock in yet from your 1st work schedule. Please clock in instead.', error_type: 'warning', user: params.user});
					return;
				} else {
					reject( {message: 'Sorry you haven\'t clock in yet. Please clock in instead.', error_type: 'warning', user: params.user});
					return;
				}
			}
		});
	}); // End Promise	
}

exports.logout = function( params ) {
	return new Promise((resolve, reject) => {
		// Is user exist?
		const DailyTimeRecordModel  = require('../models/DailyTimeRecord');
		const moment = require('moment-timezone');

		let with_break = params.workSchedule.with_break;

		let dayOfWeek = moment().format('dddd'); // Monday, Sunday, etc.
		let ymd = moment().format("YYYY-MM-DD");
		let currTime = moment().format("YYYY-MM-DD HH:mm:ss");
		let currTimeUnix = moment(currTime, "YYYY-MM-DD HH:mm:ss").unix();

		if ( params.action === 'time-out2' ) {
			let timeout2Ref = ymd + ' ' + params.workSchedule.time_out2 + ':00';
			let time_out2_ref = moment(timeout2Ref).format("YYYY-MM-DD HH:mm:ss");
			let timeout2RefUnix = moment(timeout2Ref, "YYYY-MM-DD HH:mm:ss").unix();

			let timein2Ref = ymd + ' ' + params.workSchedule.time_in2 + ':00';
			let timein2RefUnix = moment(timein2Ref, "YYYY-MM-DD HH:mm:ss").unix();
			
			let timeout2Diff = ( timeout2RefUnix - currTimeUnix );
				timeout2Diff = timeout2Diff > 0 ? timeout2Diff : 0;
			let is_undertime2 = timeout2Diff ? 1 : 0;
			let time_out2_status = is_undertime2 ? 'Undertime' : 'On Time';


			// Do not allow to logout if less than loginRef.
			if ( currTimeUnix <= timein2RefUnix ) {
				reject( {message: 'You are not allowed to clock-out. Please clock-out after ' + timein2Ref , user: params.user});
				return;
			}


			var data = {
				is_undertime2: is_undertime2,
				time_out2: currTime,
				time_out2_unix: currTimeUnix,
				time_out2_ref: timeout2Ref,
				time_out2_ref_unix: timeout2RefUnix,
				time_out2_status: time_out2_status,
				time_out2_diff: timeout2Diff,
				$inc: { 
					total_undertime: timeout2Diff,
					work_rendered: -timeout2Diff
				},
			};
		} else if ( params.action === 'overtime-out' ) {
			let fromTime = moment().format("YYYY-MM-DD 00:00:00");
			let toTime = moment().format("YYYY-MM-DD HH:mm:ss");

			let ot_out = currTime;
			let ot_out_unix = currTimeUnix;
			let ot_out_diff = ( ot_out_unix - params.overtime.time_out_unix );
			let ot_out_status = ot_out_diff >= 0 ? 'On Time' : 'Undertime';
			let ot_is_undertime = ot_out_diff >= 0 ? 0 : 1;
			let otInRef = moment(params.overtime.time_in).format("YYYY-MM-DD HH:mm:ss");

			if ( currTimeUnix <= params.overtime.time_in_unix ) {
				reject( {message: 'You are not allowed to clock-out. Please clock-out after ' + otInRef , user: params.user});
				return;
			}


			var data = {
				ot_out: ot_out,
				ot_out_unix: ot_out_unix,
				ot_out_diff: ot_out_diff,
				ot_out_status: ot_out_status,
				ot_is_undertime: ot_is_undertime
			};

		} else {
			let timeOutRef = ymd + ' ' + params.workSchedule.time_out + ':00';
			let time_out_ref = moment(timeOutRef).format("YYYY-MM-DD HH:mm:ss");
			let timeOutRefUnix = moment(timeOutRef, "YYYY-MM-DD HH:mm:ss").unix();

			let timeinRef = ymd + ' ' + params.workSchedule.time_in + ':00';
			let timeinRefUnix = moment(timeinRef, "YYYY-MM-DD HH:mm:ss").unix();

			let timeDiff = ( timeOutRefUnix - currTimeUnix );
				timeDiff = (timeDiff > 0 ? timeDiff : 0 )
			let is_undertime = timeDiff ? 1 : 0;
			let time_out_status = is_undertime ? 'Undertime' : 'On Time';

			// Do not allow to logout if less than loginRef.
			if ( currTimeUnix <= timeinRefUnix ) {
				reject( {message: 'You are not allowed to clock-out. Please clock-out after ' + timeinRef , user: params.user});
				return;
			}

			var data = {
				is_undertime: is_undertime,
				time_out: currTime,
				time_out_ref: time_out_ref,
				time_out_unix: currTimeUnix,
				time_out_ref_unix: timeOutRefUnix,
				time_out_status: time_out_status,
				time_out_diff: timeDiff,
				$inc: { 
					total_undertime: timeDiff,
					work_rendered: -timeDiff
				},
			};
		}

		let fromTime = moment().format("YYYY-MM-DD 00:00:00")
		let toTime = moment().format("YYYY-MM-DD HH:mm:ss");

		const condition = {
			user_id: params.user._id,
			for_date: { $gte: fromTime, $lte: toTime },
		};

		if ( params.action === 'time-out2' ) {
			condition.time_in2_unix = { $gt: 0 };
			condition.time_out2 = null;
		} else if ( params.action === 'overtime-out' ) {
			condition.ot_in_unix = { $gt: 0 };
			condition.ot_out = null;
		} else {
			condition.time_in_unix = { $gt: 0 };
			condition.time_out = null;
		}

		DailyTimeRecordModel.findOneAndUpdate(condition, data, {new: true}, function(error, DTR) {
			if ( error ) {
				reject( {message: 'Unable to clocked-out at this time. Please try again later.', user: params.user});
			}

			if ( DTR ) {

				let msg = with_break ?
						(params.action === 'time-out2' ?
						'You have successfully clocked-out from your 2nd work schedule.':
						'You have successfully clocked-out from your 1st work schedule.') :
					'You have successfully clocked-out.';

				params.dtr = DTR;
				params.msg = msg;

				resolve( params );
			} else {
				reject( {message: 'No record found. Please time in first.', user: params.user});
			}
		});
	}); // End Promise	
}


exports.getWorkingEmployees = function( params ) {

	return new Promise((resolve, reject) => {
		const moment = require('moment-timezone');
		

		let fromTime = params.date.from;
		let dayOfWeek = fromTime.format('dddd');

		// console.log( fromTime.format('YYYY-MM-DD') );

		// var fields = '_id, employee';

		// Prepare conditions.
		// var conditions = {
		// 	company_id: params.company._id
		// };
		var conditions = {
			company_id: params.company._id,
			enabled: true,
			day: dayOfWeek
		};
		
		var TextUtil = require('../libs/TextUtil');
		const WorkScheduleModel  = require('../models/WorkSchedule');

		// Select fields only.
		// fields = TextUtil.toFields( fields, ' ' );

		var query = WorkScheduleModel
			.find(conditions)
			// .select(fields)
			.sort({ createdAt: -1 });
		
		// TODO: Find a better way to get total count for large data set.
	  	query
		  	.limit(1000)
		  	.exec('find', function (err, results) {
				if ( err ) {
					reject( {message: 'Unable to promise request at this time. Please try again later.'} );
				} else {

					// Filter out employees that only has yesterday's work schedule.
					let employees = [];
					let workSchedules = [];
					for (var i = 0; i < results.length; i++) {
						let employee = results[i].employee;
						if ( results[i].enabled ) {
							employees[i] = employee;
							workSchedules[i] = results[i];
						}
					}
					// console.log('------------ has work schedule ---------');
					if (! employees.length ) {
						// Now, update the company that the attendances has been successfully updated.
						const CompanyModel  = require('../models/Company');
						const moment = require('moment-timezone');

						let updatedAt = fromTime.format("YYYY-MM-DD HH:mm:ss");

						CompanyModel.update({_id: params.company._id}, { attd_updtd_at: updatedAt }, function(err){
							console.log(err);
						});

						reject( {message: 'CODE191415: No attendances to update on ' + updatedAt + ' . ' + params.company.name } );
					}
					else
						resolve({
							employees: employees, 
							company: params.company,
							date: params.date,
							workSchedules: workSchedules
						});
				}
		   	});

	}); // End Promise	
}



exports.getAbsentsFromWorkingEmployees = function( params ) {

	return new Promise((resolve, reject) => {

		const moment = require('moment-timezone');
		

		let fromTime = moment(params.date.from).format("YYYY-MM-DD HH:mm:ss");
		let toTime = moment(params.date.to).format("YYYY-MM-DD HH:mm:ss");
		let dayOfWeek = moment(params.date.from).format('dddd');

		// console.log('fromTimefromTime: ' + fromTime);
		// console.log('toTime: ' + toTime);
		// console.log('dayOfWeek: ' + dayOfWeek);

		// Prepare conditions.
		var conditions = {
			company_id: params.company._id,
			for_date: { $gte: fromTime, $lte: toTime },
		};
		
		var TextUtil = require('../libs/TextUtil');
		const DailyTimeRecordModel  = require('../models/DailyTimeRecord');

		var query = DailyTimeRecordModel
			.find(conditions)
			.sort({ createdAt: -1 });
		
		// TODO: Find a better way to get total count for large data set.
	  	query
		  	.limit(1000)
		  	.exec('find', function (err, results) {
				if ( err ) {
					reject( {message: 'Unable to promise request at this time. Please try again later.'} );
				} else {

					var getPresentEmployeeIDs = function (dtrs) {
						return new Promise(function (resolve, reject) {
							// TODO: Bug?
							// console.log('dtrs: ',dtrs);
							let IDs = [];
							for (let i = 0; i < dtrs.length; i++) {
								IDs.push(dtrs[i].user_id+'');
							}

							resolve(IDs);
						});
					};

					params.employees = params.employees.filter(function (el) {
					  return el != null;
					});


					getPresentEmployeeIDs(results).then( function( presentEmployeeIDs ){
						
						// All is present.
						let absentEmployeeIDs = [];
						let absentEmployees = [];

						for (let x = 0; x < params.employees.length; x++) {

							if ( 
								typeof params.employees[x]._id === 'undefined' ||
								typeof params.employees[x] === 'undefined' || 
								!params.employees[x]
							) continue;

							if ( presentEmployeeIDs.indexOf( params.employees[x]._id.toString() ) === -1 ) {
								absentEmployeeIDs.push(params.employees[x]._id.toString() );
								absentEmployees[params.employees[x]._id.toString()] = params.employees[x];
							}

							
						}

						// console.log('------------ absent employees ---------');

						if (! absentEmployeeIDs.length ) {

							const CompanyModel  = require('../models/Company');
							
							CompanyModel.update({_id: params.company._id}, { attd_updtd_at: fromTime }, function(err){
								console.log(err);
							});

							reject( {message: 'CODE1914: No attendances to update for date. ' + fromTime + ' | ' + params.company.name } );

						} else {
							resolve({ 
								absentEmployeeIDs: absentEmployeeIDs,
								absentEmployees: absentEmployees,
								company: params.company,
								date: params.date,
								employees: params.employees,
								workSchedules: params.workSchedules
							});
						}
						
						// return;
					}).catch(function(error){
						reject( {message: 'CODE1914: Unable to update employee attendances at this time.'} );
						return;
					});
				}
		   	});

	}); // End Promise	
};

exports.recordAbsentEmployees = function( params ) {

	return new Promise((resolve, reject) => {

		// Is user exist?
		const DailyTimeRecordModel  = require('../models/DailyTimeRecord');

		let dtrs = [];

		//TODO: Find a good and right way.
		for (var i = 0; i < params.absentEmployeeIDs.length; i++) {

			const moment = require('moment-timezone');

			let fromTime = moment(params.date.from).format("YYYY-MM-DD HH:mm:ss");

			let currentEmployee = params.absentEmployees[
				params.absentEmployeeIDs[i]
			];

			let dayOfWeek = params.date.from.format('dddd'); // Monday, Sunday, etc.
			let ymd = params.date.from.format("YYYY-MM-DD");

			let timeinRef = ymd + ' ' + params.workSchedules[i].time_in + ':00';
			let timeOutRef = ymd + ' ' + params.workSchedules[i].time_out + ':00';
			let timeinRefUnix = moment(timeinRef, "YYYY-MM-DD HH:mm:ss").unix();
			let timeOutRefUnix = moment(timeOutRef, "YYYY-MM-DD HH:mm:ss").unix();
			
			let timein2Ref = ymd + ' ' + params.workSchedules[i].time_in2 + ':00';
			let timeout2Ref = ymd + ' ' + params.workSchedules[i].time_out2 + ':00';
			let timein2RefUnix = moment(timein2Ref, "YYYY-MM-DD HH:mm:ss").unix();
			let timeout2RefUnix = moment(timeout2Ref, "YYYY-MM-DD HH:mm:ss").unix();

			let work_to_render = 0, 
				work_to_render1 = 0, 
				work_to_render2 = 0;

			let with_break = params.workSchedules[i]
				.with_break;

			if ( with_break ) {
				work_to_render2 = timeout2RefUnix - timein2RefUnix;
				work_to_render1 = timeOutRefUnix - timeinRefUnix;
			} else {
				work_to_render1 = timeOutRefUnix - timeinRefUnix;
			}

			work_to_render = work_to_render1 + work_to_render2;

			let is_onleave = 0;

			for ( var onLeave = 0; onLeave < params.onLeaveEmployees.length; onLeave++ ){

				if ( currentEmployee._id.toString() == params.onLeaveEmployees[onLeave].user_id.toString() ) {
					is_onleave = 1;
				}

			}

			let DTR = new DailyTimeRecordModel({
				user_id: params.absentEmployeeIDs[i],
				employee: params.absentEmployeeIDs[i],
				company_id: params.company._id,
				is_absent: params.is_holiday || is_onleave ? 0 :  1,
				status: params.is_holiday ? 'Holiday' : 'Absent',
				for_date: fromTime,
				with_break: with_break,
				work_rendered: params.is_holiday || is_onleave ? work_to_render : 0,
				work_to_render: work_to_render,
				is_holiday: params.is_holiday,
				is_onleave: is_onleave,
				branch_id: params.workSchedules[i].branch_id,
				// salary_type: params.user.salary_type,
			});

			dtrs.push(DTR);
		}


		if ( params.absentEmployeeIDs.length ) {

			DailyTimeRecordModel.collection.insertMany(dtrs, function (err, dtrs) {

				if (err){ 
					reject( {message: 'DTR:recordAbsentEmployees - Unable to update employee attendances at this time. Please try again later.'} );
					return;
				}

				// Now, update the company that the attendances has been successfully updated.
				const CompanyModel  = require('../models/Company');
				const moment = require('moment-timezone');
				
				let updatedAt = params.date.from.format("YYYY-MM-DD HH:mm:ss");

				CompanyModel.update({_id: params.company._id}, { attd_updtd_at:updatedAt }, function(err){
					console.log(err);
				});

				resolve({ 
					absentEmployeeIDs: params.absentEmployeeIDs,
					company: params.company,
					updated: true, 
				});
		    });
		}
			
	}); // End Promise	
};

exports.createOrUpdateAttendance = function( params ) {

	return new Promise((resolve, reject) => {
		
		const DailyTimeRecordModel  = require('../models/DailyTimeRecord');

		if ( params.action == 'create' ) {
			var DailyTimeRecord = new DailyTimeRecordModel(params.attendance_details);

			// Validate the input first.
			DailyTimeRecord.validate( function(error) {

				if ( error ) {

					console.log('Form error', error);
					reject( {message: 'An error occurred. Please try again later.'} );
					return;
				}

				// Now save data into db.
				DailyTimeRecord.save( function(error, result) {

					if ( error ) {
						reject({ message: 'Unable to create attendance. Please try again later.', error: error });
						return;
					}

					resolve({ dtr: result });

				});

			});
		} else {

			var data = params.attendance_details;

			DailyTimeRecordModel.findOneAndUpdate({_id: params.id}, data, {new: true}, function(error, DTR) {

				if ( error ){
					reject({ message: 'Unable to update record at this time. Please try again later.', error: error });
					return;
				} else {

					let msg = 'You have successfully clocked-in from your 2nd work schedule.';
					
					resolve({ dtr: DTR });
					return;
				}
			});
		}
		
		
	}); // End Promise	
}

exports.isHoliday = function( params ) {

	return new Promise((resolve, reject) => {
		
		const HolidayModel  = require('../models/Holiday');
		var moment = require('moment-timezone');
		var status = params.data.status;
		params.is_holiday = false;

		if ( !params.date )	{
			reject( {message: 'Please choose a date.', error_type: 'warning'} );
			return;
		}

		var forDate = moment(params.date.from).format('YYYY-MM-DD');
		var conditions = {
			date: forDate,
			company_id: params.user.company_id
		}

		HolidayModel.findOne( conditions, function(error, holiday) {

			if ( error ) {
				// reject( error );
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( holiday ) {
				params.is_holiday = true;
			}

			if ( holiday && status == 'Absent' ) {
				reject( {message: forDate + ' is a holiday.'} );
				return;
			}

			resolve(params);
			
		});

		
	}); // End Promise	
}

exports.isHolidayToday = function( params ) {

	return new Promise((resolve, reject) => {
		
		const HolidayModel  = require('../models/Holiday');
		var moment = require('moment-timezone');
		var is_holiday = false;

		var date = moment(params.date.from).format('YYYY-MM-DD');

		var conditions = {
			date: date,
			company_id: params.company._id
		}

		if ( !date )	{
			reject( {message: 'Please choose a date.', error_type: 'warning'} );
			return;
		}

		HolidayModel.findOne( conditions, function(error, holiday) {

			if ( error ) {
				// reject( error );
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( holiday ) {
				is_holiday = true;
			}

			params.is_holiday = is_holiday;

			resolve(params);
			
		});

		
	}); // End Promise	
}

exports.isOnLeave = function( params ) {

	return new Promise((resolve, reject) => {
		
		const LeaveModel  = require('../models/Leave');
		var moment = require('moment-timezone');

		fromDate = moment(params.date.from).format("YYYY-MM-DD HH:mm:ss");
		toDate = moment(params.date.to).format("YYYY-MM-DD HH:mm:ss");

		var conditions = {
			date: { $gte: fromDate, $lte: toDate },
			status: 'approved'
		};

		if ( params.leave_action === 'create' ) {
			conditions.user_id = params.user._id;
		}

		var query = LeaveModel
		.find( conditions )
		.select('user_id')
		.sort( { date: 1 } );

		query.count(function (err, count) {
		  	query
			  	.exec('find', function (err, results) {
					if ( err ) {
						reject( {message: 'An error occurred. Please try again later.'} );
						return;
					} else {

						if ( params.leave_action === 'create' && results.length ) {
							reject( {message: 'Employee is on leave'} );
							return;
						}

						params.onLeaveEmployees = results;
						resolve(params);

					}
			   	});
		});

		
	}); // End Promise	
}

exports.checkIP = function( user, ip ) {

	return new Promise((resolve, reject) => {
		
		const LoginRestrictionModel  = require('../models/LoginRestriction');

		var conditions = {
			user_id: user._id
		};

		LoginRestrictionModel.findOne( conditions, function(error, result) {

			if ( error ) {
				// reject( error );
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( !result ) {
				resolve( user );
				return;
			}
			
			let validIP = false;

			if ( result.ips ) {

				let ips = result.ips.split(",");
				for ( i = 0; i < ips.length; i++ ){
					if ( ips[i] == ip ) {
						validIP = true;
					}
				}	
			}

			if ( result.dids ) {

				let dids = result.dids.split(",");
				for ( i = 0; i < dids.length; i++ ) {
					if ( dids[i] == ip ) {
						validIP = true;
					}
				}	
			}
			
			if ( !validIP ) {
				reject( {message: 'You are not allowed to login from this device.'} );
				return;
			}

			resolve( user );

		});

		
	}); // End Promise	
}

exports.hasOT = function( params ) {

	return new Promise((resolve, reject) => {

		const OvertimeModel  = require('../models/Overtime');
		var moment = require('moment-timezone');

		let fromDate = moment(params.time_in).format("YYYY-MM-DD 00:00:00");
   		let toDate = moment(params.time_in).format("YYYY-MM-DD 23:59:59");

		var conditions = {
			company_id: params.user.company_id,
			branch_id: params.user.branch_id,
			employee: params.user._id,
			status: 'approved',
			time_in: { $gte: fromDate, $lte: toDate }
		};

		OvertimeModel.findOne( conditions, function(error, overtime) {

			if ( error ) {
				// reject( error );
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			}

			if ( overtime ) {
				params.with_ot = true;
				params.overtime = overtime
			} else {
				params.with_ot = false;
			}

			resolve(params);
			
		});

		
	}); // End Promise	
}


