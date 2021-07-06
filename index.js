const express = require('express');
const {OAuth2Client} = require('google-auth-library');
var mysql = require('mysql');
const jwt = require("jsonwebtoken")
const client = new OAuth2Client("985596922523-tr74rdm03hj1mh6tg2hpmnirvcrm4v14.apps.googleusercontent.com");
const pug = require('pug');
var session = require('client-sessions');
var nodemailer = require('nodemailer');
const { pugEngine } = require("nodemailer-pug-engine");

//these to functions are for sorting commonts this one sorts by new/old
function compareNumbers(key, order = 'asc') {
  return function innerSort(a, b) {
    const varA = (typeof a[key] === 'string')
      ? a[key].toUpperCase() : a[key];
    const varB = (typeof b[key] === 'string')
      ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return (
      (order === 'desc') ? (comparison * -1) : comparison
    );
  };
}
//this sorts by most upvoted
function compareValues(order = 'desc') {
  return function innerSort(a, b) {
    let key = 3;

    const varA = (typeof a[key] === 'string')
      ? a[key].toUpperCase() : a[key];
    const varB = (typeof b[key] === 'string')
      ? b[key].toUpperCase() : b[key];
    let comparison = 0;
		if (varA.length > varB.length) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return (
      (order === 'desc') ? (comparison * -1) : comparison
    );
  };
}

//this decodes strings from the mySql datablse into arrays
function strToArr(oldString){
	//console.log(oldString)
	if (oldString !== null){
		var newArr = [];
		var toPush = "";
		for (i = 1; i < oldString.length; i++){
			if(oldString.charAt(i) == "ᙍ"){	
				var toSend = "";
				var notfound = true;
				var numNested = 0;
				while(notfound){
					if (oldString.charAt(i) == "ᙊ"){
						numNested = numNested -1;
						toSend = toSend + oldString.charAt(i);
						if(numNested == 0){
							//toSend = toSend + "]";
							const keyI = i;
							toPush = strToArr(toSend)
							newArr.push(toPush)
							i = keyI
							toPush = "";
							notfound = false;
						}else{
							//toSend = toSend + oldString.charAt(i);
						}
					}else if (oldString.charAt(i) == "ᙍ"){
						numNested++;
						toSend = toSend + oldString.charAt(i);	
					}else if(oldString.charAt(i) == "ᗵ"||oldString.charAt(i) == "ᙊ") {
						//yo
					} else{
						toSend = toSend + oldString.charAt(i);
					}

					i++;
					
				}
				
			} else if (oldString.charAt(i) == "෴") {
				newArr.push(toPush)
				
				toPush = "";
			} else if(oldString.charAt(i) == "ᗵ"||oldString.charAt(i) == "ᙊ") {
				//yo
			} else {
				toPush = toPush + oldString.charAt(i)
			}
		}
		if(toPush !== ''){
			newArr.push(toPush)
			toPush = "";
		}
		
		return newArr;
			
	}else{
		const empty= [];
		return empty
	}
}
//this encodes strings from the mySql datablse into arrays
function arrToStr(oldArr){
	//console.log(oldArr);
	if(oldArr == null || oldArr.length ==0){
		return null;
	}else{

		
		var newStr = "ᙍ"
		for (i = 0; i < oldArr.length; i++) {
			if (typeof oldArr[i] == "string"){
				
				newStr += "ᗵ" +oldArr[i]+"ᗵ෴";
			}else	if (typeof oldArr[i] == "number"){
				
				newStr += oldArr[i]+"෴";
			}else{
				const keyI = i;
				newStr +=arrToStr(oldArr[i])+"෴";
				i = keyI
			}
				
		}
		newStr = newStr.slice(0, newStr.length - 1)
		newStr += "ᙊ";
		return newStr;
	}
}


function strToArrOld(oldString){
	console.log(oldString)
	if (oldString !== null){
		var newArr = [];
		var toPush = "";
		for (i = 1; i < oldString.length; i++){
			if(oldString.charAt(i) == "["){	
				var toSend = "";
				var notfound = true;
				var numNested = 0;
				while(notfound){
					if (oldString.charAt(i) == "]"){
						numNested = numNested -1;
						toSend = toSend + oldString.charAt(i);
						if(numNested == 0){
							//toSend = toSend + "]";
							const keyI = i;
							toPush = strToArrOld(toSend)
							newArr.push(toPush)
							i = keyI
							toPush = "";
							notfound = false;
						}else{
							//toSend = toSend + oldString.charAt(i);
						}
					}else if (oldString.charAt(i) == "["){
						numNested++;
						toSend = toSend + oldString.charAt(i);	
					}else if(oldString.charAt(i) == "'"||oldString.charAt(i) == "]"||oldString.charAt(i) == '"') {
						//yo
					} else{
						toSend = toSend + oldString.charAt(i);
					}

					i++;
					
				}
				
			} else if (oldString.charAt(i) == ",") {
				newArr.push(toPush)
				
				toPush = "";
			} else if(oldString.charAt(i) == "'"||oldString.charAt(i) == "]"||oldString.charAt(i) == '"') {
				//yo
			} else {
				toPush = toPush + oldString.charAt(i)
			}
		}
		if(toPush !== ''){
			newArr.push(toPush)
			toPush = "";
		}
		
		return newArr;
			
	}else{
		const empty= [];
		return empty
	}
}


var smtpConfig = {
    service:"gmail",
    auth: {
        user: 'dumax315@gmail.com',
        pass: process.env['emailpass']
    }
};
var transporter = nodemailer.createTransport(smtpConfig);
transporter.use('compile', pugEngine({
	templateDir: __dirname + '/emails'
}));


function sendResponseEmail(sendto,commentOrPost,link,thecomment) {
	console.log(sendto);
	var mailOptions = {
		from: 'QuestionConnection@email.com',
		to: sendto,
		subject:'Someone responded to your '+commentOrPost+' on Qustion Connection.',
		template: 'test',   // defines the template to compile for the email
		ctx: {
			commentOrPost:commentOrPost,
			thecomment:thecomment,
			link:link
		}
	};

	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}


const app = express();
app.set('views', './views')
app.set('view engine', 'pug')
app.use(session({
  cookieName: 'session',
  secret: 'eg[isfd-8yF9-7w2315df{}+Ijsli;;to8',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly: true,
  secure: true,
  ephemeral: true
}));

app.use(function(req, res, next) {
  if (req.session && req.session.user) {
		login(req.session.user.id,function(err, userinfo) {
			if (err) {
				console.log(err);
				console.log("user doesn't egist")
				// Do something with your error...
			} else if (userinfo == []){
				console.log("user doesn't egist")
			} else {
				//gives id to session cookie
				req.user = userinfo[0];
				req.session.user = userinfo[0];  //refresh the session value
				res.locals.user = userinfo[0];
				
			}
		});			
		
		
		next();
  } else {
    next();
  }
});

var con = mysql.createPool({
  host: "remotemysql.com",
  user: "9DMClKlmNb",
  password:process.env['sqlpass'],
	database: "9DMClKlmNb"
});



// Attempt to catch disconnects 
con.on('connection', function (connection) {
  console.log('DB Connection established');

  connection.on('error', function (err) {
    console.error(new Date(), 'MySQL error', err.code);
  });
  connection.on('close', function (err) {
    console.error(new Date(), 'MySQL close', err);
  });

});



con.query("SELECT * FROM users", function (err, result, fields) {
	console.log(result);
});
con.query("SELECT * FROM schools", function (err, result, fields) {
	console.log(result);
});
con.query("SELECT * FROM WSHSclasses", function (err, result, fields) {
	console.log(result);
});
/*
con.query("SELECT * FROM WSHSAPWHposts", function (err, result, fields) {
	console.log(result);
});
*/

//checks to see if username is taken
function getUsedNames(tryName,callback) {
	//var sql = "INSERT INTO users (username,email, id) VALUES ('Theology', 'theomhalpern@gmail.com', '116743678376729095372')";
	var sql = "SELECT username FROM users WHERE username = ?;"
  con.query(sql,tryName, function (err, result) {
		//console.log(result[0].username)
		if (err) {
			callback(err, null);
		} else 
			callback(null, result);
  });
}

//gets all data form the school table
function getSchools(callback) {
	con.query("SELECT * FROM schools", function (err, result, fields) {
		if(err){
			callback(err,null)
		}else{
			callback(null, result);
		}
		
	});
}

function getClasses(school,callback) {
	var sql = "SELECT * FROM " +school;
	con.query(sql, function (err, result, fields) {
		if(err){
			callback(err,null)
		}else{
			callback(null, result);
		}
		
	});
}
function fetchTheData(school){
	
}
async function getSClasses(school,callback) {
	return new Promise(function(resolve, reject){
		var sql = "SELECT * FROM " +school;
		con.query(sql, function (err, result, fields) {
			if(err){
				reject(err);
			}
			else{
				resolve(result);
			}
		});
	}).then(value => {
		return value; // 42
	}).catch(function onRejected() {
		err.message; // 'Oops!'
	});;
}

function getPosts(school,sort,callback) {
	var toSort;
	if (typeof sort == "undefined"){
		toSort = "id DESC";
	}else if (sort == "new"){
		toSort = "id DESC";
	}else if (sort == "old"){
		toSort = "id";
	}else if (sort == "upVotes"){
		toSort = "score DESC";
	}
	var sql = "SELECT * FROM " +school +" ORDER BY "+ toSort;
	con.query(sql, function (err, result, fields) {
		if(err){
			callback(err,null)
		}else{
			callback(null, result);
		}
		
	});
}

function getPost(schoolclass,id,callback) {
	//var sql = "INSERT INTO users (username,email, id) VALUES ('Theology', 'theomhalpern@gmail.com', '116743678376729095372')";
	var sqll = "SELECT * FROM "+schoolclass + "posts"+" WHERE id = ?;"
	const sql = sqll;
  con.query(sql,[id], function (err, result) {
		if (err) {
			callback(err, null);
		} else 
			callback(null, result[0]);
  });
}

function login(id,callback) {
	//var sql = "INSERT INTO users (username,email, id) VALUES ('Theology', 'theomhalpern@gmail.com', '116743678376729095372')";
	var sql = "SELECT * FROM users WHERE id = ?;"
  con.query(sql,[id], function (err, result) {
		if (err) {
			callback(err, null);
		} else 
			callback(null, result);
  });
}
function createNewAccount(username,id,email,grade,school,callback) {
	console.log(username,id,email,grade,school)
	//var sql = "INSERT INTO users (username,email, id) VALUES ('Theology', 'theomhalpern@gmail.com', '116743678376729095372')";
	var sql = "SELECT username FROM users WHERE id = ?;"
  con.query(sql,[id], function (err, result) {
		console.log("res = " +result)
		if (err) {
			callback(err, null);
		} else if (!Array.isArray(result) || !result.length) {
			// array does not exist, is not an array, or is empty
			// ⇒ do not attempt to process array
			console.log("2")
			sql = "SELECT username FROM users WHERE username = ?;"
			con.query(sql,[username], function (err, result) {
				console.log(result)
				if (err) {
					callback(err, null);
				} else if (!Array.isArray(result) || !result.length) {
					console.log("3")
					sql = "INSERT INTO users (username, id, email, grade, school) VALUES (?,?,?,?,?)";
					con.query(sql,[username,id,email,grade,school], function (err, result) {
						console.log("1 record incerted");
						console.log(result)
					});
					
				} else{
					callback("uTaken", null);
				}
			});
			
		} else {
			callback("exist", null);
		}
  });

}

async function verify(token) {
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "985596922523-tr74rdm03hj1mh6tg2hpmnirvcrm4v14.apps.googleusercontent.com",  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  const userid = payload['sub'];
  const email = payload['email']
  console.log('User ID: ' + userid);
  console.log('Email: ' + email);
	const resultarr = await Promise.resolve([userid, email]);
	return resultarr;
	console.log(resultarr)
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
}
//verify().catch(console.error);


app.use(express.urlencoded());

app.get('/', (req, res) => {
	getSchools(function(err, listOfSchools) {
		if(err){
			console.log(err)
		}else{
			if (typeof req.session.user == "object") {
				res.render('index', { username: req.session.user.username, location: "QuestionConnection/", logedin:true,schools: listOfSchools});
				
			} else {
				res.render('index', {location: "QuestionConnection/", logedin:false, schools: listOfSchools})

			}
		}
	});
	
		//res.redirect('/account/'+token);
});
app.get('/login', (req, res) => {
	res.render('login', {location: "QuestionConnection/Login"});
});

app.get('/signout', (req, res) => {
	req.session.user = "signotut";
	delete req.session.user; 
	res.sendFile(__dirname + '/signout.html');
		//res.redirect('/account/'+token);
});

app.get('/s/:school', function (req, res) {
	let tblname= req.params.school +"classes";
	const plswork = tblname;
	try{
		getClasses(plswork, function(err, listOfClasses) {
			if(err){
				console.log(err)
				res.render('error',{error:"404 not found",location:"QustionConnection/ERROR"})
			}else{
				console.log(listOfClasses)
				if (typeof req.session.user == "object") {
					res.render('classes', {favClasses:req.session.user.favClasses, username: req.session.user.username, location: "QC/" + req.params.school, logedin:true,classes: listOfClasses, school:req.params.school});
					
				} else {
					res.render('classes', {location: "QC/" + req.params.school, logedin:false,classes: listOfClasses,school:req.params.school});

				}
			}
		});
	}catch{
		res.render('error',{error:"404 not found",location:"QustionConnection/ERROR"})
	}
})

app.get('/s/:school/c/:class', function (req, res) {
	console.log(req.query.sort)
  let tblname= req.params.school +req.params.class +"posts";
	const plswork = tblname;
	getPosts(plswork, req.query.sort, function(err, listOfPosts) {
		
		if(err){
			console.log(err)
			res.render('error',{error:"404 not found",location:"QustionConnection/ERROR"})
		}else{
			var sql = "SELECT * FROM " +req.params.school+"classes WHERE sName = ?";
			con.query(sql,[req.params.class], function (err, result, fields) {
				if(err){
					console.log(err)
					res.render('error',{error:"404 not found",location:"QustionConnection/ERROR"})
				}else{
					console.log(listOfPosts)
					if (typeof req.session.user == "object") {
						res.render('posts', { username: req.session.user.username, location: "QC/" + req.params.school + "/"+req.params.class, logedin:true,posts: listOfPosts, school:req.params.school,classs:req.params.class,sort:req.query.sort,clas:result[0],favClasses:req.session.user.favClasses});
						
					} else {
						res.render('posts', {location: "QC/" + req.params.school + "/"+req.params.class, logedin:false,posts: listOfPosts, school:req.params.school,classs:req.params.class,sort:req.query.sort,clas:result[0]});

					}
				}
				
			});
		}
	});
})

app.get('/s/:school/c/:class/p/:postId', function (req, res)  {	
	try{
		let tblname= req.params.school +req.params.class;
		const plswork = tblname;
		const idToSend = req.params.postId;

		getPost(plswork, idToSend, function(err, thePost) {
			if(err){
				console.log(err)
			}else{
				try{
					console.log(thePost.flair)
					let commentsssss=strToArr(thePost.comments)
					
					if (typeof req.query.sort == "undefined"){
						commentsssss.sort(compareValues())
					}else if (req.query.sort == "new"){
						commentsssss.sort(compareNumbers(5, 'desc'));
					}else if (req.query.sort == "old"){
						commentsssss.sort(compareNumbers(5));
					}else if (req.query.sort == "upVotes"){
						commentsssss.sort(compareValues())
					}
					for(i = 0; i < commentsssss.length; i++) {
						if(commentsssss[i][4] == "ans"){
							commentsssss.unshift(commentsssss.splice(i, 1)[0]);
						}
					}
					
					if (typeof req.session.user == "object") {
						res.render('post', { username: req.session.user.username, location: "QC/" + req.params.school + "/"+req.params.class+"/"+thePost.title, logedin:true,post: thePost, comments:commentsssss, school:req.params.school,classs:req.params.class,idSent:idToSend,sort:req.query.sort});
						
					} else {
						res.render('post', { location: "QC/" + req.params.school + "/"+req.params.class+"/"+thePost.title, logedin:false,post: thePost, comments:commentsssss, school:req.params.school,classs:req.params.class,idSent:idToSend,sort:req.query.sort});

					}
				}catch(err) {
					console.log(err)
					res.render('error',{error:"404 not found",location:"QustionConnection/ERROR"})
				}
			}
		});
		
	}catch(err) {
		res.render('error',{error:"404 not found",location:"QustionConnection/ERROR"})
	}
})


app.get('/home', function (req, res)  {	
	try{
		if (typeof req.session.user == "object") {
			con.query("SELECT favClasses FROM users WHERE id = ?",[req.session.user.id],async function (err, result, fields) {
				if(err){
					console.log(err)
					res.render('error', {error:err});
				}else{
					var favClasses = strToArr(result[0].favClasses);
					console.log(favClasses);
					var schoolsToGet = [];

					for (i = 0; i < favClasses.length; i++) {
						if (schoolsToGet.findIndex(e=>{if(e[0]===favClasses[i][0])return!0}) == -1){
							schoolsToGet.push([favClasses[i][0]]);
						}
						schoolsToGet[schoolsToGet.findIndex(e=>{if(e[0]===favClasses[i][0])return!0})].push(favClasses[i][1])
					}
					var classesToSend = [];
					for (i = 0; i < schoolsToGet.length; i++){
						const res = await getSClasses(schoolsToGet[i][0]+"classes");

						var listOfClasses= res
						for (j = 0; j < listOfClasses.length; j++){

							if(schoolsToGet[i].includes(listOfClasses[j].sName)){
								classesToSend.push(listOfClasses[j])
							}
						}
						
					}
					console.log("calsses to send")
					console.log(classesToSend);
					console.log(schoolsToGet);
					con.query("SELECT * FROM schools WHERE sName = ?",req.session.user.school, function (err, result, fields) {
						if(err){
							console.log(err)
							res.render('error', {error:err});
						}else{
							console.log(result)
							res.render('home', { username: req.session.user.username, location: "QuestionConnection/home", logedin:true,classes: classesToSend, school:favClasses,favClasses:req.session.user.favClasses, userSchool:result[0]});
						}
					});				
				}	
			});	
		} else {
			console.log("no user loged in")
			res.redirect("/");
		}
	}
  catch(err) {
		console.log(err)
		res.render('error', {error:err});
	}
	
});

app.post('/newclass', (req, res) => {
	try{
		if (typeof req.session.user == "object") {
			if (/[A-Za-z0-9]{1,10}/.test(req.body.sName)){
				var sql = "CREATE TABLE "+req.body.school+req.body.sName+"posts"+" (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), body TEXT(4080), poster VARCHAR(255), comments TEXT(16320), flair VARCHAR(255),score INT,usersUpvoted TEXT(4080))";
				con.query(sql, function (err, result) {
					if(err){
						console.log(err)
						res.render('error', {error:err});
					} else{
						console.log(result);
						//adding info
						var sqlt = "INSERT INTO "+ req.body.school+"classes" +" (name, teacher, description, sName) VALUES (?,?,?,?)";
						console.log(sqlt)
						const sql = sqlt;
						console.log([req.body.name,req.body.teacher,req.body.description,req.body.sName]);
						con.query(sql,[req.body.name,req.body.teacher,req.body.description,req.body.sName], function (err, result) {
							if(err) {
								console.log(err)
								res.render('error', {error:err});
							}else{
								console.log(result);
								res.redirect("/s/"+req.body.school)
							}
							
						});
						
					}
				});
			
				
			}else {
				console.log(err)
				res.render('error', {error:"Short name invaled: Some Special Characters And Spaces Are Not Allowed and it must be below 10 characters"});
			}
			
			
		} else {
			console.log(err)
			res.render('error', {error:"No user loged in"});
		}
	}
  catch(err) {
		console.log(err)
		res.render('error', {error:err});
	}
})

app.post('/newpost', (req, res) => {
  try{
		if (typeof req.session.user == "object") {
				//adding info
			var sqlt = "INSERT INTO "+ req.body.school+ req.body.classs+"posts" +" (title, body, poster, score) VALUES (?,?,?,?)";
			console.log(sqlt)
			const sql = sqlt;
			con.query(sql,[req.body.title,req.body.body,req.session.user.username,0], function (err, result) {
				if(err) {
					console.log(err)
					res.render('error', {error:err});
				}else{
					res.redirect("/s/"+req.body.school+"/c/"+req.body.classs)
				}
			});
			
		} else {
			console.log(err)
			res.render('error', {error:"No user loged in"});
		}
	}
  catch(err) {
		console.log(err)
		res.render('error', {error:err});
	}
})

function commentWithNew(oldArr,commentId,inputArr) {
	console.log("look here")
	console.log(oldArr)
	console.log(commentId)
	console.log(inputArr)
	var keytoarr = [];
	if(commentId.length == 2){
		for (j = 0; j < oldArr.length; j++) {		
			if (oldArr[j][5] == commentId[1]){
				var idnum = 0;
				if(typeof oldArr[j][6] == "object") {
					idnum = parseInt(oldArr[j][6][oldArr[j][6].length-1][5]) + 1 
					inputArr.push(idnum.toString())
					oldArr[j][6].push(inputArr);		
				} else{
					inputArr.push(idnum.toString())
					oldArr[j].push([]);
					oldArr[j][6].push(inputArr);		
				}
				console.table(oldArr)
				return oldArr;
			}
		}
	} else{
		for (j = 0; j < oldArr.length; j++) {		
			if (oldArr[j][5] == commentId[1]){
				var sendId = commentId;
				sendId.shift();
				var res = commentWithNew(oldArr[j][6],sendId,inputArr)
				oldArr[j].push(res);
				console.table(oldArr)
				return oldArr;
			}
		}
	}
}

app.post('/newcomment', (req, res) => {
	console.log(req.body.idee)
  try{
		if (typeof req.session.user == "object") {
				//adding info
			var sqll = "SELECT comments, poster FROM "+ req.body.school+ req.body.classs+"posts"+" WHERE id = "+req.body.idee.toString();
			console.log(sqll)
			const sql = sqll;
			con.query(sql,function (err, result, fields) {
				if(err){
					console.log(err)
				}else{
					var sqlt = "Update "+ req.body.school+ req.body.classs+"posts" +" SET comments = ? WHERE id = "+req.body.idee.toString();
					const sq = sqlt;
					//finding the place to put the comment
					if (typeof req.body.commentId == 'undefined') {
						
						var genArr = strToArr(result[0].comments);
						var idnum = 0
						console.log("gettingIdnum")
						console.table(genArr)
						console.log(genArr[genArr.length-1])
						if(typeof genArr[genArr.length-1] == "object") {
							idnum = parseInt(genArr[genArr.length-1][5]) + 1 
						}
						genArr.push([req.body.title,req.body.body,req.session.user.username,"","flair",idnum.toString()])
						console.log("here?")
						console.log(genArr)
						var generateString = arrToStr(genArr);


						con.query(sq,generateString, function (err, result1) {
							if(err) {
								console.log(err)
								res.render('error', {error:err});
							}else{
								
								res.redirect("/s/"+req.body.school+"/c/"+req.body.classs+"/p/"+req.body.idee)
								console.log(result[0].poster)
								con.query("SELECT email,settings FROM users WHERE username = ?",[result[0].poster], function (err, result2) {
									if(err) {
										console.log(err)
									}else{
										console.log(result2)
										sendResponseEmail(result2[0].email,"post","https://schoolathome.theohalpern.repl.co/s/"+req.body.school+"/c/"+req.body.classs+"/p/"+req.body.idee,[req.body.title,req.body.body,req.session.user.username,"","flair",idnum.toString()]);
									}
								});
								
							}
						});
						
					}else{

						const commentId = strToArrOld(req.body.commentId);
						console.log("look at me:")
						console.log(commentId)
						
						var resCom = strToArr(result[0].comments);
						var keytoarr = [];
						console.log("commentId.flat(3)")
						console.log(commentId.flat(3))

						resCom = commentWithNew(resCom,commentId.flat(3),[req.body.title,req.body.body,req.session.user.username,"","flair"])
						console.log("this is the array were are sending to the database")
						console.log(resCom)
						var generateString = arrToStr(resCom);
						con.query(sq,generateString, function (err, result1) {
							if(err) {
								console.log(err)
								res.render('error', {error:err});
							}else{
								var sendTo;
								var toSend;
								for(i = 0; i < resCom.length; i++){
									if(commentId.flat(3)[1] == resCom[i][5]){
										sendTo = resCom[i][2];
										toSend = resCom[i];
									}
								}
								res.redirect("/s/"+req.body.school+"/c/"+req.body.classs+"/p/"+req.body.idee)
								con.query("SELECT email,settings FROM users WHERE username = ?",[result[0].poster], function (err, result2, fields) {
									if(err) {
										console.log(err)
									}else{
										sendResponseEmail(result2[0].email,"post",[req.body.title,req.body.body,req.session.user.username,"","flair"],"https://schoolathome.theohalpern.repl.co/s/"+req.body.school+"/c/"+req.body.classs+"/p/"+req.body.idee,toSend);
									}
								});
								
								con.query("SELECT email,settings FROM users WHERE username = ?",[sendTo], function (err, result2, fields) {
									if(err) {
										console.log(err)
									}else{
										sendResponseEmail(result2[0].email,"comment",[req.body.title,req.body.body,req.session.user.username,"","flair"],"https://schoolathome.theohalpern.repl.co/s/"+req.body.school+"/c/"+req.body.classs+"/p/"+req.body.idee,toSend);
									}
								});
							}
						});
					}
					
					
				}
				
			});
		} else {
			//console.log(err)
			res.render('error', {error:"No user loged in"});
		}
	}
  catch(err) {
		console.log(err)
		res.render('error', {error:err});
	}
})

app.post('/loginenter', async (req, res) => {
  //var resultarr = await verify(req.body.idtoken).catch(console.error);	
  try {
    let resultarr = await verify(req.body.idtoken);
		login(resultarr[0],function(err, userinfo) {
			if (err) {
				console.log(err);
				console.log("user doesn't egist")
				return res.send(userinfo);
				// Do something with your error...
			} else if (userinfo == []){
				console.log("user doesn't egist")
				return res.send(userinfo);
			} else {
				//gives id to session cookie
				req.session.user = userinfo[0];
				return res.send('https://schoolathome.theohalpern.repl.co/');
				
			}
		});
    
  } catch(error) {
    // handling error
    console.log(error);
    return res.send([])
	}

});

//the code to change the comment list back end when someone astemps an upvote
app.post('/s/:school/c/:class/p/:postId/upVoteComment', (req, res) => {
	console.log(req.session.user)	
  console.log(req.body.postId)
	console.log(req.params)
	try{
		if (typeof req.session.user == "object") {
			var sqlt = "SELECT comments FROM "+ req.params.school+ req.params.class+"posts" +"  WHERE id = ?";
			const sql = sqlt;
			con.query(sql,[req.body.postId], function (err, result) {
			
				if(err) {
					console.log(err)
					res.render('error', {error:err});
				}else{
					console.log(result[0].comments)
					console.log(strToArr(result[0].comments))
					var arrayedComs = strToArr(result[0].comments);
					var pathToComment = req.body.commentID.split(',')
					console.log(pathToComment)
					//var usUp = strToArr(result[0].usersUpvoted)
					
					for(i = 0; i < arrayedComs.length; i++) {
						if (pathToComment[1] == arrayedComs[i][5]){
							console.log(arrayedComs[i])
							//is the comment 1 or 2 levels deep
							if( pathToComment.length == 3){
								for(j = 0; j < arrayedComs[i][6].length; j++) {
									if (pathToComment[2] == arrayedComs[i][6][j][5]){
										console.log(arrayedComs[i][6][j])
										if (arrayedComs[i][6][j][3].length == 0 || arrayedComs[i][6][j][3] == "0"|| arrayedComs[i][6][j][3] == "null"){
											arrayedComs[i][6][j][3] = arrToStr([req.session.user.username]);
										}else{	
											var usUp = arrayedComs[i][6][j][3]			
											if (usUp.includes(req.session.user.username)) {
												const index = usUp.indexOf(req.session.user.username);
												if (index > -1) {
													usUp.splice(index, 1);
												}
												console.log(usUp)
												if (usUp.length == 0){
													usUp = "";
												}
												arrayedComs[i][6][j][3] = usUp;
												console.log(arrayedComs[i][6][j][3])
											}else{
												usUp.push(req.session.user.username)
												console.log(usUp)
												arrayedComs[i][6][j][3] =usUp;
											}
										}
										break;
									}
								}
							}else{
								if (arrayedComs[i][3].length == 0 || arrayedComs[i][3] == "0"|| arrayedComs[i][3] == "null"){
									arrayedComs[i][3] = arrToStr([req.session.user.username]);
								}else{	
									var usUp = arrayedComs[i][3];				
									if (usUp.includes(req.session.user.username)) {
										const index = usUp.indexOf(req.session.user.username);
										if (index > -1) {
											usUp.splice(index, 1);
										}
										console.log(usUp)
										if (usUp.length == 0){
											usUp = "";
										}
										arrayedComs[i][3] = usUp;
										console.log(arrayedComs[i][3])
									}else{
										usUp.push(req.session.user.username)
										console.log(usUp)
										
										arrayedComs[i][3] = usUp;
									}
								}
								break;
							}
						}
					}
					var commentsToSend = arrToStr(arrayedComs);
					var sqlt = "UPDATE "+ req.params.school+ req.params.class+"posts" +" SET comments = ? WHERE id = ?";
					const sql = sqlt;
					con.query(sql,[commentsToSend, req.body.postId], function (err, result) {
						if(err) {
							console.log(err)
							res.render('error', {error:err});
						}else{
							res.send("suc")
						}
					});
				}
			});
			
			
		} else {
			console.log("No user loged in")
			res.send("No user loged in");
		}
	}
  catch(err) {
		console.log(err)
		res.render('error', {error:err});
	}
});

//the code to change the comment list and post flair back end the poster trys to mark a comment as the answer
app.post('/s/:school/c/:class/p/:postId/markAns', (req, res) => {
	console.log(req.session.user)	
  console.log(req.body.postId)
	console.log(req.params)
	try{
		if (typeof req.session.user == "object") {
			var sqlt = "SELECT comments, poster, flair FROM "+ req.params.school+ req.params.class+"posts" +"  WHERE id = ?";
			const sql = sqlt;
			con.query(sql,[req.body.postId], function (err, result) {
			
				if(err) {
					console.log(err)
					res.render('error', {error:err});
				}else{
					if(req.session.user.username == result[0].poster){
						var arrayedComs = strToArr(result[0].comments);
						var pathToComment = req.body.commentID.split(',')
						console.log(pathToComment)
						//var usUp = strToArr(result[0].usersUpvoted)
						var addingOrSub = false;
						for(i = 0; i < arrayedComs.length; i++) {
							if (pathToComment[1] == arrayedComs[i][5]){
								console.log(arrayedComs[i])
								//is the comment 1 or 2 levels deep
								
								if (arrayedComs[i][4] !== "ans"){
									arrayedComs[i][4] = "ans";
								}else{	
									arrayedComs[i][4] = "flair";
									addingOrSub = true;
								}
								break;
							}
						}
						
						var flairToSend = "flair";
						if(result[0].flair !== "ans"){
							if(!addingOrSub){
								flairToSend = "ans"
							}
						}else{
							for(i = 0; i < arrayedComs.length; i++) {
								if(arrayedComs[i][4] == "ans"){
									var flairToSend = "ans";
								}
							}

						}
						var commentsToSend = arrToStr(arrayedComs);
						var sqlt = "UPDATE "+ req.params.school+ req.params.class+"posts" +" SET comments = ?, flair = ? WHERE id = ?";
						const sql = sqlt;
						con.query(sql,[commentsToSend,flairToSend, req.body.postId], function (err, result) {
							if(err) {
								console.log(err)
								res.render('error', {error:err});
							}else{
								res.send("suc")
							}
						});
					}

				}
			});	
		} else {
			console.log("No user loged in")
			res.send("No user loged in");
		}
	}
  catch(err) {
		console.log(err)
		res.render('error', {error:err});
	}
});

//backend to delet a comment
app.post('/s/:school/c/:class/p/:postId/delComment', (req, res) => {
	try{
		if (typeof req.session.user == "object") {
			var sqlt = "SELECT comments FROM "+ req.params.school+ req.params.class+"posts" +"  WHERE id = ?";
			const sql = sqlt;
			con.query(sql,[req.body.postId], function (err, result) {
				if(err) {
					console.log(err)
					res.render('error', {error:err});
				}else{
					var arrayedComs = strToArr(result[0].comments);
					var pathToComment = req.body.commentID.split(',')
					for(i = 0; i < arrayedComs.length; i++) {
						if (pathToComment[1] == arrayedComs[i][5]){
							//is the comment 1 or 2 levels deep
							if( pathToComment.length == 3){
								for(j = 0; j < arrayedComs[i][6].length; j++) {
									if (pathToComment[2] == arrayedComs[i][6][j][5]){
										if(arrayedComs[i][6][j][2]==req.session.user.username){
											arrayedComs[i][6].splice(j,1);
										}
										
										
										break;
									}
								}
							}else{
								if(arrayedComs[i][2]==req.session.user.username){
									arrayedComs.splice(i,1);
									break;
								}
								
							}
						}
					}
					var commentsToSend = arrToStr(arrayedComs);
					var sqlt = "UPDATE "+ req.params.school+ req.params.class+"posts" +" SET comments = ? WHERE id = ?";
					const sql = sqlt;
					con.query(sql,[commentsToSend, req.body.postId], function (err, result) {
						if(err) {
							console.log(err)
							res.render('error', {error:err});
						}else{
							res.send("suc")
						}
					});
				}
			});	
		} else {
			console.log("No user loged in")
			res.send("No user loged in");
		}
	}
  catch(err) {
		console.log(err)
		res.render('error', {error:err});
	}
});

app.post('/s/:school/c/:class/upVotePost/', (req, res) => {
	try{
		if (typeof req.session.user == "object") {
			var sqlt = "SELECT score, usersUpvoted FROM "+ req.params.school+ req.params.class+"posts" +"  WHERE id = ?";
			const sql = sqlt;
			con.query(sql,[req.body.postId], function (err, result) {
			
				if(err) {
					console.log(err)
					res.render('error', {error:err});
				}else{
					var scoreToSet;
					var usersUpvotedToSet;
					if (typeof result[0].usersUpvoted == "string"){
						var usUp = strToArr(result[0].usersUpvoted)

						if (usUp.includes(req.session.user.username)) {
							const index = usUp.indexOf(req.session.user.username);
							if (index > -1) {
								usUp.splice(index, 1);
							}
							usersUpvotedToSet = arrToStr(usUp);

							scoreToSet = result[0].score - 1;
						}else{
							usUp.push(req.session.user.username)
							usersUpvotedToSet = arrToStr(usUp);
							scoreToSet = result[0].score + 1;
						}
					}else{
						usersUpvotedToSet = arrToStr([req.session.user.username]);
						scoreToSet = 1;
					}
					var sqlt = "UPDATE "+ req.params.school+ req.params.class+"posts" +" SET score = ?, usersUpvoted = ? WHERE id = ?";
					const sql = sqlt;
					con.query(sql,[scoreToSet,usersUpvotedToSet,req.body.postId], function (err, result) {
						if(err) {
							console.log(err)
							res.render('error', {error:err});
						}else{
							res.send("suc")
						}
					});
				}
			});
			
			
		} else {
			console.log("No user loged in")
			res.send("No user loged in");
		}
	}
  catch(err) {
		console.log(err)
		res.render('error', {error:err});
	}


});


app.post('/s/:school/c/:class/delPost/', (req, res) => {
	try{
		if (typeof req.session.user == "object") {
			var sqlt = "SELECT poster FROM "+ req.params.school+ req.params.class+"posts" +"  WHERE id = ?";
			const sql = sqlt;
			con.query(sql,[req.body.postId], function (err, result) {
			
				if(err) {
					console.log(err)
					res.render('error', {error:err});
				}else{
					if(result[0].poster == req.session.user.username){
						var sqlt = "DELETE FROM "+ req.params.school+ req.params.class+"posts" +" WHERE id = ?";
						const sql = sqlt;
						con.query(sql,[req.body.postId], function (err, result) {
							if(err) {
								console.log(err)
								res.render('error', {error:err});
							}else{
								res.send("suc");
							}
						});
					}else{
						res.render('error', {error:"bro, you didn't post that"});
					}
					
				}
			});
			
			
		} else {
			console.log("No user loged in")
			res.send("No user loged in");
		}
	}
  catch(err) {
		console.log(err)
		res.render('error', {error:err});
	}


});

//this is the backend code to favorite a class it adds/subtracts the class from the users list of favorite classes
app.post('/favoriteClass/', (req, res) => {
	try{
		if (typeof req.session.user == "object") {
			var sqlt = "SELECT favClasses FROM users WHERE id = ?";
			const sql = sqlt;
			con.query(sql,[req.session.user.id], function (err, result) {
			
				if(err) {
					console.log(err)
					res.render('error', {error:err});
				}else{
					var favClaToSend;
					if (typeof result[0].favClasses !== "null"){
						favClaToSend = strToArr(result[0].favClasses);
						const index=favClaToSend.findIndex( element => {
							if (element[0] === req.body.shortSchoolName &&element[1] === req.body.shortClassName) {
								return true;
							}
						});
						if (index !== -1) {

							if (index > -1) {
								favClaToSend.splice(index, 1);
							}
							if (favClaToSend == []){
								favClaToSend = null;
							}else{
								favClaToSend = arrToStr(favClaToSend);
							}							
						}else{
							favClaToSend.push([req.body.shortSchoolName,req.body.shortClassName])
							favClaToSend = arrToStr(favClaToSend);
						}
					}else{
						favClaToSend = arrToStr([[req.body.shortSchoolName,req.body.shortClassName]]);
					}
					var sqlt = "UPDATE users SET favClasses = ? WHERE id = ?";
					const sql = sqlt;
					con.query(sql,[favClaToSend,req.session.user.id], function (err, result) {
						if(err) {
							req.session.user.favClasses = favClaToSend;
							console.log(err)
							res.render('error', {error:err});
						}else{
							res.send("suc")
						}
					});
				}
			});
			
			
		} else {
			console.log("No user loged in")
			res.send("No user loged in");
		}
	}
  catch(err) {
		console.log(err)
		res.render('error', {error:err});
	}


});


app.post('/signup', async (req, res) => {
	console.log(req)
  //var resultarr = await verify(req.body.idtoken).catch(console.error);	
	//INSERT INTO users (username, id, email, grade, school) VALUES (?,?,?,?,?)
  try {
    let resultarr = await verify(req.body.idtoken);
    console.log(resultarr)
		console.log(req.body.username)
		createNewAccount(req.body.username,resultarr[0],resultarr[1],req.body.grade,req.body.school,function(err, suc) {
			console.log(req.body.username+resultarr[1]+resultarr[0]+req.body.grade+req.body.school)
			console.log("err: "+ err)
			if (err == "exist") {
				console.log(err);
				return res.send('account already exists')
				// Do something with your error...
			} else if (err == "uTaken"){
				return res.send('username taken')
			} else {
				return res.send("suc");
			}
		});
    
  } catch(error) {
    // handling error
    console.log(error);
    return res.send("error")
	}

});

app.get('/createaccount', (req, res) => {
	con.query("SELECT * FROM schools", function (err, result, fields) {
		if(err){
			console.log(err)

		}else{
			res.render('createAccount', {location:"QustionConnection/CreateAnAccount", schools:result});
		}
	});
});
app.get('/search', (req, res) => {
	res.render('search', {location:"QustionConnection/seach"});
});
app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + '/script.js');
});
app.get('/favicon.png', (req, res) => {
  res.sendFile(__dirname + '/favicon.png');
});
app.get('/signin.js', (req, res) => {
  res.sendFile(__dirname + '/signin.js');
});
app.get('/back', (req, res) => {
  res.sendFile(__dirname + '/back.webp');
});
app.get('/style.css', (req, res) => {
  res.sendFile(__dirname + '/style.css');
});
app.get('*', function(req, res){
  res.render('error',{error:"404 not found",location:"QustionConnection/ERROR"})
});
app.listen(3000, () => {
  console.log('server started');
});