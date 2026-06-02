"use client";

import { KeyRound, Pencil, Plus, Save, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { api, Device, Profile } from "@/lib/api";
import { TronCard } from "./gridcn/tron-card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";

type ProfileForm = {
  display_name: string;
  role: Profile["role"];
  is_active: boolean;
  notes: string;
  pin: string;
};

type DeviceForm = {
  name: string;
  profile_id: string;
  ip_address: string;
  mac_address: string;
  device_type: Device["device_type"];
  notes: string;
};

const blankProfile: ProfileForm = {
  display_name: "",
  role: "child",
  is_active: true,
  notes: "",
  pin: "",
};

const blankDevice: DeviceForm = {
  name: "",
  profile_id: "",
  ip_address: "",
  mac_address: "",
  device_type: "other",
  notes: "",
};

export function HouseholdManager({ token }: { token: string | null }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [profileForm, setProfileForm] = useState<ProfileForm>(blankProfile);
  const [deviceForm, setDeviceForm] = useState<DeviceForm>(blankDevice);
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);

  const userProfiles = useMemo(() => profiles.filter((profile) => profile.role === "user"), [profiles]);

  const refresh = useCallback(async () => {
    if (!token) return;
    const [profileRows, deviceRows] = await Promise.all([
      api<Profile[]>("/admin/profiles", { token }),
      api<Device[]>("/admin/devices", { token }),
    ]);
    setProfiles(profileRows);
    setDevices(deviceRows);
  }, [token]);

  useEffect(() => {
    refresh().catch((error) => toast.error(error instanceof Error ? error.message : "Could not load household data"));
  }, [refresh]);

  function editProfile(profile: Profile) {
    setEditingProfileId(profile.id);
    setProfileForm({
      display_name: profile.display_name,
      role: profile.role,
      is_active: profile.is_active,
      notes: profile.notes || "",
      pin: "",
    });
  }

  function editDevice(device: Device) {
    setEditingDeviceId(device.id);
    setDeviceForm({
      name: device.name,
      profile_id: device.profile_id ? String(device.profile_id) : "",
      ip_address: device.ip_address || "",
      mac_address: device.mac_address || "",
      device_type: device.device_type,
      notes: device.notes || "",
    });
  }

  async function saveProfile() {
    if (!token) return;
    if (!profileForm.display_name.trim()) {
      toast.error("Profile name is required");
      return;
    }
    if (profileForm.pin && !/^\d{6}$/.test(profileForm.pin)) {
      toast.error("PIN must be exactly 6 digits");
      return;
    }
    if (profileForm.pin && profileForm.role !== "user") {
      toast.error("Only User profiles can have PINs");
      return;
    }

    const payload = {
      display_name: profileForm.display_name.trim(),
      role: profileForm.role,
      is_active: profileForm.is_active,
      notes: profileForm.notes.trim() || null,
      ...(profileForm.pin ? { pin: profileForm.pin } : {}),
    };

    try {
      if (editingProfileId) {
        await api(`/admin/profiles/${editingProfileId}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(payload),
        });
        toast.success("Profile updated");
      } else {
        await api("/admin/profiles", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
        toast.success("Profile created");
      }
      setProfileForm(blankProfile);
      setEditingProfileId(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    }
  }

  async function deleteProfile(profile: Profile) {
    if (!token) return;
    try {
      await api(`/admin/profiles/${profile.id}`, { method: "DELETE", token });
      toast.success("Profile deleted");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete profile");
    }
  }

  async function saveDevice() {
    if (!token) return;
    if (!deviceForm.name.trim()) {
      toast.error("Device name is required");
      return;
    }
    const payload = {
      name: deviceForm.name.trim(),
      profile_id: deviceForm.profile_id ? Number(deviceForm.profile_id) : null,
      ip_address: deviceForm.ip_address.trim() || null,
      mac_address: deviceForm.mac_address.trim() || null,
      device_type: deviceForm.device_type,
      notes: deviceForm.notes.trim() || null,
    };

    try {
      if (editingDeviceId) {
        await api(`/admin/devices/${editingDeviceId}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(payload),
        });
        toast.success("Device updated");
      } else {
        await api("/admin/devices", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
        toast.success("Device created");
      }
      setDeviceForm(blankDevice);
      setEditingDeviceId(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save device");
    }
  }

  async function deleteDevice(device: Device) {
    if (!token) return;
    try {
      await api(`/admin/devices/${device.id}`, { method: "DELETE", token });
      toast.success("Device deleted");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete device");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <TronCard id="profiles">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary">Profiles</p>
            <h2 className="mt-2 text-lg font-semibold">Profiles And PINs</h2>
          </div>
          <Users className="h-5 w-5 text-primary" />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Display name"
            value={profileForm.display_name}
            onChange={(event) => setProfileForm((current) => ({ ...current, display_name: event.target.value }))}
          />
          <Select
            value={profileForm.role}
            onChange={(event) => setProfileForm((current) => ({ ...current, role: event.target.value as Profile["role"] }))}
          >
            <option value="child">Child</option>
            <option value="user">User</option>
          </Select>
          <Input
            placeholder="6-digit PIN for User"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={profileForm.pin}
            disabled={profileForm.role !== "user"}
            onChange={(event) =>
              setProfileForm((current) => ({ ...current, pin: event.target.value.replace(/\D/g, "").slice(0, 6) }))
            }
          />
          <label className="flex min-h-11 items-center justify-between rounded-md border border-primary/30 bg-background/70 px-3 text-sm">
            Active
            <input
              type="checkbox"
              className="h-5 w-5 accent-cyan-400"
              checked={profileForm.is_active}
              onChange={(event) => setProfileForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
          </label>
          <Input
            className="md:col-span-2"
            placeholder="Notes"
            value={profileForm.notes}
            onChange={(event) => setProfileForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveProfile}>
            {editingProfileId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingProfileId ? "Save profile" : "Add profile"}
          </Button>
          {editingProfileId ? (
            <Button
              onClick={() => {
                setEditingProfileId(null);
                setProfileForm(blankProfile);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>

        <div className="mt-6 divide-y divide-primary/15">
          {profiles.map((profile) => (
            <div key={profile.id} className="grid gap-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{profile.display_name}</span>
                  <span className="rounded-md border border-primary/25 px-2 py-1 text-xs text-primary">{profile.role}</span>
                  {profile.has_pin ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-secondary/30 px-2 py-1 text-xs text-secondary">
                      <KeyRound className="h-3 w-3" />
                      PIN
                    </span>
                  ) : null}
                  {!profile.is_active ? <span className="text-xs text-danger">inactive</span> : null}
                </div>
                {profile.notes ? <p className="mt-1 text-sm text-muted">{profile.notes}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => editProfile(profile)} aria-label={`Edit ${profile.display_name}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button onClick={() => deleteProfile(profile)} aria-label={`Delete ${profile.display_name}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </TronCard>

      <TronCard id="devices">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary">Devices</p>
            <h2 className="mt-2 text-lg font-semibold">Device Tracking</h2>
          </div>
          <Users className="h-5 w-5 text-primary" />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Device name"
            value={deviceForm.name}
            onChange={(event) => setDeviceForm((current) => ({ ...current, name: event.target.value }))}
          />
          <Select
            value={deviceForm.profile_id}
            onChange={(event) => setDeviceForm((current) => ({ ...current, profile_id: event.target.value }))}
          >
            <option value="">Unassigned</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.display_name}
              </option>
            ))}
          </Select>
          <Input
            placeholder="IP address"
            value={deviceForm.ip_address}
            onChange={(event) => setDeviceForm((current) => ({ ...current, ip_address: event.target.value }))}
          />
          <Input
            placeholder="MAC address"
            value={deviceForm.mac_address}
            onChange={(event) => setDeviceForm((current) => ({ ...current, mac_address: event.target.value }))}
          />
          <Select
            value={deviceForm.device_type}
            onChange={(event) =>
              setDeviceForm((current) => ({ ...current, device_type: event.target.value as Device["device_type"] }))
            }
          >
            <option value="phone">Phone</option>
            <option value="tablet">Tablet</option>
            <option value="computer">Computer</option>
            <option value="TV">TV</option>
            <option value="console">Console</option>
            <option value="other">Other</option>
          </Select>
          <Input
            placeholder="Notes"
            value={deviceForm.notes}
            onChange={(event) => setDeviceForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveDevice}>
            {editingDeviceId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingDeviceId ? "Save device" : "Add device"}
          </Button>
          {editingDeviceId ? (
            <Button
              onClick={() => {
                setEditingDeviceId(null);
                setDeviceForm(blankDevice);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>

        <div className="mt-6 divide-y divide-primary/15">
          {devices.map((device) => (
            <div key={device.id} className="grid gap-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{device.name}</span>
                  <span className="rounded-md border border-primary/25 px-2 py-1 text-xs text-primary">{device.device_type}</span>
                  <span className="text-xs text-muted">{device.owner || "unassigned"}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  {device.ip_address || "no IP"} {device.mac_address ? ` / ${device.mac_address}` : ""}
                </p>
                {device.notes ? <p className="mt-1 text-sm text-muted">{device.notes}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => editDevice(device)} aria-label={`Edit ${device.name}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button onClick={() => deleteDevice(device)} aria-label={`Delete ${device.name}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {!userProfiles.some((profile) => profile.has_pin) ? (
          <p className="mt-5 rounded-md border border-danger/35 bg-danger/10 px-3 py-2 text-sm text-danger">
            Add a 6-digit PIN to at least one User profile before real bypass approvals are available.
          </p>
        ) : null}
      </TronCard>
    </div>
  );
}
