var http = require("http"),
    fs = require("fs")
    cron = require("node-cron")
    request = require("request")
    csv = require("fast-csv");
    var PythonShell = require('python-shell');
    const express = require('express')
    const app = express()
    const port = process.env.PORT || 3000
    
    var engines = require('consolidate');

    app.set('views', __dirname + '/views');
    app.engine('html', engines.mustache);
    app.set('view engine', 'html');
    var bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    require('dotenv').config();
    var multer = require('multer');
    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            fs.unlink('./AUDJPY.csv');
            callback(null, './');
        },
        filename: function (req, file, callback) {
            var originalname = file.originalname;
            var extension = originalname.split(".");
            filename = "AUDJPY" + '.' + extension[extension.length-1];
            callback(null, filename);
        }
    });
    var upload = multer({
        storage: storage
    }).single('upload');
    
    app.get('/', (request, response, next) => {
        response.render('file');
    })
   
    app.post('/add', (r, s, n) => {
        var open = r.body.open
        var close = r.body.close
        var high = r.body.high
        var low = r.body.low
        var data = "1" + "," + "1" + "," + open + "," + high + "," + low + "," + close + "," + "1";
        fs.appendFile('AUDJPY.csv', "\n" + data, function (err) {
            if (err) return s.json({ status: 'failed', data: err });;
            console.log('Saved!');
            return s.json({ status: 'success', data: "Saved" });
        });
    });

    app.post('/upload', upload, (r, s, n) => {
        return s.redirect('/');
    });

    app.post('/predict', (r, s, n) => {
        var pyshell = new PythonShell('work.py');
        var messages = "";
        console.log("computing....")

        console.log(r.body.open);
        pyshell.send(JSON.stringify([parseInt(r.body.open)]));
        
        pyshell.on('message', function (message) {
            messages += message;
        });

        pyshell.end(function (err) {
            console.log(err);
            if (err) {
                return s.json({ status: 'failed', data: err });
            };
            return s.json({ status: 'success', data: messages });
            console.log('finished');
        });
    });
    
    app.listen(port, (err) => {
        if (err) {
        return console.log('something bad happened', err)
        }
    
        console.log(`server is listening on ${port}`)
        cron.schedule('*/5 * * * *', function () {
            console.log('running every 10 minutes');
            var date = new Date();
            console.log(date);
            request.get('http://webrates.truefx.com/rates/connect.html?u=Jude&p=dyke2010&q=ozrates&c=AUD/JPY&f=csv&s=n', (error, response, body) => {
                var resp = body.split(":");
                var ID = resp[resp.length - 1]
                request.get('http://webrates.truefx.com/rates/connect.html?id=Jude:dyke2010:ozrates:' + ID, (error, response, body) => {
                    console.log(body);
                    var data = body.replace("\n", "").replace("\r", "").replace("\n", "");
                    fs.appendFile('my.csv', "\n" + data, function (err) {
                        if (err) throw err;
                        console.log('Saved!');
                    });
                });
            });
        });
    })

    
    
    // next();

        
