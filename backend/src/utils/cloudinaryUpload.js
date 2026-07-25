import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

/**
 * Upload a file buffer to Cloudinary via stream.
 *
 * @param {Buffer} fileBuffer - The raw file buffer from multer memory storage.
 * @param {string} folder    - Cloudinary folder path (e.g. "SCMS/complaints/<id>").
 * @returns {Promise<{url: string, secureUrl: string, publicId: string, width: number, height: number, format: string}>}
 */
export const uploadToCloudinary = (fileBuffer, folder = "SCMS/complaints") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete a single image from Cloudinary by its public_id.
 *
 * @param {string} publicId - The Cloudinary public_id of the image.
 * @returns {Promise<object>} Cloudinary deletion result.
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, error.message);
    throw error;
  }
};

/**
 * Delete multiple images from Cloudinary.
 * Uses Promise.allSettled so one failure doesn't block the rest.
 *
 * @param {string[]} publicIds - Array of Cloudinary public_ids to delete.
 * @returns {Promise<{succeeded: string[], failed: string[]}>}
 */
export const deleteMultipleFromCloudinary = async (publicIds = []) => {
  if (!publicIds.length) return { succeeded: [], failed: [] };

  const results = await Promise.allSettled(
    publicIds.map((id) => cloudinary.uploader.destroy(id))
  );

  const succeeded = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value?.result === "ok") {
      succeeded.push(publicIds[index]);
    } else {
      failed.push(publicIds[index]);
      console.error(
        `Failed to delete Cloudinary asset ${publicIds[index]}:`,
        result.status === "rejected" ? result.reason?.message : result.value
      );
    }
  });

  return { succeeded, failed };
};
