function onSignIn(googleUser) {
	function getOption(id) { 
		selectElement = document.querySelector('#'+id); 
							
		return(selectElement.options[selectElement.selectedIndex].value); 

		
	} 
	var x = document.forms["createForm"]["fname"].value;
  if (x == "") {
    alert("Username must be filled out");
  }else if (document.forms["createForm"]["school"].value == "null"){
		alert("School must be sleected");
	}else if (document.forms["createForm"]["grade"].value == "null"){
		alert("Grade must be sleected");
	}else{
		var id_token = googleUser.getAuthResponse().id_token;
		var xhr = new XMLHttpRequest();
		xhr.open('POST', 'https://schoolathome.theohalpern.repl.co/signup');
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onload = function() {
			if (xhr.responseText == "suc"){
				window.location.replace("https://schoolathome.theohalpern.repl.co/login");
			}else{
				alert( xhr.responseText);
				console.log('Signed in as: ' + xhr.responseText);
			}

		};

		xhr.send('idtoken=' + id_token + '&username=' + document.getElementById("createForm").elements[0].value + '&school=' + getOption("school") + '&grade=' + getOption("grade"));
	}
	
}