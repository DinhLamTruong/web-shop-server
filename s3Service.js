const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

exports.s3Uploadv3 = async files => {
  const s3client = new S3Client({
    credentials: {
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    },
    region: process.env.AWS_REGION,
  });

  const uploadResults = await Promise.all(
    files.map(async file => {
      const resizedImage = await sharp(file.buffer)
        .resize({ width: 400, height: 400, fit: 'contain' })
        .toBuffer();
      const key = `uploads/${Date.now()}-${file.originalname}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: resizedImage,
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
