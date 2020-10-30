var urlParams;
(window.onpopstate = function () {
	var match,
		pl     = /\+/g,  // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
		query  = window.location.search.substring(1);

	urlParams = {};
	while (match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);
})();
function onSignIn(googleUser) {
	var id_token = googleUser.getAuthResponse().id_token;
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://schoolathome.theohalpern.repl.co/loginenter');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
		console.log('Signed in : ' + xhr.responseText);
		
		//document.getElementById("signedInAs").innerText = xhr.responseText;
		if (xhr.responseText == "https://schoolathome.theohalpern.repl.co/") {
			if (typeof urlParams.goBackTo == "undefined"){
				window.location.href = "https://schoolathome.theohalpern.repl.co/home";
				document.getElementById("mainGSignIn").style.display = "none";
				document.getElementById("signOut").style.display = "inline";
				document.getElementById("cA").style.display = "none";
			}else{
				window.location.href = urlParams.goBackTo;
				document.getElementById("mainGSignIn").style.display = "none";
				document.getElementById("signOut").style.display = "inline";
				document.getElementById("cA").style.display = "none";
			}
			
		}
	}

	xhr.send('idtoken=' + id_token);
}

function upVotePost(idd,school,sclass){
	var xhr = new XMLHttpRequest();
	xhr.open('POST','https://schoolathome.theohalpern.repl.co/s/'+school+"/c/"+sclass+'/upVotePost/');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
		
		//document.getElementById("signedInAs").innerText = xhr.responseText;
		if (xhr.responseText == "suc") {
			var tochange = document.getElementById("pID" + idd); 
			var scoreChange = document.getElementById("sID" + idd); 
			if (tochange.className.includes("yUpvoted")) {
				scoreChange.innerText = parseInt(scoreChange.innerText)- 1;
				tochange.classList.remove("yUpvoted");
			}else{
				scoreChange.innerText =parseInt(scoreChange.innerText)+ 1;
				tochange.classList.add("yUpvoted");
			}
			//change color nad number
		}
	}
	xhr.send('postId=' + idd);
}

function delComment(commentID,idd,school,sclass){
	if (confirm("Are you sure you want to delete this comment, this cannot be undone.")) {
		var xhr = new XMLHttpRequest();
		xhr.open('POST','https://schoolathome.theohalpern.repl.co/s/'+school+"/c/"+sclass+'/p/'+idd+'/delComment/');
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onload = function() {
			
			//document.getElementById("signedInAs").innerText = xhr.responseText;
			if (xhr.responseText == "suc") {
				window.location.replace('https://schoolathome.theohalpern.repl.co/s/'+school+"/c/"+sclass+"/p/"+idd);
				//change color nad number
			}
		}
		xhr.send('postId=' + idd+'&commentID='+commentID);
	}
}

function delPost(idd,school,sclass){
	if (confirm("Are you sure you want to delete this post, this cannot be undone.")) {
		var xhr = new XMLHttpRequest();
		xhr.open('POST','https://schoolathome.theohalpern.repl.co/s/'+school+"/c/"+sclass+'/delPost/');
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onload = function() {
			//document.getElementById("signedInAs").innerText = xhr.responseText;
			if (xhr.responseText == "suc") {
				window.location.replace('https://schoolathome.theohalpern.repl.co/s/'+school+"/c/"+sclass);
				//change color nad number
			}
		}
		xhr.send('postId=' + idd);
	}
	
}

function fav(shortClassName,shortSchoolName){
	var xhr = new XMLHttpRequest();
	xhr.open('POST','https://schoolathome.theohalpern.repl.co/favoriteClass/');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
		
		//document.getElementById("signedInAs").innerText = xhr.responseText;
		console.log(xhr.responseText)
	}
	xhr.send('shortSchoolName=' + shortSchoolName+'&shortClassName='+shortClassName);
}

function upVoteComment(commentID,idd,school,sclass){
	var xhr = new XMLHttpRequest();
	xhr.open('POST','https://schoolathome.theohalpern.repl.co/s/'+school+"/c/"+sclass+'/p/'+idd+'/upVoteComment/');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
		
		//document.getElementById("signedInAs").innerText = xhr.responseText;
		if (xhr.responseText == "suc") {
			var tochange = document.getElementById("pID" + commentID); 
			var scoreChange = document.getElementById("sID" + commentID); 
			if (tochange.className.includes("yUpvoted")) {
				scoreChange.innerText = parseInt(scoreChange.innerText)- 1;
				tochange.classList.remove("yUpvoted");
			}else{
				scoreChange.innerText =parseInt(scoreChange.innerText)+ 1;
				tochange.classList.add("yUpvoted");
			}
			//change color nad number
		}
	}
	xhr.send('postId=' + idd+'&commentID='+commentID);
}


function markAns(commentID,idd,school,sclass){
	var xhr = new XMLHttpRequest();
	xhr.open('POST','https://schoolathome.theohalpern.repl.co/s/'+school+"/c/"+sclass+'/p/'+idd+'/markAns/');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
		
		//document.getElementById("signedInAs").innerText = xhr.responseText;
		if (xhr.responseText == "suc") {
			location.reload();
			//change color nad number
		}else{
			window.location.href = xhr.responseText;
		}
	}
	xhr.send('postId=' + idd+'&commentID='+commentID);
}


function onClickHide(idd) {
	id = idd.substring(0, idd.length - 4);
	console.log(id)
	var dots = document.getElementById(id+"dots");
	var moreText = document.getElementById(id+"more");
	var btnText = document.getElementById(id+"butt");

	if (dots.style.display === "none") {
		dots.style.display = "inline";
		btnText.innerHTML = "Add comment/post";
		moreText.style.display = "none";
	} else {
		dots.style.display = "none";
		btnText.innerHTML = "Minimise";
		moreText.style.display = "inline";
	}
}

function signOut() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
		window.location.href = "https://schoolathome.theohalpern.repl.co/signout";
	});
}