
function onSignIn(googleUser) {
	var id_token = googleUser.getAuthResponse().id_token;
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://schoolathome.theohalpern.repl.co/loginenter');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
		console.log('Signed in : ' + xhr.responseText);
		
		//document.getElementById("signedInAs").innerText = xhr.responseText;
		if (xhr.responseText == "https://schoolathome.theohalpern.repl.co/") {
			window.location.href = "https://schoolathome.theohalpern.repl.co/";
			document.getElementById("mainGSignIn").style.display = "none";
			document.getElementById("signOut").style.display = "inline";
			document.getElementById("cA").style.display = "none";
		}
	}

	xhr.send('idtoken=' + id_token);
}



function signOut() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
		window.location.href = "https://schoolathome.theohalpern.repl.co/signout";
	});
}