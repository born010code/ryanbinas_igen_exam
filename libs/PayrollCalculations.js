
exports.calculate = function( params ) {
	return new Promise((resolve, reject) => {
		// console.log('calculate params:', params);

		let basic_salary = params.user.basic_salary;


		if ( params.salary_type === 'bi-monthly-fixed' ) {
			if ( params.user.salary_type === 'monthly-fixed')
				basic_salary = basic_salary / 2;
			else if ( params.user.salary_type === 'weekly-fixed')
				basic_salary = basic_salary * 2;
		} else if ( params.salary_type === 'monthly-fixed' ) {
			if ( params.user.salary_type === 'bi-monthly-fixed')
				basic_salary = basic_salary * 2;
			else if ( params.user.salary_type === 'weekly-fixed')
				basic_salary = basic_salary * 4;
		} else if ( params.salary_type === 'weekly-fixed' ) {
			if ( params.user.salary_type === 'bi-monthly-fixed')
				basic_salary = basic_salary / 2;
			else if ( params.user.salary_type === 'monthly-fixed')
				basic_salary = basic_salary / 4;
		}

		if ( 
			['weekly', 'bi-monthly', 'monthly'].indexOf(params.salary_type) === -1 && // DAILY
			['weekly', 'bi-monthly', 'monthly'].indexOf(params.user.salary_type) !== -1 // NOT DAILY
		) {
			basic_salary = 0;
		} else if ( 
			['weekly', 'bi-monthly', 'monthly'].indexOf(params.salary_type) !== -1 && // NOT DAILY
			['weekly', 'bi-monthly', 'monthly'].indexOf(params.user.salary_type) !== -1 // DAILY
		) {
			basic_salary = 0;
		}


		//console.log('params.user:',params.user, 'basic_salary', basic_salary);

		params.basic_salary = basic_salary;

		let d = {
			'action': params.action,
            '_id': params._id,

            'user_id': params.user._id,
            'payroll_id': params.payroll_id,
            'branch_id': params.branch_id,
            'company_id': params.company_id,

			'salary_type': params.salary_type,
            'rate_min': 0,
           
            'with_taxes': params.with_taxes,
            'with_benefits': params.with_benefits,
            'with_night_diff': params.with_night_diff,
            'with_ot': params.with_ot,
            'deduct_absences': params.deduct_absences,
            'deduct_lates': params.deduct_lates,
            'deduct_undertime': params.deduct_undertime,
            
            'total_basic_pay': basic_salary,
            'total_incomes': 0,
            'total_deductions': 0,
            'total_netpay': 0,
            'total_night_diff': 0,
            'total_ot': 0,
            
            // INCOMES
            'addtl_incomes': params.addtl_incomes ? params.addtl_incomes : [],
            'total_addtl_incomes': 0,

            // DEDUCTIONS
            'addtl_deductions': params.addtl_deductions ? params.addtl_deductions : [],
            'total_addtl_deductions': 0,

             // CONTRIBUTIONS
			'contributions': params.contributions ? params.contributions : [],
			'total_contributions': 0,
			'total_contributions_ee': 0,
			'total_contributions_er': 0,
			'total_contributions_ec': 0,

			'total_work_to_render_min': 0,
            'total_work_rendered_min': 0,

            'total_work_rendered': 0,
            'total_work_to_render': 0,

            // TARDINESS
            'total_unwork': 0,
            'total_unwork_min': 0,

            'total_lates': 0,
            'total_lates_min': 0,

            'total_undertime': 0,
            'total_undertime_min': 0,

            'total_tardiness': 0,
            'total_tardiness_min': 0,
            
            'total_absences': 0,
            'total_present': 0,
            'total_withholding_tax': 0,

            'with_cola': params.user.with_cola || false,
            'cola_rate': params.user.cola_rate || 0,
            'total_cola': 0,

            // deduct in computing tax
            'total_contribution_for_tax': 0,

            // sss
            'sss_er': 0,
            'sss_ee': 0,
            'total_sss': 0,

            // philhealth
            'philhealth_er': 0,
            'philhealth_ee': 0,
            'total_philhealth': 0,

            // pagibig
            'pagibig_er': 0,
            'pagibig_ee': 0,
            'total_pagibig': 0,

            // gsis
            'gsis_er': 0,
            'gsis_ee': 0,
            'total_gsis': 0

		}

		// console.log('BEFORE DDDD:', d);

		// OK, LET'S GO! START OF COMPUTATIONS
		calculateSalary( d, params )
			.then( function( params ){

				if ( params.with_taxes ) {
					return calculateTax( params );	
				} else {
					resolve( params );
				}
				
			})
			.then( function( results ){
				resolve( results )
			})
			.catch(function(error){
				////console.log(error);
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			});
	}); // End Promise	
};

calculateSalaryRate =  function( params ) {
	return new Promise((resolve, reject) => {
		var MathUtil = require("./../libs/MathUtil");

		let total_work_to_render_min = 0;
		let rate_min = -1;

		let basic_salary = params.basic_salary;

		// DAILY SALARY COMPUTATIONS
		if ( ['weekly', 'bi-monthly', 'monthly'].indexOf(params.salary_type) !== -1 ) {
			resolve(rate_min);
		} else {
			if ( params.dtrs.length ) {
				for ( var i = params.dtrs.length - 1; i >= 0; i-- ) {
					total_work_to_render_min += MathUtil.toFixed( params.dtrs[i].work_to_render / 60 );
				}

				rate_min = MathUtil.toFixed( basic_salary / total_work_to_render_min );
				resolve(rate_min);
			} else {
				resolve(0);
			}
		}
	}); // End Promise	
}

calculateSalary =  function( d, params ) {
	return new Promise((resolve, reject) => {
		// LET'S DO THE ACTUAL CALCULATIONS
		var MathUtil = require("./../libs/MathUtil");
		var moment = require('moment-timezone');

		calculateSalaryRate( params )
			.then( function( rate_per_min ){

				let daily = [];
				d.daily = daily;

				if ( params.dtrs.length ) {
					// Daily rates vary. So let's compute it daily as well.
					for ( var i = params.dtrs.length - 1; i >= 0; i-- ) {

						// MINUTES
						let total_lates_min = MathUtil.toFixed( params.dtrs[i].total_late / 60 );
						let total_undertime_min = MathUtil.toFixed( params.dtrs[i].total_undertime / 60 );
						let total_work_to_render_min = MathUtil.toFixed( params.dtrs[i].work_to_render / 60 );
						let total_unwork_min = 0;
						let total_work_rendered_min = 0;
						let total_tardiness_min = 0;

						// SECONDS
						let total_unwork_sec = 0;
						let total_work_rendered_sec = params.dtrs[i].work_rendered ? params.dtrs[i].work_rendered: 0;

						if ( params.dtrs[i].is_absent ) {
							total_unwork_sec = ( params.dtrs[i].work_to_render );
						} else {
							d.total_present++;
							total_unwork_sec = params.dtrs[i].work_to_render - (params.dtrs[i].work_rendered + params.dtrs[i].total_late + params.dtrs[i].total_undertime );
						}

						total_unwork_sec <= 0 ? 0: total_unwork_sec;
						
						total_unwork_min = MathUtil.toFixed( total_unwork_sec / 60 );
						total_work_rendered_min = MathUtil.toFixed( total_work_rendered_sec / 60 );

						let daily_rate = params.dtrs[i].daily_rate ? params.dtrs[i].daily_rate : 0;
						let rate_min = rate_per_min;

						if ( rate_per_min === -1 ) {
							rate_min =  MathUtil.toFixed( daily_rate / total_work_to_render_min );
							d.total_basic_pay += daily_rate;

						} else {
							d.rate_min = rate_min;
						}

						// solve COLA
						let cola_rate = 0;

						if ( d.with_cola ) {
							cola_rate = d.cola_rate;
						}

						// solve night differential
						let hourly_rate = 50;
						// let hourly_rate = d.rate_min * 60;
						let night_diff = 0;

						if ( d.with_night_diff && params.dtrs[i].with_night_differential ) {
							night_diff = hourly_rate * (params.dtrs[i].nd_rate / 100) * params.dtrs[i].nd_total_time;
						}

						// Compute Overtime Pay
						let ot = 0;

						if ( d.with_ot && params.dtrs[i].with_ot ) {
							let ot_total_time = moment(params.dtrs[i].ot_out).diff(params.dtrs[i].ot_in, 'hours', true).toFixed(2);
							ot = hourly_rate * params.dtrs[i].ot_rate * ot_total_time;
						}


						// Compute for total tardiness.
						let total_lates =  MathUtil.toFixed( total_lates_min * rate_min);
						let total_undertime =  MathUtil.toFixed( total_undertime_min * rate_min) ;
						let total_unwork = MathUtil.toFixed( total_unwork_min * rate_min);

						let total_work_to_render = MathUtil.toFixed( total_work_to_render_min * rate_min);
						let total_work_rendered = MathUtil.toFixed( total_work_rendered_min * rate_min);

						total_tardiness_min = MathUtil.toFixed( total_lates_min + total_undertime_min );
						total_tardiness =  MathUtil.toFixed( total_lates + total_undertime);

						let total_deductions = MathUtil.toFixed( 
							total_tardiness + 
							total_unwork
						);

						let total_incomes = MathUtil.toFixed( 
							(rate_per_min === -1 ? daily_rate : total_work_to_render)
						);

						let total_netpay = MathUtil.toFixed( total_incomes - total_deductions);
						total_netpay = total_netpay <= 0 ? 0 : total_netpay;

						daily_computation = {
							with_break: params.dtrs[i].with_break,
							is_absent: params.dtrs[i].is_absent,
							is_absent1: params.dtrs[i].is_absent ? 1 : 0,
							is_absent2: params.dtrs[i].is_absent ? 1 : 
								params.dtrs[i].time_in2 === null && 
								params.dtrs[i].with_break ? 1 : 0,
							for_date: params.dtrs[i].for_date,

							designation: params.dtrs[i].designation ? params.dtrs[i].designation.title : null,
							rate_min: rate_min,
							daily_rate: daily_rate,
							total_lates_min: total_lates_min,
							total_undertime_min: total_undertime_min,


							total_unwork_min: total_unwork_min,
							total_work_to_render_min: total_work_to_render_min,
							total_work_rendered_min: total_work_rendered_min,
							
							total_work_to_render: total_work_to_render,
							total_work_rendered: total_work_rendered,

							total_lates: total_lates,
							total_undertime: total_undertime,
							total_unwork: total_unwork,

							total_deductions: total_deductions,
							total_incomes: total_incomes,
							total_netpay: total_netpay,

							cola_rate: cola_rate,
							night_diff: night_diff,
							ot: ot

						};

						daily.push(daily_computation);

						d.total_lates_min += daily_computation.total_lates_min;
						d.total_undertime_min += daily_computation.total_undertime_min;
						d.total_unwork_min += daily_computation.total_unwork_min;
						d.total_work_to_render_min += daily_computation.total_work_to_render_min;
						d.total_work_rendered_min += daily_computation.total_work_rendered_min;

						d.total_work_to_render += daily_computation.total_work_to_render;
						d.total_work_rendered += daily_computation.total_work_rendered;
						d.total_lates += daily_computation.total_lates;
						d.total_undertime += daily_computation.total_undertime;
						d.total_unwork += daily_computation.total_unwork;
						d.total_deductions += daily_computation.total_deductions;
						d.total_incomes += daily_computation.total_incomes;
						d.total_netpay += daily_computation.total_netpay;

						d.total_cola += daily_computation.cola_rate;
						d.total_night_diff += daily_computation.night_diff;
						d.total_ot += daily_computation.ot;

					} // END for
				} else {
					//console.log('AAAAAA:' + d.total_basic_pay);
					d.total_unwork = d.total_basic_pay;
				}

				// //console.log('BBBBBB total_deductions:' + d.total_deductions);

				d.total_lates_min = MathUtil.toFixed( d.total_lates_min );
				d.total_undertime_min = MathUtil.toFixed( d.total_undertime_min );
				d.total_work_to_render_min = MathUtil.toFixed( d.total_work_to_render_min );
				d.total_work_rendered_min = MathUtil.toFixed( d.total_work_rendered_min );


				// COMPUTE for ADDITIONAL INCOMES
				if ( params.addtl_incomes ) {
					for ( var a = 0; a < params.addtl_incomes .length; a++ ) {
						params.addtl_incomes[a].user_id = params.user._id;
						params.addtl_incomes[a].company_id = params.user.company_id;
						d.total_addtl_incomes += params.addtl_incomes[a].amount;
					}
				}

				// COMPUTE for ADDITIONAL DEDUCTIONS
				if ( params.addtl_deductions ) {
					for ( var b = 0; b < params.addtl_deductions.length; b++ ) {
						params.addtl_deductions[b].user_id = params.user._id;
						params.addtl_deductions[b].company_id = params.user.company_id;
						d.total_addtl_deductions += params.addtl_deductions[b].amount;
					}
				}

				// COMPUTE CONTRIBUTIONS
				if ( params.contributions ) {
					for ( var c = 0; c < params.contributions.length; c++ ) {
						params.contributions[c].user_id = params.user._id;
						params.contributions[c].company_id = params.user.company_id;
						let ec = 0

						if ( params.contributions[c].name === 'sss' ) {
							ec = d.total_basic_pay < 14750 ? 10 : 30
							d.total_contributions_ec += ec;
							params.contributions[c].ec_amt = ec;


						}

						params.contributions[c].total = params.contributions[c].ee_amt + params.contributions[c].er_amt + ec;
						d.total_contributions += params.contributions[c].ee_amt;
						d.total_contributions += params.contributions[c].er_amt;
						d.total_contributions += ec;
						d.total_contributions_ee += params.contributions[c].ee_amt;
						d.total_contributions_er += params.contributions[c].er_amt;

						if ( ['sss', 'philhealth', 'pagibig'].indexOf(params.contributions[c].name) !== -1 ){
							d.total_contribution_for_tax += params.contributions[c].ee_amt;
						}

					}
				}

				// PRE-CALCULATIONS FOR SSS 
				let total_sss = 0;
				let salary_credit = Math.round(d.total_basic_pay/500) * 500;
				
				if (  d.total_basic_pay < 2250 ) {
					salary_credit = 2000;
				}

				if ( d.total_basic_pay >= 19750 ) {
					salary_credit = 20000;
				} 

				d.sss_er = MathUtil.toFixed(salary_credit * .08);
				d.sss_ee = MathUtil.toFixed(salary_credit * .04);
				d.total_sss = MathUtil.toFixed(d.sss_ee + d.sss_er);

				// PRE-CALCULATIONS FOR PHILHEALTH
				let total_philhealth = d.total_basic_pay * .03;
				if (  d.total_basic_pay < 10000 ) {
					total_philhealth = 300;
				}

				if ( d.total_basic_pay >= 60000 ) {
					total_philhealth = 1800;
				} 

				d.philhealth_er = MathUtil.toFixed(total_philhealth/2);
				d.philhealth_ee = MathUtil.toFixed(total_philhealth/2);
				d.total_philhealth = MathUtil.toFixed(total_philhealth);

				// PRE-CALCULATIONS FOR PAGIBIG
				let pagibig_er = 0;
				let pagibig_ee = 0;
				if ( 1500 <= d.total_basic_pay > 1000 ) {
					pagibig_er = d.total_basic_pay * .01;
					pagibig_ee = d.total_basic_pay * .02;
				}

				if ( d.total_basic_pay > 1500 ) {
					pagibig_er = d.total_basic_pay * .02;
					pagibig_ee = d.total_basic_pay * .02;
				} 

				if ( d.total_basic_pay > 5000 ) {
					pagibig_er = 5000 * .02;
					pagibig_ee = 5000 * .02;
				}

				d.pagibig_er = MathUtil.toFixed(pagibig_er);
				d.pagibig_ee = MathUtil.toFixed(pagibig_ee);
				d.total_pagibig = MathUtil.toFixed(pagibig_er + pagibig_ee);

				// PRE-CALCULATIONS FOR GSIS
				let gsis_er = d.total_basic_pay * .12;
				let gsis_ee = d.total_basic_pay * .09;
				
				d.gsis_er = MathUtil.toFixed(gsis_er);
				d.gsis_ee = MathUtil.toFixed(gsis_ee);
				d.total_gsis = MathUtil.toFixed(gsis_er + gsis_ee);

				d.addtl_incomes = params.addtl_incomes;
				d.addtl_deductions = params.addtl_deductions;

				d.total_incomes += d.total_addtl_incomes;
				d.total_deductions -= d.total_addtl_deductions;

				d.total_incomes += d.total_cola;
				d.total_incomes += d.total_night_diff;
				d.total_incomes += d.total_ot;


				// Do not trust front end. 
				// Let's start server side calculations.
				// CALCULATIONS GOES here.


				if ( !d.deduct_lates ) {
					d.total_deductions -= d.total_lates;
				}

				if ( !d.deduct_undertime ) {
					d.total_deductions -= d.total_undertime;
				}

				if ( !d.deduct_absences ) {
					d.total_deductions -= d.total_unwork;
				}

				if ( !d.with_benefits ) {
					d.contributions = [];
					d.total_contributions = 0;
					d.total_contributions_ee = 0;
					d.total_contributions_er = 0;
					d.total_contributions_ec = 0;
				}

				d.total_netpay = MathUtil.toFixed( d.total_incomes - d.total_deductions - d.total_contributions_ee);
				d.total_netpay = d.total_netpay <= 0 ? 0 : d.total_netpay;
				
				d.daily = daily;

				d.total_work_to_render = MathUtil.toFixed( d.total_work_to_render );
				d.total_work_rendered = MathUtil.toFixed( d.total_work_rendered );
				d.total_lates = MathUtil.toFixed( d.total_lates );
				d.total_undertime = MathUtil.toFixed( d.total_undertime );
				d.total_unwork = MathUtil.toFixed( d.total_unwork );
				d.total_deductions = MathUtil.toFixed( d.total_deductions );
				d.total_incomes = MathUtil.toFixed( d.total_incomes );
				d.total_netpay = MathUtil.toFixed( d.total_netpay );

				resolve( d );
			})
			.catch(function(error){
				////console.log(error);
				reject( {message: 'An error occurred. Please try again later.'} );
				return;
			});
	}); // End Promise	
}

calculateTax = function( params ) {
	
	return new Promise((resolve, reject) => {

		let totalContributions = params.total_contribution_for_tax;
		let basic_salary = params.total_basic_pay;
		let salary_type = params.salary_type;
		let taxableIncome = basic_salary - totalContributions;
		let withholdingTax = 0;
		let overCompensationLevel = 0;

		if ( salary_type === 'monthly-fixed' || salary_type === 'monthly' ) {

			if ( taxableIncome > 20833 && taxableIncome < 33333 ){

				overCompensationLevel = (taxableIncome - 20833) * .20;
				withholdingTax = overCompensationLevel;

			} else if ( taxableIncome > 33333 && taxableIncome < 66667 ) {

				overCompensationLevel = (taxableIncome - 33333) * .25;
				withholdingTax = 2500 + overCompensationLevel;

			} else if ( taxableIncome > 66667 && taxableIncome < 166667 ) {

				overCompensationLevel = (taxableIncome - 66667) * .30;
				withholdingTax = 10833 + overCompensationLevel;

			} else if ( taxableIncome > 166667 && taxableIncome < 666667 ) {

				overCompensationLevel = (taxableIncome - 166667) * .32;
				withholdingTax = 40833 + overCompensationLevel;

			} else if ( taxableIncome > 666667 ) {

				overCompensationLevel = (taxableIncome - 666667) * .35;
				withholdingTax = 200833 + overCompensationLevel;

			}

		}

		if ( salary_type === 'bi-monthly-fixed' || salary_type === 'bi-monthly' ) {

			if ( taxableIncome > 10417 && taxableIncome < 16667 ){

				overCompensationLevel = (taxableIncome - 10417) * .20;
				withholdingTax = overCompensationLevel;

			} else if ( taxableIncome > 16667 && taxableIncome < 33333 ) {

				overCompensationLevel = (taxableIncome - 16667) * .25;
				withholdingTax = 1250 + overCompensationLevel;

			} else if ( taxableIncome > 33333 && taxableIncome < 83333 ) {

				overCompensationLevel = (taxableIncome - 33333) * .30;
				withholdingTax = 5416 + overCompensationLevel;

			} else if ( taxableIncome > 83333 && taxableIncome < 333333 ) {

				overCompensationLevel = (taxableIncome - 83333) * .32;
				withholdingTax = 20416 + overCompensationLevel;

			} else if ( taxableIncome > 333333 ) {

				overCompensationLevel = (taxableIncome - 333333) * .35;
				withholdingTax = 100416 + overCompensationLevel;

			}

		}

		if ( salary_type === 'weekly-fixed' || salary_type === 'weekly' ) {

			if ( taxableIncome > 4808 && taxableIncome < 7692 ){

				overCompensationLevel = (taxableIncome - 4808) * .20;
				withholdingTax = overCompensationLevel;

			} else if ( taxableIncome > 7692 && taxableIncome < 15385 ) {

				overCompensationLevel = (taxableIncome - 7692) * .25;
				withholdingTax = 576 + overCompensationLevel;

			} else if ( taxableIncome > 15385 && taxableIncome < 38462 ) {

				overCompensationLevel = (taxableIncome - 15385) * .30;
				withholdingTax = 2500 + overCompensationLevel;

			} else if ( taxableIncome > 38462 && taxableIncome < 153846 ) {

				overCompensationLevel = (taxableIncome - 38462) * .32;
				withholdingTax = 9423 + overCompensationLevel;

			} else if ( taxableIncome > 153846 ) {

				overCompensationLevel = (taxableIncome - 153846) * .35;
				withholdingTax = 46346 + overCompensationLevel;

			}

		}

		params.total_withholding_tax = withholdingTax;
		params.total_netpay -= withholdingTax;

		resolve( params );
		return;
	}); // End Promise	
};



