const formTemplate = ({ errors, data }, auth_key) => {
    const disabledBecauseNoKey = auth_key ? '' : 'disabled';

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Cleantalk demo - just try it!</title>
<link href="https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7/cerulean/bootstrap.min.css" rel="stylesheet">
</head><body><nav class="navbar navbar-default navbar-fixed-top"><div class="container-fluid">
	<div class="navbar-header"><strong class="navbar-brand"><img height="20px" align="left" src="/cleantalk-logo-main.png" />&nbsp;<span>CLEAN</span><span>TALK</span> DEMO</strong></div>
	<ul class="nav navbar-nav"><li><a target="_blank" href="https://cleantalk.org/">Cleantalk Official</a></li></ul>
</div></nav><br><br>
	<div class="jumbotron"><div class="container-fluid"><div class="col-xs-6">
		<h2 class="pull-right"><strong style="color: red;">Try it &rarr;</strong></h2>
		<h2 style="font-size: 45px;">
			<img src="/cleantalk-logo-main.png" style="margin-right: 5px; position: relative; top: -2px; height: 33px;" />
			<strong style="color: #49c73b;">CLEAN</strong><strong style="color: #349ebf;">TALK</strong>
		</h2>
		<hr style="border-top: solid 1px rgba(0, 0, 0, 0.2);" />
		<p>Cleantalk is spam protection service for forums, boards, blogs and sites.</p>
		<p>No Captcha, no questions, no counting animals, no puzzles, no math. Fight spam!</p>
	</div>

	<div class="col-xs-6">
		<form class="panel panel-default" action="/post_message" method="POST">
		<div class="panel-heading">
			<strong>CHECK MESSAGE</strong>
			<div class="pull-right"><strong>API KEY: </strong>${ auth_key ? `<a href="/reset">${auth_key}</a>` : 'No set'}</div>
		</div>
		<div class="panel-body">
			${errors && errors.length ? '<ul class="alert alert-danger" role="alert">' : ''}
			${(errors || []).map(error => `<div>- ${error.message}</div>`).join('')}
			${errors && errors.length ? '</ul>' : ''}

			${auth_key ? '' : `
				<div class="alert alert-info">
					<strong>Before you can start you need to set up your auth key (Get there <a target="_blank" href="https://cleantalk.org/my">https://cleantalk.org/my</a>).</strong>
				</div>
				<div class="form-group">
					<label for="auth_key">Auth key</label>
					<input type="input" class="form-control" name="auth_key" value="${ data.auth_key || ''}"><br>
				</div>
			`}

			${!auth_key ? '' : `
				<label for="sender_email">EMail</label>
				<input type="email" class="form-control" ${disabledBecauseNoKey} name="sender_email" value="${data.sender_email || 'stop_email@example.com'}"><br>

				<label for="sender_nickname">Nickname</label>
				<input type="text"  class="form-control" ${disabledBecauseNoKey} name="sender_nickname" value="${data.sender_nickname || 'John Doe'}"><br>

				<label for="message">Message</label>
				<textarea name="message" ${disabledBecauseNoKey} class="form-control" rows="8" cols="80">${data.message || 'Spam message'}</textarea><br>
			`}
			</div>
			<div class="panel-footer clearfix">
				<input class="btn btn-success pull-right" value="${ !auth_key ? 'Set key' : 'Check message'}" type="submit">
			</div>
		</form>
		<h3>Cleantalk last news</h3>
		<a class="twitter-timeline" data-height="407" data-dnt="true" data-theme="light" href="https://twitter.com/cleantalk_en">Tweets by cleantalk_en</a> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

	</div>
</div></div></body></html>`;
};

module.exports = formTemplate;