import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function TestIcons() {
  const icons = [
    'home', 'star', 'settings', 'search', 'menu',
    'phone', 'email', 'location-on', 'navigation', 'timer'
  ];

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Icon Test:</Text>
      {icons.map(iconName => (
        <View key={iconName} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Icon name={iconName} size={30} color="#000" />
          <Text style={{ marginLeft: 10 }}>{iconName}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
