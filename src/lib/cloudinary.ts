import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type CloudinaryResourceType = "image" | "video" | "raw" | "auto";

export async function uploadToCloudinary(
  file: string | Buffer,
  options: {
    folder?: string;
    resource_type?: CloudinaryResourceType;
    public_id?: string;
  } = {}
): Promise<{ secure_url: string; public_id: string }> {
  const result = await cloudinary.uploader.upload(file as string, {
    folder: options.folder ?? "childrenlk",
    resource_type: options.resource_type ?? "auto",
    public_id: options.public_id,
  });
  return { secure_url: result.secure_url, public_id: result.public_id };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
