import React, { useState, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text, Animated, TouchableWithoutFeedback } from 'react-native';
import PinchZoomView from 'react-native-pinch-zoom-view';
import * as ImagePicker from 'expo-image-picker';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import OpenAI from 'openai';
import { promises as fs } from 'fs';

const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: './junc2024.json'
});

const openaiClient = new OpenAI();

export default function App() {
  const [markers, setMarkers] = useState([]);
  const [scale, setScale] = useState(1);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const drawerAnimation = useRef(new Animated.Value(0)).current;

  const maxScale = 6;
  const minScale = 0.5;

  const openDrawer = async (marker) => {
    setSelectedMarker(marker);
    
    // First start the drawer animation
    Animated.timing(drawerAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // If marker doesn't have an image, open camera
    if (!marker.image) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status === 'granted') {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

        if (!result.canceled) {
          // Update markers and selectedMarker with the new image
          const newImage = result.assets[0].uri;
          const updatedMarkers = markers.map((m) => {
            if (m === marker) {
              return { ...m, image: newImage };
            }
            return m;
          });
          setMarkers(updatedMarkers);
          // Update the selected marker to show image immediately
          setSelectedMarker({ ...marker, image: newImage });
        }
      }
    }
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedMarker(null));
  };

  const handlePress = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    
    // Store the raw coordinates divided by scale
    setMarkers([...markers, { 
      x: locationX / scale,
      y: locationY / scale
    }]);
  };

  const handleZoomIn = () => {
    if (scale < maxScale) {
      setScale(scale + 0.2);
    }
  };

  const handleZoomOut = () => {
    if (scale > minScale) {
      setScale(scale - 0.2);
    }
  };

  return (
    <View style={styles.container}>
      <PinchZoomView>
        <TouchableOpacity 
          activeOpacity={1}
          onPress={handlePress}
          style={styles.imageContainer}
        >
          <Image
            source={require('./assets/map.png')}
            style={[styles.map, { transform: [{ scale: scale }] }]}
            resizeMode="contain"
          />
          
          {/* Markers inside the PinchZoomView */}
          {markers.map((marker, index) => (
            <View
              key={index}
              style={[
                styles.markerContainer,
                {
                  position: 'absolute',
                  left: (marker.x * scale) - (10 * scale),
                  top: (marker.y * scale) - (10 * scale),
                  width: 20 * scale,
                  height: 20 * scale,
                }
              ]}
            >
              <TouchableOpacity 
                style={[
                  styles.deleteButton,
                  {
                    width: Math.max(12, 14 * scale),
                    height: Math.max(12, 14 * scale),
                    top: -5 * scale,
                    right: -5 * scale,
                    borderRadius: 7 * scale,
                  }
                ]}
                onPress={() => {
                  setMarkers(markers.filter((_, i) => i !== index));
                }}
              >
                <Text style={[
                  styles.deleteButtonText,
                  {
                    fontSize: Math.max(12, 12 * scale),
                    lineHeight: Math.max(14, 14 * scale),
                  }
                ]}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openDrawer(marker)}
                style={styles.markerTouchable}
              >
                <Image
                  source={require('./assets/image.png')}
                  style={styles.marker}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          ))}
        </TouchableOpacity>
      </PinchZoomView>

      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.zoomButton} onPress={() => setMarkers([])}>
          <Text style={styles.buttonText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusStripe}>
        <Text style={styles.statusText}>
          File: map.png | Zoom: {scale.toFixed(2)}x
        </Text>
      </View>

      {/* Bottom Drawer */}
      {selectedMarker && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <View style={styles.overlay}>
            <Animated.View 
              style={[
                styles.drawer,
                {
                  transform: [{
                    translateY: drawerAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [Dimensions.get('window').height, 0]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.drawerCloseButton}
                onPress={closeDrawer}
              >
                <Text style={styles.drawerCloseText}>×</Text>
              </TouchableOpacity>
              
              <View style={styles.drawerContent}>
                <Text style={styles.drawerTitle}>Marker Details</Text>
                
                {selectedMarker.image ? (
                  <Image
                    source={{ uri: selectedMarker.image }}
                    style={styles.drawerImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text>Taking picture...</Text>
                  </View>
                )}
                
                <Text>Position: {selectedMarker.x.toFixed(2)}, {selectedMarker.y.toFixed(2)}</Text>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  imageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    position: 'absolute',
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  marker: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  deleteButtonText: {
    textAlign: 'center',
    color: 'black',
    includeFontPadding: false,
    marginTop: -1,
  },
  zoomControls: {
    position: 'absolute',
    right: 20,
    bottom: 55,
    zIndex: 1000,
  },
  zoomButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    fontSize: 24,
    color: 'black',
  },
  statusStripe: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 15,
    zIndex: 1000,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2000,
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    zIndex: 2001,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drawerCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    backgroundColor: 'white',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2002,
  },
  drawerCloseText: {
    fontSize: 20,
    color: 'black',
    lineHeight: 24,
    textAlign: 'center',
  },
  drawerContent: {
    marginTop: 40,
    alignItems: 'center',
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  markerTouchable: {
    width: '100%',
    height: '100%',
  },
  drawerImage: {
    width: '100%',
    height: Dimensions.get('window').height * 0.85 * 0.5, // 50% of drawer height
    marginVertical: 20,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: Dimensions.get('window').height * 0.85 * 0.5,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    borderRadius: 10,
  },
}); 