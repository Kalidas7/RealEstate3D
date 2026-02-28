import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput,
  TouchableOpacity, Alert, FlatList, Dimensions, RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropertyCard, { CARD_WIDTH, CARD_MARGIN } from '@/components/PropertyCard';

const API_URL = 'https://realestate3d.onrender.com/api';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Offset so the first card is centered and side cards peek in
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;
const LEFT_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_MARGIN;

interface Property {
  id: number;
  name: string;
  location: string;
  price: string;
  image: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  description: string;
  three_d_file: string | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [serverError, setServerError] = useState(false);

  useEffect(() => {
    loadUser();
    fetchProperties();
  }, []);

  useEffect(() => {
    let result = [...properties];

    if (searchQuery.trim() !== '') {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter) {
      switch (activeFilter) {
        case 'Villa':
          result = result.filter(p =>
            p.name.toLowerCase().includes('villa') ||
            p.description?.toLowerCase().includes('villa')
          );
          break;
        case 'Bedroom':
          result.sort((a, b) => b.bedrooms - a.bedrooms);
          break;
        case 'Place':
          result.sort((a, b) => a.location.localeCompare(b.location));
          break;
        case 'Type':
          result.sort((a, b) => {
            const pa = parseInt(a.price.replace(/[^0-9]/g, '')) || 0;
            const pb = parseInt(b.price.replace(/[^0-9]/g, '')) || 0;
            return pa - pb;
          });
          break;
      }
    }

    setFilteredProperties(result);
  }, [searchQuery, properties, activeFilter]);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        router.replace('/');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    setServerError(false);
    try {
      const response = await fetch(`${API_URL}/properties/`);
      if (!response.ok) throw new Error('Server returned an error');
      const data = await response.json();
      if (Array.isArray(data)) {
        setProperties(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setServerError(true);
      setProperties([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const handlePropertyPress = (property: Property) => {
    router.push({
      pathname: '/property/[id]',
      params: { id: property.id, property: JSON.stringify(property) },
    });
  };

  const selectFilter = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  const Header = (
    <View style={styles.header}>
      {/* Title row */}
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>Find Your Dream</Text>
          <Text style={styles.title}>Home</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search buildings or locations..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters toggle */}
      <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterVisible(!isFilterVisible)}>
        <Text style={styles.filterIcon}>⚙️</Text>
        <Text style={styles.filterText}>Filters</Text>
      </TouchableOpacity>

      {isFilterVisible && (
        <View style={styles.filterOptionsContainer}>
          {['Place', 'Villa', 'Type', 'Bedroom'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterOption, activeFilter === filter && styles.filterOptionActive]}
              onPress={() => selectFilter(filter)}
            >
              <Text style={[styles.filterOptionText, activeFilter === filter && styles.filterOptionTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.subtitle}>
        {properties.length > 0
          ? `${filteredProperties.length} propert${filteredProperties.length !== 1 ? 'ies' : 'y'} available`
          : 'Explore premium properties in 3D'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Fixed header above the horizontal carousel */}
      {Header}

      {/* Horizontal snapping carousel */}
      {loading && properties.length === 0 ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      ) : serverError && properties.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>🔌</Text>
          <Text style={styles.errorTitle}>Backend Offline</Text>
          <Text style={styles.errorSubtitle}>
            We can't reach the server right now. Make sure the Django backend is running.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : filteredProperties.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No properties match your search' : 'No properties available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="center"
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: LEFT_PADDING,
            paddingBottom: 20,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />
          }
          renderItem={({ item }) => (
            <PropertyCard
              id={item.id}
              name={item.name}
              location={item.location}
              price={item.price}
              image={item.image}
              bedrooms={item.bedrooms}
              area={item.area}
              onPress={() => handlePropertyPress(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 6,
  },
  filterIcon: { fontSize: 16 },
  filterText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  filterOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  filterOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filterOptionActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  filterOptionText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  filterOptionTextActive: { color: '#fff', fontWeight: 'bold' },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 14,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40,
    paddingHorizontal: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    minHeight: 300,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  retryText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
