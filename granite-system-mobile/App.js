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
import ProfileScreen from './src/screens/ProfileScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';
import CartScreen from './src/screens/CartScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import SimulatedPaymentScreen from './src/screens/SimulatedPaymentScreen';
import AdminOrderScreen from './src/screens/AdminOrderScreen';
import PurchaseOrderListScreen from './src/screens/PurchaseOrderListScreen';
import AddPurchaseOrderScreen from './src/screens/AddPurchaseOrderScreen';
import EditPurchaseOrderScreen from './src/screens/EditPurchaseOrderScreen';

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
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SimulatedPayment" component={SimulatedPaymentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminOrder" component={AdminOrderScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PurchaseOrderList" component={PurchaseOrderListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddPurchaseOrder" component={AddPurchaseOrderScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditPurchaseOrder" component={EditPurchaseOrderScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}