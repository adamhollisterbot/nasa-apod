// NASA Image Library API Service
// API: https://images-api.nasa.gov/search?q={topic}&media_type=image

import * as FileSystem from 'expo-file-system';

const TOPICS = ['james webb', 'nebula', 'black hole', 'deep field', 'planets', 'galaxy'];
const IMAGE_DIR = `${FileSystem.documentDirectory}cached_images/`;
const METADATA_FILE = `${FileSystem.documentDirectory}image_metadata.json`;

// Get today's topic based on the date (cycles through topics)
const getTodayTopic = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  return TOPICS[dayOfYear % TOPICS.length];
};

// Fetch images from NASA Image Library API
export const fetchNASALibraryImages = async (topic = null, count = 2) => {
  const searchTopic = topic || getTodayTopic();
  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(searchTopic)}&media_type=image&page_size=20`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch NASA Image Library');
    }
    
    const data = await response.json();
    
    // Filter for high-quality images (with location data and good descriptions)
    const validImages = (data.collection?.items || []).filter(item => {
      const hasImage = item.data?.[0]?.media_type === 'image';
      const hasDescription = item.data?.[0]?.description?.length > 50;
      const hasLocation = item.data?.[0]?.location;
      // Prefer images with location data or longer descriptions
      return hasImage && hasDescription;
    });
    
    // Shuffle and pick top 'count' images
    const shuffled = validImages.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(item => ({
      id: item.data[0].nasa_id,
      title: item.data[0].title,
      description: item.data[0].description,
      date: item.data[0].date_created,
      location: item.data[0].location,
      photographer: item.data[0].photographer || item.data[0].secondary_creator,
      // Get the best quality image URL
      url: item.links?.find(l => l.rel === 'preview')?.href || 
           item.links?.[0?.href] || '',
      // Use the higher resolution image if available
      hdurl: item.links?.find(l => l.rel === 'original')?.href || 
             item.links?.[0?.href] || '',
    }));
  } catch (error) {
    console.error('Error fetching NASA Image Library:', error);
    return [];
  }
};

// Initialize the image directory
export const initImageCache = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    }
    
    // Initialize metadata if doesn't exist
    const metaInfo = await FileSystem.getInfoAsync(METADATA_FILE);
    if (!metaInfo.exists) {
      await FileSystem.writeAsStringAsync(METADATA_FILE, JSON.stringify({
        lastFetchDate: null,
        images: []
      }));
    }
  } catch (error) {
    console.error('Error initializing cache:', error);
  }
};

// Get cached images metadata
export const getCachedImagesMeta = async () => {
  try {
    const metaInfo = await FileSystem.getInfoAsync(METADATA_FILE);
    if (metaInfo.exists) {
      const content = await FileSystem.readAsStringAsync(METADATA_FILE);
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading metadata:', error);
  }
  return { lastFetchDate: null, images: [] };
};

// Save images metadata
export const saveCachedImagesMeta = async (metadata) => {
  try {
    await FileSystem.writeAsStringAsync(METADATA_FILE, JSON.stringify(metadata));
  } catch (error) {
    console.error('Error saving metadata:', error);
  }
};

// Check if we need to fetch new images (once per day)
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// Download and cache images
export const cacheImages = async (images) => {
  const cachedImages = [];
  
  for (const image of images) {
    if (!image.url) continue;
    
    const filename = `${image.id}.jpg`;
    const localPath = `${IMAGE_DIR}${filename}`;
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      
      if (!fileInfo.exists) {
        console.log(`Caching image: ${image.title}`);
        const downloadResult = await FileSystem.downloadAsync(image.url, localPath);
        if (downloadResult.status !== 200) {
          console.error(`Failed to download: ${image.url}`);
          continue;
        }
      }
      
      cachedImages.push({
        ...image,
        localPath: localPath,
      });
    } catch (error) {
      console.error(`Error caching image ${image.title}:`, error);
    }
  }
  
  return cachedImages;
};

// Get curated images - fetches from API and caches locally
export const getCuratedImages = async () => {
  await initImageCache();
  
  const today = getTodayDateString();
  const metadata = await getCachedImagesMeta();
  
  // Check if we already fetched today's images
  if (metadata.lastFetchDate === today && metadata.images?.length > 0) {
    console.log('Using cached images for today');
    return metadata.images;
  }
  
  // Fetch new images from API
  console.log('Fetching new curated images...');
  const images = await fetchNASALibraryImages(getTodayTopic(), 2);
  
  if (images.length > 0) {
    // Cache them locally
    const cachedImages = await cacheImages(images);
    
    // Save metadata
    await saveCachedImagesMeta({
      lastFetchDate: today,
      images: cachedImages
    });
    
    return cachedImages;
  }
  
  // Return cached if API fails
  return metadata.images || [];
};

export { getTodayTopic, TOPICS };
