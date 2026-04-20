// import { StyleSheet, Text, View } from 'react-native';
// import RoleAViewer from '../components/RoleAViewer';
// import RoleBTracker from '../components/RoleBTracker';

// type User = {
//   id: string;
//   role: 'ROLE_A' | 'ROLE_B';
// };

// type HomeScreenProps = {
//   user: User;
// };

// export default function HomeScreen({ user }: HomeScreenProps) {
//   if (user.role === 'ROLE_B') {
//     return <RoleBTracker userId={user.id} />;
//   }

//   if (user.role === 'ROLE_A') {
//     return <RoleAViewer />;
//   }

//   return (
//     <View style={styles.fallbackContainer}>
//       <Text style={styles.fallbackText}>Unsupported role</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   fallbackContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#f8fafc',
//   },
//   fallbackText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#334155',
//   },
// });
