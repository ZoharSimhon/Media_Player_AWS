const express = require('express');
const AWS = require('aws-sdk');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const port = 80;

// AWS.config.update({
//   accessKeyId: 'YOUR_ACCESS_KEY_ID',
//   secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
//   region: 'YOUR_REGION'
// });

const cloudFrontKeyPairId = 'K2517LF4H1QMNE';
const privateKey = fs.readFileSync('./key.pem', 'utf-8');

const s3 = new AWS.S3();
const bucketName = 'zohar-assignment1-videos';
const cloudFrontUrl = 'https://d1w8760bzlo5zv.cloudfront.net';

// Enable CORS for all routes
app.use(cors());

app.get('/videoList', async (req, res) => {
  try {
    const params = {
      Bucket: bucketName,
    };

    const data = await s3.listObjectsV2(params).promise();
    const fileNames = data.Contents.map(item => item.Key);

    res.json(fileNames);
  } catch (error) {
    console.error('Error fetching file names from S3:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/getVideoUrl', (req, res) => {
  const fileName = req.query.fileName;
  if (!fileName) {
    return res.status(400).send('File name is required');
  }

  const url = `${cloudFrontUrl}/${fileName}`;
  const expires = Math.floor((Date.now() + 60000) / 100); // URL expiry time in seconds (1 minute)

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

  const sign = (policy, privateKey) => {
    const sign = crypto.createSign('RSA-SHA1');
    sign.update(policy);
    return sign.sign(privateKey, 'base64');
  };

  const signature = sign(policy, privateKey);

  const signedUrl = `${url}?Expires=${expires}&Signature=${encodeURIComponent(signature)}&Key-Pair-Id=${cloudFrontKeyPairId}`;

  res.json({ url: signedUrl });
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
