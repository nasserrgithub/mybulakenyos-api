const express = require('express');
const bodyParser = require('body-parser');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');

const app = express();
const db = knex ({
	client: 'pg',
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: true
	}
})

app.use(bodyParser.json());
app.use(cors());


//controllers

app.get('/', (req, res) => {
	res.send('it is working')
})

app.post('/register', (req,res) => {
	const {name, address, email, password} = req.body;
	const hash = bcrypt.hashSync(password);
	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
				.insert({
					name: name,
					address: address,
					email: loginEmail[0],
					joined: new Date()
				})
				.returning('*')
				.then(user => res.json(user[0]))
				.catch(err => res.status(400).json('unable to register'))
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.status(404).json('unable to register'))
})


app.post('/signin', (req, res) => {
	const {email, password} = req.body;
	db.select('email', 'hash').from('login')
		.where('email', '=', email)
		.then(data => {
			const isValid = bcrypt.compareSync(password, data[0].hash);
			if (isValid) {
				db.select('*').from('users').where('email', '=', email)
				.then(user => {
					res.json(user[0])
				})
			} else {
				res.status(400).json('wrong credentials 1')
			}
		})
		.catch(err => res.status(400).json('wrong credentials 2'))

})

app.get('/jobsbulakan', (req, res) => {
	db.select('*').from('jobs').then(data => res.json(data))
})

app.get('/jobsbulakancount', (req, res) => {
	db('jobs').count('id')
	.then(count => res.json(count[0]));
})




app.listen(process.env.PORT || 3000, () => {
	console.log(`App is runnin on port ${process.env.PORT}`)
});

//signin
//register
//home