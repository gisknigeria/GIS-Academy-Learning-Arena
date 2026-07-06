import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { profileApi } from "../lib/profile-api";
import { useAuth } from "../context/AuthContext";

type Props = { open: boolean; onClose(): void; onChanged?(): void };

export function ChangePasswordModal({ open, onClose, onChanged }: Props) {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      await profileApi.changePassword(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      onChanged?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel">
        <div className="modal-header">
          <h2>Change password</h2>
          <button className="payment-banner-close" onClick={onClose} aria-label="Close">x</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Current password
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </label>
          <label>
            New password
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button className="primary-button" disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : null}
              {saving ? "Changing..." : "Change password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
