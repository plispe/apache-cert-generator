let express = require('express')
let bodyParser = require('body-parser')
let tmp = require('tmp')
let fs = require('fs')
let fsp = require('fs-promise')
let archiver = require('archiver')
let pem = require('pem')

let app = express()
let urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(express.static('public'))

app.get('/', urlencodedParser, (req, res) => {
  pem.createCertificate({days:1, selfSigned:true}, (err, keys) => {
    let certFile = tmp.fileSync()
    let keyFile = tmp.fileSync()

    fsp.writeFile(certFile.fd, keys.certificate).then((err) => {
      if (err) {
        console.log(err)
      }
      fsp.writeFile(keyFile.fd, keys.serviceKey).then((err) => {
        if (err) {
          console.log(err)
        }

        let zip = archiver.create('zip', {})

        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-disposition': 'attachment; filename=ssl.zip'
        });

        zip.pipe(res);

        zip
          .append(fs.readFileSync(certFile.name), {name: 'ssl/certs/server.crt'})
          .append(fs.readFileSync(keyFile.name), {name: 'ssl/certs/server.key'})
          .finalize()
      })
    })
  })
})

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
})

app.listen(process.env.PORT)
