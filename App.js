import React, { useState } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import PinchZoomView from 'react-native-pinch-zoom-view';

export default function App() {
  const [scale, setScale] = useState(1);

  const zoomIn = () => {
    setScale(scale + 0.2);
  };

  const zoomOut = () => {
    if (scale > 0.2) {
      setScale(scale - 0.2);
    }
  };

  return (
    <View style={styles.container}>
      <PinchZoomView>
        <Image
          source={require('./assets/map.png')}
          style={[styles.map, { transform: [{ scale: scale }] }]}
          resizeMode="contain"
        />
      </PinchZoomView>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={zoomIn}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={zoomOut}>
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  controls: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    backgroundColor: 'transparent',
  },
  button: {
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
});
