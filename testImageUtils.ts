// Basic test to validate image processing utilities
import { processImageInput } from "./core/imageUtils";

async function testImageUtilities() {
  console.log("Testing image processing utilities...");

  try {
    // Test with base64 data URL
    const redPixelBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQV R42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    
    const processedImage = await processImageInput({
      data: redPixelBase64,
      detail: 'high'
    });

    console.log("✅ Image processing utility works correctly");
    console.log("Processed image URL length:", processedImage.url.length);
    console.log("Detail level:", processedImage.detail);

    // Test with Buffer
    const bufferData = Buffer.from("fake-image-data");
    const processedFromBuffer = await processImageInput({
      data: bufferData,
      mimeType: 'image/jpeg',
      detail: 'auto'
    });

    console.log("✅ Buffer processing works correctly");
    console.log("Processed buffer image detail:", processedFromBuffer.detail);

  } catch (error) {
    console.error("❌ Image processing test failed:", error);
  }
}

testImageUtilities();