import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';

aws.config.update({
    secretAccessKey: 'YOUR_SECRET_ACCESS_KEY', // Replace with your secret key
    accessKeyId: 'YOUR_ACCESS_KEY_ID', // Replace with your access key
    region: 'YOUR_REGION' // Replace with your S3 bucket region
});

const s3 = new aws.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'YOUR_BUCKET_NAME', // Replace with your bucket name
        acl: 'public-read', // Files will be publicly readable
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            const filename = `${Date.now().toString()}-${file.originalname}`;
            cb(null, filename);
        }
    })
});

export default upload;