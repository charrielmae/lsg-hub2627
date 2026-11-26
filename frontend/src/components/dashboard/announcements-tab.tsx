"use client";

import * as React from "react";
import { Loader2, Megaphone, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAnnouncementApi,
  deleteAnnouncementApi,
  HubAnnouncement,
  HubOrganization,
} from "@/lib/auth-api";

interface AnnouncementsTabProps {
  announcements: HubAnnouncement[];
  organizations: HubOrganization[];
  isStaff: boolean;
  onRefresh: () => Promise<void>;
}

export function AnnouncementsTab({
  announcements,
  organizations,
  isStaff,
  onRefresh,
}: AnnouncementsTabProps) {
  const [filterOrgId, setFilterOrgId] = React.useState<string>("ALL");
  const [organizationId, setOrganizationId] = React.useState(
    organizations[0]?.id || ""
  );
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [publishing, setPublishing] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!organizationId && organizations[0]?.id) {
      setOrganizationId(organizations[0].id);
    }
  }, [organizations, organizationId]);

  const filtered =
    filterOrgId === "ALL"
      ? announcements
      : announcements.filter((a) => a.organization_id === filterOrgId);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) return;
    setError(null);
    setPublishing(true);
    try {
      await createAnnouncementApi({ organizationId, title, body });
      setTitle("");
      setBody("");
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to publish announcement."
      );
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    try {
      await deleteAnnouncementApi(id);
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete announcement."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-ccis-ink">
            Council &amp; Organization Announcements
          </h2>
          <p className="font-headline text-sm text-ccis-espresso/85">
            Official memorandums, assembly calls, and organization dispatches (`announcements`).
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={filterOrgId === "ALL" ? "brand" : "outline"}
            onClick={() => setFilterOrgId("ALL")}
          >
            All ({announcements.length})
          </Button>
          {organizations.map((org) => (
            <Button
              key={org.id}
              type="button"
              size="sm"
              variant={filterOrgId === org.id ? "brand" : "outline"}
              onClick={() => setFilterOrgId(org.id)}
            >
              {org.type === "LSG" ? "CCISLSG" : org.name.split(" ")[0]}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-ccis-orange/60 bg-ccis-orange/10 px-4 py-2.5 font-subtext text-xs text-ccis-ink">
          {error}
        </div>
      )}

      {isStaff && (
        <Card className="bg-ccis-paper">
          <CardHeader className="pb-3">
            <CardDescription>PUBLISH DISPATCH</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-4 w-4 text-ccis-orange" />
              New Official Announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePublish} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="ann-org">Issuing Organization</Label>
                  <select
                    id="ann-org"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="ann-title">Headline</Label>
                  <Input
                    id="ann-title"
                    placeholder="e.g. 1st Semester General Assembly & Consultation"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ann-body">Body</Label>
                <textarea
                  id="ann-body"
                  rows={3}
                  placeholder="Write full announcement details for CCIS constituents..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  className="w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3.5 py-2.5 text-sm text-ccis-ink focus:outline-none focus:ring-2 focus:ring-ccis-orange"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="brand" disabled={publishing}>
                  {publishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Publish Announcement
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="bg-ccis-paper">
            <CardContent className="py-10 text-center font-headline text-sm text-ccis-espresso/75">
              No announcements found for this filter.
            </CardContent>
          </Card>
        ) : (
          filtered.map((item) => (
            <Card key={item.id} className="bg-ccis-paper">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.organization?.type === "LSG" ? "orange" : "default"
                      }
                    >
                      {item.organization?.name || "CCISLSG"}
                    </Badge>
                    <span className="font-subtext text-xs text-ccis-espresso/75">
                      By {item.authorName} •{" "}
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {isStaff && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-ccis-orange" />
                    </Button>
                  )}
                </div>
                <CardTitle className="pt-2 text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line font-headline text-sm leading-relaxed text-ccis-espresso">
                  {item.body}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
