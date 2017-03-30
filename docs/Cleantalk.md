# Global





* * *

## Class: Cleantalk
constructor - Constructor method for Cleantalk API class

**auth_key**:  , auth_key - Getter for service authorization key property
**language**:  , language - Getter for language property
**language**:  , language - Setter for language property
**server_url**:  , server_url - Getter for server api url property
**agent**:  , agent - Getter for server client agent property

## Class: Cleantalk
constructor - Constructor method for Cleantalk API class

### Cleantalk.isAllowMessage(request)

isAllowMessage - High level function - check whether it is possible to post new message

**Parameters**

**request**: `CleantalkRequest`, Description

**Returns**: `CleantalkResponse`, Description

### Cleantalk.isAllowUser(request)

isAllowUser - High level function - check whether it is possible to register new user

**Parameters**

**request**: `CleantalkRequest`, Description

**Returns**: `CleantalkResponse`, Description

### Cleantalk.checkNewUser(Options)

checkNewUser - Low level function - checks whether it is possible to register new user

**Parameters**

**Options**: `object`, Method options

 - **Options.sender_email**: `String`, Email for spam checking, Required.

 - **Options.sender_ip**: `String`, IP for spam checking. Required.

 - **Options.js_on**: `Boolean`, Is JavaScript enabled in
user's browser. Default null. Js_on can be calculated by evaluating some
JavaScript code in browser and comparing with reference value
on server side. Very important parameter.

valid are 0|1|2
Status:
 null - JS html code not inserted into phpBB templates
 0 - JS disabled at the client browser
 1 - JS enabled at the client broswer

 - **Options.submit_time**: `Integer`, Form submitting time in seconds. Required.
 Submit_time is the difference between submitting form time and
 page accessing time. Very important parameter.

 - **Options.all_headers**: `Object`, HTTP-request headers

 - **Options.sender_nickname**: `String`, Sender nickname for spam checking. Optional

 - **Options.sender_info**: `Object`, Any additional information about sender

 - **Options.tz**: `type`, Sender's timezone

 - **Options.phone**: `String`, Sender's phone nubmer

**Returns**: `CleantalkResponse`, Promised object with result of request

### Cleantalk.checkMessage(Options)

checkMessage - Function checks whether it is possible to publish the message

**Parameters**

**Options**: `object`, Method options

 - **Options.sender_email**: `String`, Email for spam checking, Required.

 - **Options.sender_ip**: `String`, IP for spam checking. Required.

 - **Options.js_on**: `Boolean`, Is JavaScript enabled in
user's browser. Default null. Js_on can be calculated by evaluating some
JavaScript code in browser and comparing with reference value
on server side. Very important parameter.

valid are 0|1|2
Status:
 null - JS html code not inserted into phpBB templates
 0 - JS disabled at the client browser
 1 - JS enabled at the client broswer

 - **Options.submit_time**: `Integer`, Form submitting time in seconds. Required.
 Submit_time is the difference between submitting form time and
 page accessing time. Very important parameter.

 - **Options.all_headers**: `Object`, HTTP-request headers

 - **Options.sender_nickname**: `String`, Sender nickname for spam checking. Optional

 - **Options.message**: `String`, Text message for checking, can contain HTML-tags

 - **Options.sender_info**: `Object`, Any additional information about sender

 - **Options.post_info**: `Object`, Additional information about message

 - **Options.stoplist_check**: `Boolean`, logical flag to check
message via stop-words list (1 or 0) (should be enabled in account);

**Returns**: `CleantalkResponse`, Promised object with result of request

### Cleantalk.ipInfo(ipList)

ipInfo - The API method ip_info() returns a 2 letter country code
(US, UK, CN and etc) for an IP address. You can specify a list
for IP address to find countries for each IP address by one API call.

**Parameters**

**ipList**: `array`, list of IP addresses

**Returns**: `Object`, Promised result object, e.g. {"data":{"8.8.8.8":{"country_code":"US","country_name":"United States"}}}

### Cleantalk.sendFeedback(requestList)

sendFeedback - This method should be used only for moderator feedbacks.
	It doesn't check spam. It sends back result of manual moderation.

**Parameters**

**requestList**: `array`, List of receipt request ids with status code,
e.g. <request_id1>:<0|1>

**Returns**: `Object`, Promisified object e.g. {"received " : 2, "comment" : "OK"},
where received - number of received request IDs and comment
- server answer, normally 'Ok'

### Cleantalk.spamCheck(addressList)

spamCheck - This method should be used only for mass check IPs, emails
for spam activity

**Parameters**

**addressList**: `array`, List of IP or email lists
, e.g. (stop_email@example.com, 127.0.0.1)

**Returns**: `Object`, Promised response data
, e.g. {"data":{"127.0.0.1":{"appears":0},"stop_email@example.com":
{"appears":1,"frequency":"999","updated":"2019-04-24 23:33:00"}}}
explanation
data - array with checked records,
record - array with details per record,
appears - marker witch define record status in the blacklists 0|1.
spam_rate - a rating of spam activity from 0 to 100%. 100 means certain spam.
frequency - is a number of web-sites that reported about spam activity
of the record. It can be from 0 up to 9999.

### Cleantalk.backlinksCheck(domains)

backlinksCheck - This method should be used only for mass backlinks
check for a domain list

**Parameters**

**domains**: `array`, List of domains for checking

**Returns**: `type`, Promised response data, e.g.
{"data":{"example.com":{"appears":1,"frequency":"164",
"updated":"2016-08-05 07:15:51"}}}

explanation
data - array with results
appears - marker which defines record existence in the database 0|1.
frequency - counts websites with backlinks in the record.
updated - last time a backlink was found.

### Cleantalk.sendRequest(method, data)

sendRequest - Publi method for promisified request to moderator Cleantalk API

**Parameters**

**method**: `String`, Name of remote method

**data**: `Object`, Request post data

**Returns**: `CleantalkResponse`, Promised result of request

### Cleantalk.requestMethod(requestUrl, data)

requestMethod - Private method for creating promisified requests to API server

**Parameters**

**requestUrl**: `String`, URL endpoint

**data**: `Object`, Request post data

**Returns**: `Promise`, Promised result of request



* * *
