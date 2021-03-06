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
let List=[];

app.get("/", (req, res, next) => {
    res.json("{ 'message': 'sakila server online'}");
});

//peliculas por country australia id 8, canada id 20
app.get("/movies/:id", jsonParser, (req, res, next) => {
    const id= req.params.id;
    const sql= "SELECT film_id, title from film "+ 
	"WHERE film_id In(SELECT film_id from inventory "+ 
		"WHERE store_id in(SELECT store_id from store "+ 
			"WHERE address_id in(SELECT address_id from address "+
				"WHERE city_id in(SELECT city_id from city "+
					"WHERE country_id =" +id+ "))));";
    conn.query(sql,function(err,result){
        if(err) throw err;
         //console.log("Result "+result);
        res.json(result);
    }); 
});

//peliculas por country 10 estrenos
app.get("/movies/:id/top", jsonParser, (req, res, next) => {
    const id= req.params.id;
    const sql= "SELECT film_id, title from film "+
	"WHERE film_id In(SELECT film_id from inventory "+
		"WHERE store_id in(SELECT store_id from store "+
			"WHERE address_id in(SELECT address_id from address "+
				"WHERE city_id in(SELECT city_id from city "+
					"WHERE country_id = "+id+")))) "+				
					"ORDER BY release_year DESC " +
					"LIMIT 10;";
    conn.query(sql,function(err,result){
        if(err) throw err;
        res.json(result);
    }); 
});

//busqueda peliculas por nombre de pelicula
app.get("/movies/:id/search/:film", jsonParser, (req, res, next) => {
    const id= req.params.id;
    const film=req.params.film;
    const sql= "SELECT film_id, title from film "+ 
	"WHERE film_id In(SELECT film_id from inventory "+
		"WHERE store_id in(SELECT store_id from store "+
			"WHERE address_id in(SELECT address_id from address "+
				"WHERE city_id in(SELECT city_id from city "+
					"WHERE country_id = "+id+")))) "+
				"AND UPPER(title) like ('"+film+"');";
    conn.query(sql,function(err,result){
        if(err) throw err;
        res.json(result);
    }); 
});

//busqueda peliculas por actor
app.get("/movies/:id/search/:name/:lastname", jsonParser, (req, res, next) => {
    const id= req.params.id;
    const name=req.params.name;
    const lastname=req.params.lastname;
    const sql= "SELECT film_id, title from film "+
	"WHERE film_id In(SELECT film_id from inventory "+
		"WHERE store_id in(SELECT store_id from store "+
			"WHERE address_id in(SELECT address_id from address "+
				"WHERE city_id in(SELECT city_id from city "+
					"WHERE country_id =  "+id+")))) "+
				"AND film_id IN(SELECT film_id "+
                   "FROM film_actor "+
                   "WHERE actor_id IN(SELECT actor_id "+
                   "FROM actor "+
                   "WHERE first_name LIKE('"+name+"') AND last_name LIKE('"+lastname+"')));";
    conn.query(sql,function(err,result){
        if(err) throw err;
        res.json(result);
    }); 
});

//cantidad de stock total(validacion de disponibilidad) por country
app.get("/movies/:id/available", jsonParser, (req, res, next) => {
    const id= req.params.id;
    const sql= "SELECT film_id, COUNT(*) from inventory "+
	"WHERE store_id in(SELECT store_id from store "+
			"WHERE address_id in(SELECT address_id from address "+
				"WHERE city_id in(SELECT city_id from city "+
					"WHERE country_id = "+id+"))) "+
	"GROUP by film_id;";
    conn.query(sql,function(err,result){
        if(err) throw err;
        res.json(result);
    }); 
});

//cantidad de stock de 1 pelicula(validacion de disponibilidad) por country
app.get("/movies/:id/available/:film_id", jsonParser, (req, res, next) => {
    const id= req.params.id;
    const fid= req.params.film_id;
    const sql= "SELECT film_id, COUNT(*) from inventory "+
	"WHERE store_id in(SELECT store_id from store "+
			"WHERE address_id in(SELECT address_id from address "+
				"WHERE city_id in(SELECT city_id from city "+
					"WHERE country_id = "+id+"))) "+
	"AND film_id = "+fid+" "+
	"GROUP by film_id;";
    conn.query(sql,function(err,result){
        if(err) throw err;
        res.json(result);
    }); 
});

//carrito de pelicualas a alquilar no mas de 4 requiera autenticacion y autorizacion
app.post("/list/:id", jsonParser, (req, res, next) => {
    const id= req.params.id;
    const aux=0;
    var lim=0;
    
    if(List.length>3){
        console.log("N?? de peliculas en el carrito superadas");
    }else{
        const sql= "SELECT film_id, COUNT(*) from inventory "+
	"WHERE store_id in(SELECT store_id from store "+
			"WHERE address_id in(SELECT address_id from address "+
				"WHERE city_id in(SELECT city_id from city "+
					"WHERE country_id = "+id+"))) "+
	"AND film_id = "+req.body.film_id+" "+
	"GROUP by film_id;";
    conn.query(sql,function(err,result){
    for(let Lists of List){
        if(Lists.film_id==parseInt(req.body.film_id)){
            lim=1;
        }
    }   
        if(err) throw err;
        if(result){
            if(lim==1){
                console.log("la pelicula ya esta en su carrito"); 
            }else{
                req.body.id=surrogateKey++;
                req.body.date=new Date().toISOString().slice(0, 19).replace('T', ' ');
                List.push(req.body);
                console.log("A??adido al carrito");
            }
          
        }
    }); 
    }
});

//obtener carrito de compras
app.get("/list", (req, res, next) => {
    res.json(List);
});

//calcular monto
app.put("/payment", jsonParser, (req, res, next) => {
    let payment=0;
    for(let Lists of List){
       let datea=new Date();
       detea=Date.parse(Lists.date);
       let dateb= new Date(req.body.date_return);
       let pay=dateb-datea;
       let aux=pay/(1000*60*60*24);
       //console.log("val :"+ parseInt(aux));
       //console.log("a = "+Date.parse(Lists.date)+" : b = "+dateb);
       payment=payment +parseInt(aux)*0.99;
    }
    if(payment>=20){
        payment=payment-payment*0.2;
    }else{
        if(payment>=15){
            payment=payment-payment*0.15;
        }else{
            if(payment>=10){
                payment=payment-payment*0.1;
            }
        }
    } 
    console.log("pago final "+payment);  
});

//rentar lista
app.post("/rental", jsonParser, (req, res, next) => {
   const dtu=req.body.user_id;
    const dt=req.body.return_date;

    let payment=0;
    let ids;
    for(let Lists of List){ 
        const sql= "INSERT into rental values(null,'"+Lists.date+"',"+Lists.film_id+","+dtu+",'"+dt+"',1,null);";
        conn.query(sql,function(err,result){
            if(err) throw err;
            //res.json(result);
            ids=json(result).rental_id;
            //console.log("alquiler exitoso");
        });
    }
    for(let Lists of List){
        let datea=new Date();
        detea=Date.parse(Lists.date);
        let dateb= new Date(req.body.return_date);
        let pay=dateb-datea;
        let aux=pay/(1000*60*60*24);
        payment=payment +parseInt(aux)*0.99;
     }
     if(payment>=20){
         payment=payment-payment*0.2;
     }else{
         if(payment>=15){
             payment=payment-payment*0.15;
         }else{
             if(payment>=10){
                 payment=payment-payment*0.1;
             }
         }
     } 
     const sql2= "INSERT into payment values(null,"+dtu+",1 ,"+ids+","+payment+",null);";
     conn.query(sql2,function(err,result){
         if(err) throw err;
         res.json(result);
         console.log("alquiler exitoso");
     });
});

app.listen(3000, () => {
    console.log("Servidor HTTP funcionando");
});

