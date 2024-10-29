import cloudinary from '../config/cloudinaryConfig.js';
// Helper function to extract `public_id` from Cloudinary URL
// Helper function to extract `public_id` from Cloudinary URL
// Helper function to extract `public_id` from Cloudinary URL
function getPublicIdFromUrl(url) {
    // Split the URL into parts based on '/'
    const urlParts = url.split('/');
    
    // Remove the first few parts that are not relevant
    // ['https:', 'res.cloudinary.com', 'your_cloud_name', 'image', 'upload', 'v1730094075', 'uploaded_files', '1730094072719.jpg']
    // We need to keep the rest
    // Join the remaining parts excluding the version and file extension
    const publicIdWithExtension = urlParts.slice(7).join('/'); // "uploaded_files/1730094072719.jpg"
    
    // Remove the file extension
    const publicId = publicIdWithExtension.split('.')[0]; // "uploaded_files/1730094072719"
    
    return publicId; // Return the correctly formatted public_id
}


// Function to delete the image using extracted `public_id`
async function deleteImageFromCloudinary(url) {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) {
        console.error("Failed to extract public_id from URL.");
        return false;
    }
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok') {
            console.log(`Image with public_id "${publicId}" deleted successfully.`);
            return true;
        } else {
            console.log(`Failed to delete image with public_id "${publicId}":`, result);
            return false;
        }
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        return false;
    }
}

export default deleteImageFromCloudinary;
