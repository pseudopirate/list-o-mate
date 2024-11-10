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

// Simulate server request
const sendImageToServer = async (imageUri) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return mockServerResponse;
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
          
          // Send image to server and get response
          const serverData = await sendImageToServer(newImage);
          
          // Update markers with image and server data
          const updatedMarkers = markers.map((m) => {
            if (m === marker) {
              return { 
                ...m, 
                image: newImage,
                serverData: serverData.RECAIR 
              };
            }
            return m;
          });
          
          setMarkers(updatedMarkers);
          setSelectedMarker({ 
            ...marker, 
            image: newImage,
            serverData: serverData.RECAIR,
            isLoading: false 
          });
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
                    <View style={styles.tableContainer}>
                      <Text style={styles.sectionHeader}>Address</Text>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Street</Text>
                        <Text style={styles.tableCellValue}>{selectedMarker.serverData.address.street}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>City</Text>
                        <Text style={styles.tableCellValue}>{selectedMarker.serverData.address.city}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Postal Code</Text>
                        <Text style={styles.tableCellValue}>{selectedMarker.serverData.address.postal_code}</Text>
                      </View>

                      <Text style={styles.sectionHeader}>Contact</Text>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Telephone</Text>
                        <Text style={styles.tableCellValue}>{selectedMarker.serverData.contact.telephone}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Fax</Text>
                        <Text style={styles.tableCellValue}>{selectedMarker.serverData.contact.fax}</Text>
                      </View>

                      <Text style={styles.sectionHeader}>Project</Text>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Project ID</Text>
                        <Text style={styles.tableCellValue}>{selectedMarker.serverData.project.project_id}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Date</Text>
                        <Text style={styles.tableCellValue}>{selectedMarker.serverData.project.date}</Text>
                      </View>

                      <Text style={styles.sectionHeader}>Specifications</Text>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Type</Text>
                        <Text style={styles.tableCellValue}>{selectedMarker.serverData.specifications.type}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Unit Code</Text>
                        <Text style={styles.tableCellValue}>{selectedMarker.serverData.specifications.unit_code}</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Air Flow</Text>
                        <Text style={styles.tableCellValue}>{selectedMarker.serverData.specifications.air_flow_m3_s} m³/s</Text>
                      </View>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Total Pressure</Text>
                        <Text style={styles.tableCellValue}>{selectedMarker.serverData.specifications.total_pressure_Pa} Pa</Text>
                      </View>
                    </View>
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
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 100,
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
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    backgroundColor: '#f8f8f8',
    padding: 16,
    paddingBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
  },
  tableCell: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    opacity: 0.6,
  },
  tableCellValue: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    textAlign: 'right',
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