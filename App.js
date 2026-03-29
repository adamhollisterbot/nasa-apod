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
import { getCuratedImages, getTodayTopic } from './services/nasaLibrary';

const { width } = Dimensions.get('window');

export default function App() {
  const [curatedImages, setCuratedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCuratedImages = async () => {
    try {
      const images = await getCuratedImages();
      setCuratedImages(images);
    } catch (err) {
      console.error('Error fetching curated images:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuratedImages();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCuratedImages().then(() => setRefreshing(false));
  }, []);

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
          <Text style={styles.headerTitle}>SpaceView</Text>
          <Text style={styles.headerSubtitle}>Daily Astrophotography</Text>
        </View>

        {/* Curated Gallery Section */}
        <View style={styles.curatedSection}>
          <Text style={styles.sectionTitle}>Today's Collection</Text>
          <Text style={styles.topicLabel}>Topic: {todayTopic}</Text>
          
          {curatedImages.length > 0 ? (
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
                No images available. Pull to refresh.
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
});
