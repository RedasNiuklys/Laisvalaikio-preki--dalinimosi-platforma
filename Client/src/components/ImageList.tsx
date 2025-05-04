import React from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ImageListProps {
  images: string[];
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
}

export const ImageList: React.FC<ImageListProps> = ({
  images,
  onAddImage,
  onRemoveImage,
}) => {
  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.image} />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemoveImage(index)}
      >
        <MaterialIcons name="close" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={
          <TouchableOpacity style={styles.addButton} onPress={onAddImage}>
            <MaterialIcons name="add-a-photo" size={40} color="#666" />
          </TouchableOpacity>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  imageContainer: {
    marginRight: 8,
    position: "relative",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 4,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
});
