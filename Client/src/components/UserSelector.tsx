import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Platform } from "react-native";
import { List, Avatar, Searchbar, useTheme, Text } from "react-native-paper";
import axios from "axios";
import { BASE_URL } from "../utils/envConfig";
import { getAuthToken } from "../utils/authUtils";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  avatar?: string;
}

interface UserSelectorProps {
  onUserSelect: (user: User) => void;
  selectedUsers: User[];
  isMultiSelect?: boolean;
  excludeUsers?: string[];
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  onUserSelect,
  selectedUsers,
  isMultiSelect = false,
  excludeUsers = [],
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
      const response = await axios.get(`${BASE_URL}/user/chat-users`, {
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
      (user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !excludeUsers.includes(user.id)
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
              title={`${item.firstName} ${item.lastName}`}
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
