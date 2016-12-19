'use strict';

/**
* @Author: Popov Gennadiy <dio>
* @Date:   2016-12-16T17:51:11+03:00
* @Email:  me@westtrade.tk
* @Last modified by:   dio
* @Last modified time: 2016-12-17T22:15:43+03:00
*/

const assert = require('assert');

const RESPONSE_CODES_EXPLANATIONS = {
	ALLOWED: 'Allowed',
	ALLOWED_PRIV_LIST: 'Private list allow',
	ALLOWED_PROFILE: 'Profile allowed',
	ALLOWED_USER: 'User allowed',
	BAD_INSTALL: 'Check plugin setup',
	BAD_LANGUAGE: 'Contains bad language',
	BL_DOMAIN: 'HTTP links blacklisted',
	BL: 'Sender blacklisted',
	COMMENT_TYPE_UNKNOWN: 'Trackback, Pingback comment\'s type need manual moderation',
	CONTACTS: 'Contains links',
	CONTACTS_DATA: 'Contains contacts',
	DENIED: 'Forbidden',
	DENIED_GREY_LIST: 'Please submit form again',
	DENIED_PRIV_LIST: 'Private list deniy',
	DENIED_PROFILE: 'Profile forbidden',
	DENIED_USER: 'User forbidden',
	ERR_CLIENT_IP_EQ_SERVER_IP: 'Site visitor IP is rqual to server site IP',
	FAST_SUBMIT: 'Submitted too quickly',
	FORBIDDEN: 'Forbidden',
	JS_DISABLED: 'Please enable JavaScript',
	KEY_NOT_FOUND: '“Antispam disabled. Check access key',
	MANUAL: 'Need manually approve',
	MULT_MESSAGE: 'Massive posting',
	MULT_SUBMIT: 'Multiple comments submit',
	NO_NORM_WORDS: 'Without dictionary words',
	OFFTOP: 'Offtopic',
	SERVICE_DISABLED: 'Service disabled. Check account status',
	SERVICE_FREEZED: 'Service freezed. Please extend limit',
	STOP_LIST: 'Contains stop words',
	TRIAL_EXPIRED: 'Trial period expired',
	USERNAME_SPAM: 'Spam sender name',
	WRONG_TZ: 'Wrong timezone',
};

/**
 * ServiceResponseHelper - Helper class for recognize moderator API response decision
 */
class CleantalkResponse {

	/**
	 * constructor - ServiceResponseHelper constructor method
	 *
	 * @param {object} [responseData={}] Response result object
	 * @see {@link https://cleantalk.org/help/api-without}
	 *
	 * @return {type} Description
	 */
	constructor(responseData = {}) {

		assert.equal(typeof responseData, 'object', 'Argument responseData must be an object');

		let {
			stop_words,
			sms_allow,
			sms,
			sms_error_code,
			sms_error_text,
			stop_queue,
			inactive,
			version,
			codes,
			spam,
			js_disabled,
			comment,
			blacklisted,
			fast_submit,
			account_status,
			id,
			allow,
		} = responseData;

		this.stop_words = stop_words || null;
		this.sms_allow = sms_allow || null;
		this.sms = sms || null;
		this.sms_error_code = sms_error_code || null;
		this.sms_error_text = sms_error_text || null;

		this.stop_queue = !!stop_queue;
		this.inactive = !!inactive;
		this.version = version;
		this.codes = codes;
		this.spam = !!spam;
		this.js_disabled = !!js_disabled;
		this.raw_comment = comment;
		this.blacklisted = !!blacklisted;
		this.fast_submit = !!fast_submit;
		this.account_status = !!account_status;
		this.id = id;
		this.allow = !!allow;
	}

	get isSpam() {
		return this.spam;
	}

	get isAllowed() {
		return this.allow;
	}

	get codesExplanation() {
		return this.codes.split(' ').map(code => RESPONSE_CODES_EXPLANATIONS[code]);
	}

	get senderInBlacklist() {
		return this.blacklisted;
	}

	get comment() {
		return this.raw_comment.replace(/[*]+/gim, '').trim();
	}

}


module.exports = CleantalkResponse;
