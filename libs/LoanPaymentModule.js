exports.createNewBalance = function( LoanData ) {
	
	return new Promise((resolve, reject) => {

		const LoanModel  = require('../models/Loan');

		var moment = require('moment-timezone');		

		var conditions = {
			_id: LoanData._id,
			company_id: LoanData.company_id,
		};

		LoanModel.findOne(conditions, function(err, result)  {

			if ( err ) {
				reject( {
					message: 'Unable to create an account at this time. Please try again later.',
					error: error
				});
				return;
			}
			
			var newBalance = result.balance - LoanData.amount_paid;

			var data = {
				balance : newBalance
			};
			var opts = { runValidators: true, new: true };

			LoanModel.findOneAndUpdate( conditions, data, opts, function(err, loan) {

				if ( err ) {
					reject( {
						message: 'Unable to create an account at this time. Please try again later.',
						error: error
					});
					return;
				}

				resolve( {loan:loan} );
				return;
				
			});
			
		});

		
	}); // End Promise	
};


exports.createLoanPayment = function( params ) {
	
	return new Promise((resolve, reject) => {

		const loanPaymentModel  = require('../models/LoanPayment');

		var LoanPayment = new loanPaymentModel( params.loanpayment );

		// Validate the input first.
		LoanPayment.validate( function(error) {

			if ( error ) {
				reject( {
					message: 'Unable to create an account at this time. Please try again later.',
					form_errors: error
				});
				return;
			}

			// Now save data into db.
			LoanPayment.save( function(err, loanPayment) {

				if ( err ) {
					reject( {
						message: 'Unable to create an account at this time. Please try again later.',
						error: error
					});
					return;
				}

				params.loanpayment = loanPayment;

				resolve( params );
				return;
				
			});
			
		});

		
	}); // End Promise	
};