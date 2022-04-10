exports.getSubscription = function( subscirptionConditions ) { 

	return new Promise((resolve, reject) => {

		const SubscriptionModel  = require('../models/Subscription');
		var conditions = subscirptionConditions;	

		SubscriptionModel.findOne(conditions, function(err, subscription)  {

			if ( err ) {
				reject( {
					message: 'Unable to create an account at this time. Please try again later.',
					error: error
				});
				return;
			}

			resolve( {subscription: subscription} );
			return;			
		});

		
	}); // End Promise

};

exports.updateSubscriptionStatus = function( subscriptionData,  subscirptionConditions) { 

	return new Promise((resolve, reject) => {

		const SubscriptionModel  = require('../models/Subscription');

		var moment = require('moment-timezone');		

		var opts = { runValidators: true, new: true };
		var data = subscriptionData;
		var conditions = subscirptionConditions;

		SubscriptionModel.findOneAndUpdate( conditions, data, opts, function(err, subscription) {

			if ( err ) {
				reject( {
					message: 'Unable to create an account at this time. Please try again later.',
					error: error
				});
				return;
			}

			resolve( {subscription:subscription} );
			return;
			
		});

		
	}); // End Promise	
};

exports.createPaymentTransaction = function( params ) {
	
	return new Promise((resolve, reject) => {

		const paymentTransactionModel  = require('../models/PaymentTransaction');

		var PaymentTransaction = new paymentTransactionModel( params.paymentData );

		// Validate the input first.
		PaymentTransaction.validate( function(error) {

			if ( error ) {
				reject( {
					message: 'Unable to create an account at this time. Please try again later.',
					form_errors: error
				});
				return;
			}

			// Now save data into db.
			PaymentTransaction.save( function(err, paymentTransaction) {

				if ( err ) {
					reject( {
						message: 'Unable to create an account at this time. Please try again later.',
						error: error
					});
					return;
				}

				params.payment = paymentTransaction;
					
				resolve( params );
				return;
				
			});
			
		});

		
	}); // End Promise	
};

exports.createInvoice = function( invoiceData ) {
	
	return new Promise((resolve, reject) => {

		const InvoiceModel  = require('../models/Invoice');

		var Invoice = new InvoiceModel( invoiceData );

		// Validate the input first.
		Invoice.validate( function(error) {

			if ( error ) {
				reject( {
					message: 'Unable to create an account at this time. Please try again later.',
					form_errors: error
				});
				return;
			}

			// Now save data into db.
			Invoice.save( function(err, invoice) {

				if ( err ) {
					reject( {
						message: 'Unable to create an account at this time. Please try again later.',
						error: error
					});
					return;
				}
				
				resolve( {invoice:invoice} );
				return;
				
			});
			
		});

		
	}); // End Promise	
};