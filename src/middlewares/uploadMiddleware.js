import multer from 'multer';
import path from 'path';

// Configure Multer to store files locally
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "./public/uploads/"),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Create a unique file name
    },
});

// Initialize multer with the local storage configuration
const upload = multer({ storage });

export default upload;
