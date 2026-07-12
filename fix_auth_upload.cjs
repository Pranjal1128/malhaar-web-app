const fs = require('fs');
let content = fs.readFileSync('src/components/AuthView.tsx', 'utf8');

// Add import if not present
if (!content.includes('compressImageBase64')) {
  content = content.replace(
    "import { dbInstance, Profile } from '../db/mockDb';",
    "import { dbInstance, Profile } from '../db/mockDb';\nimport { compressImageBase64 } from '../db/imageCompressor';"
  );
}

// Replace handleFileChange
content = content.replace(
`  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onRequestToast('Image file is too large. Please select a photo under 5MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRegProfileImageUrl(event.target.result as string);
          onRequestToast('Photo uploaded successfully!', 'success');
        }
      };
      reader.onerror = () => {
        onRequestToast('Failed to read image file.', 'error');
      };
      reader.readAsDataURL(file);
    }
  };`,
`  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onRequestToast('Image file is too large. Please select a photo under 5MB.', 'error');
        return;
      }
      try {
        const compressedBase64 = await compressImageBase64(file);
        setRegProfileImageUrl(compressedBase64);
        onRequestToast('Photo uploaded and compressed successfully!', 'success');
      } catch (err) {
        console.error("Compression failed:", err);
        onRequestToast('Failed to read image file.', 'error');
      }
    }
  };`
);

// Replace handleDrop
content = content.replace(
`  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onRequestToast('Please upload an image file (PNG/JPG).', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        onRequestToast('Image file is too large. Please select a photo under 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRegProfileImageUrl(event.target.result as string);
          onRequestToast('Photo uploaded successfully!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };`,
`  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onRequestToast('Please upload an image file (PNG/JPG).', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        onRequestToast('Image file is too large. Please select a photo under 5MB.', 'error');
        return;
      }
      try {
        const compressedBase64 = await compressImageBase64(file);
        setRegProfileImageUrl(compressedBase64);
        onRequestToast('Photo uploaded and compressed successfully!', 'success');
      } catch (err) {
        console.error("Compression failed:", err);
        onRequestToast('Failed to read image file.', 'error');
      }
    }
  };`
);

fs.writeFileSync('src/components/AuthView.tsx', content);
