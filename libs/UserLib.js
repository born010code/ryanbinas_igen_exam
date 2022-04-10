exports.getUser = function( condition ) {
	
	return new Promise((resolve, reject) => {

		// Is user exist?
		const UserModel  = require('../models/User');

		UserModel.findOne(condition, function(error, user) {

			if ( error ) {
				//console.log('ERROR(UserLib.getUser): ', error);
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

exports.updateUser = function( conditions, data, opts ) {

	return new Promise((resolve, reject) => {

		// Is user exist?
		const UserModel  = require('../models/User');
		const ErrorMsgs  = require('../constants/ErrorMsgs');
		const NotificationModel = require('../models/Notification');

		UserModel.findOneAndUpdate(conditions, data, opts, function (error, result) {

			if ( error ) {
				//console.log('ERROR(UserLib.updateUser): ', error);
				reject(error);
				return;
			}

			if ( !result ) {
				reject( {message: ErrorMsgs.err_0004} );
				return;
			}

			new NotificationModel({
				user_id: result._id, 
				type: 'Profile',
				ref_id: result._id,
				description: 'Your profile has been updated.'
			}).save();

			resolve({
				user: result,
				message: 'Employee has been successfully updated.'
			});
		});

	}); // End Promise	
};

exports.isValidTime = function( user , DailyWorkSchedule ) {

	return new Promise((resolve, reject) => {

		// Is user exist?
		const UserModel  = require('../models/User');
		const ErrorMsgs  = require('../constants/ErrorMsgs');

		let days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
		let daily_work_schedules = DailyWorkSchedule;
		let regexp = /^([01]\d|2[0-3]):?([0-5]\d)$/;

		for ( var i = 0; i < days.length; i++ ) {

			let day = days[i];
			
			if ( daily_work_schedules[day].enabled ) {

				// check time-in
				if ( daily_work_schedules[day].in == '' || !daily_work_schedules[day].in.match(regexp) ) {
					reject( {message: 'Invalid time on ' + day + ' time in.'} );
					return;
				}

				// check time-out
				if ( daily_work_schedules[day].out == '' || !daily_work_schedules[day].out.match(regexp) ) {
					reject( {message: 'Invalid time on ' + day + ' time out.'} );
					return;	
				}

				// check if with break
				if ( daily_work_schedules[day].with_break ) {

					// check in2
					if ( daily_work_schedules[day].in2 == '' || !daily_work_schedules[day].in2.match(regexp) ) {
						reject( {message: 'Invalid time on ' + day + ' second time-in.'} );
						return;	
					}

					// check out2
					if ( daily_work_schedules[day].out2 == '' || !daily_work_schedules[day].out2.match(regexp) ) {
						reject( {message: 'Invalid time on ' + day + ' second time-out.'} );
						return;		
					}

					// check if time-in2 is more than time-out2
					if ( daily_work_schedules[day].in2 >= daily_work_schedules[day].out2 ) {
						reject( {message: 'Invalid time on ' + day + ' second time-in. It cannot be more than the second time-out.'} );
						return;
					}

					// check if time-in2 is less than time-out
					if ( daily_work_schedules[day].in2 <= daily_work_schedules[day].out ) {
						reject( {message: 'Invalid time on ' + day + ' second time-in. It cannot be more than the first time-out.'} );
						return;		
					}

				}

			}
		}

		resolve( user );

	}); // End Promise	
};

exports.generateQR = function( user ) {

	return new Promise((resolve, reject) => {

		const UserModel  = require('../models/User');
		const ErrorMsgs  = require('../constants/ErrorMsgs');

		var QRCode = require('qrcode');
		var multer  = require('multer')
		const multerS3 = require('multer-s3');
		const aws = require('aws-sdk');
		const s3 = new aws.S3();

		var path = require('path');
		var fs = require('fs');
		var sharp = require('sharp');
		var Config = require('../config/config');

		var hash = user.hash;
		var company_id = user.company_id;
		var user_id = user._id;
		var filename = Date.now().toString() + '_' + user_id + '.png';
		var path = './temp_files/' + filename;

		QRCode.toFile(path, hash, {type: 'png'}, function (err, result) {

			if (err){
				reject( {message: ErrorMsgs.err_0001} );
				return;		
			}

			var bucket = Config.S3_BUCKET_FOLDER + 'companies/' + company_id + '/users/' + user_id + '/qr';

			if( path === undefined ) {
				reject( {message: ErrorMsgs.err_0001} );
				return;		
			}

			var maxHeight = 400;
			var maxWidth = 400;
			var newHeight = 0;
			var newWidth = 0;
			var left = 0;
			var top = 0;

			var image = sharp(path);


			image
				.metadata()
				.then( function( metadata ) {

					if ( metadata.width < metadata.height ) {
						newHeight = metadata.width;
						newWidth = metadata.width;
						left = 0;
						top = Math.round((metadata.height - metadata.width) / 2);
					} else if ( metadata.height < metadata.width ) {
						newHeight = metadata.height;
						newWidth = metadata.height;
						left = Math.round((metadata.width - metadata.height) / 2);
						top = 0;
					} else {
						newHeight = newWidth = metadata.height;
						left = 0;
						top = 0;
					}

					return image
						.extract({ left: left, top: top, width: newWidth, height: newHeight })
					  	.resize( maxWidth, maxHeight )
					  	.toBuffer();
				})
				.then( function( data ) {
					var options = {
						Bucket:  bucket,
						Key: filename,
						Body: data,
						ACL: 'public-read',
						ContentLength: image.length,
						ContentType: "image/png"
					};

					s3.putObject(options, function (err, data) {
						if (!err) {
						  	fs.unlink(path, (err) => {
								if (err) {
									reject( {message: err.message} );
									return;		
								}

								var data = {
									qr_code :  filename
								};

								var opts = { runValidators: true, new: true };

								var conditions = {
									_id: user_id,
									company_id: company_id
								};

								UserModel.findOneAndUpdate(conditions, data, opts, function (error, result) {


									if ( error ) {
										// Delete qr when there is error when saving in the database has error
										var params = { Bucket: bucket, Key: filename };

										s3.deleteObjects(params, function (err, data) {
											if ( err ) {
												reject( {message: error.message} );
												return;		
											}
										});
									   
										reject( {message: ErrorMsgs.err_0001, form_errors: error} );
										return;		
									}


									if ( !result ) {
										// Delete qr when there is no user found.
										var params = { Bucket: bucket, Key: filename };

										 s3.deleteObject(params, function (err, data) {
											if ( err ) {
												reject( {message: ErrorMsgs.err_0001, form_errors: error} );
												return;		
											}
										});

										reject( {message: ErrorMsgs.err_0004} );
										return;		

									}

									resolve( user );

								});
						  		
							});
						}
					});
				})
				.catch(function(error){
					//console.log( 'GOT an error', error );
					reject( {message: ErrorMsgs.err_0001} );
					return;		
				});
	  
		})


	}); // End Promise	
};

exports.sendEmail = function( params ) {

	return new Promise((resolve, reject) => {

		var SesClient = require("../libs/SesClient");

		SesClient.sendEmail( params.emailData )
		.then( function( results ){
			resolve( params.user );
		})
		.catch(function(error){
			//console.log( 'GOT an error', error );
			reject( {message: error.message} );
			return;
		});

	}); // End Promise	
};

exports.validateUser = function( params ) {
	return new Promise((resolve, reject) => {

		const UserModel  = require('../models/User');
		var User = new UserModel(params);

		User.validate( function(error) {

			if ( error ) {
				reject({ message: 'Validation Error!', form_errors: error });
				return;	
			}

			resolve( params );

		});

	}); 
};

exports.checkUsername = function( username ) {
	return new Promise((resolve, reject) => {
		
		const UserModel  = require('../models/User');

		UserModel.findOne( {username: username}, function(err, user) {

			if ( err ) {
				reject({ message: ErrorMsgs.err_0001 });
				return;	
			}

			if ( user ) {
				reject({ message: 'The username you entered is already taken.' });
				return;	
			}

			resolve();

		});

	}); 
};

exports.checkEmail = function( conditions ) {
	return new Promise((resolve, reject) => {
		
		const UserModel  = require('../models/User');

		UserModel.findOne( conditions, function(err, user) {

			if ( err ) {
				reject({ message: ErrorMsgs.err_0001 });
				return;	
			}

			if ( user ) {
				reject({ message: 'The email you entered is already taken.' });
				return;	
			}

			resolve();

		});

	}); 
};

exports.createUser = function( params, current_user ) {
	return new Promise((resolve, reject) => {

		const UserModel  = require('../models/User');
		const UserSettingModel  = require('../models/UserSetting');
		const SystemLogModel  = require('../models/SystemLog');

		var User = new UserModel(params);

		User.save( function(error, user) {

			if ( error ) {
				reject({ message: ErrorMsgs.err_0001 });
				return;	
			}

			new UserSettingModel({
				user_id: user._id, 
				company_id: user.company_id,
				field1: '',
				field2: '',
				field3: '',
				field4: '',
			}).save();

			new SystemLogModel({
				user_id: current_user, 
				employee: current_user,
				type: 'users', 
				ref_id: user._id,
				company_id: user.company_id,
				branch_id: user.branch_id,
				action: 'created an employee account for '+ user.first_name +' '+ user.last_name +'.'
			}).save();

			resolve( params );

		});

	}); 
};

exports.countUser = function( params ) {
	return new Promise((resolve, reject) => {

		const UserModel  = require('../models/User');

		var conditions = {
			company_id: params.company_id,
			status: 'active'
		}

		UserModel.count(conditions, function (err, count) {

			if ( err ) {
				reject({ message: ErrorMsgs.err_0001 });
				return;	
			}

			params.user_count = count
			resolve( params );

		});

	});
};

exports.checkPlanType = function( params ) {
	return new Promise((resolve, reject) => {

		const SubscriptionModel  = require('../models/Subscription');

		SubscriptionModel.findOne({company_id: params.company_id}, function(err, subscription) {

			if ( err ) {
				reject({ message: ErrorMsgs.err_0001 });
				return;	
			}

			if ( !subscription ) {
				reject({ message: ErrorMsgs.err_0004 });
				return;	
			}

			if ( subscription.plan_type == 'plan_FREE' ) {
				if ( params.user_count >= 5 ) {
					reject( {message: "You have reached the maximum number of employees allowed for your plan type. Upgrade your account to add more employees."} );
					return;
				}
			} else {
				let plan_count = subscription.plan_type.replace( /^\D+/g, '');

				if ( params.user_count >= plan_count ) {
					reject( {message: "You have reached the maximum number of employees allowed for your plan type. Upgrade your account to add more employees."} );
					return;
				}
			}

			resolve( params );
			
		});

	});
};