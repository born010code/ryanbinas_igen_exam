const aws = require('aws-sdk');
const ses = new aws.SES({apiVersion: '2010-12-01'});

exports.sendEmail = function( data ) {
	
	return new Promise((resolve, reject) => {

	    const params = {
	        Source: data.from ? data.from : 'no-reply@qloudhr.com',
	        Destination: {
	            ToAddresses: data.to
	        },
	        Message: {
	            Body: {
	                Html: {
	                    Charset: 'UTF-8',
	                    Data: generateEmail(data)
	                },
	            },
	            Subject: {
	                Charset: 'UTF-8',
	                Data: data.subject
	            }
	        },
	        ReturnPath: data.from ? data.from : 'no-reply@qloudhr.com',
	    };

	    ses.sendEmail(params, function(err, data) {
	        if (err) {
	            //console.log(err, err.stack);
	            reject( {message: 'Something went wrong. Please try again later.'} );
				return;
	        } else {
	            //console.log("Email sent.", data);
	            let msg = "Email sent.";

				resolve( { msg: msg } );
	        }
	    });

	    function generateEmail( data ) {
	    	return `
			  <!DOCTYPE html>
			  <html>
			    <head>
			      <meta charset='UTF-8' />
			      <title>title</title>
			    </head>
			    <body>
			    	<p>${data.clientName} </p>
			    	<p>${data.messageBody}</p>
			    	<p>${data.linkhere}</p>
			    	<br>
			    	<p>${data.messageEnd}</p>
			    	<br>
			    	<p>Best,</p>
			    	<p>The QloudHR Accounts Team</p>
			    </body>
			  </html>
			`
	    }
		
	}); // End Promise	
};

exports.sendVerifiedEmail = function( data ) {
	
	return new Promise((resolve, reject) => {

	    const params = {
	        Source: data.from ? data.from : 'no-reply@qloudhr.com',
	        Destination: {
	            ToAddresses: data.to
	        },
	        Message: {
	            Body: {
	                Html: {
	                    Charset: 'UTF-8',
	                    Data: generateEmail(data)
	                },
	            },
	            Subject: {
	                Charset: 'UTF-8',
	                Data: data.subject
	            }
	        },
	        ReturnPath: data.from ? data.from : 'no-reply@qloudhr.com',
	    };

	    ses.sendEmail(params, function(err, data) {
	        if (err) {
	            //console.log(err, err.stack);
	            reject( {message: 'Something went wrong. Please try again later.'} );
				return;
	        } else {
	            //console.log("Email sent.", data);
	            let msg = "Email sent.";

				resolve( { msg: msg } );
	        }
	    });

	    function generateEmail( data ) {
	    	return `
			  <!DOCTYPE html>
			  <html>
			    <head>
			      <meta charset='UTF-8' />
			      <title>title</title>
			    </head>
			    <body>
			    	<p>${data.clientName} </p>
			    	<p>${data.clientUserName} </p>
			    	<p>${data.messageBody}</p>
			    	<p>${data.linkhere}</p>
			    	<br>
			    	<p>${data.messageEnd}</p>
			    	<br>
			    	<p>Best,</p>
			    	<p>The QloudHR Accounts Team</p>
			    </body>
			  </html>
			`
	    }
		
	}); // End Promise	
};