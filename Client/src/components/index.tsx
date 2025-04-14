// import React, { useEffect, useState } from 'react';
// import { View, Text, Button, FlatList, TextInput } from 'react-native';
// import userApi from '@/src/api/userApi';
// import { User } from '@/Interfaces/User';
// import { StyleSheet } from 'react-native';
// import { Link, Stack } from 'expo-router';

// export default function UserScreenTest() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [newName, setNewName] = useState('');
//   const [newEmail, setNewEmail] = useState('');
//   const [newAge, setNewAge] = useState('');

//   useEffect(() => {
//     loadUsers();
//   }, []);

//   const loadUsers = async () => {
//     const data = await userApi.getUsers();
//     setUsers(data);
//   };

//   const addUser = async () => {
//     if (!newName.trim() || !newEmail.trim() || !newAge.trim()) return;
//     const newUser: User = { name: newName, email: newEmail, age: parseInt(newAge) };
//     await userApi.addUser(newUser);
//     setNewName('');
//     setNewEmail('');
//     setNewAge('');
//     loadUsers();
//   };

//   const deleteUser = async (id: number) => {
//     await userApi.deleteUser(id);
//     loadUsers();
//   };

//   return (
//     <View style={{ padding: 20 }}>
//       <Text style={{ fontSize: 24, fontWeight: 'bold' }}>User List</Text>

//       <FlatList
//         data={users}
//         keyExtractor={(item) => item.id?.toString() || ''}
//         renderItem={({ item }) => (
//           <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
//             <Text style={{ flex: 1 }}>{item.name} - {item.email} - {item.age} years</Text>
//             <Button title="Delete" color="red" onPress={() => deleteUser(item.id!)} />
//           </View>
//         )}
//       />

//       <TextInput
//         placeholder="Name"
//         value={newName}
//         onChangeText={setNewName}
//         style={{ borderBottomWidth: 1, marginVertical: 5, padding: 5 }}
//       />
//       <TextInput
//         placeholder="Email"
//         value={newEmail}
//         onChangeText={setNewEmail}
//         style={{ borderBottomWidth: 1, marginVertical: 5, padding: 5 }}
//       />
//       <TextInput
//         placeholder="Age"
//         value={newAge}
//         onChangeText={setNewAge}
//         keyboardType="numeric"
//         style={{ borderBottomWidth: 1, marginVertical: 5, padding: 5 }}
//       />
//       <Button title="Add User" onPress={addUser} />
//     </View>
//   );
// }
