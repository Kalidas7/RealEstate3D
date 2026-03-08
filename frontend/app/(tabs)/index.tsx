import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TextInput,
  TouchableOpacity, FlatList, Dimensions, RefreshControl,
  ActivityIndicator, ScrollView, Image, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import SponsoredCard, { CARD_WIDTH, CARD_MARGIN } from '@/components/SponsoredCard';
import PropertyListCard from '@/components/PropertyListCard';
import LocationModal from '@/components/LocationModal';
import HomeHeader from '@/components/HomeHeader';
import HomeStateIndicator from '@/components/HomeStateIndicator';
import { useLikedViewed } from '@/contexts/LikedViewedContext';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'https://realestate3d.onrender.com/api';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;
const LEFT_PADDING = 20 - CARD_MARGIN; // Align with list cards (marginHorizontal: 20)

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
  interior_file?: string | null;
  interactive_mesh_names?: string;
}

interface ListedProperty {
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
  interior_file?: string | null;
  interactive_mesh_names?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [listedProperties, setListedProperties] = useState<ListedProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filteredListedProperties, setFilteredListedProperties] = useState<ListedProperty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [serverError, setServerError] = useState(false);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number, lon: number } | null>(null);

  const { syncLikedFromBackend } = useLikedViewed();

  useFocusEffect(
    useCallback(() => {
      loadUser();
      loadLocation();
    }, [])
  );

  useEffect(() => {
    fetchProperties(userCoords);
    fetchListedProperties(userCoords);
    syncLikedFromBackend();
  }, [userCoords]);

  useEffect(() => {
    let result = [...properties];
    let listedResult = [...listedProperties];

    if (selectedCity) {
      result = result.filter(p => p.location.toLowerCase().includes(selectedCity.toLowerCase()));
      listedResult = listedResult.filter(p => p.location.toLowerCase().includes(selectedCity.toLowerCase()));
    }

    if (searchQuery.trim() !== '') {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      listedResult = listedResult.filter(
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
    setFilteredListedProperties(listedResult);
  }, [searchQuery, properties, listedProperties, activeFilter]);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Removed Frontend Distance Calculations. Django Backend handles spatial arithmetic over `/properties/?lat=&lon=`

  const loadLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem('user_location');
      const savedCoords = await AsyncStorage.getItem('user_coords');

      if (savedLocation) {
        setSelectedCity(savedLocation);
        if (savedCoords) {
          setUserCoords(JSON.parse(savedCoords));
        }
        setShowLocationModal(false);
      } else {
        setShowLocationModal(true);
      }
    } catch (e) {
      console.error("Error loading location:", e);
      setShowLocationModal(true);
    }
  };

  const handleLocationSelect = async (city: string, lat: number | null, lon: number | null) => {
    setSelectedCity(city);
    try {
      await AsyncStorage.setItem('user_location', city);
      if (lat !== null && lon !== null) {
        const coordsObj = { lat, lon };
        setUserCoords(coordsObj);
        await AsyncStorage.setItem('user_coords', JSON.stringify(coordsObj));
      } else {
        await AsyncStorage.removeItem('user_coords');
        setUserCoords(null);
      }
    } catch (e) {
      console.error("Error saving location:", e);
    }
    setShowLocationModal(false);
  };

  const fetchProperties = async (coords: { lat: number, lon: number } | null = null) => {
    setLoading(true);
    setServerError(false);
    try {
      let url = `${API_URL}/properties/`;
      if (coords) url += `?lat=${coords.lat}&lon=${coords.lon}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Server returned an error');
      const data = await response.json();
      if (Array.isArray(data)) {
        if (coords) {
          console.log(`\n\x1b[36m--- API DISTANCE REPORT (Sponsored) ---\x1b[0m`);
          data.forEach((p: any) => {
            if (p.distance_km !== undefined && p.distance_km !== null) {
              console.log(`🏠 \x1b[33m${p.name}\x1b[0m | Distance: \x1b[32m${p.distance_km} km\x1b[0m`);
            }
          });
        }
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

  const fetchListedProperties = async (coords: { lat: number, lon: number } | null = null) => {
    try {
      let url = `${API_URL}/listed-properties/`;
      if (coords) url += `?lat=${coords.lat}&lon=${coords.lon}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      if (Array.isArray(data)) {
        if (coords) {
          console.log(`\n\x1b[36m--- API DISTANCE REPORT (Listed) ---\x1b[0m`);
          data.forEach((p: any) => {
            if (p.distance_km !== undefined && p.distance_km !== null) {
              console.log(`🏠 \x1b[33m${p.name}\x1b[0m | Distance: \x1b[32m${p.distance_km} km\x1b[0m`);
            }
          });
        }
        setListedProperties(data);
      }
    } catch (error) {
      console.error('Listed properties fetch error:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties(userCoords);
    fetchListedProperties(userCoords);
  };

  const handlePropertyPress = (property: any) => {
    router.push({
      pathname: '/property/[id]',
      params: { id: property.id, property: JSON.stringify(property) },
    });
  };

  const selectFilter = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  if (loading && properties.length === 0) {
    return <HomeStateIndicator type="loading" />;
  }

  if (serverError && properties.length === 0) {
    return <HomeStateIndicator type="error" onRetry={onRefresh} />;
  }

  const profilePicUrl = user?.profile?.profile_pic
    ? (user.profile.profile_pic.startsWith('http') ? user.profile.profile_pic : `${API_URL.replace('/api', '')}${user.profile.profile_pic}`)
    : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header ─────────────────────────────────────────── */}
      <HomeHeader
        profilePicUrl={profilePicUrl}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isFilterVisible={isFilterVisible}
        setIsFilterVisible={setIsFilterVisible}
        activeFilter={activeFilter}
        selectFilter={selectFilter}
        selectedCity={selectedCity}
        onLocationPress={() => { setShowLocationModal(true); setIsFilterVisible(false); }}
      />

      {/* ─── Sponsored Properties (Horizontal Carousel) ───── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⭐ Sponsored Properties</Text>
        <Text style={styles.sectionSubtitle}>Featured premium listings</Text>
      </View>

      {filteredProperties.length > 0 ? (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => `sponsored-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="center"
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: LEFT_PADDING,
            paddingBottom: 16,
          }}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          renderItem={({ item }) => (
            <SponsoredCard
              id={item.id}
              name={item.name}
              location={item.location}
              price={item.price}
              image={item.image}
              bedrooms={item.bedrooms}
              area={item.area}
              three_d_file={item.three_d_file}
              interior_file={item.interior_file}
              interactive_mesh_names={item.interactive_mesh_names}
              onPress={() => handlePropertyPress({ ...item, source: 'sponsored' })}
            />
          )}
        />
      ) : (
        <HomeStateIndicator type="empty" message={searchQuery ? 'No properties match your search' : 'No properties available'} />
      )}

      {/* ─── All Properties (Vertical List) ────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏢 All Properties</Text>
        <Text style={styles.sectionSubtitle}>Browse all available properties</Text>
      </View>

      {filteredListedProperties.length > 0 ? (
        filteredListedProperties.map((item) => (
          <PropertyListCard
            key={`list-${item.id}`}
            id={item.id}
            name={item.name}
            location={item.location}
            price={item.price}
            image={item.image}
            bedrooms={item.bedrooms}
            bathrooms={item.bathrooms}
            area={item.area}
            description={item.description}
            three_d_file={item.three_d_file}
            interior_file={item.interior_file}
            interactive_mesh_names={item.interactive_mesh_names}
            onPress={() => handlePropertyPress({ ...item, source: 'listed' } as any)}
          />
        ))
      ) : (
        <HomeStateIndicator type="empty" message="No listed properties yet" />
      )}

      {/* Bottom spacing */}
      <View style={{ height: 100 }} />

      <LocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={handleLocationSelect}
        onSkipOption={async () => {
          try {
            await AsyncStorage.removeItem('user_coords');
            setUserCoords(null);
          } catch (e) {
            console.error(e);
          }
          setShowLocationModal(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  sectionHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
});
