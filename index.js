
const express = require('express');
const {OAuth2Client} = require('google-auth-library');
var mysql = require('mysql');
const jwt = require("jsonwebtoken")
const client = new OAuth2Client("985596922523-tr74rdm03hj1mh6tg2hpmnirvcrm4v14.apps.googleusercontent.com");
const pug = require('pug');
var session = require('client-sessions');

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

function requireLogin (req, res, next) {
  if (!req.user) {
    res.redirect('/login');
  } else {
		console.log(req.user)
    next();
  }
};
/*app.use((req, res, next) => {
	console.log(req.protocol);
	if (req.protocol== "http"){
		return res.redirect('https://' + req.headers.host + req.url);
	}
	else {
		return next();
	}
});*/

function initializeConnection(config) {
    function addDisconnectHandler(connection) {
        connection.on("error", function (error) {
            if (error instanceof Error) {
                if (error.code === "PROTOCOL_CONNECTION_LOST") {
                    console.error(error.stack);
                    console.log("Lost connection. Reconnecting...");
										
                    con = mysql.createConnection(config);
                } else if (error.fatal) {
                    throw error;
                }
            }
        });
    }

    connection = mysql.createConnection(config);

    // Add handlers.
    addDisconnectHandler(connection);

    connection.connect();
    return connection;
}

var con = initializeConnection({
  host: "remotemysql.com",
  user: "bB3Dq1wsqu",
  password: "3sAnOYv3UT",
	database: "bB3Dq1wsqu"
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

function getPosts(schoolclass,callback) {
	var sql = "SELECT * FROM " +school;
	con.query(sql, function (err, result, fields) {
		if(err){
			callback(err,null)
		}else{
			callback(null, result);
		}
		
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
				res.render('index', { username: req.session.user.username, location: "SchoolAtHome/", logedin:true,schools: listOfSchools});
				
			} else {
				res.render('index', {location: "SchoolAtHome/", logedin:false, schools: listOfSchools})

			}
		}
	});
	
		//res.redirect('/account/'+token);
});
app.get('/login', (req, res) => {
	
	res.sendFile(__dirname + '/login.html');
		//res.redirect('/account/'+token);
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
	getClasses(plswork, function(err, listOfClasses) {
		if(err){
			console.log(err)
		}else{
			console.log(listOfClasses)
			if (typeof req.session.user == "object") {
				res.render('classes', { username: req.session.user.username, location: "SAH/" + req.params.school, logedin:true,classes: listOfClasses, school:req.params.school});
				
			} else {
				res.render('classes', {location: "SAH/" + req.params.school, logedin:false,classes: listOfClasses,school:req.params.school});

			}
		}
	});
})

app.get('/s/:school/:class', function (req, res) {
  let tblname= req.params.school +req.params.class +"posts";
	const plswork = tblname;
	getClasses(plswork, function(err, listOfPosts) {
		if(err){
			console.log(err)
		}else{
			console.log(listOfPosts)
			if (typeof req.session.user == "object") {
				res.render('posts', { username: req.session.user.username, location: "SAH/" + req.params.school + "/"+req.params.class, logedin:true,posts: listOfPosts, school:req.params.school,classs:req.params.class});
				
			} else {
				res.render('posts', {location: "SAH/" + req.params.school + "/"+req.params.class, logedin:false,posts: listOfPosts, school:req.params.school,classs:req.params.class});

			}
		}
	});
})

app.get('/s/:school/:class/:postId', function (req, res)  {
  res.render(req.params)
})

app.post('/newclass', (req, res) => {
	try{
		if (typeof req.session.user == "object") {
			if (/[A-Za-z0-9]{1,10}/.test(req.body.sName)){
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
						var sql = "CREATE TABLE "+req.body.school+req.body.sName+"posts"+" (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), body TEXT(4080), poster VARCHAR(255), comments TEXT(16320), flair VARCHAR(255))";
						con.query(sql, function (err, result) {
							if(err){
								console.log(err)
								res.render('error', {error:err});
							} else{
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
  res.render('error', {error:req.body.title});
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

app.post('/signup', async (req, res) => {
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
				return res.sendfile(__dirname + '/login.html');
			}
		});
    
  } catch(error) {
    // handling error
    console.log(error);
    return res.send("error")
	}

});

app.get('/createaccount', (req, res) => {
  res.sendFile(__dirname + '/createAccount.html');
});
app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + '/script.js');
});
app.get('/style.css', (req, res) => {
  res.sendFile(__dirname + '/style.css');
});

app.listen(3000, () => {
  console.log('server started');
});


  

