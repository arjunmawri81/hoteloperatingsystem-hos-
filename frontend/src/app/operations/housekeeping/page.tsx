"use client";

import { useState, useEffect } from "react";
import { housekeepingApi } from "@/lib/api";
import { HousekeepingTask } from "@/types";
import { Sparkles, ArrowRight, CheckCircle2, Plus, X, RefreshCw, UserCheck } from "lucide-react";

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    roomNumber: "205",
    assignedTo: "P. Mensah",
    priority: "high" as HousekeepingTask["priority"],
    status: "dirty" as HousekeepingTask["status"],
  });

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await housekeepingApi.getAll();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const moveTask = async (taskId: string, targetStatus: HousekeepingTask["status"]) => {
    try {
      await housekeepingApi.updateStatus(taskId, targetStatus);
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)));
      setToastMsg(`✅ Task for Room ${tasks.find((t) => t.id === taskId)?.roomNumber} moved to "${targetStatus.toUpperCase()}"`);
      setTimeout(() => setToastMsg(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const created: HousekeepingTask = {
      id: `hk-${Date.now()}`,
      roomNumber: newTask.roomNumber,
      assignedTo: newTask.assignedTo,
      priority: newTask.priority,
      status: newTask.status,
      floor: Number(newTask.roomNumber[0]) || 2,
    };
    setTasks([created, ...tasks]);
    setIsModalOpen(false);
    setToastMsg(`✅ Cleaning task for Room ${created.roomNumber} created`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const columns: { id: HousekeepingTask["status"]; label: string; nextStatus?: HousekeepingTask["status"]; nextLabel?: string; color: string }[] = [
    { id: "dirty", label: "Dirty", nextStatus: "cleaning", nextLabel: "Start Cleaning", color: "border-amber-500 bg-amber-50" },
    { id: "cleaning", label: "Cleaning", nextStatus: "inspection", nextLabel: "Ready for Inspection", color: "border-blue-500 bg-blue-50" },
    { id: "inspection", label: "Inspection", nextStatus: "clean", nextLabel: "Mark as Clean ✓", color: "border-purple-500 bg-purple-50" },
    { id: "clean", label: "Clean & Ready", color: "border-emerald-500 bg-emerald-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
            Housekeeping
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Room Board — manage turnover & cleaning tasks stage by stage
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTasks}
            title="Refresh"
            className="p-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] rounded text-[#4B5563] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#EC3013]" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white text-[13px] font-bold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[13px] px-4 py-2.5 rounded flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div key={col.id} className="bg-white rounded-lg border border-[#E5E7EB] shadow-xs flex flex-col min-h-[480px]">
              {/* Column Header */}
              <div className="p-3.5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#111827] uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E5E7EB] text-[#374151]">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="text-center py-12 text-[#9CA3AF] text-[12px]">
                    No rooms in this stage
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-md shadow-xs space-y-2.5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[15px] font-black font-mono text-[#111827]">
                          Room {task.roomNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            task.priority === "urgent"
                              ? "bg-rose-100 text-rose-800"
                              : task.priority === "high"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-[#F3F4F6] text-[#6B7280]"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="text-[12px] text-[#4B5563] flex items-center gap-1.5">
                        <span>👤 {task.assignedTo || "Unassigned"}</span>
                        <span className="text-[#9CA3AF]">· Fl. {task.floor || 2}</span>
                      </div>

                      {/* Advance Stage Action */}
                      {col.nextStatus && (
                        <button
                          type="button"
                          onClick={() => moveTask(task.id, col.nextStatus!)}
                          className="w-full mt-2 py-1.5 px-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#D1D5DB] text-[#111827] text-[12px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>{col.nextLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {col.id === "clean" && (
                        <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 py-1 px-2 rounded flex items-center gap-1.5 justify-center">
                          <Sparkles className="w-3.5 h-3.5" /> Ready for Guest
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-[16px] font-bold text-[#111827]">New Housekeeping Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 308"
                  value={newTask.roomNumber}
                  onChange={(e) => setNewTask({ ...newTask, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded focus:outline-none focus:border-[#EC3013]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Assigned Cleaner
                </label>
                <input
                  type="text"
                  placeholder="e.g. P. Mensah"
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
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="normal">Normal</option>
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
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded bg-white"
                  >
                    <option value="dirty">Dirty</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D5DB] rounded text-[#374151] font-semibold hover:bg-[#F3F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EC3013] hover:bg-[#D62839] text-white font-bold rounded shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
