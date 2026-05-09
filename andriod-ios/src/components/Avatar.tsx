import { Image, StyleSheet, View } from "react-native";
import { User } from "../types";
import { colors } from "../utils/theme";

type Props = {
  user: Pick<User, "avatar" | "username">;
  size?: number;
  online?: boolean;
};

export const Avatar = ({ user, size = 44, online }: Props) => (
  <View style={{ width: size, height: size }}>
    <Image source={{ uri: user.avatar }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
    {online !== undefined && <View style={[styles.dot, { backgroundColor: online ? "#34d399" : colors.dim }]} />}
  </View>
);

const styles = StyleSheet.create({
  image: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel2 },
  dot: { position: "absolute", right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.panel }
});
