const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')



app.use(cors())
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


let persons = [
    {
        id: 1,
        name: "Arto Hellas",
        number: "040-123456"
    },
    {
        id: 2,
        name: "Ada Lovelace",
        number: "39-44-5323523"
    },
    {
        id: 3,
        name: "Dan Abramov",
        number: "12-43-234345"
    },
    {
        id: 4,
        name: "Mary Poppendick",
        number: " 39-23-642387"
    }
]

app.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (req, res) => {
    res.json(persons)
})

app.get('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    const person = persons.find(person => person.id === id)

    if (person) {
        response.json(person)
    }
    else {
        response.status(404).end()
    }
})

app.get('/info', (req, res) => {
    res.send(`<div>
                <p>Phonebook has info for ${persons.length} people </p>
                <p><span id="datetime"></span></p>

                    <script>
                        var dt = new Date();
                        document.getElementById("datetime").innerHTML = dt.toLocaleString();
                    </script>
              </div>`)
})

app.delete('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    persons = persons.filter(person => person.id !== id)

    response.status(204).end()
})

const generateRandomId = () => {
    return Math.floor(Math.random() * Math.floor(persons.length*100));
}

app.post('/api/persons', (request, response) => {
    const body = request.body

    if (!body.name || !body.number) {
        return response.status(400).json({
            error: 'details missing'
        })
    }

    if(persons.some(person => person.name === body.name)){
        return response.status(400).json({
            error: 'person name already registered'
        })
    }
    if(persons.some(person => person.number === body.number)){
        return response.status(400).json({
            error: 'person number already registered'
        })
    }

    const person = {
        id: generateRandomId(),
        name: body.name,
        number: body.number
    }

    persons = persons.concat(person)

    response.json(person)
})

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })