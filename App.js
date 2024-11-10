import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Animated,
  Platform,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import PinchZoomView from 'react-native-pinch-zoom-view';
import * as ImagePicker from 'expo-image-picker';

// Add this mock function at the top level
const mockServerResponse = {
  RECAIR: {
    address: {
      street: "Mukulakuja 3",
      city: "Tuusula",
      postal_code: "FIN-04300"
    },
    contact: {
      telephone: "+358-9-274 4000",
      fax: "+358-9-274 40044"
    },
    project: {
      project_id: "18817",
      date: "19.06.2006"
    },
    specifications: {
      type: "RECAIR 6E",
      unit_code: "TK1",
      air_flow_m3_s: "7.2",
      total_pressure_Pa: "972"
    }
  }
};

// Update the data structure expected from server
const processServerData = (rawData) => {
  try {
    // Parse the data string if it's a string
    const parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    console.log('Processed data:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error processing data:', error);
    return null;
  }
};

// Function to send image to server
const sendImageToServer = async (imageUri) => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg'
    });

    console.log('Sending image to server:', imageUri);

    const serverResponse = await fetch('https://4acc-93-106-14-175.ngrok-free.app/process-image', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!serverResponse.ok) {
      throw new Error('Server response was not ok');
    }

    const result = await serverResponse.json();
    console.log('Server response:', result);
    
    if (result.success && result.data) {
      const processedData = processServerData(result.data);
      if (processedData) {
        return processedData;
      }
      throw new Error('Failed to process data');
    } else {
      throw new Error(result.error || 'Unknown error');
    }

  } catch (error) {
    console.error('Error sending image to server:', error);
    throw error;
  }
};

const DataTable = ({ data }) => {
  // Match exact property names from server
  const propertyLabels = {
    "device type": "Device Type",
    "name": "Name",
    "color": "Color",
    "brand": "Brand",
    "last maintenance date": "Last Maintenance",
    "contact phone": "Phone",
    "contact website": "Website",
    "manufacturer": "Manufacturer"
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (Array.isArray(value)) return value.join(", ");
    return value.toString();
  };

  return (
    <ScrollView style={styles.drawerScroll}>
      <View style={styles.tableContainer}>
        <Text style={styles.sectionHeader}>Device Information</Text>
        {Object.entries(propertyLabels).map(([key, label]) => (
          <View key={key} style={styles.tableRow}>
            <Text style={styles.tableCell}>{label}</Text>
            <Text style={styles.tableCellValue}>
              {renderValue(data[key])}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = new Animated.Value(1);
  const [markers, setMarkers] = useState([]);
  const [scale, setScale] = useState(1);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const drawerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start fade out after 1.5 seconds
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 1500);
  }, []);

  const handlePress = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    setMarkers([...markers, { 
      x: locationX / scale, 
      y: locationY / scale,
      deviceId: Math.floor(Math.random() * 1000)
    }]);
  };

  const openDrawer = async (marker) => {
    setSelectedMarker(marker);
    
    Animated.timing(drawerAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

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
          const newImage = result.assets[0].uri;
          
          // Show loading state
          setSelectedMarker({ ...marker, image: newImage, isLoading: true });
          
          try {
            // Send image to server and get response
            const serverData = await sendImageToServer(newImage);
            
            // Update markers with image and server data
            const updatedMarkers = markers.map((m) => {
              if (m === marker) {
                return { 
                  ...m, 
                  image: newImage,
                  serverData: serverData
                };
              }
              return m;
            });
            
            setMarkers(updatedMarkers);
            setSelectedMarker({ 
              ...marker, 
              image: newImage,
              serverData: serverData,
              isLoading: false 
            });
          } catch (error) {
            console.error('Failed to process image:', error);
            // Show error state or fallback to mock data
            setSelectedMarker({ 
              ...marker, 
              image: newImage,
              serverData: mockServerResponse.RECAIR,
              isLoading: false,
              error: 'Failed to process image'
            });
          }
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

  if (showSplash) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <Image
          source={require('./assets/gear.png')}
          style={styles.splashIcon}
          resizeMode="contain"
        />
        <Text style={styles.splashTitle}>list-o-matic</Text>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <PinchZoomView
        maxScale={6}
        minScale={0.5}
        onScaleChange={(scale) => setScale(scale)}
        style={styles.container}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePress}
          style={styles.imageContainer}
        >
          <Image
            source={require('./assets/map.png')}
            style={styles.image}
            resizeMode="contain"
          />
          
          {markers.map((marker, index) => (
            <View
              key={index}
              style={[
                styles.markerContainer,
                {
                  position: 'absolute',
                  left: (marker.x * scale) - (11.5 * scale),
                  top: (marker.y * scale) - (11.5 * scale),
                  width: 23 * scale,
                  height: 23 * scale,
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => openDrawer(marker)}
                style={styles.markerTouchable}
              >
                <View style={styles.markerBorder}>
                  <Image
                    source={require('./assets/gear.png')}
                    style={styles.markerImage}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.deleteButton,
                  {
                    width: Math.max(11, 13 * scale),
                    height: Math.max(11, 13 * scale),
                    top: -4.5 * scale,
                    right: -4.5 * scale,
                    borderRadius: 6.5 * scale,
                  }
                ]}
                onPress={() => {
                  Alert.alert(
                    "Delete Marker",
                    "Are you sure you want to delete this marker?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        onPress: () => setMarkers(markers.filter((_, i) => i !== index)),
                        style: "destructive"
                      }
                    ],
                    { cancelable: true }
                  );
                }}
              >
                <Text style={[styles.deleteButtonText, { fontSize: 11 }]}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </TouchableOpacity>
      </PinchZoomView>

      {selectedMarker && (
        <View style={styles.overlay} pointerEvents="box-none">
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
            
            <ScrollView 
              style={styles.drawerScroll}
              showsVerticalScrollIndicator={true}
              bounces={true}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.drawerTitle}>
                Inventory device #{selectedMarker.deviceId}
              </Text>
              
              {selectedMarker.image && (
                <>
                  <Image
                    source={{ uri: selectedMarker.image }}
                    style={styles.drawerImage}
                    resizeMode="cover"
                  />

                  {selectedMarker.isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Processing image...</Text>
                    </View>
                  ) : selectedMarker.serverData ? (
                    <DataTable data={selectedMarker.serverData} />
                  ) : null}

                  <TouchableOpacity 
                    style={styles.exportButton}
                    onPress={() => console.log('Export pressed')}
                  >
                    <Text style={styles.exportButtonText}>Export</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIcon: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'System',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  markerTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 11.5,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  markerImage: {
    width: '90%',
    height: '90%',
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
    color: 'black',
    includeFontPadding: false,
    marginTop: -1,
    fontWeight: '300',
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: 2001,
  },
  drawerScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  drawerCloseButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 30,
    height: 30,
    backgroundColor: 'transparent',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2002,
  },
  drawerCloseText: {
    fontSize: 24,
    color: 'black',
    fontWeight: '300',
  },
  drawerTitle: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
    color: '#000',
  },
  drawerImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 24,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#000',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tableCellValue: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  nestedRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  nestedCell: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  nestedValue: {
    fontSize: 14,
    color: '#333',
  },
  exportButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
}); 