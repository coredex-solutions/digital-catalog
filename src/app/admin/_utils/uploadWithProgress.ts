import {
  compressImage,
  formatBytes,
  isImageFile,
} from "@/utils/image-compression";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status?: string;
}

export interface UploadResult {
  url: string;
  compressionInfo?: {
    originalSize: number;
    compressedSize: number;
    wasCompressed: boolean;
  };
}

export async function uploadImageWithProgress(
  file: File,
  folder: string,
  token: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Compress image before upload if it's an image
  let fileToUpload = file;
  let compressionInfo = undefined;

  if (isImageFile(file)) {
    onProgress?.({
      loaded: 0,
      total: 100,
      percentage: 0,
      status: "Compressing image...",
    });

    const result = await compressImage(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 2048,
      quality: 0.85,
    });

    fileToUpload = result.file;
    compressionInfo = {
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      wasCompressed: result.wasCompressed,
    };

    if (result.wasCompressed) {
      console.log(
        `📦 Image compressed: ${formatBytes(
          result.originalSize
        )} → ${formatBytes(result.compressedSize)}`
      );
    }
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("folder", folder);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const percentage = Math.round((e.loaded / e.total) * 100);
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percentage,
          status: percentage < 100 ? "Uploading..." : "Processing...",
        });
      }
    });

    // Handle completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.url,
            compressionInfo,
          });
        } catch (error) {
          reject(new Error("Invalid response from server"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || "Upload failed"));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was aborted"));
    });

    // Start upload
    xhr.open("POST", "/api/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });
}
