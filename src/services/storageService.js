import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '../firebase';

/**
 * Uploads a book cover image to Firebase Storage and returns its public URL.
 * Fallback to FileReader base64 URL if Firebase is not configured.
 */
export async function uploadBookCoverImage(file, pathPrefix = 'covers') {
  if (!file) return '';

  if (!isFirebaseConfigured) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  try {
    const filename = `${pathPrefix}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storage, filename);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.error('Chyba při nahrávání obálky do Firebase Storage:', err);
    // Fallback to local Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
}
