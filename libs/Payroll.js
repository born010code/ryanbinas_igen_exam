exports.getUser = function( condition ) {
	
	return new Promise((resolve, reject) => {

		// Is user exist?
		const UserModel  = require('../models/User');

		UserModel.findOne(condition, function(error, user) {

			if ( error ) {
				////console.log('ERROR(getUser): ', error);
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


exports.calculateTimeRecords = function( params ) {

	// Get Time Records based on payperiod.
	// Get Holidays
	return new Promise((resolve, reject) => {

		// No dat range?
		if ( !params.period.from || !params.period.to ) {
			reject( {message: 'No date range specified.'} );
			return;
		}

		const DailyTimeRecordModel  = require('../models/DailyTimeRecord');
		var conditions = {};

		// Prepare conditions.
		conditions.user_id = params.user._id;
		conditions.company_id = params.company_id;

		if ( params.salary_type == 'monthly-fixed' || params.salary_type == 'bi-monthly-fixed' ) {
			conditions.salary_type = { $in: ['monthly-fixed', 'bi-monthly-fixed', 'weekly-fixed'] };
		} else {
			conditions.salary_type = { $in: ['monthly', 'bi-monthly', 'weekly'] };
		}
		

		var moment = require('moment-timezone');
		var fromTime = moment().format( params.period.from + " 00:00:00");
		var toTime = moment().format( params.period.to + " 23:59:59");
		// Get only record for certain date range.
		conditions.for_date = { $gte: fromTime, $lte: toTime };

		var query = DailyTimeRecordModel
			.find( conditions )
			.sort( { createdAt: -1 } );

		// TODO: Find a better way to get total count for large data set.
		query
			.populate('designation', 'title')
			.exec('find', function (error, results) {
				
				if ( error ) {
					reject( {message: 'An error occored. Please try again later.' + error} );
					return;
				}

				params.dtrs = results;

				// Daily Time records starts here.
				var PayrollCalculations = require("./../libs/PayrollCalculations");

				PayrollCalculations.calculate( params )
				.then( function( d ){
					resolve( d );
				}) 
				.catch(function(error){
					reject( {message: 'An error occored. Please try again later.' + error} );
				});
			})
	}); // End Promise	
};

exports.getPayroll = function( conditions ) {
	return new Promise((resolve, reject) => {
		// Is payroll exist?
		const PayrollModel  = require('../models/Payroll');

		PayrollModel.findOne(conditions, function(error, payroll) {

			if ( error ) {
				reject( {message: 'An error occored. Please try again later.'} );
				return;
			}

			if ( !payroll ) {
				reject( {message: 'Unable to find payroll record.'} );
				return;
			}
			
			resolve( payroll );
		});
	}); // End Promise	
};

exports.createOrUpdatePayrollDetail = function( params ) {
	return new Promise((resolve, reject) => {

		// console.log('params: ', params);
		
		// 1. Get User's DTRs
		let d = {
			payroll_id: params.payroll_id,
			payroll: params.payroll_id,
			branch: params.branch_id, 
			company_id: params.company_id,
			employee: params.user_id,

	        salary_type: params.salary_type,
	        rate_min: params.rate_min,

	        with_taxes: params.with_taxes,
	        with_benefits: params.with_benefits,
	        with_night_diff: params.with_night_diff,
	        deduct_absences: params.deduct_absences,
	        deduct_lates: params.deduct_lates,
	        deduct_undertime: params.deduct_undertime,

	        total_basic_pay: params.total_basic_pay,
	        total_incomes: params.total_incomes,
	        total_deductions: params.total_deductions,
	        total_netpay: params.total_netpay,
	        total_night_diff: params.total_night_diff,

	        addtl_incomes: params.addtl_incomes,
	        total_addtl_incomes: params.total_addtl_incomes,

	        addtl_deductions: params.addtl_deductions,
	        total_addtl_deductions: params.total_addtl_deductions,

	        contributions: params.contributions,
	        total_contributions: params.total_contributions,
	        total_contributions_ee: params.total_contributions_ee,
	        total_contributions_er: params.total_contributions_er,
	        total_contributions_ec: params.total_contributions_ec,

	        total_work_to_render_min: params.total_work_to_render_min,
	        total_work_rendered_min: params.total_work_rendered_min,

	        total_work_rendered: params.total_work_rendered,
	        total_work_to_render: params.total_work_to_render,


	        total_unwork: params.total_unwork,
	        total_unwork_min: params.total_unwork_min,

	        total_lates: params.total_lates,
	        total_lates_min: params.total_lates_min,

	        total_undertime: params.total_undertime,
	        total_undertime_min: params.total_undertime_min,

	        total_tardiness: params.total_tardiness,
	        total_tardiness_min: params.total_tardiness_min,

	        total_absences: params.total_absences,
	        total_present: params.total_present,
	        total_withholding_tax: params.total_withholding_tax,

	        total_cola: params.total_cola,

	        daily: params.daily,
		}

		const PayrollDetailModel  = require('../models/PayrollDetail');
		const PayrollModel  = require('../models/Payroll');

		if ( params.action === 'update' ) {

			// Prepare data.
			var opts = { runValidators: true, new: true };

			var conditions = {
				_id: params._id,
				company_id: params.company_id,
			};

			console.log('d: ', d);
			console.log('conditions: ', conditions);

			PayrollDetailModel.findOneAndUpdate(conditions, d, opts, function (error, result) {

				console.log('err: ', error);
				console.log('res: ', result);

				if ( error || !result ) {
					reject( {
						message: 'Unable to update record. Please try again later.1',
						form_errors: error
					});
				}

				updatePayrollSummary(d)
					.then( function( res ){
						resolve(res)
					})
					
					// Step 6: If it has, then blah blah blah.
					.catch(function(res){
						reject(res)
					});
			});
		} else {

			// TODO, check if the user_id and payroll_id already exist ot not.
			// Do not allow dups

			var PayrollDetail = new PayrollDetailModel(d);

			// Validate the input first.
			PayrollDetail.validate( function(error) {
				if ( error ) {
					reject( {
						message: 'Unable to add to payroll. Please try again later.',
						form_errors: error
					});
					return;
				}
				
				// Now save data into db.
				PayrollDetail.save( function(error, payrollDetail) {

					if ( error ) {
						reject( {
							message: 'Unable to add to payroll. Please try again later.',
							error: error
						});
						return;
					}

					updatePayrollSummary(d)
						.then( function( res ){
							resolve(PayrollDetail)
						})
						
						// Step 6: If it has, then blah blah blah.
						.catch(function(res){
							reject(res)
						});
				});
			});
		}

	}); // End Promise	
};


updatePayrollSummary = function(d) {

	return new Promise((resolve, reject) => {

		const mongoose = require('mongoose');
		const PayrollDetailModel  = require('../models/PayrollDetail');
		const PayrollModel  = require('../models/Payroll');

		let payrollConditions = {
			_id: d.payroll
		}

		let matchCond = {
			payroll: new mongoose.Types.ObjectId(d.payroll)
		}

		PayrollDetailModel.aggregate(
		    [
		    	{ $match: matchCond},
		        // Grouping pipeline
		        { $group: { 
		            _id: null, 
		            total_netpay: { $sum: "$total_netpay" },
		            total_incomes: { $sum: "$total_incomes" },
		            total_deductions: { $sum: "$total_deductions" },
		            total_taxes: { $sum: "$total_taxes" },
		            total_contributions: { $sum: "$total_contributions" },
		        }},
		        
		    ],
		    function(error, payrollDetailSummary) {

		    	if (error) {
		    		reject( {
		    			message: 'Unable to update record. Please try again later.2',
		    			form_errors: error
		    		});
		    		return;
		    	}

		    	let data = {
		    		total_netpay : d.total_netpay,
		    		total_incomes : d.total_incomes,
		    		total_deductions : d.total_deductions,
		    		total_taxes : d.total_taxes,
		    		total_contributions : d.total_contributions,
		    	};

		    	if ( payrollDetailSummary.length ) {
		    		data = {
			    		total_netpay : payrollDetailSummary[0].total_netpay,
			    		total_incomes : payrollDetailSummary[0].total_incomes,
			    		total_deductions : payrollDetailSummary[0].total_deductions,
			    		total_taxes : payrollDetailSummary[0].total_taxes,
			    		total_contributions : payrollDetailSummary[0].total_contributions,
			    	}
		    	}

		    	//console.log('payrollDetailSummary',payrollDetailSummary,'DDDDDDDDD', data);

		    	var opts = { runValidators: true, new: true };

		    	PayrollModel
		    		.findOneAndUpdate(payrollConditions, data, opts, function(error, payroll) {
		    			console.log(payroll);
		    			if ( error || !payroll) {
		    				reject( {
		    					message: 'Unable to update record3. Please try again later.',
		    					form_errors: error
		    				});
		    				return;
		    			}

		    			resolve( d );
		    		});
		    }
		);
	}); // End Promise	
}

