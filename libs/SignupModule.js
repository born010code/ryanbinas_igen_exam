exports.createCompany = function( companyData ) {
	
	return new Promise((resolve, reject) => {

		const CompanyModel  = require('../models/Company');

		var Company = new CompanyModel( companyData );

		// Validate the input first.
		Company.validate( function(error) {

			if ( error ) {
				reject( {
					message: 'Unable to create an account at this time. Please try again later.',
					form_errors: error
				});
				return;
			}

			// Now save data into db.
			Company.save( function(err, company) {

				if ( err ) {
					reject( {
						message: 'Unable to create an account at this time. Please try again later.',
						error: error
					});
					return;
				}

				resolve( {company: company} );
				return;
				
			});
			
		});

		
	}); // End Promise	
};


exports.createMainBranch = function( data ) {
	
	return new Promise((resolve, reject) => {

		const BranchModel  = require('../models/Branch');

		//console.log('Company Object', data.company);

		var branchData = {
			company_id: data.company._id,
			name: 'Main Branch',
			status: 'active'
		}

		var Branch = new BranchModel( branchData );

		// Validate the input first.
		Branch.validate( function(error) {

			if ( error ) {
				reject( {
					message: 'Unable to create an account at this time. Please try again later.',
					form_errors: error
				});

				// TODO: Delete company.
				return;
			}

			// Now save data into db.
			Branch.save( function(err, branch) {

				if ( err ) {
					reject( {
						message: 'Unable to create an account at this time. Please try again later.',
						error: error
					});
					return;
				}

				// TODO: Delete company.

				data.branch = branch;

				resolve( data );
				return;
			});
			
		});

		
	}); // End Promise	
};


exports.createUser = function( params ) {
	
	return new Promise((resolve, reject) => {

		const UserModel  = require('../models/User');


		//console.log('Create User inside', params);

		var gender = params.user.gender.toLowerCase();

		//console.log('gender:' , gender);

		if ( gender !== 'female' && gender !== 'male') {
			
			reject( {
				message: 'Invalid gender value.',
				company: params.company,
				branch: params.branch
			});
			return;
		}

		var User = new UserModel( params.user );

		// Validate the input first.
		User.validate( function(error) {

			if ( error ) {
				reject( {
					message: 'Unable to create an account at this time. Please try again later.',
					form_errors: error,
					company: params.company,
					branch: params.branch
				});
				return;
			}

			var config = require('../config/config');

			// Now save data into db.
			User.save( function(err, user) {

				if ( err ) {
					reject( {
						message: 'Unable to create an account at this time. Please try again later.',
						error: err,
						company: params.company,
						branch: params.branch
					});
					return;
				}

				var SesClient = require("../libs/SesClient");
				let link = config.SITE_URL + 'signup/verify/' + params.company.verification_hash;

					
				var data = {
					to: [params.company.email],
					subject: 'QloudHR - Email Verification',
					clientName: 'Good day!',
					messageBody: 'This company email has been registered to use QloudHR. \
						To verify your company, please click the link below.',
					linkhere: 'Verification link: ' + link,
					messageEnd:'If you didn’t make this request, simply ignore this message. \
						Please do not reply to this message. \
						This is a system-generated email sent to ' + params.company.email + '.',
					from: 'QloudHR Support <support@qloudhr.com>' // Get from CONFIG
				};
			    
			    SesClient.sendEmail( data )
					.then( function( results ){

						params.user = user;

						resolve( params );
						return;
					
					})
					.catch(function(error){
						reject( {
							message: 'Unable to send a verification link.',
							error: error
						});
						return;
					});

				params.user = user;
				resolve( params );
				return;

				
			});
		});
		
	}); // End Promise	
};


exports.createUserPermissions = function( results ) {
	
	return new Promise((resolve, reject) => {

		const UserPermissionModel  = require('../models/UserPermission')
			, Config = require('../config/config');


		var UserPermission = new UserPermissionModel({
			user_id: results.user._id,
			perm: Config.permission_keys,
			company_id: results.user.company_id,
		});
		//console.log('perm', results);

		// Validate the input first.
		UserPermission.validate( function(error) {

			if ( error ) {
				reject( {
					message: 'Unable to create an account at this time. Please try again later.',
					form_errors: error
				});
				return;
			}

			// Now save data into db.
			UserPermission.save( function(err, userPermissions) {

				if ( err ) {
					reject( {
						message: 'Unable to create an account at this time. Please try again later.',
						error: error,
						// employee: results.user
					});
					return;
				}

				results.userPermissions = userPermissions;
				resolve( results );
				return;
			});
			
		});

		
	}); // End Promise	
};

exports.createCompanySettings = function( data ) {
	
	return new Promise((resolve, reject) => {

		const SettingModel  = require('../models/Setting');

		//console.log('Company Object in create settings', data.company);

		var settingData = {
			company_id: data.company._id,
			field1: 'default value',
			field2: 'default value',
			field3: 'default value',
			field4: 'default value',
		}

		var Setting = new SettingModel( settingData );

		// Validate the input first.
		Setting.validate( function(error) {

			if ( error ) {
				reject( {
					message: 'Unable to create an account settings at this time. Please try again later.',
					form_errors: error
				});

				// TODO: Delete company.
				return;
			}

			// Now save data into db.
			Setting.save( function(err, setting) {

				if ( err ) {
					reject( {
						message: 'Unable to create an account at this time. Please try again later.',
						error: error
					});
					return;
				}


				// TODO: Delete company.

				data.setting = setting;

				resolve( data );
				return;
			});
			
		});

		
	}); // End Promise	
};


exports.createSubscription = function( params ) {
	
	return new Promise((resolve, reject) => {

		const SubscriptionModel  = require('../models/Subscription');

		var Subscription = new SubscriptionModel( params.subscription );

		// Validate the input first.
		Subscription.validate( function(error) {

			if ( error ) {
				reject( {
					message: 'Unable to create an account at this time. Please try again later.',
					form_errors: error
				});
				return;
			}

			// Now save data into db.
			Subscription.save( function(err, subscription) {

				if ( err ) {
					reject( {
						message: 'Unable to create an account at this time. Please try again later.',
						error: error
					});
					return;
				}

				params.subscription = subscription;
				params.companyEmail = params.company.email;

				resolve( params );
				return;
				
			});
			
		});

		
	}); // End Promise	
};

