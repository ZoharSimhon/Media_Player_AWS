const express = require('express');
const AWS = require('aws-sdk');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const port = 3000;

// CloudFront key pair ID and private key for signing URLs
const cloudFrontKeyPairId = 'K2517LF4H1QMNE';
const privateKey = fs.readFileSync('./key.pem', 'utf-8');

// Initialize the S3 client
const s3 = new AWS.S3();
const bucketName = 'zohar-assignment1-videos'; // S3 bucket name
const cloudFrontUrl = 'https://d2x7fviad3egxx.cloudfront.net'; // CloudFront distribution URL


// Enable CORS for all routes
app.use(cors());

// Variables for caching the file list
let cachedFileList = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // Cache duration set to 1 hour (in milliseconds)

// Function to fetch the list of files from S3 and cache it
const fetchFileList = async () => {
  const params = { Bucket: bucketName };
  const data = await s3.listObjectsV2(params).promise();  // Fetching the list of objects from S3 bucket
  return data.Contents.map(item => item.Key);  // Extracting file names
};

// Route to fetch the list of video files from S3
app.get('/videoList', async (req, res) => {
  try {
    const now = Date.now();
    if (!cachedFileList || now - lastCacheTime > CACHE_DURATION) {
      cachedFileList = await fetchFileList();  // Refreshing the cache if expired
      lastCacheTime = now;
    }
    res.json(cachedFileList);  // Responding with the cached list of file names
  } catch (error) {
    console.error('Error fetching file names from S3:', error);
    res.status(500).send('Internal Server Error');  // Handling errors
  }
});

// Route to generate a signed URL for a video file
app.get('/getVideoUrl', (req, res) => {
  const fileName = req.query.fileName;
  if (!fileName) {
    return res.status(400).send('File name is required');  // Validating request
  }

  const url = `${cloudFrontUrl}/${fileName}`;  // Constructing the CloudFront URL for the file
  const expires = Math.floor((Date.now() + 60000) / 100);  // URL expiry time in seconds (1 minute)

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

  const signature = sign(policy, privateKey);  // Generating the signature

  // Constructing the signed URL with the signature and key pair ID
  const signedUrl = `${url}?Expires=${expires}&Signature=${encodeURIComponent(signature)}&Key-Pair-Id=${cloudFrontKeyPairId}`;

  res.json({ url: signedUrl });  // Responding with the signed URL
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Start the server and listen on the defined port
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
