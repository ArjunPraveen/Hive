import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { confirm, showAlert } from '@/lib/alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const { user, family, familyMembers, signOut } = useAuth();

  const handleCopyInvite = () => {
    showAlert('Invite Code', `Share this code with family:\n\n${family?.invite_code}`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar name={user?.display_name || 'U'} size={80} />
        <Text style={[styles.name, { color: colors.text }]}>{user?.display_name}</Text>
        {user?.role_label && (
          <Badge label={user.role_label} size="md" />
        )}
      </View>

      {/* Family Card */}
      <Card style={styles.familyCard}>
        <View style={styles.familyHeader}>
          <View>
            <Text style={[styles.familyLabel, { color: colors.textSecondary }]}>Family</Text>
            <Text style={[styles.familyName, { color: colors.text }]}>{family?.name}</Text>
          </View>
          <TouchableOpacity
            onPress={handleCopyInvite}
            style={[styles.inviteBtn, { backgroundColor: colors.primaryLight }]}>
            <FontAwesome name="share-alt" size={14} color={colors.primaryDark} />
            <Text style={[styles.inviteBtnText, { color: colors.primaryDark }]}>Invite</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.membersSection}>
          <Text style={[styles.membersLabel, { color: colors.textSecondary }]}>Members</Text>
          {familyMembers.map((member) => (
            <View
              key={member.id}
              style={[styles.memberRow, { borderBottomColor: colors.borderLight }]}>
              <Avatar name={member.display_name} size={36} />
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.text }]}>
                  {member.display_name}
                  {member.id === user?.id && (
                    <Text style={{ color: colors.textTertiary }}> (you)</Text>
                  )}
                </Text>
                {member.role_label && (
                  <Text style={[styles.memberRole, { color: colors.textTertiary }]}>
                    {member.role_label}
                  </Text>
                )}
              </View>
              {member.phone && (
                <FontAwesome name="whatsapp" size={18} color={colors.success} />
              )}
            </View>
          ))}
        </View>
      </Card>

      {/* Settings */}
      <View style={styles.settingsSection}>
        <Text style={[styles.settingsTitle, { color: colors.text }]}>Settings</Text>

        {[
          { icon: 'user', label: 'Edit Profile' },
          { icon: 'bell', label: 'Notifications' },
          { icon: 'moon-o', label: 'Dark Mode' },
          { icon: 'info-circle', label: 'About Hive' },
        ].map((item) => (
          <TouchableOpacity key={item.label}>
            <Card style={styles.settingRow}>
              <FontAwesome name={item.icon as any} size={18} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
              <FontAwesome name="chevron-right" size={14} color={colors.textTertiary} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        onPress={() => confirm('Sign Out', 'Are you sure you want to sign out?', signOut, true)}
        style={[styles.signOutBtn, { borderColor: colors.danger }]}>
        <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  name: { fontSize: 24, fontWeight: '800' },
  // Family
  familyCard: { marginBottom: 24 },
  familyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  familyLabel: { fontSize: 12, fontWeight: '500' },
  familyName: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  inviteBtnText: { fontSize: 13, fontWeight: '600' },
  membersSection: {},
  membersLabel: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  memberInfo: { flex: 1, marginLeft: 10 },
  memberName: { fontSize: 15, fontWeight: '600' },
  memberRole: { fontSize: 12, marginTop: 1 },
  // Settings
  settingsSection: { marginBottom: 24 },
  settingsTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  // Sign Out
  signOutBtn: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  signOutText: { fontSize: 15, fontWeight: '600' },
});
