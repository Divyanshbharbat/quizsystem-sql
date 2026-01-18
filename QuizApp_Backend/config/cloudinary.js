import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || 'dhfyarphc',
  api_key: process.env.CLOUD_KEY || '537316744387757',
  api_secret: process.env.CLOUD_SECRET || '5VB_SHQtJMO-hsoR02jXcOJDtug'
});


export default cloudinary;
