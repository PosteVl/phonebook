require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const { handleError, ErrorHandler } = require("./helpers/error")



app.use(cors())
app.use(express.static('build'))
app.use(express.json())

morgan.token('reqData', (req) => {
    return JSON.stringify(req.body)
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.use(morgan(function (tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms',
        req.method === 'POST' ? JSON.stringify(req.body) : ''
    ].join(' ')
}))

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person)
            }
            else {
                response.status(404).end()
            }
        })
        .catch((error) => {
            if (err.name === "CastError" && err.kind === "ObjectId") {
                next(new ErrorHandler(400, ["Malformatted Id"]));
            }
            next(error)
        })
})

app.get('/info', (req, res) => {
    Person.countDocuments({}, (err, result) => {
        if (err) {
            next(err);
        } else {
            res.send(`<div>
                <p>Phonebook has info for ${result} people </p>
                <p><span id="datetime"></span></p>

                    <script>
                        var dt = new Date();
                        document.getElementById("datetime").innerHTML = dt.toLocaleString();
                    </script>
              </div>`)
        }
    });


})

app.delete('/api/persons/:id', (request, response) => {
    Person.findByIdAndRemove(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch((err) => {
            console.error(err);
            if (err.name === "CastError" && err.kind === "ObjectId") {
                next(new ErrorHandler(400, ["Malformatted Id"]));
            }

            next(err);
        });
})

const generateRandomId = () => {
    return Math.floor(Math.random() * Math.floor(5 * 100));
}

app.post('/api/persons', (req, res, next) => {
    const body = req.body

    if (!body.name || !body.number) {
        throw new ErrorHandler(400, ["Missing name and/or number fields"]);
    }

    const person = new Person({
        id: generateRandomId(),
        name: body.name,
        number: body.number
    })

    person
        .save()
        .then((savedPerson) => savedPerson.toJSON())
        .then((formattedPerson) => {
            res.json(formattedPerson);
        })
        .catch((err) => {
            if (err.name === "ValidatorError" || err.name === "ValidationError") {
                const keys = Object.keys(err.errors);
                const messages = keys.map((e) => {
                    const error = err.errors[e];
                    const field = error.path[0].toUpperCase() + error.path.substr(1);

                    if (error.kind === "unique") {
                        return `${field} already exists`;
                    }
                    if (error.kind === "minlength") {
                        const length = error.message.match(/length \((\d+)\)/)[1];
                        return `${field} must be at least ${length} characters long`;
                    }

                    return `ValidationError in ${field}`;
                });

                next(new ErrorHandler(422, messages));
            } else {
                next(err);
            }
        });
})

app.put("/api/persons/:id", (req, res, next) => {
    const { body } = req;

    if (!body.name || !body.number) {
        throw new ErrorHandler(400, ["Missing name and/or number fields"]);
    }

    const person = {
        name: body.name,
        number: body.number,
    };

    Person.findByIdAndUpdate(req.params.id, person, {
        new: true,
    })
        .then((updatedPerson) => {
            if (updatedPerson) {
                res.json(updatedPerson.toJSON());
            } else {
                res.status(404).end();
            }
        })
        .catch((err) => {
            console.error(err);
            if (err.name === "CastError" && err.kind === "ObjectId") {
                next(new ErrorHandler(400, ["Malformatted Id"]));
            }

            next(err);
        });
});


app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    }

    next(error)
}

app.use((err, req, res, next) => {
    if (!err) next();

    if (err instanceof ErrorHandler) {
        handleError(err, res);
    } else {
        next(err);
    }
});

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})