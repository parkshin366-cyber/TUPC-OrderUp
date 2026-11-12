import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { type AppColors, useAppTheme } from "../context/ThemeContext";
import { createThemedStyleSheet } from "../utils/themeStyles";

export type CampusPin = { latitude: number; longitude: number };

type Props = {
  visible: boolean;
  initialPin?: CampusPin | null;
  initialDescription?: string;
  phoneLocation?: CampusPin | null;
  onClose: () => void;
  onConfirm: (pin: CampusPin, description: string) => void;
};

const CENTER = { latitude: 14.34582, longitude: 120.96589 };
const BOUNDS = { south: 14.3439, west: 120.9637, north: 14.3477, east: 120.9681 };
const CARDINAL = "#A6192E";

function insideCampus(pin: CampusPin) {
  return pin.latitude >= BOUNDS.south && pin.latitude <= BOUNDS.north && pin.longitude >= BOUNDS.west && pin.longitude <= BOUNDS.east;
}

export default function CampusLocationPicker({ visible, initialPin, initialDescription = "", phoneLocation, onClose, onConfirm }: Props) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [selected, setSelected] = useState<CampusPin | null>(initialPin ?? null);
  const [mapError, setMapError] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [description, setDescription] = useState(initialDescription);
  useEffect(() => {
    if (visible) {
      setMapError(false);
      setSelected(initialPin ?? null);
      setDescription(initialDescription);
      setMapKey((value) => value + 1);
    }
  }, [initialPin?.latitude, initialPin?.longitude, visible]);
  const mapHtml = useMemo(() => {
    const pin = selected ?? (phoneLocation && insideCampus(phoneLocation) ? phoneLocation : CENTER);
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
      html,body,#map{height:100%;margin:0;background:#edf1ec;font-family:system-ui,sans-serif}
      .leaflet-control-attribution{font-size:9px}.leaflet-control-zoom{border:0!important;box-shadow:0 3px 14px #18252025!important;border-radius:14px!important;overflow:hidden}
      .leaflet-control-zoom a{width:42px!important;height:42px!important;line-height:42px!important;color:#7D1021!important}
      .leaflet-bottom.leaflet-right{bottom:38px}.leaflet-tooltip{border:0;border-radius:10px;padding:8px 12px;font-weight:700;box-shadow:0 3px 14px #0002}
      .delivery-icon{background:none;border:0}.delivery-pin{width:38px;height:38px;background:#A6192E;border:3px solid white;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);box-shadow:0 4px 14px #64122355;display:flex;align-items:center;justify-content:center}.delivery-pin svg{transform:rotate(45deg);width:21px;height:21px}
      .fit-button{border:0;background:white;color:#7D1021;padding:12px 15px;border-radius:12px;font-weight:700;box-shadow:0 3px 14px #18252025;cursor:pointer}
      .map-hint{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:500;white-space:nowrap;background:#fffef5ed;padding:8px 12px;border-radius:20px;font-size:11px;color:#454545;box-shadow:0 2px 10px #0001;pointer-events:none}
      </style></head>
      <body><div id="map"></div><div class="map-hint">Tap a spot or drag the red pin</div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
      const bounds=L.latLngBounds([${BOUNDS.south},${BOUNDS.west}],[${BOUNDS.north},${BOUNDS.east}]);
      const map=L.map('map',{zoomControl:false,maxBounds:bounds.pad(.25),minZoom:17,maxZoom:20}).setView([${pin.latitude},${pin.longitude}],18);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxNativeZoom:19,maxZoom:20,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
      L.control.zoom({position:'bottomright'}).addTo(map);
      const fit=L.control({position:'bottomleft'});
      fit.onAdd=function(){const button=L.DomUtil.create('button','fit-button');button.textContent='Campus view';button.setAttribute('aria-label','Show whole campus area');L.DomEvent.disableClickPropagation(button);button.onclick=()=>map.fitBounds(bounds,{padding:[24,50]});return button;};fit.addTo(map);

      ${phoneLocation && insideCampus(phoneLocation) ? `L.circleMarker([${phoneLocation.latitude},${phoneLocation.longitude}],{radius:8,color:'#fff',weight:3,fillColor:'#2563eb',fillOpacity:1}).addTo(map).bindTooltip('Phone GPS (approximate)');` : ''}
      const deliveryIcon=L.divIcon({className:'delivery-icon',iconSize:[44,50],iconAnchor:[22,48],html:'<div class="delivery-pin"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 8h16v12H4zM8 8V6a4 4 0 0 1 8 0v2"/></svg></div>'});
      let marker=L.marker([${pin.latitude},${pin.longitude}],{draggable:true,icon:deliveryIcon}).addTo(map);
      marker.bindTooltip('Delivery meeting point',{direction:'top',offset:[0,-44]});
      let lastValid=marker.getLatLng();
      function valid(p){return bounds.contains(p)}
      function send(p){if(valid(p)){marker.setLatLng(p);lastValid=p;marker.openTooltip();window.ReactNativeWebView.postMessage(JSON.stringify({latitude:p.lat,longitude:p.lng}))}else{marker.setLatLng(lastValid);window.ReactNativeWebView.postMessage(JSON.stringify({error:'outside'}))}}
      map.on('click',e=>send(e.latlng)); marker.on('dragend',e=>send(e.target.getLatLng()));
      </script></body></html>`;
  }, [mapKey, phoneLocation]);

  const choosePhoneLocation = () => {
    if (!phoneLocation) {
      Alert.alert("Location Unavailable", "Waiting for your phone location. Make sure location access is enabled.");
      return;
    }
    if (!insideCampus(phoneLocation)) {
      Alert.alert("Outside TUP Cavite", "Your phone location is outside the TUP Cavite campus. Tap the correct delivery point inside the campus map.");
      return;
    }
    setSelected(phoneLocation);
    setMapKey((value) => value + 1);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.error === "outside") {
        Alert.alert("Campus Only", "Please place the delivery pin inside TUP Cavite.");
        return;
      }
      const pin = { latitude: Number(data.latitude), longitude: Number(data.longitude) };
      if (Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude) && insideCampus(pin)) setSelected(pin);
    } catch { /* Ignore malformed map messages. */ }
  };

  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <Pressable style={styles.close} onPress={onClose}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
        <View style={styles.heading}><Text style={styles.title}>Where should we meet?</Text><Text style={styles.subtitle}>1. Pin the meeting point   2. Add building / room</Text></View>
      </View>
      <View style={styles.mapWrap}>
        <WebView startInLoadingState renderLoading={() => <View style={styles.mapFeedback}><ActivityIndicator color={colors.cardinal} /><Text style={{ color: colors.text, marginTop: 10 }}>Loading campus map...</Text></View>} onError={() => setMapError(true)} key={mapKey} source={{ html: mapHtml }} onMessage={handleMessage} javaScriptEnabled originWhitelist={["*"]} style={styles.map} />
        {mapError && <View style={styles.mapFeedback}><Text style={{ color: colors.text }}>Map could not load. Check your connection.</Text><Pressable style={styles.phoneButton} onPress={() => { setMapError(false); setMapKey(k => k + 1); }}><Text style={styles.phoneButtonText}>Reload map</Text></Pressable></View>}
        <View pointerEvents="none" style={styles.campusBadge}><Ionicons name="school-outline" size={15} color={colors.cardinal} /><Text style={styles.campusBadgeText}>TUP CAVITE  /  DELIVERY</Text></View>
      </View>
      <ScrollView style={{ maxHeight: 320, flexGrow: 0 }} contentContainerStyle={styles.panel} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: 18, marginBottom: 12 }}>
          <Text style={{ color: colors.cardinal, fontSize: 12, fontWeight: '700' }}>Pin: delivery point</Text>
          <Text style={{ color: colors.text, fontSize: 12 }}>Blue dot: phone GPS</Text>
        </View>
        <Pressable style={styles.phoneButton} onPress={choosePhoneLocation}><Ionicons name="locate" size={18} color={CARDINAL} /><Text style={styles.phoneButtonText}>Use My Phone Location</Text></Pressable>
        <View style={styles.pinInfo}><Ionicons name={selected ? "location" : "location-outline"} size={20} color={selected ? CARDINAL : "#777"} /><View style={styles.pinCopy}><Text style={styles.pinTitle}>{selected ? (description.trim() || "Meeting point selected") : "Tap your meeting point on the map"}</Text><Text style={styles.pinCoordinates}>{selected ? `${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}` : "The pin must be inside the campus boundary."}</Text></View></View>
        <Text style={{ color: colors.text, fontWeight: "800", fontSize: 13, marginTop: 14 }}>Building, floor, room or landmark *</Text>
        <TextInput value={description} onChangeText={setDescription} multiline maxLength={300} placeholder="Building name, floor, room number / nearby landmark" placeholderTextColor={colors.muted} accessibilityLabel="Delivery building room and landmark" style={{ color: colors.text, backgroundColor: colors.input, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 72, marginTop: 8, textAlignVertical: "top" }} />
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 7 }}>Room numbers are not shown on this outdoor map. Add the exact room and choose an accessible meeting point, such as the building entrance.</Text>
        <Pressable disabled={!selected || !description.trim()} style={[styles.confirm, (!selected || !description.trim()) && styles.disabled]} onPress={() => selected && description.trim() && onConfirm(selected, description.trim())}><Text style={styles.confirmText}>Confirm Delivery Location</Text></Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const createStyles = (colors: AppColors) => createThemedStyleSheet(colors, {
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { minHeight: 72, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#E7E7E8" },
  close: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#F3F3F4", alignItems: "center", justifyContent: "center" },
  heading: { flex: 1, marginLeft: 12 }, title: { fontSize: 20, fontWeight: "900", color: "#171717" }, subtitle: { marginTop: 3, fontSize: 12, color: "#737373" },
  mapFeedback: { ...StyleSheet.absoluteFill, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: 12, padding: 20 },
  mapWrap: { flex: 1, minHeight: 180, backgroundColor: "#EDEDED" }, map: { flex: 1 },
  campusBadge: { position: "absolute", top: 12, alignSelf: "center", paddingHorizontal: 12, height: 34, borderRadius: 17, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 6, shadowColor: "#000", shadowOpacity: .15, shadowRadius: 6, elevation: 5 },
  campusBadgeText: { fontSize: 10, fontWeight: "900", color: "#171717" },
  panel: { padding: 20, paddingBottom: 24, backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  phoneButton: { height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E8C4CA", backgroundColor: "#FFF7F8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  phoneButtonText: { fontSize: 11, fontWeight: "900", color: CARDINAL },
  pinInfo: { marginTop: 12, padding: 12, borderRadius: 13, backgroundColor: "#F6F6F7", flexDirection: "row", alignItems: "center" },
  pinCopy: { flex: 1, marginLeft: 9 }, pinTitle: { fontSize: 14, fontWeight: "900", color: "#171717" }, pinCoordinates: { marginTop: 5, fontSize: 11, color: "#737373" },
  confirm: { height: 48, marginTop: 12, borderRadius: 14, backgroundColor: CARDINAL, alignItems: "center", justifyContent: "center" }, disabled: { opacity: .45 }, confirmText: { fontSize: 14, fontWeight: "900", color: "#FFFFFF" },
});
