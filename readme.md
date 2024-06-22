# media player App

This project is a media player application that fetches video files from an AWS S3 bucket, serves them through an AWS CloudFront CDN, and utilizes caching for improved performance. The client side presents a list of video files and allows users to click on a file name to play the video.

## Table of Contents

- [Server](#server)
  - [Using S3](#using-s3)
  - [Using CDN](#using-cdn)
  - [Using CDN with Cache](#using-cdn-with-cache)
- [Client Side](#client-side)
- [Load Test](#load-test)
- [Setup and Run](#setup-and-run)

## Server

### Using S3

The server uses the AWS SDK to fetch the list of video files from an S3 bucket. It has an endpoint `/videoList` that returns a JSON array of file names stored in the bucket.

- **Endpoint**: `/videoList`
- **Method**: `GET`
- **Response**: `['video1.mp4', 'video2.mp4', ...]`

### Using CDN

To improve the distribution of video files, the server uses AWS CloudFront. A signed URL is generated for each video file, allowing temporary access to the video through the CDN.

- **Endpoint**: `/getVideoUrl`
- **Method**: `GET`
- **Query Parameter**: `fileName`
- **Response**: `{ "url": "signed_cloudfront_url" }`

### Using CDN with Cache

To further optimize performance, the server caches the list of video files fetched from S3. The cache is updated every hour to ensure the file list is reasonably up-to-date without overwhelming the S3 service.

- **Caching**: File list is cached for 1 hour.
- **Cache Duration**: 1 hour (configurable).

## Client Side

The client side is a simple HTML page that displays the list of video files. When a user clicks on a video file name, the video is played in a media player embedded in the page. The clicked video file name is highlighted.

- **HTML**: Displays the video list and media player.
- **CSS**: Styles for the table and media player.
- **JavaScript**: Fetches the video list, handles click events to play videos, and highlights the selected video.

## Load Test

A load test was performed to ensure the server can handle numerous simultaneous requests. The test compares the server performance with and without caching the file list from S3.

- **Auto-scaling**: Configured to scale up to 3 instances during high load and scale back down to 1 instance during low load.
- **Latency Measurement**: The time taken for each request is measured and analyzed.
- **Optimization**: Caching the file list significantly improves the server's scalability by reducing the number of requests made to S3.

## Setup and Run

### Prerequisites

- Node.js
- AWS account with S3 bucket and CloudFront distribution
- AWS SDK configured with appropriate permissions

### Install Dependencies

```bash
npm install
```

### Run the Server

```bash
node server/[server.js or server_cdn.js]
```

### Run the Client

Open `public/index.html` in a web browser.

### Load Test

To perform the load test, use the provided script and analyze the results:

```bash
# Run the load test script (ensure you have the necessary load testing tool installed)
npm run test
```

### Visualize Load Test Results

To visualize the load test results, use the provided Python script:

```bash
# Ensure you have matplotlib installed
pip install matplotlib

# Run the visualization script
python loadTest/plot_time_results.py
```

## Project Structure

```
.
├── client
│   ├── index.html               # HTML file
│   ├── script.js                # JavaScript file
│   └── styles.css               # CSS file
├── loadTest
│   ├── loadTest.js              # Load test script
│   ├── plot_time_results.py     # Script to visualize load test results
│   ├── time_results.txt         # Load test results without cache
│   └── time_results_with_cache.txt # Load test results with cache
├── server
│   ├── key.pem                  # Private key for CloudFront
│   ├── pubkey.pem               # Public key for CloudFront
│   ├── server_cdn.js            # Server code using CDN
│   └── server.js                # Server code
├── package-lock.json
└── package.json

```

## Conclusion

This project demonstrates a scalable and efficient media player application using AWS services. By leveraging CloudFront CDN and caching strategies, the server performance is optimized, ensuring a better user experience. The client side provides a simple interface for users to view and play videos.
