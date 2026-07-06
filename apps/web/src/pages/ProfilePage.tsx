import { CheckCircle2, Edit3, Loader2, Save, User } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { SectionHeading } from "../components/SectionHeading";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { useAuth } from "../context/AuthContext";
import { profileApi, type FullUser, type UpdateProfilePayload } from "../lib/profile-api";
import { getRoleLabel } from "../lib/roles";

const DELIVERY_MODE_OPTIONS = [
  { value: "", label: "No preference" },
  { value: "E_LEARNING", label: "E-Learning" },
  { value: "ONSITE", label: "Onsite" },
  { value: "LIVE_VIRTUAL", label: "Live Virtual" },
  { value: "HYBRID", label: "Hybrid" },
];

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  NOT_REQUIRED: "Not required",
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
  BLOCKED: "Blocked",
};

export function ProfilePage() {
  const { token, user: authUser, refreshUser } = useAuth();
  const [fullUser, setFullUser] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Basic info edit
  const [editingBasic, setEditingBasic] = useState(false);
  const [basicForm, setBasicForm] = useState({ fullName: "", phone: "" });
  const [savingBasic, setSavingBasic] = useState(false);
  const [basicError, setBasicError] = useState("");

  // Extended profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfilePayload>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await profileApi.getMe(token);
      setFullUser(data);
      setBasicForm({ fullName: data.fullName, phone: data.phone ?? "" });
      setProfileForm({
        gender: data.profile?.gender ?? "",
        country: data.profile?.country ?? "",
        state: data.profile?.state ?? "",
        lga: data.profile?.lga ?? "",
        community: data.profile?.community ?? "",
        institution: data.profile?.institution ?? "",
        profession: data.profile?.profession ?? "",
        highestQualification: data.profile?.highestQualification ?? "",
        preferredMode: data.profile?.preferredMode ?? "",
      });
    } catch {
      setError("Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSaveBasic(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingBasic(true);
    setBasicError("");
    setSaved(false);
    try {
      await profileApi.updateMe(token, {
        fullName: basicForm.fullName || undefined,
        phone: basicForm.phone || undefined,
      });
      await refreshUser();
      await load();
      setEditingBasic(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setBasicError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSavingBasic(false);
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    setProfileError("");
    setSaved(false);
    try {
      // Strip empty strings → undefined so they don't overwrite with blanks
      const payload: UpdateProfilePayload = Object.fromEntries(
        Object.entries(profileForm).map(([k, v]) => [k, v === "" ? undefined : v]),
      );
      await profileApi.updateProfile(token, payload);
      await load();
      setEditingProfile(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Loader2 size={22} className="spin" />
        Loading profile…
      </div>
    );
  }

  if (error || !fullUser) {
    return (
      <section className="module-page">
        <p className="form-error">{error || "Profile unavailable."}</p>
      </section>
    );
  }

  const initials = fullUser.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
    <section className="module-page profile-page">
      <SectionHeading eyebrow="Account" title="My profile" />

      {saved && (
        <div className="profile-saved-banner">
          <CheckCircle2 size={16} />
          Profile saved successfully.
        </div>
      )}

      {/* ── Avatar + identity card ── */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{initials}</div>
        </div>
        <div className="profile-hero-body">
          <h2>{fullUser.fullName}</h2>
          <span>{fullUser.email}</span>
          <div className="profile-badges">
            <span className="assignment-badge score">{getRoleLabel(fullUser.role)}</span>
            <span className={`assignment-badge ${
              fullUser.paymentStatus === "PAID" ? "status-graded" :
              fullUser.paymentStatus === "NOT_REQUIRED" ? "badge-neutral" :
              fullUser.paymentStatus === "PENDING" ? "status-submitted" :
              "status-returned"
            }`}>
              {PAYMENT_STATUS_LABELS[fullUser.paymentStatus] ?? fullUser.paymentStatus}
            </span>
            <span className={`assignment-badge ${fullUser.status === "ACTIVE" ? "status-graded" : "status-returned"}`}>
              {fullUser.status}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-layout">

        {/* ── Basic info ── */}
        <section className="profile-card">
          <div className="profile-card-header">
            <h3>Basic information</h3>
            {!editingBasic && (
              <button className="secondary-button small-button" onClick={() => setEditingBasic(true)}>
                <Edit3 size={14} />Edit
              </button>
            )}
          </div>

          {editingBasic ? (
            <form className="profile-form" onSubmit={(e) => void handleSaveBasic(e)}>
              <label>
                Full name
                <input
                  value={basicForm.fullName}
                  onChange={(e) => setBasicForm({ ...basicForm, fullName: e.target.value })}
                  required
                  minLength={2}
                />
              </label>
              <label>
                Phone
                <input
                  value={basicForm.phone}
                  onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
                  placeholder="+234…"
                />
              </label>
              {basicError ? <p className="form-error">{basicError}</p> : null}
              <div className="profile-form-actions">
                <button type="button" className="secondary-button small-button" onClick={() => setEditingBasic(false)}>
                  Cancel
                </button>
                <button className="primary-button small-button" disabled={savingBasic}>
                  {savingBasic ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
                  {savingBasic ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="profile-dl">
              <div><dt>Full name</dt><dd>{fullUser.fullName}</dd></div>
              <div><dt>Email</dt><dd>{fullUser.email}</dd></div>
              <div><dt>Phone</dt><dd>{fullUser.phone ?? <em>Not set</em>}</dd></div>
              <div><dt>Member since</dt><dd>{new Date(fullUser.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</dd></div>
            </dl>
          )}
            <div style={{ marginTop: 12 }}>
              <button className="secondary-button" onClick={() => setShowChangePassword(true)}>Change password</button>
            </div>
        </section>

        {/* ── Extended profile ── */}
        <section className="profile-card">
          <div className="profile-card-header">
            <h3>Learning profile</h3>
            {!editingProfile && (
              <button className="secondary-button small-button" onClick={() => setEditingProfile(true)}>
                <Edit3 size={14} />Edit
              </button>
            )}
          </div>

          {editingProfile ? (
            <form className="profile-form" onSubmit={(e) => void handleSaveProfile(e)}>
              <div className="profile-form-grid">
                <label>
                  Institution / School
                  <input
                    value={profileForm.institution ?? ""}
                    onChange={(e) => setProfileForm({ ...profileForm, institution: e.target.value })}
                    placeholder="University / company name"
                  />
                </label>
                <label>
                  Profession
                  <input
                    value={profileForm.profession ?? ""}
                    onChange={(e) => setProfileForm({ ...profileForm, profession: e.target.value })}
                    placeholder="GIS Analyst, Surveyor…"
                  />
                </label>
                <label>
                  Highest qualification
                  <input
                    value={profileForm.highestQualification ?? ""}
                    onChange={(e) => setProfileForm({ ...profileForm, highestQualification: e.target.value })}
                    placeholder="B.Sc, M.Sc…"
                  />
                </label>
                <label>
                  Country
                  <input
                    value={profileForm.country ?? ""}
                    onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                    placeholder="Nigeria"
                  />
                </label>
                <label>
                  State
                  <input
                    value={profileForm.state ?? ""}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    placeholder="Oyo, Lagos…"
                  />
                </label>
                <label>
                  LGA
                  <input
                    value={profileForm.lga ?? ""}
                    onChange={(e) => setProfileForm({ ...profileForm, lga: e.target.value })}
                  />
                </label>
                <label>
                  Community
                  <input
                    value={profileForm.community ?? ""}
                    onChange={(e) => setProfileForm({ ...profileForm, community: e.target.value })}
                  />
                </label>
                <label>
                  Gender
                  <select
                    value={profileForm.gender ?? ""}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  Preferred learning mode
                  <select
                    value={profileForm.preferredMode ?? ""}
                    onChange={(e) => setProfileForm({ ...profileForm, preferredMode: e.target.value })}
                  >
                    {DELIVERY_MODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              {profileError ? <p className="form-error">{profileError}</p> : null}
              <div className="profile-form-actions">
                <button type="button" className="secondary-button small-button" onClick={() => setEditingProfile(false)}>
                  Cancel
                </button>
                <button className="primary-button small-button" disabled={savingProfile}>
                  {savingProfile ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
                  {savingProfile ? "Saving…" : "Save profile"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="profile-dl">
              {[
                ["Institution", fullUser.profile?.institution],
                ["Profession", fullUser.profile?.profession],
                ["Qualification", fullUser.profile?.highestQualification],
                ["Country", fullUser.profile?.country],
                ["State", fullUser.profile?.state],
                ["LGA", fullUser.profile?.lga],
                ["Community", fullUser.profile?.community],
                ["Gender", fullUser.profile?.gender],
                ["Preferred mode", fullUser.profile?.preferredMode],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt>{label}</dt>
                  <dd>{value ?? <em>Not set</em>}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>
    </section>
    {showChangePassword ? (
      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} onChanged={async () => { await refreshUser(); }} />
    ) : null}
    </>
  );
}
