import multer from "multer";

// Use memory storage because we are directly uploading to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
