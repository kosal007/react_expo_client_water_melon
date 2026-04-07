import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export default function LanguageOptionButton({ label, active = false, onPress }: Props) {
  return (
    <Pressable style={[styles.button, active && styles.activeButton]} onPress={onPress}>
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeButton: {
    borderColor: '#0f172a',
    backgroundColor: '#0f172a',
  },
  text: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  activeText: {
    color: '#ffffff',
  },
});
