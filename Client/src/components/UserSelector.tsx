import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Platform } from "react-native";
import { List, Avatar, Searchbar, useTheme, Text } from "react-native-paper";
import axios from "axios";
import { BASE_URL } from "../utils/envConfig";
import { getAuthToken } from "../utils/authUtils";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserSelectorProps {
  onUserSelect: (user: User) => void;
  selectedUsers: User[];
  isMultiSelect?: boolean;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  onUserSelect,
  selectedUsers,
  isMultiSelect = false,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await getAuthToken();
      console.log("Fetching users with token:", token);
      const response = await axios.get(`${BASE_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isUserSelected = (user: User) =>
    selectedUsers.some((selected) => selected.id === user.id);

  const handleUserPress = (user: User) => {
    if (!isMultiSelect) {
      onUserSelect(user);
      return;
    }

    if (isUserSelected(user)) {
      onUserSelect(
        selectedUsers.filter((selected) => selected.id !== user.id)[0]
      );
    } else {
      onUserSelect(user);
    }
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search users..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      {loading ? (
        <Text>Loading users...</Text>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={item.name}
              description={item.email}
              left={(props) => (
                <Avatar.Image
                  {...props}
                  size={40}
                  source={
                    item.avatar
                      ? { uri: item.avatar }
                      : require("../assets/default-avatar.png")
                  }
                />
              )}
              onPress={() => handleUserPress(item)}
              style={[
                styles.listItem,
                isUserSelected(item) && {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
            />
          )}
          style={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    borderRadius: 8,
  },
  list: {
    flex: 1,
  },
  listItem: {
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
  },
});
