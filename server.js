const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer');
const app = express()
const fs = require('fs')
var mongoose = require('mongoose')


var dbUrl = '<Enter  your mlab Url>'
//mongoose schema
var Image = mongoose.model('Image', {
    contentType: String,
    image: Buffer
})

var port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({
    extended: true
}))

// SET STORAGE USING MULTER
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

var upload = multer({
    storage: storage
})


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

//single file route
app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
    const file = req.file
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }
    res.send(file)
})

//multiple files route
app.post('/uploadmultiple', upload.array('myFiles', 12), (req, res, next) => {
    const files = req.files
    if (!files) {
        const error = new Error('Please choose files')
        error.httpStatusCode = 400
        return next(error)
    }

    res.send(files)

})

//  upload to db
app.post('/uploadphoto', upload.single('myImage'), (req, res) => {
    console.log(typeof (req.file.mimetype))
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');
    // Define a JSONobject for the image attributes for saving to database

    var finalImg = {
        contentType: req.file.mimetype,
        image: new Buffer(encode_image, 'base64')
    };
    Image.create(finalImg, (err, result) => {
        console.log(result)

        if (err) return console.log(err)

        console.log('saved to database')
        res.redirect('/')


    })
})

// get photos id from db
app.get('/photos', (req, res) => {
    Image.find({}, ((err, result) => {

        const imgArray = result.map(element => element._id);
        //   console.log(imgArray);
        if (err)
            return console.log(err)
        res.send(imgArray)
    }))
});

//get the photos by id
app.get('/photo/:id', (req, res,next) => {
    var filename = req.params.id;

    Image.findOne({
        '_id': filename
    }, (err, result) => {

        if (err)
            return next(err)

        res.contentType('image/jpeg');
        res.send(result.image)


    })
})

//error handler
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    res.status(500)
    res.render('error', {
        error: err
    })
}

//connect to mongoose
mongoose.connect(dbUrl, {
    useNewUrlParser: true
}, (err) => {
    console.log('Mongo db connected', err)
})














app.listen(port, () => {
    console.log('Server listening on port', port)
})