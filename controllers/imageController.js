const AWS = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user'); // Import your User model

const s3 = new AWS.S3({ region: process.env.AWS_REGION }); // Use your region

// Function to upload or update profile image
const uploadProfileImage = async (req, res) => {
    const userEmail = req.user.email; // Use email to find the user
  
    if (!req.file) {
        return res.status(400).json({ code: 400 }); // Bad Request
    }

    const { originalname, mimetype, buffer } = req.file;

    // Check if the uploaded file is an image
    if (!mimetype.startsWith('image/')) {
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
        const { Location } = await s3.upload(params);
        
        // Update user record in the database with the image URL and upload date
        await User.update(
            { 
                profileImageUrl: Location,
                uploadDate: new Date(), // Set current date as upload date
                fileName: originalname
            }, 
            { where: { email: userEmail } } // Find user by email
        );

        return res.status(201).json({ 
            code: 201, 
            file_name: originalname, 
            id: req.user.id, // Assuming you have access to the user ID
            url: Location, 
            upload_date: new Date(), // Setting the upload date
            user_id: req.user.id // Assuming you have access to the user ID
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({ code: 500 }); // Internal Server Error
    }
};

  

// Function to get profile image
const getProfileImage = async (req, res) => {
  const userEmail = req.user.email; // Get user email from request

  try {
    const user = await User.findOne({ where: { email: userEmail } });
    if (!user || !user.profileImageUrl) {
      return res.status(404).send(); // Not Found
    }

    return res.status(200).json({
      file_name: user.fileName, // Extract file name from URL
      id: user.id,
      url: user.profileImageUrl,
      upload_date: user.uploadDate, // Use last updated date if applicable
      user_id: user.id,
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return res.status(500).send(); // Internal Server Error
  }
};

// Function to delete profile image
const deleteProfileImage = async (req, res) => {
  const userEmail = req.user.email; // Get user email from request

  try {
    const user = await User.findOne({ where: { email: userEmail } });
    if (!user || !user.profileImageUrl) {
      return res.status(404).send(); // Not Found
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: user.profileImageUrl.split('/').slice(-2).join('/'), // Extract key from URL
    };

    await s3.deleteObject(params);

    // Remove image URL from user record
    await User.update(
      { profileImageUrl: null ,fileName: null, uploadDate: null},
      { where: { email: userEmail } }
    );

    return res.status(204).send(); // No Content
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).send(); // Internal Server Error
  }
};

module.exports = {
  uploadProfileImage,
  getProfileImage,
  deleteProfileImage,
};
