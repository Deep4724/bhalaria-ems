// ✅ File: app/admin/audit-logs/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  startAfter,
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import CSVExportButton from "@/components/CSVExportButton";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  details: string;
  timestamp: Timestamp;
  ip?: string;
  role?: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [lastDoc, setLastDoc] =
    useState<null | QueryDocumentSnapshot<DocumentData>>(null);

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchLogs = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const baseQuery = query(
      collection(db, "audit-logs"),
      orderBy("timestamp", "desc"),
      ...(lastDoc ? [startAfter(lastDoc.data().timestamp)] : []),
      limit(20)
    );

    const snapshot = await getDocs(baseQuery);
    const newLogs: AuditLog[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<AuditLog, "id">),
    }));

    setLogs((prev) => [...prev, ...newLogs]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setHasMore(snapshot.docs.length === 20);
    setLoading(false);
  }, [loading, lastDoc, hasMore]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchLogs();
      }
    });
    observer.current.observe(loadMoreRef.current);
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    return (
      (!actorFilter ||
        log.actor.toLowerCase().includes(actorFilter.toLowerCase())) &&
      (!actionFilter ||
        log.action.toLowerCase().includes(actionFilter.toLowerCase()))
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📜 Audit Logs</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Filter by actor..."
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="border px-3 py-2 rounded w-full md:w-64"
        />
        <input
          type="text"
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border px-3 py-2 rounded w-full md:w-64"
        />
        <CSVExportButton data={filteredLogs} filename="audit-logs.csv" />
      </div>

      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 text-left">
            <tr>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Details</th>
              <th className="p-3">IP</th>
              <th className="p-3">Role</th>
              <th className="p-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr
                key={log.id}
                className="border-t hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="p-3 font-medium">{log.actor}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.details}</td>
                <td className="p-3">{log.ip ?? "-"}</td>
                <td className="p-3">{log.role ?? "-"}</td>
                <td className="p-3 text-gray-500">
                  {format(log.timestamp.toDate(), "PPpp")}
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-500">
                  No logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div
          ref={loadMoreRef}
          className="p-4 text-center text-sm text-gray-500"
        >
          {loading
            ? "Loading more..."
            : hasMore
            ? "Scroll down to load more"
            : "End of logs"}
        </div>
      </div>
    </div>
  );
}
