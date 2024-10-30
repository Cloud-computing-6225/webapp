const { statsdClient } = require('../server'); // Adjust the path based on your project structure
const AWS = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/userModel'); // Import your User model
const Image = require('../models/imageModel'); // Import your Image model

const s3 = new AWS.S3({ region: process.env.AWS_REGION }); // Use your AWS region

// Function to upload or update profile image
const uploadProfileImage = async (req, res) => {
    const userEmail = req.user.email; // Use email to find the user
    const startTime = Date.now(); // Start timer for API call

    if (!req.file) {
        statsdClient.increment('api.uploadProfileImage.call'); // Increment API call count
        return res.status(400).json({ code: 400 }); // Bad Request
    }

    const { originalname, mimetype, buffer } = req.file;

    // Check if the uploaded file is an image
    if (!mimetype.startsWith('image/')) {
        statsdClient.increment('api.uploadProfileImage.call'); // Increment API call count
        return res.status(400).json({ code: 400 }); // Bad Request for non-image files
    }

    const key = `profile-images/${uuidv4()}-${originalname}`; // S3 key

    // Set parameters for S3 upload
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        ACL: 'public-read', // Optional: make the file publicly accessible
    };

    try {
        const s3StartTime = Date.now(); // Start timer for S3 upload
        const { Location } = await s3.upload(params);
        const s3Duration = Date.now() - s3StartTime; // Calculate S3 upload duration
        statsdClient.timing('s3.upload_time', s3Duration); // Log S3 upload time

        // Create or update image record in the database
        const dbStartTime = Date.now(); // Start timer for database query
        const image = await Image.create({
            file_name: originalname,
            url: Location,
            upload_date: new Date(),
            user_id: req.user.id // Assuming you have access to the user ID
        });
        const dbDuration = Date.now() - dbStartTime; // Calculate DB update duration
        statsdClient.timing('db.insert_time', dbDuration); // Log database insert time

        const duration = Date.now() - startTime; // Calculate total API duration
        statsdClient.timing('api.uploadProfileImage.response_time', duration); // Log API response time
        statsdClient.increment('api.uploadProfileImage.call'); // Increment API call count

        return res.status(201).json({
            file_name: originalname,
            id: image.id,
            url: Location,
            upload_date: new Date().toISOString().split('T')[0], // Format date as "YYYY-MM-DD"
            user_id: req.user.id
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({ code: 500 }); // Internal Server Error
    }
};

// Function to get profile image
const getProfileImage = async (req, res) => {
    const userEmail = req.user.email; // Get user email from request
    const startTime = Date.now(); // Start timer for API call

    try {
        const image = await Image.findOne({ where: { user_id: req.user.id } }); // Get the single image for the user

        // Check if the image exists
        if (!image) {
            statsdClient.increment('api.getProfileImage.call'); // Increment API call count
            return res.status(404).json({ code: 404 }); // Not Found
        }

        const duration = Date.now() - startTime; // Calculate total API duration
        statsdClient.timing('api.getProfileImage.response_time', duration); // Log API response time
        statsdClient.increment('api.getProfileImage.call'); // Increment API call count

        return res.status(200).json({
            file_name: image.file_name,
            id: image.id,
            url: image.url,
            upload_date: image.upload_date.toISOString().split('T')[0], // Format date as "YYYY-MM-DD"
            user_id: image.user_id
        });
    } catch (error) {
        console.error('Error fetching image:', error);
        return res.status(500).json({ code: 500 }); // Internal Server Error
    }
};

// Function to delete profile image
const deleteProfileImage = async (req, res) => {
    const { imageId } = req.params; // Get image ID from request parameters
    const userEmail = req.user.email; // Get user email from request
    const startTime = Date.now(); // Start timer for API call

    try {
        const image = await Image.findOne({ where: { id: imageId, user_id: req.user.id } });
        if (!image) {
            statsdClient.increment('api.deleteProfileImage.call'); // Increment API call count
            return res.status(404).json({ code: 404 }); // Not Found
        }

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: image.url.split('/').slice(-2).join('/'), // Extract key from URL
        };

        const s3StartTime = Date.now(); // Start timer for S3 delete
        await s3.deleteObject(params);
        const s3Duration = Date.now() - s3StartTime; // Calculate S3 delete duration
        statsdClient.timing('s3.delete_time', s3Duration); // Log S3 delete time

        // Remove image record from database
        const dbStartTime = Date.now(); // Start timer for database query
        await Image.destroy({ where: { id: imageId } });
        const dbDuration = Date.now() - dbStartTime; // Calculate DB delete duration
        statsdClient.timing('db.delete_time', dbDuration); // Log database delete time

        const duration = Date.now() - startTime; // Calculate total API duration
        statsdClient.timing('api.deleteProfileImage.response_time', duration); // Log API response time
        statsdClient.increment('api.deleteProfileImage.call'); // Increment API call count

        return res.status(204).send(); // No Content
    } catch (error) {
        console.error('Error deleting image:', error);
        return res.status(500).json({ code: 500 }); // Internal Server Error
    }
};

module.exports = {
    uploadProfileImage,
    getProfileImage,
    deleteProfileImage,
};
