"use client";
import React, { useState } from "react";
import { z } from "zod";
import { X, CheckCircle, Clock, AlertCircle } from "lucide-react";

// ==================== TYPES ====================
import { User } from "@/types/chat";

interface StatusModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

// ==================== ZOD SCHEMA ====================
const statusSchema = z.object({
  statusMessage: z
    .string()
    .max(100, "Status message must be under 100 characters")
    .optional(),
  status: z.enum(["online", "away", "dnd", "offline"]),
});

type StatusFormData = z.infer<typeof statusSchema>;

// ==================== COMPONENT ====================
const StatusModal: React.FC<StatusModalProps> = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<StatusFormData>({
    status: user.status,
    statusMessage: user.statusMessage ?? "",
  });

  const [error, setError] = useState<string | null>(null);

  const statusOptions = [
    { value: "online", label: "Active", icon: CheckCircle, color: "text-green-500" },
    { value: "away", label: "Away", icon: Clock, color: "text-yellow-500" },
    { value: "dnd", label: "Do not disturb", icon: AlertCircle, color: "text-red-500" },
    { value: "offline", label: "Offline", icon: X, color: "text-gray-500" },
  ] as const;

  const handleSave = () => {
    const result = statusSchema.safeParse(formData);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    onUpdate({ ...user, ...formData });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">Set status</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Status message */}
          <div>
            <label className="block text-sm font-medium mb-2">Status message</label>
            <input
              type="text"
              value={formData.statusMessage}
              onChange={(e) =>
                setFormData({ ...formData, statusMessage: e.target.value })
              }
              placeholder="What's your status?"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && (
              <p className="text-red-400 text-xs mt-1">{error}</p>
            )}
          </div>

          {/* Status selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, status: option.value })}
                  className={`w-full flex items-center gap-3 p-3 rounded border-2 ${
                    formData.status === option.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600"
                  }`}
                >
                  <option.icon className={`w-5 h-5 ${option.color}`} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
