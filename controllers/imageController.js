const { statsdClient, logger } = require('../stats'); // Import logger and statsdClient from server.js
const AWS = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/userModel');
const Image = require('../models/imageModel');

const s3 = new AWS.S3({ region: process.env.AWS_REGION });

// Function to upload or update profile image
const uploadProfileImage = async (req, res) => {
    const userEmail = req.user.email;
    const startTime = Date.now();
    statsdClient.increment('api.uploadProfileImage.call');
    logger.info({ message: 'Upload profile image initiated', user: userEmail });

    if (!req.file) {
        logger.warn({ message: 'No file provided for upload', user: userEmail });
        return res.status(400).json({ code: 400 });
    }

    const { originalname, mimetype, buffer } = req.file;

    if (!mimetype.startsWith('image/')) {
        logger.warn({ message: 'Non-image file upload attempt', user: userEmail, fileType: mimetype });
        return res.status(400).json({ code: 400 });
    }

    const key = `profile-images/${uuidv4()}-${originalname}`;
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        ACL: 'public-read'
    };

    try {
        const s3StartTime = Date.now();
        const { Location } = await s3.upload(params);
        const s3Duration = Date.now() - s3StartTime;
        statsdClient.timing('s3.upload_time', s3Duration);
        logger.info({ message: 'Image uploaded to S3', user: userEmail, duration: s3Duration, location: Location });

        const dbStartTime = Date.now();
        const image = await Image.create({
            file_name: originalname,
            url: Location,
            upload_date: new Date(),
            user_id: req.user.id
        });
        const dbDuration = Date.now() - dbStartTime;
        statsdClient.timing('db.insert_time', dbDuration);
        logger.info({ message: 'Database entry created for image', user: userEmail, duration: dbDuration, imageId: image.id });

        const duration = Date.now() - startTime;
        statsdClient.timing('api.uploadProfileImage.response_time', duration);

        return res.status(201).json({
            file_name: originalname,
            id: image.id,
            url: Location,
            upload_date: new Date().toISOString().split('T')[0],
            user_id: req.user.id
        });
    } catch (error) {
        logger.error({ message: 'Error uploading image', user: userEmail, error: error.message });
        return res.status(500).json({ code: 500 });
    }
};

// Function to get profile image
const getProfileImage = async (req, res) => {
    const userEmail = req.user.email;
    const startTime = Date.now();
    statsdClient.increment('api.getProfileImage.call');
    logger.info({ message: 'Fetch profile image initiated', user: userEmail });

    try {
        const image = await Image.findOne({ where: { user_id: req.user.id } });

        if (!image) {
            logger.warn({ message: 'Profile image not found', user: userEmail });
            return res.status(404).json({ code: 404 });
        }

        const duration = Date.now() - startTime;
        statsdClient.timing('api.getProfileImage.response_time', duration);

        return res.status(200).json({
            file_name: image.file_name,
            id: image.id,
            url: image.url,
            upload_date: image.upload_date.toISOString().split('T')[0],
            user_id: image.user_id
        });
    } catch (error) {
        logger.error({ message: 'Error fetching image', user: userEmail, error: error.message });
        return res.status(500).json({ code: 500 });
    }
};

// Function to delete profile image
const deleteProfileImage = async (req, res) => {
    const userEmail = req.user.email;
    const userId = req.user.id;
    const startTime = Date.now();
    statsdClient.increment('api.deleteProfileImage.call');
    logger.info({ message: 'Delete profile image initiated', user: userEmail });

    try {
        // Find the image associated with the user
        const image = await Image.findOne({ where: { user_id: userId } });
        if (!image) {
            logger.warn({ message: 'Profile image not found for deletion', user: userEmail });
            return res.status(404).json({ code: 404 });
        }

        // Prepare parameters to delete from S3
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: image.url.split('/').slice(-2).join('/')
        };

        // Delete the image from S3
        const s3StartTime = Date.now();
        await s3.deleteObject(params);
        const s3Duration = Date.now() - s3StartTime;
        statsdClient.timing('s3.delete_time', s3Duration);
        logger.info({ message: 'Image deleted from S3', user: userEmail, duration: s3Duration });

        // Delete the image record from the database
        const dbStartTime = Date.now();
        await Image.destroy({ where: { user_id: userId } });
        const dbDuration = Date.now() - dbStartTime;
        statsdClient.timing('db.delete_time', dbDuration);
        logger.info({ message: 'Image record deleted from database', user: userEmail, duration: dbDuration });

        // Calculate the full request duration and log it
        const duration = Date.now() - startTime;
        statsdClient.timing('api.deleteProfileImage.response_time', duration);

        return res.status(204).send();
    } catch (error) {
        logger.error({ message: 'Error deleting image', user: userEmail, error: error.message });
        return res.status(500).json({ code: 500 });
    }
};


module.exports = {
    uploadProfileImage,
    getProfileImage,
    deleteProfileImage,
};
