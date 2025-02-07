import { Platform, Text, View, StyleSheet} from 'react-native';
import { Link } from 'expo-router';


export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{Platform.select({ ios: "Hello iOS!", android: "Hello Android!", web: "SUP NIGGAS"})}</Text>
      <Link href="/about" style={styles.button}>Go to About screen</Link>
    </View>
  );
}
// interface Styles {
//   container: ViewStyle;
//   text: TextStyle;
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
});
