import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import {createUser,deleteUser,getUserById,getUsers,updateUser} from "../api/users"; // Adjust API path
import { User } from '../types/User';
import axios from "axios";


const UserFormScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  
  // const existingUser: User | undefined = getUserById(1).then((response => ));

  // const [user, setUser] = useState<User>({
  //   name: existingUser?.name || "",
  //   age: existingUser?.age || 0,
  //   email: existingUser?.email || "",
  //   theme: existingUser?.theme || "",
  // });
  const [user,setUser] = useState<User>({
        name:  "",
    age:  0,
    email:  "",
    theme: "",
  });

  const handleChange = (key: keyof User, value: string) => {
    setUser((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user.name || !user.age || !user.email) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    // try {
    //   if (existingUser?.id) {
    //     await axios.put(`/users/${existingUser.id}`, { ...user, age: Number(user.age) });
    //     Alert.alert("Success", "User updated successfully!");
    //   } else {
    //     await axios.post("/users", { ...user, age: Number(user.age) });
    //     Alert.alert("Success", "User created successfully!");
    //   }
    //   navigation.goBack();
    // } catch (error) {
    //   Alert.alert("Error", "Failed to save user. Please try again.");
    // }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: theme.backgroundColor }}>
      <Text style={{ fontSize: 24, color: theme.primaryTextColor, marginBottom: 10 }}>
"Edit User"
      </Text>

      <TextInput
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, color: theme.primaryTextColor }}
        placeholder="Name"
        value={user.name}
        onChangeText={(text) => handleChange("name", text)}
      />

      <TextInput
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, color: theme.primaryTextColor }}
        placeholder="Age"
        keyboardType="numeric"
        value={user.age.toString()}
        onChangeText={(text) => handleChange("age", text)}
      />

      <TextInput
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, color: theme.primaryTextColor }}
        placeholder="Email"
        value={user.email}
        onChangeText={(text) => handleChange("email", text)}
      />

      {/* <Button title={existingUser ? "Update User" : "Create User"} onPress={handleSubmit} /> */}
    </View>
  );
};

export default UserFormScreen;
