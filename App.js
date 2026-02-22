import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { getCuratedImages, getTodayTopic, TOPICS } from './services/nasaLibrary';

const { width } = Dimensions.get('window');

export default function App() {
  const [apod, setApod] = useState(null);
  const [curatedImages, setCuratedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCurated, setLoadingCurated] = useState(true);

  const fetchAPOD = async () => {
    try {
      setError(null);
      const response = await fetch(
        'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch APOD');
      }
      
      const data = await response.json();
      setApod(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCuratedImages = async () => {
    try {
      setLoadingCurated(true);
      const images = await getCuratedImages();
      setCuratedImages(images);
    } catch (err) {
      console.error('Error fetching curated images:', err);
    } finally {
      setLoadingCurated(false);
    }
  };

  const loadData = async () => {
    await Promise.all([fetchAPOD(), fetchCuratedImages()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAPOD();
    fetchCuratedImages();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const openHDImage = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Loading today's cosmos...</Text>
      </View>
    );
  }

  if (error && !apod) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.errorEmoji}>🌌</Text>
        <Text style={styles.errorText}>Houston, we have a problem</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAPOD}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isVideo = apod?.media_type === 'video';
  const todayTopic = getTodayTopic();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4A90D9"
            colors={['#4A90D9']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🌌</Text>
          <Text style={styles.headerTitle}>NASA APOD</Text>
          <Text style={styles.headerSubtitle}>Astronomy Picture of the Day</Text>
        </View>

        {/* APOD Section */}
        <Text style={styles.sectionTitle}>Picture of the Day</Text>
        
        {/* Image/Video */}
        {isVideo ? (
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={() => Linking.openURL(apod.url)}
          >
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoIcon}>▶️</Text>
              <Text style={styles.videoText}>Tap to watch video</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => openHDImage(apod?.hdurl || apod?.url)} activeOpacity={0.9}>
            <Image
              source={{ uri: apod?.url }}
              style={styles.image}
              resizeMode="cover"
            />
            {apod?.hdurl && (
              <View style={styles.hdBadge}>
                <Text style={styles.hdText}>HD</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* APOD Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{apod?.title}</Text>
          <Text style={styles.date}>{formatDate(apod?.date)}</Text>
          
          {apod?.copyright && (
            <Text style={styles.copyright}>© {apod.copyright}</Text>
          )}
          
          <View style={styles.divider} />
          
          <Text style={styles.explanation}>{apod?.explanation}</Text>
        </View>

        {/* Curated Gallery Section */}
        <View style={styles.curatedSection}>
          <Text style={styles.sectionTitle}>Curated Astrophysics</Text>
          <Text style={styles.topicLabel}>Today's Topic: {todayTopic}</Text>
          
          {loadingCurated ? (
            <View style={styles.curatedLoading}>
              <ActivityIndicator size="small" color="#4A90D9" />
              <Text style={styles.curatedLoadingText}>Loading gallery...</Text>
            </View>
          ) : curatedImages.length > 0 ? (
            <View style={styles.galleryGrid}>
              {curatedImages.map((image, index) => (
                <TouchableOpacity 
                  key={image.id || index}
                  style={styles.galleryItem}
                  onPress={() => openHDImage(image.hdurl || image.url)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: image.localPath || image.url }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                  <View style={styles.galleryOverlay}>
                    <Text style={styles.galleryTitle} numberOfLines={2}>
                      {image.title}
                    </Text>
                    {image.photographer && (
                      <Text style={styles.galleryPhotographer}>
                        📷 {image.photographer}
                      </Text>
                    )}
                    {image.location && (
                      <Text style={styles.galleryLocation}>
                        📍 {image.location}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noCurated}>
              <Text style={styles.noCuratedText}>
                No curated images available. Pull to refresh.
              </Text>
            </View>
          )}
          
          <Text style={styles.galleryFooter}>
            Images from NASA Image Library • {new Date().getFullYear()}
          </Text>
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B93A7',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  topicLabel: {
    fontSize: 13,
    color: '#4A90D9',
    paddingHorizontal: 20,
    paddingBottom: 12,
    fontStyle: 'italic',
  },
  image: {
    width: width,
    height: width * 0.75,
    backgroundColor: '#1A1D35',
  },
  videoContainer: {
    width: width,
    height: width * 0.75,
    backgroundColor: '#1A1D35',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  videoText: {
    color: '#8B93A7',
    fontSize: 16,
  },
  hdBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(74, 144, 217, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hdText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 32,
  },
  date: {
    fontSize: 14,
    color: '#4A90D9',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#8B93A7',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2D45',
    marginVertical: 20,
  },
  explanation: {
    fontSize: 16,
    color: '#C5CAD9',
    lineHeight: 26,
    textAlign: 'justify',
  },
  // Curated Gallery Styles
  curatedSection: {
    paddingTop: 10,
    paddingBottom: 0,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  galleryItem: {
    width: (width - 36) / 2,
    height: (width - 36) / 2 * 1.2,
    margin: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1D35',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 8,
  },
  galleryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  galleryPhotographer: {
    fontSize: 10,
    color: '#8B93A7',
  },
  galleryLocation: {
    fontSize: 10,
    color: '#8B93A7',
  },
  curatedLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  curatedLoadingText: {
    color: '#8B93A7',
    marginLeft: 10,
    fontSize: 14,
  },
  noCurated: {
    padding: 30,
    alignItems: 'center',
  },
  noCuratedText: {
    color: '#8B93A7',
    fontSize: 14,
  },
  galleryFooter: {
    fontSize: 11,
    color: '#4A5568',
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 10,
  },
  bottomPadding: {
    height: 40,
  },
  loadingText: {
    color: '#8B93A7',
    marginTop: 16,
    fontSize: 16,
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorDetail: {
    color: '#8B93A7',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
