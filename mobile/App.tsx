import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from './src/config';

type UploadItem = {
  uri: string;
  name: string;
  mimeType: string;
};

export default function App() {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [i9, setI9] = useState<UploadItem | null>(null);
  const [w4, setW4] = useState<UploadItem | null>(null);
  const [idImages, setIdImages] = useState<UploadItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return employeeName && employeeEmail && i9 && w4 && idImages.length > 0;
  }, [employeeName, employeeEmail, i9, w4, idImages]);

  async function pickDocument(setter: (file: UploadItem | null) => void) {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (result.canceled) return;
    const file = result.assets[0];
    setter({
      uri: file.uri,
      name: file.name,
      mimeType: file.mimeType || 'application/octet-stream',
    });
  }

  async function takeIdPhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission denied', 'Camera permission is required to capture ID photos.');
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
    if (photo.canceled) return;

    const asset = photo.assets[0];
    setIdImages((existing) => [
      ...existing,
      {
        uri: asset.uri,
        name: `id-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      },
    ]);
  }

  async function submitPacket() {
    if (!canSubmit || !i9 || !w4) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('employeeName', employeeName);
      formData.append('employeeEmail', employeeEmail);
      formData.append('i9', i9 as any);
      formData.append('w4', w4 as any);

      idImages.forEach((image) => {
        formData.append('idPhotos', image as any);
      });

      const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Unable to submit paperwork packet.');
      }

      Alert.alert('Success', 'Paperwork package submitted and emailed to HR.');
      setEmployeeName('');
      setEmployeeEmail('');
      setI9(null);
      setW4(null);
      setIdImages([]);
    } catch (error: any) {
      Alert.alert('Submission error', error.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Employee Onboarding Packet</Text>

        <TextInput
          style={styles.input}
          placeholder="Employee full name"
          value={employeeName}
          onChangeText={setEmployeeName}
        />

        <TextInput
          style={styles.input}
          placeholder="Employee email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={employeeEmail}
          onChangeText={setEmployeeEmail}
        />

        <ActionButton label={i9 ? `I-9 selected: ${i9.name}` : 'Upload I-9 form'} onPress={() => pickDocument(setI9)} />
        <ActionButton label={w4 ? `W-4 selected: ${w4.name}` : 'Upload W-4 form'} onPress={() => pickDocument(setW4)} />
        <ActionButton label={`Capture ID photo (${idImages.length})`} onPress={takeIdPhoto} />

        <TouchableOpacity
          style={[styles.submitButton, (!canSubmit || isSubmitting) && styles.submitDisabled]}
          disabled={!canSubmit || isSubmitting}
          onPress={submitPacket}
        >
          <Text style={styles.submitText}>{isSubmitting ? 'Submitting...' : 'Submit and Email Packet'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
};

function ActionButton({ label, onPress }: ActionButtonProps) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  input: {
    backgroundColor: 'white',
    borderColor: '#D9E1EC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionButton: {
    backgroundColor: '#1E66F5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  actionText: { color: 'white', fontWeight: '600' },
  submitButton: {
    backgroundColor: '#1A7F37',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { backgroundColor: '#9DB5A2' },
  submitText: { color: 'white', fontWeight: '700' },
});
