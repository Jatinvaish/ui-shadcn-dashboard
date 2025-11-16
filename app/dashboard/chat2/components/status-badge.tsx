import { JSX } from "react";
import { User } from "@/types/chat";
// ==================== IMPORTS ====================

// ==================== RENDER FUNCTIONS ====================
const renderStatusBadge = (status: User["status"]): JSX.Element => {
  const colors: Record<User["status"], string> = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    dnd: "bg-red-500",
    offline: "bg-gray-500",
  };

  return (
    <div
      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${colors[status]} border-2 border-gray-800`}
    ></div>
  );
};
export default renderStatusBadge;
