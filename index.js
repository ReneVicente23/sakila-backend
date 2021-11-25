//https://stackoverflow.com/questions/9177049/express-js-req-body-undefined

var express = require("express");
var bodyParser = require('body-parser')

var jsonParser = bodyParser.json()
//var urlencodedParser = bodyParser.urlencoded({ extended: false })

var app = express();

var surrogateKey=0;

var mysql = require('mysql');

var conn = mysql.createConnection({
   host: 'localhost',
   user: 'root',
   password: 'pass',
   database: 'sakila',
   port: 3333
});

conn.connect(
    function(err){
        if(err){
            console.log("**************ERROR*********",err);
            throw(err);
        }
        console.log("Conected")
    }
);




app.get("/", (req, res, next) => {
    res.json("{ 'message': 'sakila server online'}");
});




app.post("/tasks", jsonParser, (req, res, next) => {
    req.body.id = surrogateKey++;
    req.body.state = "pending";
    tasks.push(req.body);
    res.send("OK");
});

app.listen(3000, () => {
    console.log("Servidor HTTP funcionando");
});

app.get("/tasks", (req, res, next) => {
    res.json(tasks);
});

app.listen(3000, () => {
    console.log("Servidor HTTP funcionando");
});

app.get('/tasks/:id', function(req,res) {
    //res.send("id is set to"+req.params.id)
    res.json(tasks[req.params.id]);
});

app.put('/tasks/:id', jsonParser, function(req,res) {
        res.send("Put invoked " +req.params.id+" any body: " +req.body);
        tasks[req.params.id]=req.body;
        req.body.id = parseInt(req.params.id,10);
        req.body.state = "pending";
});

app.delete('/tasks/:id', function(req,res) {
    tasks.splice(req.params.id,1);
    res.send("delete: "+req.params.id);
});

app.put('/tasks/:id/:state', jsonParser, function(req,res) {
    if (req.params.state=="pending") {
        res.send("Put invoked " +req.params.id+" state: Completed");
        tasks[req.params.id].state="completed";
    } else {
        res.send("Put invoked " +req.params.id+" state: Pending");
        req.body.id = parseInt(req.params.id,10);
        tasks[req.params.id].state="pending";
    }
});
