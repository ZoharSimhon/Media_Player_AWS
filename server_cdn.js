const express = require('express');
const AWS = require('aws-sdk');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const port = 3000;

// AWS SDK configuration (commented out as AWS credentials are typically managed through environment variables or IAM roles)
// AWS.config.update({
//   accessKeyId: 'YOUR_ACCESS_KEY_ID',
//   secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
//   region: 'YOUR_REGION'
// });

// CloudFront key pair ID and private key for signing URLs
const cloudFrontKeyPairId = 'K2517LF4H1QMNE';
const privateKey = fs.readFileSync('./key.pem', 'utf-8');

// Initialize the S3 client
const s3 = new AWS.S3();
const bucketName = 'zohar-assignment1-videos'; // S3 bucket name
const cloudFrontUrl = 'https://d2x7fviad3egxx.cloudfront.net'; // CloudFront distribution URL
// const dateLessThan = '2024-12-12';


// Enable CORS for all routes
app.use(cors());

// Route to fetch the list of video files from S3
app.get('/videoList', async (req, res) => {
  try {
    const params = {
      Bucket: bucketName,
    };

    // Fetch the list of objects from S3 bucket
    const data = await s3.listObjectsV2(params).promise();
    const fileNames = data.Contents.map(item => item.Key); // Extract file names

    res.json(fileNames); // Respond with the list of file names
  } catch (error) {
    console.error('Error fetching file names from S3:', error);
    res.status(500).send('Internal Server Error'); // Handle errors
  }
});

// Route to generate a signed URL for a video file
app.get('/getVideoUrl', (req, res) => {
  const fileName = req.query.fileName;
  if (!fileName) {
    return res.status(400).send('File name is required'); // Validate request
  }

  const url = `${cloudFrontUrl}/${fileName}`; // Construct the CloudFront URL for the file
  const expires = Math.floor((Date.now() + 60000) / 100); // URL expiry time in seconds (1 minute)

  // Policy for the signed URL
  const policy = JSON.stringify({
    Statement: [{
      Resource: url,
      Condition: {
        DateLessThan: {
          'AWS:EpochTime': expires
        }
      }
    }]
  });

  // Function to sign the policy
  const sign = (policy, privateKey) => {
    const sign = crypto.createSign('RSA-SHA1');
    sign.update(policy);
    return sign.sign(privateKey, 'base64');
  };

  const signature = sign(policy, privateKey); // Generate the signature

  // Construct the signed URL with the signature and key pair ID
  const signedUrl = `${url}?Expires=${expires}&Signature=${encodeURIComponent(signature)}&Key-Pair-Id=${cloudFrontKeyPairId}`;

  res.json({ url: signedUrl }); // Respond with the signed URL
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
