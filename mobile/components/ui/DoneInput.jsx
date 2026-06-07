/**
 * Spotix — DoneInput + DismissKeyboard
 * Cross-platform keyboard dismissal with Done button
 */
import React, { useState } from 'react';
import { TextInput, View, Text, Pressable, Keyboard, Platform, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../constants/colors';

/**
 * TextInput that adds "Done" functionality:
 * - returnKeyType="done" for submit/dismiss
 * - blurOnSubmit for auto-dismiss
 */
export function DoneInput({ style, onSubmitEditing, ...props }) {
  return (
    <TextInput
      {...props}
      style={style}
      returnKeyType="done"
      blurOnSubmit={true}
      onSubmitEditing={(e) => {
        Keyboard.dismiss();
        onSubmitEditing?.(e);
      }}
    />
  );
}

/**
 * Floating Done bar — sits above keyboard
 * Use inside a KeyboardAvoidingView or at root level
 */
export function KeyboardDoneBar({ visible }) {
  if (!visible) return null;
  return (
    <View style={st.doneBar}>
      <View style={{ flex: 1 }} />
      <Pressable onPress={() => Keyboard.dismiss()} style={st.doneBtn}>
        <Text style={st.doneBtnText}>Done</Text>
      </Pressable>
    </View>
  );
}

/**
 * Hook to track keyboard visibility
 */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(showEvent, () => setVisible(true));
    const s2 = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => { s1.remove(); s2.remove(); };
  }, []);
  return visible;
}

/**
 * Wrap any screen content — tapping outside inputs dismisses keyboard
 */
export function DismissKeyboardView({ children, style }) {
  return (
    <Pressable style={[{ flex: 1 }, style]} onPress={() => Keyboard.dismiss()}>
      {children}
    </Pressable>
  );
}

const st = StyleSheet.create({
  doneBar: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#d0d0d0',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default DoneInput;
