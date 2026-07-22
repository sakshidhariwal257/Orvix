import { useState } from 'react';
import { updateProfile, changePassword } from '../api/auth';
import { usePageHeader } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/common/Avatar';

const TABS = ['Profile', 'Account'];

export default function SettingsPage() {
  usePageHeader('Profile Settings', null);
  const [tab, setTab] = useState('Profile');

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-[10px] text-[13.5px] font-medium ${
              tab === t ? 'bg-accent/15 text-white' : 'text-text-dim hover:bg-white/[0.04]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && <ProfileTab />}
      {tab === 'Account' && <AccountTab />}
    </div>
  );
}

function ProfileTab() {
  const { user, patchUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({ name, avatar, bio });
      patchUser(updated);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={name} avatarUrl={avatar} size="lg" />
        <div className="flex-1">
          <label className="text-[12px] font-semibold text-text-dim block mb-1.5">Avatar URL</label>
          <input
            className="input"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://…"
          />
          <p className="text-[11px] text-text-faint mt-1">
            The backend stores avatars as a URL, not an uploaded file — paste a link to an image.
          </p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && (
        <div className="px-3.5 py-2.5 rounded-[10px] bg-green-500/10 border border-green-500/30 text-green-300 text-[13.5px] mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Full Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input opacity-60" value={user?.email || ''} disabled />
        </div>
        <div className="field">
          <label>Bio</label>
          <textarea
            className="input"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell your team a bit about yourself"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

function AccountTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword) {
      setError('Current and new password are required');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-[15px] font-semibold text-white mb-4">Change Password</h3>

      {error && <div className="error-banner">{error}</div>}
      {success && (
        <div className="px-3.5 py-2.5 rounded-[10px] bg-green-500/10 border border-green-500/30 text-green-300 text-[13.5px] mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Current Password</label>
          <input
            type="password"
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label>New Password</label>
          <input
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Confirm New Password</label>
          <input
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
