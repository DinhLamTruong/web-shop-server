const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

exports.s3Uploadv3 = async files => {
  const s3client = new S3Client({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  const uploadResults = await Promise.all(
    files.map(async file => {
      const key = `uploads/${Date.now()}-${file.originalname}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype, // Important for correct display
        ContentDisposition: 'inline', // Set to inline to open in new tab
      };

      await s3client.send(new PutObjectCommand(params));

      // Construct URL
      const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return { imageUrl };
    })
  );

  return uploadResults; // return the list of uploaded URLs
};
