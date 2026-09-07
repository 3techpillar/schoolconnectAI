import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, View} from 'react-native';
import {theme} from '../api';
import {useAuth} from '../auth/AuthContext';
import {Loading} from '../components/ui';
import {AuthScreen} from '../screens/AuthScreen';
import {PendingScreen} from '../screens/PendingScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {ChatsScreen} from '../screens/ChatsScreen';
import {ChatThreadScreen} from '../screens/ChatThreadScreen';
import {HomeworkScreen} from '../screens/HomeworkScreen';
import {FeesScreen} from '../screens/FeesScreen';
import {AttendanceScreen} from '../screens/AttendanceScreen';
import {ReportScreen} from '../screens/ReportScreen';
import {ProgressScreen} from '../screens/ProgressScreen';
import {CircularsScreen} from '../screens/CircularsScreen';
import {NotificationsScreen} from '../screens/NotificationsScreen';
import {BusScreen} from '../screens/BusScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {MoreScreen} from '../screens/MoreScreen';
import type {MainTabParamList, RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

function TabGlyph({
  kind,
  color,
}: {
  kind: 'home' | 'chats' | 'hw' | 'more';
  color: string;
}) {
  const glyph = {home: '⌂', chats: '✉', hw: '✎', more: '☰'}[kind];
  return (
    <View style={{alignItems: 'center', justifyContent: 'center', height: 22}}>
      <Text style={{fontSize: 18, color, fontWeight: '700'}}>{glyph}</Text>
    </View>
  );
}

function MainTabs() {
  const TabNav = Tabs.Navigator as React.ComponentType<Record<string, unknown>>;
  const TabScreen = Tabs.Screen as React.ComponentType<Record<string, unknown>>;
  return (
    <TabNav
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.blue,
        tabBarInactiveTintColor: theme.slate,
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
        tabBarStyle: {
          borderTopColor: theme.line,
          backgroundColor: theme.white,
          height: 58,
          paddingTop: 4,
        },
      }}>
      <TabScreen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color}: {color: string}) => (
            <TabGlyph kind="home" color={color} />
          ),
        }}
      />
      <TabScreen
        name="ChatsTab"
        component={ChatsScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({color}: {color: string}) => (
            <TabGlyph kind="chats" color={color} />
          ),
        }}
      />
      <TabScreen
        name="HomeworkTab"
        component={HomeworkScreen}
        options={{
          tabBarLabel: 'Homework',
          tabBarIcon: ({color}: {color: string}) => (
            <TabGlyph kind="hw" color={color} />
          ),
        }}
      />
      <TabScreen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({color}: {color: string}) => (
            <TabGlyph kind="more" color={color} />
          ),
        }}
      />
    </TabNav>
  );
}

export function RootNavigator() {
  const {user, ready, hasAccess} = useAuth();

  if (!ready) return <Loading label="Starting…" />;

  const StackNav = Stack.Navigator as React.ComponentType<Record<string, unknown>>;
  const StackScreen = Stack.Screen as React.ComponentType<Record<string, unknown>>;

  return (
    <NavigationContainer>
      <StackNav screenOptions={{headerShown: false}}>
        {!user ? (
          <StackScreen name="Auth" component={AuthScreen} />
        ) : !hasAccess ? (
          <StackScreen name="Pending" component={PendingScreen} />
        ) : (
          <>
            <StackScreen name="MainTabs" component={MainTabs} />
            <StackScreen
              name="ChatThread"
              component={ChatThreadScreen}
              options={{headerShown: true, title: 'Chat'}}
            />
            <StackScreen
              name="Fees"
              component={FeesScreen}
              options={{headerShown: true, title: 'Fees'}}
            />
            <StackScreen
              name="Attendance"
              component={AttendanceScreen}
              options={{headerShown: true, title: 'Attendance'}}
            />
            <StackScreen
              name="Report"
              component={ReportScreen}
              options={{headerShown: true, title: 'Report'}}
            />
            <StackScreen
              name="Progress"
              component={ProgressScreen}
              options={{headerShown: true, title: 'Progress'}}
            />
            <StackScreen
              name="Circulars"
              component={CircularsScreen}
              options={{headerShown: true, title: 'Circulars'}}
            />
            <StackScreen
              name="Notifications"
              component={NotificationsScreen}
              options={{headerShown: true, title: 'Notifications'}}
            />
            <StackScreen
              name="Bus"
              component={BusScreen}
              options={{headerShown: true, title: 'Bus'}}
            />
            <StackScreen
              name="Profile"
              component={ProfileScreen}
              options={{headerShown: true, title: 'Profile'}}
            />
          </>
        )}
      </StackNav>
    </NavigationContainer>
  );
}
