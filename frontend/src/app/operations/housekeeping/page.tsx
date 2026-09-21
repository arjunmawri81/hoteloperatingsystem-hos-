"use client";

import { useState, useEffect } from "react";
import { housekeepingApi, roomsApi } from "@/lib/api";
import { HousekeepingTask } from "@/types";
import { Sparkles, CheckCircle2, Plus, X, RefreshCw, UserCheck, BedDouble, ClipboardCheck, CheckCheck, AlertTriangle } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Checklist & Supervisor Inspection States (PDF Sec 16.5, 16.6)
  const [checklistTask, setChecklistTask] = useState<any | null>(null);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [activeChecklist, setActiveChecklist] = useState<Array<{ item: string; completed: boolean }>>([
    { item: "Linen & Bedsheet Replacement", completed: true },
    { item: "Bathroom Sanitization & Dry", completed: false },
    { item: "Fresh Towels & Bath Mats Restocked", completed: false },
    { item: "Toiletries & Drinking Water Restocked", completed: false },
    { item: "Floor Vacuumed & Mopped", completed: false },
    { item: "Trash Bins Cleared & Disinfected", completed: false },
  ]);

  const [inspectTask, setInspectTask] = useState<any | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectRemarks, setInspectRemarks] = useState("");

  const [newTask, setNewTask] = useState({
    roomNumber: "",
    assignedTo: "",
    priority: "medium" as HousekeepingTask["priority"],
    status: "dirty" as HousekeepingTask["status"],
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, roomsData] = await Promise.all([
        housekeepingApi.getAll(),
        roomsApi.getAll(),
      ]);
      setTasks(tasksData || []);
      setRooms(roomsData || []);
      if (roomsData && roomsData.length > 0 && !newTask.roomNumber) {
        setNewTask((prev) => ({ ...prev, roomNumber: String(roomsData[0].number || roomsData[0].roomNumber) }));
      }
    } catch (e) {
      console.error("Failed to load housekeeping data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moveTask = async (taskId: string, targetStatus: HousekeepingTask["status"]) => {
    try {
      const currentTask = tasks.find((t) => t.id === taskId);
      await housekeepingApi.updateStatus(taskId, targetStatus);
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)));
      setToastMsg(`✅ Room ${currentTask?.roomNumber || taskId} moved to "${targetStatus.toUpperCase()}" and saved to database!`);
      setTimeout(() => setToastMsg(null), 3500);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("hos_notification", {
            detail: {
              title: "Housekeeping Status Updated",
              description: `Room ${currentTask?.roomNumber} turnover stage updated to ${targetStatus.toUpperCase()}`,
              category: "housekeeping",
              href: "/operations/housekeeping",
            },
          })
        );
      }
    } catch (e: any) {
      console.error("Failed to move housekeeping task:", e);
      setToastMsg(`❌ Error updating status: ${e?.message || "Server error"}`);
    }
  };

  const openChecklistModal = (task: any) => {
    setChecklistTask(task);
    if (task.checklist && task.checklist.length > 0) {
      setActiveChecklist(task.checklist);
    }
    setChecklistModalOpen(true);
  };

  const toggleChecklistItem = async (idx: number) => {
    const updated = [...activeChecklist];
    updated[idx].completed = !updated[idx].completed;
    setActiveChecklist(updated);

    if (checklistTask) {
      try {
        await housekeepingApi.updateChecklist(checklistTask.id, {
          itemIndex: idx,
          completed: updated[idx].completed,
        });
      } catch (err) {
        console.error("Checklist update failed:", err);
      }
    }
  };

  const openInspectionModal = (task: any) => {
    setInspectTask(task);
    setInspectRemarks("");
    setInspectModalOpen(true);
  };

  const submitInspection = async (status: "passed" | "failed") => {
    if (!inspectTask) return;
    try {
      await housekeepingApi.inspect(inspectTask.id, {
        status,
        remarks: inspectRemarks,
      });
      setToastMsg(
        status === "passed"
          ? `✅ Room ${inspectTask.roomNumber} passed inspection and marked Clean & Available!`
          : `⚠️ Room ${inspectTask.roomNumber} failed inspection, marked Dirty for re-cleaning.`
      );
      setInspectModalOpen(false);
      loadData();
    } catch (err: any) {
      setToastMsg(`❌ Inspection error: ${err?.message || "Failed"}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.roomNumber) return;

    setIsSubmitting(true);
    try {
      const created = await housekeepingApi.createTask({
        roomNumber: newTask.roomNumber,
        assignedTo: newTask.assignedTo || "Unassigned",
        priority: newTask.priority,
        status: newTask.status,
        floor: Number(newTask.roomNumber[0]) || 1,
      });

      setTasks([created, ...tasks.filter((t) => t.id !== created.id)]);
      setIsModalOpen(false);
      setToastMsg(`✅ Cleaning task for Room ${created.roomNumber} created and saved to MongoDB database`);
      setTimeout(() => setToastMsg(null), 4000);

      setNewTask({
        roomNumber: rooms.length > 0 ? String(rooms[0].number || rooms[0].roomNumber) : "",
        assignedTo: "",
        priority: "medium",
        status: "dirty",
      });
    } catch (err: any) {
      console.error("Failed to create housekeeping task:", err);
      setToastMsg(`❌ Failed to create task: ${err?.message || "Server error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { status: "dirty", title: "Dirty", bg: "bg-amber-50", accent: "bg-amber-500" },
    { status: "cleaning", title: "Cleaning", bg: "bg-blue-50", accent: "bg-blue-500" },
    { status: "inspection", title: "Inspection", bg: "bg-purple-50", accent: "bg-purple-500" },
    { status: "clean", title: "Clean & Ready", bg: "bg-emerald-50", accent: "bg-emerald-500" },
  ];

  return (
    <RoleGuard
      allowedRoles={["super_admin", "hotel_admin", "hotel_manager", "housekeeping", "receptionist"]}
      moduleName="Housekeeping Board"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
              Housekeeping Board & Room Status
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Live room turnover, cleaning workflow, and inspection queue
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refresh Housekeeping Status"
              className="p-2 border border-[#D1D5DB] rounded text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* Toast Notice */}
        {toastMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* 4 Column Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col: any) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className={`rounded-lg border ${col.bg} p-4 flex flex-col min-h-[480px] space-y-3`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.accent}`} />
                    <h3 className="font-bold text-[14px] text-[#111827]">{col.title}</h3>
                  </div>
                  <span className="text-[12px] font-bold px-2.5 py-0.5 bg-white rounded-full border border-[#E5E7EB] text-[#4B5563] shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-300/70 rounded-lg text-[#9CA3AF]">
                      <Sparkles className="w-5 h-5 mb-1.5 opacity-40" />
                      <p className="text-[12px]">No rooms currently in {col.title.toLowerCase()}</p>
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] shadow-xs space-y-2.5 hover:border-[#D1D5DB] hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <BedDouble className="w-4 h-4 text-[#6B7280]" />
                            <span className="text-[14px] font-bold text-[#111827]">
                              Room {t.roomNumber}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              t.priority === "urgent" || t.priority === "high"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <div className="text-[12px] text-[#6B7280] space-y-1">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-[#9CA3AF]" />
                            <span>Cleaner: {t.assignedTo || "Unassigned"}</span>
                          </div>
                          {t.notes && (
                            <div className="p-2 bg-amber-50 border border-amber-200/90 rounded text-[11px] text-amber-900 font-medium">
                              📝 <span className="font-semibold">{t.notes}</span>
                            </div>
                          )}
                          {t.lastCleaned && (
                            <div className="text-[11px] text-[#9CA3AF]">
                              Status: {t.lastCleaned}
                            </div>
                          )}
                        </div>

                        {/* Checklist & Inspection Quick Action Buttons (PDF Sec 16.5, 16.6) */}
                        <div className="pt-2 flex items-center gap-1.5">
                          <button
                            onClick={() => openChecklistModal(t)}
                            className="flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Checklist</span>
                          </button>
                          <button
                            onClick={() => openInspectionModal(t)}
                            className="flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </div>

                        {/* Transition Action Buttons */}
                        <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between">
                          <span className="text-[11px] font-medium text-[#9CA3AF]">Move:</span>
                          <div className="flex items-center gap-1">
                            {col.status !== "dirty" && (
                              <button
                                onClick={() => moveTask(t.id, "dirty")}
                                className="px-2 py-1 text-[11px] font-semibold bg-amber-100 hover:bg-amber-200 rounded text-amber-900 transition-colors cursor-pointer"
                              >
                                Dirty
                              </button>
                            )}
                            {col.status !== "cleaning" && (
                              <button
                                onClick={() => moveTask(t.id, "cleaning")}
                                className="px-2 py-1 text-[11px] font-semibold bg-blue-100 hover:bg-blue-200 rounded text-blue-900 transition-colors cursor-pointer"
                              >
                                Clean
                              </button>
                            )}
                            {col.status !== "inspection" && (
                              <button
                                onClick={() => moveTask(t.id, "inspection")}
                                className="px-2 py-1 text-[11px] font-semibold bg-purple-100 hover:bg-purple-200 rounded text-purple-900 transition-colors cursor-pointer"
                              >
                                Inspect
                              </button>
                            )}
                            {col.status !== "clean" && (
                              <button
                                onClick={() => moveTask(t.id, "clean")}
                                className="px-2 py-1 text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 rounded text-emerald-900 transition-colors cursor-pointer"
                              >
                                Ready
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Task Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#EC3013]" />
                  <h3 className="text-[16px] font-bold text-[#111827]">New Housekeeping Task</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4 text-[13px]">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Select Room *
                  </label>
                  {rooms.length > 0 ? (
                    <select
                      value={newTask.roomNumber}
                      onChange={(e) => setNewTask({ ...newTask, roomNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white focus:outline-none focus:border-[#EC3013]"
                    >
                      {rooms.map((r: any) => (
                        <option key={r.id || r.number} value={String(r.number)}>
                          Room {r.number} ({r.type || "Standard Room"} - Floor {r.floor || r.number[0] || 1})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. 204"
                      value={newTask.roomNumber}
                      onChange={(e) => setNewTask({ ...newTask, roomNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Assigned Housekeeper
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sunita Sharma"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white focus:outline-none focus:border-[#EC3013]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent (Rush)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                      Initial Stage
                    </label>
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white focus:outline-none focus:border-[#EC3013]"
                    >
                      <option value="dirty">Dirty</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="inspection">Inspection</option>
                      <option value="clean">Clean & Ready</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[#D1D5DB] rounded text-[#374151] font-semibold hover:bg-[#F3F4F6] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] disabled:opacity-50 text-white font-bold rounded shadow-xs cursor-pointer"
                  >
                    {isSubmitting ? "Creating..." : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- CHECKLIST MODAL (PDF Sec 16.5) ----------------- */}
        {checklistModalOpen && checklistTask && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-[16px] font-bold text-[#111827]">
                      Room {checklistTask.roomNumber} Cleaning Checklist
                    </h3>
                    <p className="text-[11px] text-gray-500">Cleaner: {checklistTask.assignedTo || "Staff"}</p>
                  </div>
                </div>
                <button onClick={() => setChecklistModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-gray-600">
                  <span>Task Progress</span>
                  <span>
                    {activeChecklist.filter((c) => c.completed).length} / {activeChecklist.length} Completed
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                    style={{
                      width: `${(activeChecklist.filter((c) => c.completed).length / activeChecklist.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2 py-2">
                {activeChecklist.map((item, idx) => (
                  <label
                    key={idx}
                    onClick={() => toggleChecklistItem(idx)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      item.completed
                        ? "bg-blue-50/60 border-blue-200 text-blue-900"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {}} // Handled by label click
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 pointer-events-none"
                    />
                    <span className={`text-[13px] ${item.completed ? "line-through text-gray-500" : "font-medium"}`}>
                      {item.item}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setChecklistModalOpen(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[13px] shadow-xs cursor-pointer"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SUPERVISOR INSPECTION MODAL (PDF Sec 16.6) ----------------- */}
        {inspectModalOpen && inspectTask && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <CheckCheck className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="text-[16px] font-bold text-[#111827]">
                      Supervisor Room Inspection
                    </h3>
                    <p className="text-[11px] text-gray-500">Verifying Room {inspectTask.roomNumber} Quality Standards</p>
                  </div>
                </div>
                <button onClick={() => setInspectModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">
                  Supervisor Notes / Remarks
                </label>
                <textarea
                  rows={3}
                  value={inspectRemarks}
                  onChange={(e) => setInspectRemarks(e.target.value)}
                  placeholder="e.g. Linen crisp, all amenities placed properly. Room is spotless."
                  className="w-full p-2.5 border border-gray-300 rounded text-[13px] focus:outline-none focus:border-purple-600"
                ></textarea>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-[12px] text-purple-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Passing</strong> the inspection will immediately mark the room <strong>Clean & Ready</strong> for front-desk check-in.
                </span>
              </div>

              <div className="flex justify-between gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => submitInspection("failed")}
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded text-[12px] transition-colors"
                >
                  Fail (Requires Re-cleaning)
                </button>
                <button
                  type="button"
                  onClick={() => submitInspection("passed")}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[12px] shadow-sm transition-colors"
                >
                  Approve & Make Ready
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
