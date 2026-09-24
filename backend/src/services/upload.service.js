const cloudinary = require('../utils/cloudinary');

async function uploadToCloudinary(buffer, mimetype, userId) {
  const b64 = Buffer.from(buffer).toString('base64');
  const dataURI = `data:${mimetype};base64,${b64}`;
  return cloudinary.uploader.upload(dataURI, {
    folder: `inkwell/${userId}`,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });
}

async function deleteFromCloudinary(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
