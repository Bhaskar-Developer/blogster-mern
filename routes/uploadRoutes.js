const AWS = require('aws-sdk')
const uuid = require('uuid/v1')
const requireLogin = require('../middlewares/requireLogin');
const keys = require('../config/keys')

const s3 = new AWS.S3({
    credentials: {
      accessKeyId: keys.accessKeyId,
      secretAccessKey: keys.secretAccessKey,
    },
    region: 'ap-south-1',
});

module.exports = app => {
    app.get('/api/upload', requireLogin ,(req, res) => {
        const fileType = req.query.fileType
        const fileExt = fileType.substring(fileType.indexOf('/')+1)
        const key = `${req.user.id}/${uuid()}.${fileExt}`;

        s3.getSignedUrl('putObject', {
            Bucket: 'blogster-bucket-ch',
            ContentType: 'image/jpeg',
            Key: key
        }, (err, url) => {
            if(err) {
                console.log(err)
                return res.sendStatus(500)
            }
            return res.json({ key, url })
        } )
    })
}