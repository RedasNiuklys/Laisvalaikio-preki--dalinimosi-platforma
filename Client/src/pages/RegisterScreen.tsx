import React, { useState } from "react";
import { View, TextInput, Button, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext"; // Assuming you're using the context
import Ionicons from "@expo/vector-icons/Ionicons"; // For the icon

const RegisterScreen = ({ navigation }: { navigation: any }) => {
  const { register } = useAuth(); // Use the register function from the context

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState<boolean>(false);

  const handlePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  const handleRegister = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (password.length < 8 || !/\d/.test(password)) {
      alert("Password must be at least 8 characters long and contain a number");
      return;
    }
    register(email, password); // Call register function from context
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Register</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{
          height: 40,
          borderColor: "gray",
          borderWidth: 1,
          marginBottom: 20,
          paddingLeft: 10,
        }}
      />
      <View style={{ position: "relative" }}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
          style={{
            height: 40,
            borderColor: "gray",
            borderWidth: 1,
            marginBottom: 20,
            paddingLeft: 10,
          }}
        />
        <TouchableOpacity
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            zIndex: 1,
          }}
          onPressIn={handlePasswordVisibility}
          onPressOut={handlePasswordVisibility}
               >
          <Ionicons
            name={isPasswordVisible ? "eye-off" : "eye"}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>
      <View style={{ position: "relative" }}>
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!isConfirmPasswordVisible}
          style={{
            height: 40,
            borderColor: "gray",
            borderWidth: 1,
            marginBottom: 20,
            paddingLeft: 10,
          }}
        />
        <TouchableOpacity
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            zIndex: 1,
          }}
          onPressIn={handleConfirmPasswordVisibility}
          onPressOut={handleConfirmPasswordVisibility}
        >
          <Ionicons
            name={isConfirmPasswordVisible ? "eye-off" : "eye"}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>
      <Button title="Register" onPress={handleRegister} />
      <Button title="Move to Login" onPress={() => navigation.navigate("Login")}/>
    </View>
  );
};

export default RegisterScreen;
