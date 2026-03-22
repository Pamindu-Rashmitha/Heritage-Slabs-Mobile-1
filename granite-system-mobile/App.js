import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 

// Import all screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import CustomerCatalogScreen from './src/screens/CustomerCatalogScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import ProductManagementScreen from './src/screens/ProductManagementScreen';
import EditProductScreen from './src/screens/EditProductScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Add Product' }} />
          <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Edit Product' }} />
          <Stack.Screen name="ProductManagement" component={ProductManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CustomerCatalog" component={CustomerCatalogScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}