import { View } from "react-native";
import { Image, type ImageSource } from "expo-image";
import { styles } from "../styles/ImageViewer.styles";

type Props = {
  imgSource: ImageSource;
  selectedImage?: string;
};

export default function ImageViewer({ imgSource, selectedImage }: Props) {
  const imageSource = selectedImage ? { uri: selectedImage } : imgSource;
  return <Image source={imageSource} style={styles.image} />;
}
