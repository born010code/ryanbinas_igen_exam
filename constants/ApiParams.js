function ApiParams() {
 	this.params = {
		'error'                 : false, 
		'status_code'           : 200, 
		'msg'                   : '',
		'form_errors'           : null,
		'results'               : [],
		'results_count'         : 0,
		'is_logged'             : true,
		'forced_login'          : false,
		// 'api_version'           => env('API_VERSION'),
	}

	return this;
}
module.exports = ApiParams;

