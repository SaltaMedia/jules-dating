// Camera and file picker utilities for mobile photo capture

export const openCamera = async (): Promise<File | null> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    
    // Create a video element to capture the image
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });
    
    // Create canvas to capture the frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    // Stop the stream
    stream.getTracks().forEach(track => track.stop());
    
    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
          resolve(file);
        } else {
          resolve(null);
        }
      }, 'image/jpeg');
    });
  } catch (error) {
    console.error('Error accessing camera:', error);
    return null;
  }
};

export const openFilePicker = async (): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0] || null;
      resolve(file);
    };
    input.click();
  });
};

// Mobile-optimized camera capture using input with capture attribute
export const openMobileCamera = (): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0] || null;
      resolve(file);
    };
    input.click();
  });
};

export const captureImage = async (): Promise<File | null> => {
  // Try camera first, fall back to file picker
  const cameraResult = await openCamera();
  if (cameraResult) {
    return cameraResult;
  }
  
  // Fall back to file picker
  return await openFilePicker();
};

// Mobile-optimized capture that tries mobile camera first, then file picker
export const captureImageMobile = async (): Promise<File | null> => {
  // Try mobile camera first (works better on mobile devices)
  const mobileCameraResult = await openMobileCamera();
  if (mobileCameraResult) {
    return mobileCameraResult;
  }
  
  // Fall back to regular file picker
  return await openFilePicker();
};


