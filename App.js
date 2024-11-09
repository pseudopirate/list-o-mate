import React, { useState } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import PinchZoomView from 'react-native-pinch-zoom-view';

export default function App() {
  const [markers, setMarkers] = useState([]);
  const [scale, setScale] = useState(1);
  const maxScale = 6;
  const minScale = 0.5;

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
              <Image
                source={require('./assets/image.png')}
                style={styles.marker}
                resizeMode="contain"
              />
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
}); 